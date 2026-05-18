/**
 * Seed Quarterly (3-month, 3% off) and Semi-Annual (6-month, 5% off) Plans
 * Run: node utils/seedMultiCyclePlans.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../env') });
const connectDB = require('../config/database');
const { SubscriptionPlan } = require('../models');

const BASE_PLANS = [
  { name: 'Starter',    monthlyPrice: 999,  branchLimit: 1,  slug: 'starter',    displayOrder: 1 },
  { name: 'Business',   monthlyPrice: 2499, branchLimit: 5,  slug: 'business',   displayOrder: 2 },
  { name: 'Enterprise', monthlyPrice: 5999, branchLimit: -1, slug: 'enterprise', displayOrder: 3 },
];

const FEATURES = {
  starter:    ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', '1 Branch', 'Email Automation', 'CSV/PDF Export'],
  business:   ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', '5 Branches', 'Email Automation', 'CSV/PDF Export', 'Priority Support', 'Custom SMTP'],
  enterprise: ['Unlimited Enquiries', 'AI Analysis', 'Full Dashboard', 'Unlimited Branches', 'Email Automation', 'CSV/PDF Export', 'Dedicated Support', 'Custom SMTP', 'API Access', 'White Label'],
};

const CYCLES = [
  { key: 'quarterly',    months: 3,  durationDays: 90,  discount: 0.03, label: '3% Quarterly Discount', suffix: '-3m',  order: 20 },
  { key: 'semi-annual',  months: 6,  durationDays: 180, discount: 0.05, label: '5% Semi-Annual Discount', suffix: '-6m', order: 30 },
];

const seed = async () => {
  await connectDB();

  let created = 0;
  let skipped = 0;

  for (const cycle of CYCLES) {
    for (const plan of BASE_PLANS) {
      const slug = `${plan.slug}${cycle.suffix}`;
      const exists = await SubscriptionPlan.findOne({ slug });

      if (exists) {
        console.log(`⏭  Skipping ${plan.name} (${cycle.key}) — already exists`);
        skipped++;
        continue;
      }

      const originalPrice = plan.monthlyPrice * cycle.months;
      const discountedPrice = Math.round(originalPrice * (1 - cycle.discount));
      const saved = originalPrice - discountedPrice;

      await SubscriptionPlan.create({
        name: `${plan.name} ${cycle.months}M`,
        slug,
        description: `${plan.name} plan billed every ${cycle.months} months — Save ${Math.round(cycle.discount * 100)}%`,
        price: discountedPrice,
        originalPrice,
        currency: 'INR',
        durationDays: cycle.durationDays,
        billingCycle: cycle.key,
        branchLimit: plan.branchLimit,
        features: [...FEATURES[plan.slug], cycle.label],
        isActive: true,
        isFreePlan: false,
        displayOrder: plan.displayOrder + cycle.order,
      });

      console.log(
        `✅ Created ${plan.name} ${cycle.months}M: ₹${discountedPrice} (was ₹${originalPrice}, saved ₹${saved})`
      );
      created++;
    }
  }

  console.log(`\n🌱 Done! Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
