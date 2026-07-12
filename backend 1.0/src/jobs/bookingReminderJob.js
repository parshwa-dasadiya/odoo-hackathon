const cron = require('node-cron');
const Booking = require('../models/Booking.model');
const { logActivity, notifyUser } = require('../utils/activityLogger');

// Runs every 5 minutes
const bookingReminderJob = cron.schedule('*/5 * * * *', async () => {
  try {
    const now = new Date();
    // 60 minutes from now
    const future = new Date(now.getTime() + 60 * 60000);

    const upcomingBookings = await Booking.find({
      status: 'Active',
      reminderSent: false,
      startTime: {
        $gt: now,
        $lte: future
      }
    }).populate('bookedBy', 'name email').populate('resource', 'name');

    for (const booking of upcomingBookings) {
      await notifyUser({
        recipient: booking.bookedBy._id,
        type: 'BookingReminder',
        message: `Reminder: Your booking for ${booking.resource.name} starts at ${booking.startTime.toLocaleString()}.`,
        relatedEntity: {
          entityType: 'Booking',
          entityId: booking._id
        },
        emailData: {
          assetName: booking.resource.name,
          startTime: booking.startTime
        }
      });

      booking.reminderSent = true;
      await booking.save();
    }
  } catch (error) {
    console.error('Error running bookingReminderJob:', error);
  }
}, {
  scheduled: false
});

module.exports = bookingReminderJob;
