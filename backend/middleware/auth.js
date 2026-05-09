const jwt = require('jsonwebtoken');
const { Admin, Organization, Branch } = require('../models');

// Generate tokens
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });
};

// Protect routes - verify JWT
const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // Validate user still exists and is active
    if (decoded.role === 'superadmin') {
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin || !admin.isActive) return res.status(401).json({ success: false, message: 'Account deactivated.' });
      req.admin = admin;
    } else if (decoded.role === 'organization') {
      const org = await Organization.findById(decoded.id).select('-password').populate('currentPlan');
      if (!org || !org.isActive) return res.status(401).json({ success: false, message: 'Organization account deactivated.' });
      if (org.status === 'expired') return res.status(403).json({ success: false, message: 'Subscription expired.', code: 'SUBSCRIPTION_EXPIRED' });
      if (org.status === 'suspended' && org.suspendedUntil && new Date() < new Date(org.suspendedUntil)) {
        return res.status(403).json({ success: false, message: 'Account is suspended.', code: 'ACCOUNT_SUSPENDED' });
      }
      req.organization = org;
    } else if (decoded.role === 'branch') {
      const branch = await Branch.findById(decoded.id).select('-password').populate('organization');
      if (!branch || !branch.isActive) return res.status(401).json({ success: false, message: 'Branch account deactivated.' });
      // Check org subscription
      if (branch.organization && branch.organization.status === 'expired') {
        return res.status(403).json({ success: false, message: 'Organization subscription expired.', code: 'SUBSCRIPTION_EXPIRED' });
      }
      req.branch = branch;
      req.organization = branch.organization;
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role '${req.user?.role}' is not authorized to access this route.` 
      });
    }
    next();
  };
};

// Ensure org access (org or branch of that org)
const orgAccess = (req, res, next) => {
  if (req.user.role === 'superadmin') return next();
  if (req.user.role === 'organization') return next();
  if (req.user.role === 'branch') return next();
  return res.status(403).json({ success: false, message: 'Forbidden.' });
};

module.exports = { generateAccessToken, generateRefreshToken, protect, authorize, orgAccess };
