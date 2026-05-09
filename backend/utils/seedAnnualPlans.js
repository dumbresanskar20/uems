/**
 * Seed Annual Subscription Plans (10% discount on 12x monthly price)
 * Run: node utils/seedAnnualPlans.js
 */
require('dotenv').config();
const connectDB = require('../config/database');
const { SubscriptionPlan } = require('../models');

const DISCOUNT = 0.10; // 10% off

const monthlyPlans = [
  { name: 'Starter', monthlyPrice: 999,  branchLimit: 1,  slug: 'starter', displayOrder: 1 },
  { name: 'Business', monthlyPrice: 2499, branchLimit: 5,  slug: 'business', displayOrder: 2 },
  { name: 'Enterprise', monthlyPrice: 5999, branchLimit: -1, slug: 'enterprise', displayOrder: 3 },
];

const FEATURES = {
  starter: ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', '1 Branch', 'Email Automation', 'CSV/PDF Export'],
  business: ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', '5 Branches', 'Email Automation', 'CSV/PDF Export', 'Priority Support', 'Custom SMTP'],
  enterprise: ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', 'Unlimited Branches', 'Email Automation', 'CSV/PDF Export', 'Dedicated Support', 'Custom SMTP', 'API Access', 'White Label'],
};

const seed = async () => {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const plan of monthlyPlans) {
    const annualSlug = `${plan.slug}-annual`;
    const exists = await SubscriptionPlan.findOne({ slug: annualSlug });

    if (exists) {
      console.log(`⏭  Skipping ${plan.name} Annual (already exists)`);
      skipped++;
      continue;
    }

    const originalPrice = plan.monthlyPrice * 12;
    const discountedPrice = Math.round(originalPrice * (1 - DISCOUNT));

    await SubscriptionPlan.create({
      name: `${plan.name} Annual`,
      slug: annualSlug,
      description: `${plan.name} plan billed annually — Save 10%`,
      price: discountedPrice,
      originalPrice: originalPrice,
      currency: 'INR',
      durationDays: 365,
      billingCycle: 'annual',
      branchLimit: plan.branchLimit,
      features: [...FEATURES[plan.slug], '10% Annual Discount', 'Priority Onboarding'],
      isActive: true,
      isFreePlan: false,
      displayOrder: plan.displayOrder + 10, // show after monthly plans
    });

    console.log(
      `✅ Created ${plan.name} Annual: ₹${discountedPrice} (was ₹${originalPrice}, saved ₹${originalPrice - discountedPrice})`
    );
    created++;
  }

  console.log(`\n🌱 Done! Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
