const mongoose = require('mongoose');

const allocationSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required']
    },
    holderType: {
      type: String,
      enum: ['Employee', 'Department'],
      required: [true, 'Holder type is required']
    },
    holderId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'holderType',
      required: [true, 'Holder reference is required']
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Allocated by user reference is required']
    },
    allocatedDate: {
      type: Date,
      default: Date.now
    },
    expectedReturnDate: {
      type: Date,
      default: null
    },
    actualReturnDate: {
      type: Date,
      default: null
    },
    returnConditionNotes: {
      type: String,
      default: null
    },
    lastOverdueNotifiedAt: {
      type: Date,
      default: null
    },
    returnConditionRating: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged', null],
      default: null
    },
    status: {
      type: String,
      enum: ['Active', 'Returned'],
      default: 'Active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Index on asset + status for fast "is this asset currently allocated" checks
allocationSchema.index({ asset: 1, status: 1 });

module.exports = mongoose.model('Allocation', allocationSchema);
