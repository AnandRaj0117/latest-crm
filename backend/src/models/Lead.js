const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },

  // Lead Details
  leadSource: {
    type: String,
    enum: ['Website', 'Referral', 'Campaign', 'Cold Call', 'Trade Show', 'Partner', 'Social Media', 'Bulk Upload', 'Other'],
    default: 'Other'
  },
  leadStatus: {
    type: String,
    enum: ['New', 'Contacted', 'Qualified', 'Unqualified', 'Lost', 'Converted'],
    default: 'New'
  },
  industry: {
    type: String,
    trim: true
  },

  // Address
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String,

  // Scoring & Qualification
  leadScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  rating: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold'],
    default: 'Warm'
  },

  // Assignment
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  // Conversion
  isConverted: {
    type: Boolean,
    default: false
  },
  convertedDate: Date,
  convertedTo: {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account'
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    }
  },

  // Additional Information
  description: String,
  website: String,
  annualRevenue: Number,
  numberOfEmployees: Number,

  // System Fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [String],
  customFields: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
leadSchema.index({ email: 1, tenant: 1 });
leadSchema.index({ leadStatus: 1 });
leadSchema.index({ owner: 1 });
leadSchema.index({ tenant: 1 });
leadSchema.index({ createdAt: -1 });

// Virtual for full name
leadSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
leadSchema.set('toJSON', { virtuals: true });
leadSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Lead', leadSchema);
