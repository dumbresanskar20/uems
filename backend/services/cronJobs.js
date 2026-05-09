const cron = require('node-cron');
const moment = require('moment');
const { Organization, Notification } = require('../models');
const { sendTrialExpiryReminder } = require('./emailService');

const startCronJobs = () => {
  // Run daily at 9 AM - check expired subscriptions and send reminders
  cron.schedule('0 9 * * *', async () => {
    console.log('⏰ Running subscription check cron...');
    try {
      const now = new Date();

      // Mark expired organizations
      const expired = await Organization.updateMany(
        { subscriptionExpiry: { $lt: now }, status: 'active', isEmailVerified: true },
        { status: 'expired' }
      );
      if (expired.modifiedCount > 0) {
        console.log(`⚠️ Marked ${expired.modifiedCount} organizations as expired`);
      }

      // Send 7-day reminder
      const sevenDaysFromNow = moment().add(7, 'days').endOf('day').toDate();
      const sevenDaysStart = moment().add(7, 'days').startOf('day').toDate();
      const expiringSoon7 = await Organization.find({
        subscriptionExpiry: { $gte: sevenDaysStart, $lte: sevenDaysFromNow },
        status: 'active',
        isEmailVerified: true,
      });

      for (const org of expiringSoon7) {
        await sendTrialExpiryReminder(org, 7);
        await Notification.create({
          organization: org._id,
          type: 'subscription_expiry',
          title: '⚠️ Subscription Expiring Soon',
          message: 'Your subscription expires in 7 days. Renew now to avoid interruption.',
          priority: 'high',
        });
      }

      // Send 1-day reminder
      const oneDayFromNow = moment().add(1, 'days').endOf('day').toDate();
      const oneDayStart = moment().add(1, 'days').startOf('day').toDate();
      const expiringSoon1 = await Organization.find({
        subscriptionExpiry: { $gte: oneDayStart, $lte: oneDayFromNow },
        status: 'active',
        isEmailVerified: true,
      });

      for (const org of expiringSoon1) {
        await sendTrialExpiryReminder(org, 1);
        await Notification.create({
          organization: org._id,
          type: 'subscription_expiry',
          title: '🚨 Subscription Expires Tomorrow!',
          message: 'Your subscription expires tomorrow. Renew now!',
          priority: 'urgent',
        });
      }

      console.log('✅ Subscription cron completed');
    } catch (err) {
      console.error('Cron error:', err.message);
    }
  });
};

module.exports = startCronJobs;
