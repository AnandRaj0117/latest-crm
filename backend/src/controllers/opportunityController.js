const mongoose = require('mongoose');
const Opportunity = require('../models/Opportunity');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all opportunities
 * @route   GET /api/opportunities
 * @access  Private
 */
const getOpportunities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      stage,
      account,
      minAmount,
      maxAmount
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // Filters
    if (search) {
      query.opportunityName = { $regex: search, $options: 'i' };
    }

    if (stage) query.stage = stage;
    if (account) query.account = account;

    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Get total count
    const total = await Opportunity.countDocuments(query);

    // Get opportunities with pagination
    const opportunities = await Opportunity.find(query)
      .populate({
        path: 'account',
        select: 'accountName accountNumber'
      })
      .populate({
        path: 'contact',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'owner',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'tenant',
        select: 'organizationName'
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ closeDate: 1 })
      .lean();

    successResponse(res, 200, 'Opportunities retrieved successfully', {
      opportunities,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
    errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

/**
 * @desc    Get single opportunity
 * @route   GET /api/opportunities/:id
 * @access  Private
 */
const getOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id)
      .populate('account', 'accountName accountNumber phone website')
      .populate('contact', 'firstName lastName email phone')
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .populate('lead', 'firstName lastName email company');

    if (!opportunity) {
      return errorResponse(res, 404, 'Opportunity not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (opportunity.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Opportunity retrieved successfully', opportunity);
  } catch (error) {
    console.error('Get opportunity error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new opportunity
 * @route   POST /api/opportunities
 * @access  Private
 */
const createOpportunity = async (req, res) => {
  try {
    const {
      opportunityName,
      amount,
      stage,
      probability,
      closeDate,
      account,
      contact,
      lead,
      type,
      leadSource,
      nextStep,
      description
    } = req.body;

    // Validation
    if (!opportunityName || !amount || !closeDate) {
      return errorResponse(res, 400, 'Please provide opportunityName, amount, and closeDate');
    }

    if (!account) {
      return errorResponse(res, 400, 'Account is required for opportunity');
    }

    // Verify account exists
    const accountExists = await Account.findById(account);
    if (!accountExists) {
      return errorResponse(res, 404, 'Account not found');
    }

    // Verify contact exists if provided
    if (contact) {
      const contactExists = await Contact.findById(contact);
      if (!contactExists) {
        return errorResponse(res, 404, 'Contact not found');
      }

      // Verify contact belongs to the account
      if (contactExists.account.toString() !== account) {
        return errorResponse(res, 400, 'Contact does not belong to the specified account');
      }
    }

    // Determine tenant
    let tenant;
    if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
      tenant = req.body.tenant;
      if (!tenant) {
        return errorResponse(res, 400, 'Tenant is required');
      }
    } else {
      tenant = req.user.tenant;
    }

    // Create opportunity
    const opportunity = await Opportunity.create({
      opportunityName,
      amount,
      stage: stage || 'Prospecting',
      probability: probability || 10,
      closeDate,
      account,
      contact: contact || null,
      lead: lead || null,
      type: type || 'New Business',
      leadSource,
      nextStep,
      description,
      owner: req.body.owner || req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await opportunity.populate('account', 'accountName accountNumber');
    await opportunity.populate('contact', 'firstName lastName email');
    await opportunity.populate('owner', 'firstName lastName email');

    // Log activity
    await logActivity(req, 'opportunity.created', 'Opportunity', opportunity._id, {
      opportunityName: opportunity.opportunityName,
      amount: opportunity.amount,
      stage: opportunity.stage
    });

    successResponse(res, 201, 'Opportunity created successfully', opportunity);
  } catch (error) {
    console.error('Create opportunity error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update opportunity
 * @route   PUT /api/opportunities/:id
 * @access  Private
 */
const updateOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return errorResponse(res, 404, 'Opportunity not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (opportunity.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const {
      opportunityName,
      amount,
      stage,
      probability,
      closeDate,
      contact,
      type,
      leadSource,
      nextStep,
      description
    } = req.body;

    // Update fields
    if (opportunityName) opportunity.opportunityName = opportunityName;
    if (amount !== undefined) opportunity.amount = amount;
    if (stage) opportunity.stage = stage;
    if (probability !== undefined) opportunity.probability = probability;
    if (closeDate) opportunity.closeDate = closeDate;
    if (contact !== undefined) opportunity.contact = contact;
    if (type) opportunity.type = type;
    if (leadSource) opportunity.leadSource = leadSource;
    if (nextStep !== undefined) opportunity.nextStep = nextStep;
    if (description !== undefined) opportunity.description = description;

    opportunity.lastModifiedBy = req.user._id;
    await opportunity.save();

    await opportunity.populate('account', 'accountName accountNumber');
    await opportunity.populate('contact', 'firstName lastName email');
    await opportunity.populate('owner', 'firstName lastName email');

    // Log activity
    await logActivity(req, 'opportunity.updated', 'Opportunity', opportunity._id, {
      opportunityName: opportunity.opportunityName,
      stage: opportunity.stage
    });

    successResponse(res, 200, 'Opportunity updated successfully', opportunity);
  } catch (error) {
    console.error('Update opportunity error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete opportunity (soft delete)
 * @route   DELETE /api/opportunities/:id
 * @access  Private
 */
const deleteOpportunity = async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);

    if (!opportunity) {
      return errorResponse(res, 404, 'Opportunity not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (opportunity.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Soft delete
    opportunity.isActive = false;
    opportunity.lastModifiedBy = req.user._id;
    await opportunity.save();

    // Log activity
    await logActivity(req, 'opportunity.deleted', 'Opportunity', opportunity._id, {
      opportunityName: opportunity.opportunityName
    });

    successResponse(res, 200, 'Opportunity deleted successfully');
  } catch (error) {
    console.error('Delete opportunity error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get opportunity statistics
 * @route   GET /api/opportunities/stats
 * @access  Private
 */
const getOpportunityStats = async (req, res) => {
  try {
    let query = { isActive: true };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // Total opportunities
    const total = await Opportunity.countDocuments(query);

    // Total value
    const pipeline = [
      { $match: query },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$amount' },
          weightedValue: { $sum: { $multiply: ['$amount', { $divide: ['$probability', 100] }] } }
        }
      }
    ];

    const valueStats = await Opportunity.aggregate(pipeline);
    const totalValue = valueStats.length > 0 ? valueStats[0].totalValue : 0;
    const weightedValue = valueStats.length > 0 ? valueStats[0].weightedValue : 0;

    // By stage
    const byStage = await Opportunity.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$stage',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // Closing this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const closingThisMonth = await Opportunity.countDocuments({
      ...query,
      closeDate: { $gte: startOfMonth, $lt: endOfMonth }
    });

    // Won vs Lost
    const wonCount = await Opportunity.countDocuments({
      ...query,
      stage: 'Closed Won'
    });

    const lostCount = await Opportunity.countDocuments({
      ...query,
      stage: 'Closed Lost'
    });

    successResponse(res, 200, 'Statistics retrieved successfully', {
      total,
      totalValue,
      weightedValue,
      closingThisMonth,
      wonCount,
      lostCount,
      byStage
    });
  } catch (error) {
    console.error('Get opportunity stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getOpportunities,
  getOpportunity,
  createOpportunity,
  updateOpportunity,
  deleteOpportunity,
  getOpportunityStats
};
