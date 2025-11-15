const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema({
  opportunityName: {
    type: String,
    required: [true, 'Opportunity name is required'],
    trim: true
  },

  // Basic Information
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0
  },

  stage: {
    type: String,
    enum: [
      'Prospecting',
      'Qualification',
      'Needs Analysis',
      'Value Proposition',
      'Proposal/Price Quote',
      'Negotiation/Review',
      'Closed Won',
      'Closed Lost'
    ],
    default: 'Prospecting',
    required: true
  },

  probability: {
    type: Number,
    min: 0,
    max: 100,
    default: 10
  },

  closeDate: {
    type: Date,
    required: [true, 'Expected close date is required']
  },

  // Relationships
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Account is required']
  },

  contact: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Contact'
  },

  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Additional Information
  type: {
    type: String,
    enum: ['New Business', 'Existing Business', 'Renewal'],
    default: 'New Business'
  },

  leadSource: {
    type: String,
    enum: ['Web', 'Phone Inquiry', 'Partner Referral', 'Purchased List', 'Other'],
    default: 'Other'
  },

  nextStep: {
    type: String,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  // Tenant (for multi-tenancy)
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },

  // Tracking
  isActive: {
    type: Boolean,
    default: true
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
opportunitySchema.index({ tenant: 1, isActive: 1 });
opportunitySchema.index({ account: 1 });
opportunitySchema.index({ stage: 1 });
opportunitySchema.index({ closeDate: 1 });
opportunitySchema.index({ owner: 1 });

// Virtual for days until close
opportunitySchema.virtual('daysUntilClose').get(function() {
  if (!this.closeDate) return null;
  const today = new Date();
  const close = new Date(this.closeDate);
  const diffTime = close - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Virtual for weighted amount (amount * probability)
opportunitySchema.virtual('weightedAmount').get(function() {
  return (this.amount * this.probability) / 100;
});

// Ensure virtuals are included in JSON
opportunitySchema.set('toJSON', { virtuals: true });
opportunitySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Opportunity', opportunitySchema);
