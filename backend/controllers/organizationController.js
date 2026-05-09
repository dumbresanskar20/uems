const { Organization, FormField, Notification, ActivityLog } = require('../models');

// ============================================================
// GET ORG PROFILE
// ============================================================
const getOrgProfile = async (req, res) => {
  try {
    const org = await Organization.findById(req.user.orgId)
      .select('-password')
      .populate('currentPlan');
    if (!org) return res.status(404).json({ success: false, message: 'Organization not found.' });
    res.json({ success: true, organization: org });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// UPDATE ORG PROFILE
// ============================================================
const updateOrgProfile = async (req, res) => {
  try {
    const { name, website, mobile, industryType } = req.body;
    const org = await Organization.findByIdAndUpdate(
      req.user.orgId,
      { name, website, mobile, industryType },
      { new: true }
    ).select('-password');
    res.json({ success: true, organization: org });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// UPDATE SMTP SETTINGS
// ============================================================
const updateSMTPSettings = async (req, res) => {
  try {
    const { smtpHost, smtpPort, smtpEmail, smtpPassword, smtpSenderName, replyToEmail } = req.body;
    const org = await Organization.findByIdAndUpdate(
      req.user.orgId,
      { smtpHost, smtpPort, smtpEmail, smtpPassword, smtpSenderName, replyToEmail },
      { new: true }
    ).select('-password');
    res.json({ success: true, message: 'SMTP settings updated.', organization: org });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// CHANGE PASSWORD
// ============================================================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const org = await Organization.findById(req.user.orgId);
    
    if (!(await org.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    org.password = newPassword;
    await org.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// FORM BUILDER - Get Fields
// ============================================================
const getFormFields = async (req, res) => {
  try {
    const orgId = req.user.orgId;
    let formField = await FormField.findOne({ organization: orgId });
    
    if (!formField) {
      // Create default fields
      formField = await FormField.create({
        organization: orgId,
        fields: [
          { id: 'name', label: 'Full Name', fieldType: 'text', isRequired: true, isDefault: true, order: 0 },
          { id: 'email', label: 'Email Address', fieldType: 'email', isRequired: false, isDefault: true, order: 1 },
          { id: 'mobile', label: 'Mobile Number', fieldType: 'phone', isRequired: false, isDefault: true, order: 2 },
        ],
      });
    }

    res.json({ success: true, formFields: formField });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// FORM BUILDER - Update Fields
// ============================================================
const updateFormFields = async (req, res) => {
  try {
    const { fields } = req.body;
    const orgId = req.user.orgId;

    // Ensure default fields are preserved
    const defaultFields = ['name', 'email', 'mobile'];
    const hasAllDefaults = defaultFields.every(id => fields.some(f => f.id === id && f.isDefault));
    if (!hasAllDefaults) {
      return res.status(400).json({ success: false, message: 'Default fields (Name, Email, Mobile) cannot be removed.' });
    }

    const formField = await FormField.findOneAndUpdate(
      { organization: orgId },
      { fields },
      { new: true, upsert: true }
    );

    res.json({ success: true, formFields: formField });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

// ============================================================
// NOTIFICATIONS
// ============================================================
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const orgId = req.user.orgId;

    const notifications = await Notification.find({ organization: orgId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ organization: orgId, isRead: false });

    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.updateMany({ organization: req.user.orgId }, { isRead: true });
    } else {
      await Notification.findByIdAndUpdate(id, { isRead: true });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = {
  getOrgProfile,
  updateOrgProfile,
  updateSMTPSettings,
  changePassword,
  getFormFields,
  updateFormFields,
  getNotifications,
  markNotificationRead,
};
