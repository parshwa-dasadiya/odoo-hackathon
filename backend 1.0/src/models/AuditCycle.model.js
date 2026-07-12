const mongoose = require('mongoose');
const User = require('./User.model');

const auditCycleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    scopeDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null
    },
    scopeLocation: {
      type: String,
      trim: true,
      default: null
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    assignedAuditors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    status: {
      type: String,
      enum: ['Draft', 'In Progress', 'Closed'],
      default: 'Draft'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    closedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Pre-save hook to validate all assignedAuditors actually have role Auditor
auditCycleSchema.pre('save', async function (next) {
  if (this.isModified('assignedAuditors')) {
    if (this.assignedAuditors && this.assignedAuditors.length > 0) {
      const users = await mongoose.model('User').find({
        _id: { $in: this.assignedAuditors }
      });
      
      const nonAuditors = users.filter(u => u.role !== 'Auditor');
      if (nonAuditors.length > 0) {
        return next(new Error(`Validation failed: Users [${nonAuditors.map(u => u.name).join(', ')}] do not have the Auditor role.`));
      }
      
      if (users.length !== this.assignedAuditors.length) {
        return next(new Error('Validation failed: One or more assigned auditor IDs are invalid.'));
      }
    }
  }
  next();
});

const AuditCycle = mongoose.model('AuditCycle', auditCycleSchema);

module.exports = AuditCycle;
