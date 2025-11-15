const Subscription = require('../models/Subscription');
const Tenant = require('../models/Tenant');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all subscriptions
 * @route   GET /api/subscriptions
 * @access  Private (SAAS owner/admin only or own subscription)
 */
const getSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, planType } = req.query;

    let query = {};

    // Tenant users can only see their own subscription
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    if (status) {
      query.status = status;
    }

    if (planType) {
      query.planType = planType;
    }

    const total = await Subscription.countDocuments(query);

    const subscriptions = await Subscription.find(query)
      .populate('tenant', 'organizationName slug contactEmail')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    successResponse(res, 200, 'Subscriptions retrieved successfully', {
      subscriptions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single subscription
 * @route   GET /api/subscriptions/:id
 * @access  Private
 */
const getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('tenant');

    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (subscription.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Subscription retrieved successfully', subscription);
  } catch (error) {
    console.error('Get subscription error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update subscription
 * @route   PUT /api/subscriptions/:id
 * @access  Private (SAAS owner/admin only)
 */
const updateSubscription = async (req, res) => {
  try {
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 403, 'Only SAAS admins can update subscriptions');
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }

    // Update allowed fields
    const allowedFields = ['planType', 'status', 'pricing', 'endDate', 'autoRenew', 'limits'];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        subscription[field] = req.body[field];
      }
    });

    await subscription.save();

    // Update tenant plan type if changed
    if (req.body.planType) {
      await Tenant.findByIdAndUpdate(subscription.tenant, {
        planType: req.body.planType
      });
    }

    // Log activity
    await logActivity(req, 'subscription.updated', 'Subscription', subscription._id);

    successResponse(res, 200, 'Subscription updated successfully', subscription);
  } catch (error) {
    console.error('Update subscription error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Cancel subscription
 * @route   POST /api/subscriptions/:id/cancel
 * @access  Private
 */
const cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (subscription.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancellationReason = reason || 'No reason provided';
    subscription.autoRenew = false;

    await subscription.save();

    // Log activity
    await logActivity(req, 'subscription.cancelled', 'Subscription', subscription._id, {
      reason
    });

    successResponse(res, 200, 'Subscription cancelled successfully', subscription);
  } catch (error) {
    console.error('Cancel subscription error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Renew subscription
 * @route   POST /api/subscriptions/:id/renew
 * @access  Private (SAAS owner/admin only)
 */
const renewSubscription = async (req, res) => {
  try {
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      return errorResponse(res, 403, 'Only SAAS admins can renew subscriptions');
    }

    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return errorResponse(res, 404, 'Subscription not found');
    }

    // Calculate new dates based on billing cycle
    const currentEnd = subscription.endDate || new Date();
    const daysToAdd = subscription.pricing.billingCycle === 'yearly' ? 365 : 30;
    const newEndDate = new Date(currentEnd.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    subscription.status = 'active';
    subscription.endDate = newEndDate;
    subscription.cancelledAt = null;
    subscription.cancellationReason = null;

    await subscription.save();

    // Log activity
    await logActivity(req, 'subscription.created', 'Subscription', subscription._id, {
      action: 'renewed',
      newEndDate
    });

    successResponse(res, 200, 'Subscription renewed successfully', subscription);
  } catch (error) {
    console.error('Renew subscription error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getSubscriptions,
  getSubscription,
  updateSubscription,
  cancelSubscription,
  renewSubscription
};
