const ActivityLog = require('../models/ActivityLog.model');
const Notification = require('../models/Notification.model');
const User = require('../models/User.model');
const sendEmail = require('./sendEmail');
const emailTemplates = require('../templates/emailTemplates');

/**
 * Logs an activity into the ActivityLog collection.
 * 
 * @param {Object} params
 * @param {ObjectId} params.actor - User who performed the action
 * @param {String} params.action - Description of the action
 * @param {String} params.entityType - Type of entity affected
 * @param {ObjectId} params.entityId - ID of the entity affected
 * @param {Object} [params.metadata] - Extra context
 */
const logActivity = async ({ actor, action, entityType, entityId, metadata = {} }) => {
  try {
    await ActivityLog.create({
      actor,
      action,
      entityType,
      entityId,
      metadata
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
};

/**
 * Creates a notification for a user and optionally sends an email based on the type.
 * 
 * @param {Object} params
 * @param {ObjectId} params.recipient - User receiving the notification
 * @param {String} params.type - Type of notification (e.g. AssetAssigned)
 * @param {String} params.message - Body of the notification
 * @param {Object} params.relatedEntity - { entityType, entityId }
 * @param {Object} [params.emailData] - Data needed to render the email template
 */
const notifyUser = async ({ recipient, type, message, relatedEntity, emailData }) => {
  try {
    const notification = await Notification.create({
      recipient,
      type,
      message,
      relatedEntity
    });

    const user = await User.findById(recipient);
    if (!user) return;

    let emailHtml = null;
    let subject = 'New Notification from AssetFlow';

    if (emailData) {
      switch (type) {
        case 'MaintenanceApproved':
        case 'MaintenanceRejected':
          subject = `Maintenance Request ${type === 'MaintenanceApproved' ? 'Approved' : 'Rejected'}`;
          emailHtml = emailTemplates.maintenanceApprovalEmail(user.name, emailData.assetTag, type === 'MaintenanceApproved' ? 'Approved' : 'Rejected');
          break;
        case 'TransferApproved':
          subject = 'Transfer Request Approved';
          emailHtml = emailTemplates.transferApprovalEmail(user.name, emailData.assetTag, 'Approved');
          break;
        case 'BookingConfirmed':
          subject = 'Booking Confirmed';
          emailHtml = emailTemplates.bookingConfirmationEmail(user.name, emailData.assetName, emailData.startTime, emailData.endTime);
          break;
        case 'BookingReminder':
          subject = 'Booking Reminder';
          emailHtml = emailTemplates.bookingReminderEmail(user.name, emailData.assetName, emailData.startTime);
          break;
        case 'AuditDiscrepancyFlagged':
        case 'AssetAssigned':
        case 'BookingCancelled':
          emailHtml = emailTemplates.notificationEmail(user.name, message);
          break;
        case 'OverdueReturnAlert':
          subject = 'Overdue Asset Return';
          emailHtml = emailTemplates.returnReminderEmail(user.name, emailData.assetTag, emailData.expectedReturnDate);
          break;
        default:
          emailHtml = emailTemplates.notificationEmail(user.name, message);
      }
    } else {
      emailHtml = emailTemplates.notificationEmail(user.name, message);
    }

    if (emailHtml) {
      await sendEmail({
        to: user.email,
        subject,
        html: emailHtml
      });
    }

    return notification;
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
};

module.exports = {
  logActivity,
  notifyUser
};
