require('dotenv').config({ path: require('path').join(__dirname, '../env') });
const connectDB = require('../config/database');
const { Admin, SubscriptionPlan } = require('../models');

const seed = async () => {
  await connectDB();

  // Create super admin
  const adminExists = await Admin.findOne({ email: process.env.SUPER_ADMIN_EMAIL });
  if (!adminExists) {
    await Admin.create({
      username: process.env.SUPER_ADMIN_USERNAME || 'superadmin',
      email: process.env.SUPER_ADMIN_EMAIL || 'admin@uems.io',
      password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123',
      role: 'superadmin',
    });
    console.log('✅ Super admin created');
  }

  // Create subscription plans
  const plansExist = await SubscriptionPlan.countDocuments();
  if (plansExist === 0) {
    await SubscriptionPlan.insertMany([
      {
        name: 'Free Trial',
        slug: 'free',
        description: 'Get started with UEMS',
        price: 0,
        currency: 'INR',
        durationDays: 30,
        branchLimit: 1,
        features: ['Unlimited Enquiries', 'AI Features', 'Basic Dashboard', '1 Branch'],
        isActive: true,
        isFreePlan: true,
        displayOrder: 0,
      },
      {
        name: 'Starter',
        slug: 'starter',
        description: 'Perfect for small businesses',
        price: 999,
        currency: 'INR',
        durationDays: 30,
        branchLimit: 1,
        features: ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', '1 Branch', 'Email Automation', 'CSV/PDF Export'],
        isActive: true,
        isFreePlan: false,
        displayOrder: 1,
      },
      {
        name: 'Business',
        slug: 'business',
        description: 'For growing organizations',
        price: 2499,
        currency: 'INR',
        durationDays: 30,
        branchLimit: 5,
        features: ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', '5 Branches', 'Email Automation', 'CSV/PDF Export', 'Priority Support', 'Custom SMTP'],
        isActive: true,
        isFreePlan: false,
        displayOrder: 2,
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'For large enterprises',
        price: 5999,
        currency: 'INR',
        durationDays: 30,
        branchLimit: -1, // unlimited
        features: ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', 'Unlimited Branches', 'Email Automation', 'CSV/PDF Export', 'Dedicated Support', 'Custom SMTP', 'API Access', 'White Label'],
        isActive: true,
        isFreePlan: false,
        displayOrder: 3,
      },
    ]);
    console.log('✅ Subscription plans created');
  }

  console.log('🌱 Database seeded successfully!');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
