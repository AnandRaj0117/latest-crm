const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  // Note Content
  title: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },

  // Related To (polymorphic - can be attached to any entity)
  relatedTo: {
    type: {
      type: String,
      enum: ['Lead', 'Account', 'Contact', 'Opportunity', 'Activity'],
      required: true
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'relatedTo.type'
    }
  },

  // Visibility
  isPrivate: {
    type: Boolean,
    default: false
  },

  // Assignment
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
noteSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });
noteSchema.index({ createdBy: 1 });
noteSchema.index({ tenant: 1 });
noteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
