const cron = require('node-cron');
const Allocation = require('../models/Allocation.model');
const { logActivity, notifyUser } = require('../utils/activityLogger');

// Runs every hour at the top of the hour (e.g. 1:00, 2:00, etc.)
const overdueReturnsJob = cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    
    // Find active allocations where expectedReturnDate is in the past
    // and we haven't notified them today.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const overdueAllocations = await Allocation.find({
      status: 'Active',
      expectedReturnDate: { $lt: now },
      $or: [
        { lastOverdueNotifiedAt: null },
        { lastOverdueNotifiedAt: { $lt: startOfDay } }
      ]
    }).populate('holderId', 'name email').populate('asset', 'assetTag');

    for (const allocation of overdueAllocations) {
      if (allocation.holderType === 'Employee') {
        // Notify the employee
        await notifyUser({
          recipient: allocation.holderId._id,
          type: 'OverdueReturnAlert',
          message: `Your allocation for asset ${allocation.asset.assetTag} is overdue. Please return it immediately.`,
          relatedEntity: {
            entityType: 'Allocation',
            entityId: allocation._id
          },
          emailData: {
            assetTag: allocation.asset.assetTag,
            expectedReturnDate: allocation.expectedReturnDate
          }
        });

        // Log the alert activity (optional, but good for tracking system actions)
        await logActivity({
          actor: allocation.holderId._id, // the system is acting, but logging against user for tracking
          action: 'System issued Overdue Return Alert',
          entityType: 'Allocation',
          entityId: allocation._id
        });
      }
      
      // Update the notified timestamp
      allocation.lastOverdueNotifiedAt = now;
      await allocation.save();
    }
  } catch (error) {
    console.error('Error running overdueReturnsJob:', error);
  }
}, {
  scheduled: false // We will start it manually in server.js
});

module.exports = overdueReturnsJob;
