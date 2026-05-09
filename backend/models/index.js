const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ============================================================
// ADMIN MODEL
// ============================================================
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, default: 'superadmin' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
}, { timestamps: true });

adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
adminSchema.methods.comparePassword = async function(pwd) {
  return bcrypt.compare(pwd, this.password);
};

// ============================================================
// SUBSCRIPTION PLAN MODEL
// ============================================================
const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  price: { type: Number, required: true },
  originalPrice: { type: Number }, // price before discount
  currency: { type: String, default: 'INR' },
  durationDays: { type: Number, required: true },
  billingCycle: { type: String, enum: ['monthly', 'quarterly', 'semi-annual', 'annual'], default: 'monthly' },
  branchLimit: { type: Number, default: 1 }, // -1 = unlimited
  features: [String],
  isActive: { type: Boolean, default: true },
  isFreePlan: { type: Boolean, default: false },
  razorpayPlanId: String,
  stripePriceId: String,
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

// ============================================================
// ORGANIZATION MODEL
// ============================================================
const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  logo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  website: String,
  mobile: { type: String, required: true },
  industryType: String,
  isEmailVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'suspended', 'pending'], 
    default: 'pending' 
  },
  // SMTP Settings
  smtpHost: String,
  smtpPort: { type: Number, default: 587 },
  smtpEmail: String,
  smtpPassword: String,
  smtpSenderName: String,
  replyToEmail: String,
  // Subscription
  currentPlan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan' },
  subscriptionExpiry: Date,
  suspendedUntil: Date,
  trialDuration: { type: Number, default: 7 }, // days
  // Stats
  totalEnquiries: { type: Number, default: 0 },
  lastLogin: Date,
  loginIp: String,
}, { timestamps: true });

organizationSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
organizationSchema.methods.comparePassword = async function(pwd) {
  return bcrypt.compare(pwd, this.password);
};
organizationSchema.methods.isSubscriptionActive = function() {
  if (!this.subscriptionExpiry) return false;
  return new Date() < new Date(this.subscriptionExpiry);
};

// ============================================================
// BRANCH MODEL
// ============================================================
const branchSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true },
  email: { type: String, required: true, lowercase: true },
  username: { type: String, required: true },
  password: { type: String, required: true },
  location: String,
  mobile: String,
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  // Branch SMTP
  smtpHost: String,
  smtpPort: { type: Number, default: 587 },
  smtpEmail: String,
  smtpPassword: String,
  smtpSenderName: String,
  // Stats
  totalEnquiries: { type: Number, default: 0 },
  lastLogin: Date,
}, { timestamps: true });

branchSchema.index({ organization: 1, code: 1 }, { unique: true });
branchSchema.index({ organization: 1, username: 1 }, { unique: true });

branchSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
branchSchema.methods.comparePassword = async function(pwd) {
  return bcrypt.compare(pwd, this.password);
};

// ============================================================
// EMAIL VERIFICATION MODEL
// ============================================================
const emailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  otpHash: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['organization_registration', 'branch_registration', 'password_reset'],
    required: true 
  },
  tempData: { type: mongoose.Schema.Types.Mixed }, // store registration data
  attempts: { type: Number, default: 0 },
  resendCount: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

// ============================================================
// FORM FIELD MODEL
// ============================================================
const formFieldSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  fields: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    fieldType: { 
      type: String, 
      enum: ['text', 'email', 'phone', 'number', 'textarea', 'select', 'radio', 'checkbox', 'date', 'file'],
      required: true 
    },
    placeholder: String,
    isRequired: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false }, // cannot be deleted
    options: [String], // for select/radio/checkbox
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  }],
}, { timestamps: true });

// ============================================================
// ENQUIRY MODEL
// ============================================================
const enquirySchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  enquiryNumber: { type: String, unique: true },
  // Default fields
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true },
  mobile: { type: String },
  // Dynamic fields
  dynamicFields: { type: Map, of: mongoose.Schema.Types.Mixed },
  // Status & Pipeline
  status: {
    type: String,
    enum: ['new', 'contacted', 'in_progress', 'follow_up', 'completed', 'cancelled'],
    default: 'new'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // AI Analysis
  aiSummary: String,
  aiPriorityScore: { type: Number, min: 0, max: 100 },
  aiSuggestedActions: [String],
  aiAnalyzed: { type: Boolean, default: false },
  // Source
  source: { type: String, default: 'manual' },
  // Notes & Follow-up
  notes: [{ 
    text: String, 
    addedBy: String, 
    addedAt: { type: Date, default: Date.now } 
  }],
  followUpDate: Date,
  assignedTo: String,
  // Timestamps
  completedAt: Date,
  cancelledAt: Date,
}, { timestamps: true });

enquirySchema.index({ organization: 1, createdAt: -1 });
enquirySchema.index({ organization: 1, status: 1 });
enquirySchema.index({ organization: 1, branch: 1 });

// Auto-generate enquiry number
enquirySchema.pre('save', async function(next) {
  if (!this.enquiryNumber) {
    const count = await mongoose.model('Enquiry').countDocuments({ organization: this.organization });
    const org = await mongoose.model('Organization').findById(this.organization).select('slug');
    const prefix = org ? org.slug.substring(0, 3).toUpperCase() : 'ENQ';
    this.enquiryNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// ============================================================
// NOTIFICATION MODEL
// ============================================================
const notificationSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  type: {
    type: String,
    enum: ['urgent_enquiry', 'subscription_expiry', 'branch_activity', 'payment', 'system', 'new_enquiry'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: mongoose.Schema.Types.Mixed,
  isRead: { type: Boolean, default: false },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
}, { timestamps: true });

notificationSchema.index({ organization: 1, isRead: 1, createdAt: -1 });

// ============================================================
// ORGANIZATION SUBSCRIPTION MODEL
// ============================================================
const organizationSubscriptionSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['active', 'expired', 'cancelled', 'pending'],
    default: 'active' 
  },
  paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentTransaction' },
  autoRenew: { type: Boolean, default: false },
}, { timestamps: true });

// ============================================================
// PAYMENT TRANSACTION MODEL
// ============================================================
const paymentTransactionSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  provider: { type: String, enum: ['razorpay', 'stripe'], required: true },
  providerOrderId: String,
  providerPaymentId: String,
  providerSignature: String,
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

// ============================================================
// ACTIVITY LOG MODEL
// ============================================================
const activityLogSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  actor: { type: String }, // username
  actorRole: { type: String },
  action: { type: String, required: true },
  entity: { type: String }, // enquiry, branch, etc.
  entityId: mongoose.Schema.Types.ObjectId,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
}, { timestamps: true });

activityLogSchema.index({ organization: 1, createdAt: -1 });

// ============================================================
// EXPORT MODELS
// ============================================================
const Admin = mongoose.model('Admin', adminSchema);
const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const Organization = mongoose.model('Organization', organizationSchema);
const Branch = mongoose.model('Branch', branchSchema);
const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);
const FormField = mongoose.model('FormField', formFieldSchema);
const Enquiry = mongoose.model('Enquiry', enquirySchema);
const Notification = mongoose.model('Notification', notificationSchema);
const OrganizationSubscription = mongoose.model('OrganizationSubscription', organizationSubscriptionSchema);
const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = {
  Admin,
  SubscriptionPlan,
  Organization,
  Branch,
  EmailVerification,
  FormField,
  Enquiry,
  Notification,
  OrganizationSubscription,
  PaymentTransaction,
  ActivityLog,
};
