const mongoose = require('mongoose');

const auditItemSchema = new mongoose.Schema(
  {
    auditCycle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AuditCycle',
      required: true
    },
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true
    },
    checkedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    result: {
      type: String,
      enum: ['Pending', 'Verified', 'Missing', 'Damaged'],
      default: 'Pending'
    },
    notes: {
      type: String,
      default: null
    },
    checkedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for filtering checklists and reports quickly
auditItemSchema.index({ auditCycle: 1, result: 1 });

const AuditItem = mongoose.model('AuditItem', auditItemSchema);

module.exports = AuditItem;
