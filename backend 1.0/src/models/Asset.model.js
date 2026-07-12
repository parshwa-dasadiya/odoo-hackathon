const mongoose = require('mongoose');
const Counter = require('./Counter.model');

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AssetCategory',
      required: [true, 'Asset category is required']
    },
    assetTag: {
      type: String,
      unique: true,
      index: true
    },
    serialNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    acquisitionDate: {
      type: Date,
      required: [true, 'Acquisition date is required']
    },
    acquisitionCost: {
      type: Number,
      min: [0, 'Acquisition cost cannot be negative'],
      required: [true, 'Acquisition cost is required']
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
      required: [true, 'Condition is required']
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true
    },
    photos: [
      {
        url: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],
    isBookable: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'],
      default: 'Available',
      index: true
    },
    currentHolder: {
      holderType: {
        type: String,
        enum: ['Employee', 'Department'],
        required: function () {
          return this.currentHolder && this.currentHolder.holderId != null;
        }
      },
      holderId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'currentHolder.holderType',
        default: null
      }
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes supporting directory search and filtering
assetSchema.index({ status: 1, category: 1, department: 1, location: 1 });

// Full text index across search terms name, assetTag, and serialNumber
assetSchema.index({ name: 'text', assetTag: 'text', serialNumber: 'text' });

// Pre-save hook to generate sequential assetTag
// CRITICAL: We use an atomic findOneAndUpdate on a Counter collection here instead of doing
// "count existing documents + 1" because count+1 is vulnerable to race conditions under concurrent requests.
assetSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    const counter = await Counter.findOneAndUpdate(
      { _id: 'assetTag' },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );

    // Format sequence padding, e.g. AF-0001
    const seqStr = String(counter.seq).padStart(4, '0');
    this.assetTag = `AF-${seqStr}`;
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Asset', assetSchema);
