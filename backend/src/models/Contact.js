const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String
}, { _id: false });

const contactSchema = new mongoose.Schema({
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
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  mobilePhone: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },

  // Related Account
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
  },

  // Address
  mailingAddress: addressSchema,

  // Contact Hierarchy
  reportingTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },
  assistant: {
    type: String,
    trim: true
  },
  assistantPhone: {
    type: String,
    trim: true
  },
  dateOfBirth: Date,

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

  // Communication Preferences
  emailOptOut: {
    type: Boolean,
    default: false
  },
  doNotCall: {
    type: Boolean,
    default: false
  },

  // Additional Information
  description: String,
  leadSource: {
    type: String,
    enum: ['Website', 'Referral', 'Campaign', 'Cold Call', 'Trade Show', 'Partner', 'Social Media', 'Other']
  },

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
contactSchema.index({ email: 1, tenant: 1 });
contactSchema.index({ account: 1 });
contactSchema.index({ owner: 1 });
contactSchema.index({ tenant: 1 });
contactSchema.index({ createdAt: -1 });

// Virtual for full name
contactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
contactSchema.set('toJSON', { virtuals: true });
contactSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Contact', contactSchema);
