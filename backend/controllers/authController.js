const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const { Organization, Branch, Admin, EmailVerification, SubscriptionPlan, OrganizationSubscription, ActivityLog } = require('../models');
const { generateAccessToken, generateRefreshToken } = require('../middleware/auth');
const { sendOTPEmail } = require('../services/emailService');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Hash OTP
const hashOTP = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// ============================================================
// SUPER ADMIN LOGIN
// ============================================================
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }
    if (!admin.isActive) return res.status(403).json({ success: false, message: 'Account deactivated.' });

    admin.lastLogin = new Date();
    await admin.save();

    const payload = { id: admin._id, role: 'superadmin', email: admin.email };
    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      success: true,
      token,
      refreshToken,
      user: { id: admin._id, email: admin.email, username: admin.username, role: 'superadmin' },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// GET ALL ORGANIZATIONS (for login dropdown)
// ============================================================
const getOrganizationsForLogin = async (req, res) => {
  try {
    const orgs = await Organization.find({ isEmailVerified: true, isActive: true, status: { $ne: 'pending' } })
      .select('name slug logo favicon')
      .sort('name');
    res.json({ success: true, organizations: orgs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// Get branches for an org (for login dropdown)
const getBranchesForLogin = async (req, res) => {
  try {
    const { orgId } = req.params;
    const branches = await Branch.find({ organization: orgId, isActive: true, isEmailVerified: true })
      .select('name code location');
    res.json({ success: true, branches });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// ORGANIZATION REGISTRATION - STEP 1 (Send OTP)
// ============================================================
const initiateOrgRegistration = async (req, res) => {
  try {
    const { name, username, email, password, confirmPassword, website, mobile, industryType, trialDuration } = req.body;

    // Validations
    if (!name || !username || !email || !password || !mobile) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Check duplicates
    const emailExists = await Organization.findOne({ email: email.toLowerCase() });
    if (emailExists) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const usernameExists = await Organization.findOne({ username: username.toLowerCase() });
    if (usernameExists) return res.status(400).json({ success: false, message: 'Username already taken.' });

    const nameExists = await Organization.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (nameExists) return res.status(400).json({ success: false, message: 'Organization name already registered.' });

    // Generate slug
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    // Validate trial duration (1, 7, 15, 30 days)
    const validTrials = [1, 7, 15, 30];
    const trial = validTrials.includes(parseInt(trialDuration)) ? parseInt(trialDuration) : 7;

    // Generate OTP
    const otp = generateOTP();
    const otpHash = hashOTP(otp);

    // Delete any existing verification for this email
    await EmailVerification.deleteMany({ email: email.toLowerCase() });

    // Store temp data
    await EmailVerification.create({
      email: email.toLowerCase(),
      otpHash,
      type: 'organization_registration',
      tempData: { name, username, email: email.toLowerCase(), password, website, mobile, industryType, trialDuration: trial, slug },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    // Send OTP
    await sendOTPEmail(email, otp, name);

    res.json({ 
      success: true, 
      message: `Verification code sent to ${email}. Valid for 10 minutes.`,
      email: email.toLowerCase(),
    });
  } catch (err) {
    console.error('Registration Initiation Error:', err);
    res.status(err.status || 500).json({ 
      success: false, 
      message: err.message || 'Server error during registration.' 
    });
  }
};

// ============================================================
// ORGANIZATION REGISTRATION - STEP 2 (Verify OTP & Create Account)
// ============================================================
const verifyOrgRegistration = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const verification = await EmailVerification.findOne({
      email: email.toLowerCase(),
      type: 'organization_registration',
      isVerified: false,
    });

    if (!verification) {
      return res.status(400).json({ success: false, message: 'Verification session not found. Please restart registration.' });
    }

    if (new Date() > verification.expiresAt) {
      await verification.deleteOne();
      return res.status(400).json({ success: false, message: 'Verification code expired. Request a new code.' });
    }

    if (verification.attempts >= 5) {
      return res.status(429).json({ success: false, message: 'Too many failed attempts. Please restart registration.' });
    }

    const otpHash = hashOTP(otp.toString());
    if (otpHash !== verification.otpHash) {
      verification.attempts += 1;
      await verification.save();
      const remaining = 5 - verification.attempts;
      return res.status(400).json({ 
        success: false, 
        message: `Invalid verification code. ${remaining} attempts remaining.` 
      });
    }

    // OTP Valid - Create Organization
    const { name, username, password, website, mobile, industryType, trialDuration, slug } = verification.tempData;

    // Get free plan
    const freePlan = await SubscriptionPlan.findOne({ isFreePlan: true });

    // Calculate expiry
    const expiryDate = moment().add(trialDuration, 'days').toDate();

    const organization = await Organization.create({
      name,
      slug,
      username,
      email,
      password,
      website,
      mobile,
      industryType,
      isEmailVerified: true,
      isActive: true,
      status: 'active',
      currentPlan: freePlan?._id,
      subscriptionExpiry: expiryDate,
      trialDuration,
    });

    // Create subscription record
    if (freePlan) {
      await OrganizationSubscription.create({
        organization: organization._id,
        plan: freePlan._id,
        startDate: new Date(),
        endDate: expiryDate,
        status: 'active',
      });
    }

    // Mark verified & delete
    await verification.deleteOne();

    // Generate tokens
    const payload = { id: organization._id, role: 'organization', email: organization.email, orgId: organization._id };
    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.status(201).json({
      success: true,
      message: 'Organization account created successfully!',
      token,
      refreshToken,
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        email: organization.email,
        logo: organization.logo,
        subscriptionExpiry: organization.subscriptionExpiry,
        role: 'organization',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// RESEND OTP
// ============================================================
const resendOTP = async (req, res) => {
  try {
    const { email, type } = req.body;

    const verification = await EmailVerification.findOne({ email: email.toLowerCase(), type });
    if (!verification) {
      return res.status(400).json({ success: false, message: 'No pending verification found.' });
    }

    if (verification.resendCount >= 3) {
      return res.status(429).json({ success: false, message: 'Maximum resend attempts reached. Please restart registration.' });
    }

    // Generate new OTP
    const otp = generateOTP();
    verification.otpHash = hashOTP(otp);
    verification.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    verification.attempts = 0;
    verification.resendCount += 1;
    await verification.save();

    const orgName = verification.tempData?.name || 'UEMS';
    await sendOTPEmail(email, otp, orgName);

    res.json({ success: true, message: `New verification code sent to ${email}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// ORGANIZATION LOGIN
// ============================================================
const orgLogin = async (req, res) => {
  try {
    const { identifier, password, orgId, branchId } = req.body;

    // Branch login
    if (branchId) {
      const branch = await Branch.findById(branchId).populate('organization');
      if (!branch) return res.status(404).json({ success: false, message: 'Branch not found.' });
      if (!branch.isActive || !branch.isEmailVerified) {
        return res.status(403).json({ success: false, message: 'Branch account is not active.' });
      }
      // Verify credentials
      const isMatch = (identifier === branch.username || identifier === branch.email) && 
                      await branch.comparePassword(password);
      if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

      // Check org subscription & suspension
      const org = branch.organization;
      if (org.status === 'suspended') {
        if (org.suspendedUntil && new Date() < new Date(org.suspendedUntil)) {
          const remaining = moment(org.suspendedUntil).fromNow(true);
          return res.status(403).json({ 
            success: false, 
            message: `The organization account is suspended for another ${remaining}.`,
            code: 'ACCOUNT_SUSPENDED'
          });
        } else {
          org.status = 'active';
          org.suspendedUntil = null;
          await org.save();
        }
      }

      if (org.status === 'expired') {
        return res.status(403).json({ success: false, message: 'Organization subscription expired.', code: 'SUBSCRIPTION_EXPIRED' });
      }

      branch.lastLogin = new Date();
      await branch.save();

      const payload = { 
        id: branch._id, 
        role: 'branch', 
        email: branch.email,
        orgId: org._id,
        branchId: branch._id,
      };
      const token = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      return res.json({
        success: true,
        token,
        refreshToken,
        user: {
          id: branch._id,
          name: branch.name,
          email: branch.email,
          role: 'branch',
          organization: { id: org._id, name: org.name, logo: org.logo, slug: org.slug },
          branch: { id: branch._id, name: branch.name, code: branch.code },
        },
      });
    }

    // Organization login
    const org = await Organization.findById(orgId).populate('currentPlan');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });
    if (!org.isEmailVerified) return res.status(403).json({ success: false, message: 'Email not verified.' });
    if (!org.isActive) return res.status(403).json({ success: false, message: 'Account deactivated.' });

    const isMatch = (identifier === org.username || identifier === org.email) && 
                    await org.comparePassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    // Check suspension
    if (org.status === 'suspended') {
      if (org.suspendedUntil && new Date() < new Date(org.suspendedUntil)) {
        const remaining = moment(org.suspendedUntil).fromNow(true);
        return res.status(403).json({ 
          success: false, 
          message: `Your account is suspended for another ${remaining}.`,
          code: 'ACCOUNT_SUSPENDED',
          suspendedUntil: org.suspendedUntil
        });
      } else {
        org.status = 'active';
        org.suspendedUntil = null;
        await org.save();
      }
    }

    if (org.status === 'expired') {
      return res.status(403).json({ 
        success: false, 
        message: 'Your subscription has expired. Please renew to continue.',
        code: 'SUBSCRIPTION_EXPIRED',
        orgId: org._id,
      });
    }

    org.lastLogin = new Date();
    org.loginIp = req.ip;
    await org.save();

    const payload = { id: org._id, role: 'organization', email: org.email, orgId: org._id };
    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: org._id,
        name: org.name,
        email: org.email,
        role: 'organization',
        organization: { id: org._id, name: org.name, logo: org.logo, favicon: org.favicon, slug: org.slug },
        plan: org.currentPlan,
        subscriptionExpiry: org.subscriptionExpiry,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// REFRESH TOKEN
// ============================================================
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required.' });

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const newToken = generateAccessToken({ id: decoded.id, role: decoded.role, email: decoded.email, orgId: decoded.orgId });

    res.json({ success: true, token: newToken });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid refresh token.' });
  }
};

module.exports = {
  adminLogin,
  getOrganizationsForLogin,
  getBranchesForLogin,
  initiateOrgRegistration,
  verifyOrgRegistration,
  resendOTP,
  orgLogin,
  refreshToken,
};
