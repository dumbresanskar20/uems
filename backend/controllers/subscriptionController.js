const Razorpay = require('razorpay');
const crypto = require('crypto');
const moment = require('moment');
const { SubscriptionPlan, Organization, OrganizationSubscription, PaymentTransaction, Notification } = require('../models');
const { sendPaymentConfirmation } = require('../services/emailService');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ============================================================
// GET ALL PLANS
// ============================================================
const getPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort('displayOrder price');
    res.json({ success: true, plans });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// GET ORG SUBSCRIPTION STATUS
// ============================================================
const getSubscriptionStatus = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId).populate('currentPlan');
    const history = await OrganizationSubscription.find({ organization: req.user.orgId })
      .populate('plan')
      .sort({ createdAt: -1 })
      .limit(10);

    const isActive = org.subscriptionExpiry && new Date() < new Date(org.subscriptionExpiry);
    const daysLeft = org.subscriptionExpiry 
      ? Math.max(0, moment(org.subscriptionExpiry).diff(moment(), 'days'))
      : 0;

    res.json({
      success: true,
      subscription: {
        currentPlan: org.currentPlan,
        subscriptionExpiry: org.subscriptionExpiry,
        isActive,
        daysLeft,
        status: org.status,
        history,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// CREATE RAZORPAY ORDER
// ============================================================
const createOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });

    const razorpay = getRazorpayInstance();
    const shortOrgId = req.user.orgId.toString().slice(-10);
    const receiptId = `uems_${shortOrgId}_${Date.now().toString().slice(-7)}`;
    const order = await razorpay.orders.create({
      amount: plan.price * 100, // paise
      currency: plan.currency || 'INR',
      receipt: receiptId,
      notes: { orgId: req.user.orgId.toString(), planId: planId },
    });

    // Create pending transaction
    const transaction = await PaymentTransaction.create({
      organization: req.user.orgId,
      plan: planId,
      amount: plan.price,
      currency: plan.currency || 'INR',
      provider: 'razorpay',
      providerOrderId: order.id,
      status: 'pending',
      metadata: { orderId: order.id },
    });

    return res.json({
      success: true,
      order,
      transaction: transaction._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment initiation failed.' });
  }
};

// ============================================================
// VERIFY RAZORPAY PAYMENT
// ============================================================
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, transactionId, planId } = req.body;

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    // Activate subscription
    const plan = await SubscriptionPlan.findById(planId);
    const org = await Organization.findById(req.user.orgId);

    // Calculate new expiry (extend if active)
    let newExpiry;
    if (org.subscriptionExpiry && new Date() < new Date(org.subscriptionExpiry)) {
      newExpiry = moment(org.subscriptionExpiry).add(plan.durationDays, 'days').toDate();
    } else {
      newExpiry = moment().add(plan.durationDays, 'days').toDate();
    }

    // Update organization
    await Organization.findByIdAndUpdate(req.user.orgId, {
      currentPlan: planId,
      subscriptionExpiry: newExpiry,
      status: 'active',
    });

    // Update transaction
    const transaction = await PaymentTransaction.findByIdAndUpdate(transactionId, {
      providerPaymentId: razorpay_payment_id,
      providerSignature: razorpay_signature,
      status: 'success',
    }, { new: true });

    // Create subscription record
    await OrganizationSubscription.create({
      organization: req.user.orgId,
      plan: planId,
      startDate: new Date(),
      endDate: newExpiry,
      status: 'active',
      paymentTransaction: transactionId,
    });

    // Create notification
    await Notification.create({
      organization: req.user.orgId,
      type: 'payment',
      title: '✅ Subscription Activated',
      message: `${plan.name} plan activated until ${moment(newExpiry).format('DD MMM YYYY')}`,
      priority: 'medium',
    });

    // Send email with rich details
    const updatedOrg = await Organization.findById(req.user.orgId);
    await sendPaymentConfirmation(updatedOrg, plan, transaction, {
        paymentDate: new Date(),
        expiryDate: newExpiry,
        paymentId: razorpay_payment_id
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully!',
      subscriptionExpiry: newExpiry,
      plan,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
};

module.exports = { getPlans, getSubscriptionStatus, createOrder, verifyPayment };
