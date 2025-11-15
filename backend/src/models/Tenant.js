const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema({
  // Organization details
  organizationName: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  domain: {
    type: String,
    trim: true
  },
  // Contact information
  contactEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  contactPhone: {
    type: String
  },
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  // Subscription details
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  // Plan type: 'free', 'basic', 'premium', 'enterprise'
  planType: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  // Features enabled for this tenant
  enabledFeatures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feature'
  }],
  // Theme customization
  theme: {
    primaryColor: {
      type: String,
      default: '#1976d2'
    },
    secondaryColor: {
      type: String,
      default: '#dc004e'
    },
    logo: {
      type: String
    },
    favicon: {
      type: String
    },
    companyName: {
      type: String
    }
  },
  // Settings
  settings: {
    maxUsers: {
      type: Number,
      default: 10
    },
    maxStorage: {
      type: Number,
      default: 1024 // in MB
    },
    allowCustomDomain: {
      type: Boolean,
      default: false
    },
    twoFactorAuth: {
      type: Boolean,
      default: false
    }
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isSuspended: {
    type: Boolean,
    default: false
  },
  suspensionReason: {
    type: String
  },
  // Trial information
  trialEndsAt: {
    type: Date
  },
  // Billing information
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  nextBillingDate: {
    type: Date
  },
  // Metadata
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Index for faster queries
tenantSchema.index({ slug: 1 });
tenantSchema.index({ isActive: 1 });

module.exports = mongoose.model('Tenant', tenantSchema);
