const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const enquiryController = require('../controllers/enquiryController');
const branchController = require('../controllers/branchController');
const subscriptionController = require('../controllers/subscriptionController');
const orgController = require('../controllers/organizationController');
const adminController = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Rate limiters
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many requests. Try again later.' } });
const otpLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 5, message: { success: false, message: 'Too many OTP requests.' } });


// ============================================================
// AUTH ROUTES
// ============================================================
router.post('/auth/admin/login', authLimiter, authController.adminLogin);
router.get('/auth/organizations', authController.getOrganizationsForLogin);
router.get('/auth/organizations/:orgId/branches', authController.getBranchesForLogin);
router.post('/auth/register/initiate', otpLimiter, authController.initiateOrgRegistration);
router.post('/auth/register/verify', otpLimiter, authController.verifyOrgRegistration);
router.post('/auth/otp/resend', otpLimiter, authController.resendOTP);
router.post('/auth/login', authLimiter, authController.orgLogin);
router.post('/auth/refresh', authController.refreshToken);

// ============================================================
// ENQUIRY ROUTES
// ============================================================
router.get('/enquiries/dashboard', protect, enquiryController.getDashboardStats);
router.get('/enquiries/pipeline', protect, enquiryController.getPipeline);
router.get('/enquiries/export', protect, enquiryController.exportEnquiries);
router.get('/enquiries', protect, enquiryController.getEnquiries);
router.post('/enquiries', protect, enquiryController.createEnquiry);
router.get('/enquiries/:id', protect, enquiryController.getEnquiry);
router.put('/enquiries/:id', protect, enquiryController.updateEnquiry);
router.delete('/enquiries/:id', protect, enquiryController.deleteEnquiry);
router.post('/enquiries/:id/notes', protect, enquiryController.addNote);

// ============================================================
// BRANCH ROUTES
// ============================================================
router.get('/branches', protect, authorize('organization'), branchController.getBranches);
router.post('/branches/initiate', protect, authorize('organization'), branchController.initiateBranchCreation);
router.post('/branches/verify', protect, authorize('organization'), branchController.verifyBranchCreation);
router.put('/branches/:id', protect, authorize('organization'), branchController.updateBranch);
router.delete('/branches/:id', protect, authorize('organization'), branchController.deleteBranch);

// ============================================================
// SUBSCRIPTION & PAYMENT ROUTES
// ============================================================
router.get('/plans', subscriptionController.getPlans);
router.get('/subscription/status', protect, subscriptionController.getSubscriptionStatus);
router.post('/subscription/order', protect, authorize('organization'), subscriptionController.createOrder);
router.post('/subscription/verify', protect, authorize('organization'), subscriptionController.verifyPayment);

// ============================================================
// ORGANIZATION SETTINGS
// ============================================================
router.get('/org/profile', protect, authorize('organization', 'branch'), orgController.getOrgProfile);
router.put('/org/profile', protect, authorize('organization'), orgController.updateOrgProfile);
router.put('/org/smtp', protect, authorize('organization'), orgController.updateSMTPSettings);
router.put('/org/password', protect, authorize('organization'), orgController.changePassword);
router.get('/org/form-fields', protect, orgController.getFormFields);
router.put('/org/form-fields', protect, authorize('organization'), orgController.updateFormFields);

// ============================================================
// NOTIFICATIONS
// ============================================================
router.get('/notifications', protect, orgController.getNotifications);
router.put('/notifications/:id/read', protect, orgController.markNotificationRead);

// ============================================================
// SUPER ADMIN ROUTES
// ============================================================
router.get('/admin/dashboard', protect, authorize('superadmin'), adminController.getDashboard);
router.get('/admin/organizations', protect, authorize('superadmin'), adminController.getOrganizations);
router.put('/admin/organizations/:id/status', protect, authorize('superadmin'), adminController.updateOrgStatus);
router.put('/admin/organizations/:id/subscription', protect, authorize('superadmin'), adminController.extendSubscription);
router.post('/admin/plans', protect, authorize('superadmin'), adminController.createPlan);
router.delete('/admin/organizations/:id', protect, authorize('superadmin'), adminController.deleteOrganization);
router.put('/admin/plans/:id', protect, authorize('superadmin'), adminController.updatePlan);
router.delete('/admin/plans/:id', protect, authorize('superadmin'), adminController.deletePlan);

module.exports = router;
