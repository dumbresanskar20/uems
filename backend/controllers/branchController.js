const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { Branch, Organization, EmailVerification, SubscriptionPlan } = require('../models');
const { sendOTPEmail } = require('../services/emailService');

const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ============================================================
// GET BRANCHES
// ============================================================
const getBranches = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const branches = await Branch.find({ organization: orgId }).sort('name');
    res.json({ success: true, branches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// INITIATE BRANCH CREATION (send OTP)
// ============================================================
const initiateBranchCreation = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { name, code, email, username, password, confirmPassword, location, mobile } = req.body;

    if (!name || !code || !email || !username || !password) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Check branch limit
    const org = await Organization.findById(orgId).populate('currentPlan');
    const currentBranchCount = await Branch.countDocuments({ organization: orgId, isActive: true });
    const branchLimit = org.currentPlan?.branchLimit || 1;

    if (branchLimit !== -1 && currentBranchCount >= branchLimit) {
      return res.status(403).json({
        success: false,
        message: `Branch limit reached. Your ${org.currentPlan?.name || 'current'} plan allows ${branchLimit} branch(es).`,
        code: 'BRANCH_LIMIT_REACHED',
        currentCount: currentBranchCount,
        limit: branchLimit,
      });
    }

    // Check duplicates within org
    const codeExists = await Branch.findOne({ organization: orgId, code: code.toUpperCase() });
    if (codeExists) return res.status(400).json({ success: false, message: 'Branch code already exists.' });

    const usernameExists = await Branch.findOne({ organization: orgId, username: username.toLowerCase() });
    if (usernameExists) return res.status(400).json({ success: false, message: 'Username already taken.' });

    const emailExists = await Branch.findOne({ email: email.toLowerCase() });
    if (emailExists) return res.status(400).json({ success: false, message: 'Email already registered.' });

    // Generate OTP
    const otp = generateOTP();
    await EmailVerification.deleteMany({ email: email.toLowerCase(), type: 'branch_registration' });
    await EmailVerification.create({
      email: email.toLowerCase(),
      otpHash: hashOTP(otp),
      type: 'branch_registration',
      tempData: { name, code: code.toUpperCase(), email: email.toLowerCase(), username: username.toLowerCase(), password, location, mobile, orgId },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    await sendOTPEmail(email, otp, org.name, org.logo);

    res.json({ success: true, message: `Verification code sent to ${email}.`, email: email.toLowerCase() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// VERIFY BRANCH OTP & CREATE
// ============================================================
const verifyBranchCreation = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const verification = await EmailVerification.findOne({ email: email.toLowerCase(), type: 'branch_registration' });
    if (!verification) return res.status(400).json({ success: false, message: 'Verification session not found.' });

    if (new Date() > verification.expiresAt) {
      await verification.deleteOne();
      return res.status(400).json({ success: false, message: 'Verification code expired.' });
    }

    if (verification.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many attempts.' });
    }

    if (hashOTP(otp.toString()) !== verification.otpHash) {
      verification.attempts += 1;
      await verification.save();
      return res.status(400).json({ success: false, message: 'Invalid verification code.' });
    }

    const { name, code, password, location, mobile, orgId, username } = verification.tempData;

    const branch = await Branch.create({
      organization: orgId,
      name,
      code,
      email,
      username,
      password,
      location,
      mobile,
      isEmailVerified: true,
      isActive: true,
    });

    await verification.deleteOne();

    res.status(201).json({ success: true, message: 'Branch created successfully.', branch });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// UPDATE BRANCH
// ============================================================
const updateBranch = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const { name, location, mobile, isActive, smtpHost, smtpPort, smtpEmail, smtpPassword, smtpSenderName } = req.body;

    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, organization: orgId },
      { name, location, mobile, isActive, smtpHost, smtpPort, smtpEmail, smtpPassword, smtpSenderName },
      { new: true }
    );

    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found.' });
    res.json({ success: true, branch });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// DELETE BRANCH
// ============================================================
const deleteBranch = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    const branch = await Branch.findOneAndUpdate(
      { _id: req.params.id, organization: orgId },
      { isActive: false },
      { new: true }
    );
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found.' });
    res.json({ success: true, message: 'Branch deactivated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getBranches, initiateBranchCreation, verifyBranchCreation, updateBranch, deleteBranch };
