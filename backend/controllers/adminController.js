const moment = require('moment');
const { Organization, Branch, SubscriptionPlan, Enquiry, PaymentTransaction, OrganizationSubscription } = require('../models');

// ============================================================
// DASHBOARD STATS
// ============================================================
const getDashboard = async (req, res) => {
  try {
    const [totalOrgs, activeOrgs, expiredOrgs, totalEnquiries, totalPlans, recentOrgs, revenue] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: 'active' }),
      Organization.countDocuments({ status: 'expired' }),
      Enquiry.countDocuments(),
      SubscriptionPlan.countDocuments({ isActive: true }),
      Organization.find().sort({ createdAt: -1 }).limit(5).select('name email status subscriptionExpiry createdAt').populate('currentPlan', 'name'),
      PaymentTransaction.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalOrgs,
        activeOrgs,
        expiredOrgs,
        totalEnquiries,
        totalPlans,
        totalRevenue: revenue[0]?.total || 0,
        recentOrgs,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// GET ALL ORGANIZATIONS
// ============================================================
const getOrganizations = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const filter = {};
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
    if (status) filter.status = status;

    const total = await Organization.countDocuments(filter);
    const organizations = await Organization.find(filter)
      .select('-password -smtpPassword')
      .populate('currentPlan', 'name branchLimit')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, organizations, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// UPDATE ORG STATUS
// ============================================================
const updateOrgStatus = async (req, res) => {
  try {
    const { status, isActive, suspensionDays } = req.body;
    let updateData = { ...(status && { status }), ...(isActive !== undefined && { isActive }) };
    
    if (status === 'suspended' && suspensionDays) {
      updateData.suspendedUntil = moment().add(suspensionDays, 'days').toDate();
    } else if (status === 'active') {
      updateData.suspendedUntil = null;
    }

    const org = await Organization.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });
    res.json({ success: true, organization: org });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// MANAGE SUBSCRIPTION PLANS
// ============================================================
const createPlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updatePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found.' });
    res.json({ success: true, plan });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deletePlan = async (req, res) => {
  try {
    await SubscriptionPlan.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Plan deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// EXTEND ORG SUBSCRIPTION MANUALLY
// ============================================================
const extendSubscription = async (req, res) => {
  try {
    const { planId, days } = req.body;
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });

    let newExpiry;
    if (org.subscriptionExpiry && new Date() < new Date(org.subscriptionExpiry)) {
      newExpiry = moment(org.subscriptionExpiry).add(days, 'days').toDate();
    } else {
      newExpiry = moment().add(days, 'days').toDate();
    }

    await Organization.findByIdAndUpdate(req.params.id, {
      subscriptionExpiry: newExpiry,
      status: 'active',
      ...(planId && { currentPlan: planId }),
    });

    res.json({ success: true, message: 'Subscription extended.', newExpiry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// DELETE ORGANIZATION
// ============================================================
const deleteOrganization = async (req, res) => {
  try {
    const orgId = req.params.id;
    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });

    // Delete all associated data
    await Promise.all([
      Branch.deleteMany({ organization: orgId }),
      Enquiry.deleteMany({ organization: orgId }),
      FormField.deleteMany({ organization: orgId }),
      Notification.deleteMany({ organization: orgId }),
      OrganizationSubscription.deleteMany({ organization: orgId }),
      PaymentTransaction.deleteMany({ organization: orgId }),
      ActivityLog.deleteMany({ organization: orgId }),
      Organization.findByIdAndDelete(orgId),
    ]);

    res.json({ success: true, message: 'Organization and all associated data deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getDashboard, getOrganizations, updateOrgStatus, createPlan, updatePlan, deletePlan, extendSubscription, deleteOrganization };
