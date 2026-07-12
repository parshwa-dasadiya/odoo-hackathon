const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    resource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true
    },
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      required: true
    },
    purpose: {
      type: String,
      trim: true,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Cancelled'], // Hybrid approach: store 'Cancelled' explicitly, else 'Active'
      default: 'Active'
    },
    cancelReason: {
      type: String,
      trim: true,
      default: null
    },
    reminderSent: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index for overlap queries and general lookups
bookingSchema.index({ resource: 1, startTime: 1, endTime: 1 });
bookingSchema.index({ bookedBy: 1 });

// Hybrid approach: compute Upcoming/Ongoing/Completed dynamically from time
// rather than storing them as a static truth. We only store Cancelled as an
// explicit persisted state. This avoids needing a cron job just to flip statuses.
bookingSchema.virtual('effectiveStatus').get(function () {
  if (this.status === 'Cancelled') {
    return 'Cancelled';
  }

  const now = new Date();
  const start = new Date(this.startTime);
  const end = new Date(this.endTime);

  if (now < start) {
    return 'Upcoming';
  } else if (now >= start && now <= end) {
    return 'Ongoing';
  } else {
    return 'Completed';
  }
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
