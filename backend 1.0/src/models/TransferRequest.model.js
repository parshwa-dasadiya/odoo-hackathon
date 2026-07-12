const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema(
  {
    asset: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required']
    },
    fromHolder: {
      holderType: {
        type: String,
        enum: ['Employee', 'Department'],
        required: true
      },
      holderId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'fromHolder.holderType',
        required: true
      }
    },
    toHolder: {
      holderType: {
        type: String,
        enum: ['Employee', 'Department'],
        required: true
      },
      holderId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'toHolder.holderType',
        required: true
      }
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requested by user reference is required']
    },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Rejected'],
      default: 'Requested'
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionNotes: {
      type: String,
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('TransferRequest', transferRequestSchema);
