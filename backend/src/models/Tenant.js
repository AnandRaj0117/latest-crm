const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  
  // Contact Information
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    trim: true,
    lowercase: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  
  // Business Details
  businessType: {
    type: String,
    enum: ['B2B', 'B2C', 'B2B2C', 'Other'],
    default: 'B2B'
  },
  industry: {
    type: String,
    trim: true
  },
  
  // Subscription & Billing
  subscriptionTier: {
    type: String,
    enum: ['free', 'basic', 'professional', 'enterprise'],
    default: 'free'
  },
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'suspended', 'cancelled'],
    default: 'trial'
  },
  subscriptionStartDate: {
    type: Date,
    default: Date.now
  },
  subscriptionEndDate: Date,
  
  // ============================================
  // 🚀 RESELLER INTEGRATION - NEW
  // ============================================
  reseller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reseller',
    default: null
  },
  // Commission rate at the time of tenant creation
  commissionRate: {
    type: Number,
    default: 0
  },
  // Total commission paid to reseller
  totalCommissionPaid: {
    type: Number,
    default: 0
  },
  // Monthly subscription amount
  monthlySubscriptionAmount: {
    type: Number,
    default: 0
  },
  // ============================================
  
  // Limits
  maxUsers: {
    type: Number,
    default: 5
  },
  maxStorage: {
    type: Number,
    default: 1024 // MB
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Branding (optional)
  logo: String,
  primaryColor: String,
  
  // Settings
  settings: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    dateFormat: {
      type: String,
      default: 'DD/MM/YYYY'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  }
}, {
  timestamps: true
});

// Indexes
tenantSchema.index({ slug: 1 });
tenantSchema.index({ isActive: 1 });
tenantSchema.index({ subscriptionStatus: 1 });
tenantSchema.index({ reseller: 1 }); // 🚀 NEW

module.exports = mongoose.model('Tenant', tenantSchema);