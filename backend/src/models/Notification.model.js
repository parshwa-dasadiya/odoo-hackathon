const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: [
        'AssetAssigned',
        'MaintenanceApproved',
        'MaintenanceRejected',
        'BookingConfirmed',
        'BookingCancelled',
        'BookingReminder',
        'TransferApproved',
        'OverdueReturnAlert',
        'AuditDiscrepancyFlagged'
      ],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    relatedEntity: {
      entityType: {
        type: String,
        required: true
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      }
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
