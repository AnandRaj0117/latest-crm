const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  street: String,
  city: String,
  state: String,
  country: String,
  zipCode: String
}, { _id: false });

const accountSchema = new mongoose.Schema({
  // Basic Information
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  accountType: {
    type: String,
    enum: ['Customer', 'Prospect', 'Partner', 'Vendor', 'Competitor', 'Other'],
    default: 'Prospect'
  },
  industry: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },

  // Financial Information
  annualRevenue: {
    type: Number,
    min: 0
  },
  numberOfEmployees: {
    type: Number,
    min: 0
  },

  // Address
  billingAddress: addressSchema,
  shippingAddress: addressSchema,

  // Same as Billing
  sameAsShipping: {
    type: Boolean,
    default: false
  },

  // Parent Account (for hierarchies)
  parentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account'
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

  // Additional Information
  description: String,
  rating: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold'],
    default: 'Warm'
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
accountSchema.index({ accountName: 1, tenant: 1 });
accountSchema.index({ owner: 1 });
accountSchema.index({ tenant: 1 });
accountSchema.index({ createdAt: -1 });
accountSchema.index({ accountType: 1 });

// Auto-generate account number
accountSchema.pre('save', async function(next) {
  if (!this.accountNumber) {
    const count = await this.constructor.countDocuments({ tenant: this.tenant });
    this.accountNumber = `ACC-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);
