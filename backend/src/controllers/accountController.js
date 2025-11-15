const mongoose = require('mongoose');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all accounts
 * @route   GET /api/accounts
 * @access  Private
 */
const getAccounts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      accountType,
      industry,
      owner
    } = req.query;

    // Build query
    let query = { isActive: true };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // Filters
    if (search) {
      query.$or = [
        { accountName: { $regex: search, $options: 'i' } },
        { accountNumber: { $regex: search, $options: 'i' } },
        { website: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (accountType) query.accountType = accountType;
    if (industry) query.industry = industry;
    if (owner) query.owner = owner;

    // Get total count
    const total = await Account.countDocuments(query);

    // Get accounts with pagination
    const accounts = await Account.find(query)
      .populate({
        path: 'owner',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'tenant',
        select: 'organizationName'
      })
      .populate({
        path: 'parentAccount',
        select: 'accountName accountNumber'
      })
      .select('-customFields')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    successResponse(res, 200, 'Accounts retrieved successfully', {
      accounts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

/**
 * @desc    Get single account
 * @route   GET /api/accounts/:id
 * @access  Private
 */
const getAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .populate('parentAccount', 'accountName accountNumber');

    if (!account) {
      return errorResponse(res, 404, 'Account not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (account.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Get related contacts
    const contacts = await Contact.find({ account: account._id, isActive: true })
      .select('firstName lastName email phone title isPrimary')
      .limit(10);

    successResponse(res, 200, 'Account retrieved successfully', {
      account,
      relatedContacts: contacts
    });
  } catch (error) {
    console.error('Get account error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new account
 * @route   POST /api/accounts
 * @access  Private
 */
const createAccount = async (req, res) => {
  try {
    const {
      accountName,
      accountType,
      industry,
      phone,
      website,
      fax,
      annualRevenue,
      numberOfEmployees,
      parentAccount,
      billingStreet,
      billingCity,
      billingState,
      billingCountry,
      billingZipCode,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingCountry,
      shippingZipCode,
      description,
      tags
    } = req.body;

    // Validation
    if (!accountName) {
      return errorResponse(res, 400, 'Please provide account name');
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

    // Check for duplicate account name in same tenant
    const existingAccount = await Account.findOne({
      accountName,
      tenant,
      isActive: true
    });
    if (existingAccount) {
      return errorResponse(res, 400, 'Account with this name already exists');
    }

    // Create account
    const account = await Account.create({
      accountName,
      accountType: accountType || 'Customer',
      industry,
      phone,
      website,
      fax,
      annualRevenue,
      numberOfEmployees,
      parentAccount: parentAccount || null,
      billingAddress: {
        street: billingStreet,
        city: billingCity,
        state: billingState,
        country: billingCountry,
        zipCode: billingZipCode
      },
      shippingAddress: {
        street: shippingStreet,
        city: shippingCity,
        state: shippingState,
        country: shippingCountry,
        zipCode: shippingZipCode
      },
      description,
      tags: tags || [],
      owner: req.body.owner || req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await account.populate('owner', 'firstName lastName email');

    // Log activity
    await logActivity(req, 'account.created', 'Account', account._id, {
      accountName: account.accountName,
      accountNumber: account.accountNumber
    });

    successResponse(res, 201, 'Account created successfully', account);
  } catch (error) {
    console.error('Create account error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update account
 * @route   PUT /api/accounts/:id
 * @access  Private
 */
const updateAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return errorResponse(res, 404, 'Account not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (account.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const {
      accountName,
      accountType,
      industry,
      phone,
      website,
      fax,
      annualRevenue,
      numberOfEmployees,
      parentAccount,
      billingStreet,
      billingCity,
      billingState,
      billingCountry,
      billingZipCode,
      shippingStreet,
      shippingCity,
      shippingState,
      shippingCountry,
      shippingZipCode,
      description,
      tags
    } = req.body;

    // Update fields
    if (accountName) account.accountName = accountName;
    if (accountType) account.accountType = accountType;
    if (industry !== undefined) account.industry = industry;
    if (phone !== undefined) account.phone = phone;
    if (website !== undefined) account.website = website;
    if (fax !== undefined) account.fax = fax;
    if (annualRevenue !== undefined) account.annualRevenue = annualRevenue;
    if (numberOfEmployees !== undefined) account.numberOfEmployees = numberOfEmployees;
    if (parentAccount !== undefined) account.parentAccount = parentAccount;
    if (description !== undefined) account.description = description;
    if (tags !== undefined) account.tags = tags;

    // Update addresses
    if (billingStreet !== undefined) account.billingAddress.street = billingStreet;
    if (billingCity !== undefined) account.billingAddress.city = billingCity;
    if (billingState !== undefined) account.billingAddress.state = billingState;
    if (billingCountry !== undefined) account.billingAddress.country = billingCountry;
    if (billingZipCode !== undefined) account.billingAddress.zipCode = billingZipCode;

    if (shippingStreet !== undefined) account.shippingAddress.street = shippingStreet;
    if (shippingCity !== undefined) account.shippingAddress.city = shippingCity;
    if (shippingState !== undefined) account.shippingAddress.state = shippingState;
    if (shippingCountry !== undefined) account.shippingAddress.country = shippingCountry;
    if (shippingZipCode !== undefined) account.shippingAddress.zipCode = shippingZipCode;

    account.lastModifiedBy = req.user._id;
    await account.save();

    await account.populate('owner', 'firstName lastName email');

    // Log activity
    await logActivity(req, 'account.updated', 'Account', account._id, {
      accountName: account.accountName
    });

    successResponse(res, 200, 'Account updated successfully', account);
  } catch (error) {
    console.error('Update account error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete account (soft delete)
 * @route   DELETE /api/accounts/:id
 * @access  Private
 */
const deleteAccount = async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);

    if (!account) {
      return errorResponse(res, 404, 'Account not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (account.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Soft delete
    account.isActive = false;
    account.lastModifiedBy = req.user._id;
    await account.save();

    // Log activity
    await logActivity(req, 'account.deleted', 'Account', account._id, {
      accountName: account.accountName
    });

    successResponse(res, 200, 'Account deleted successfully');
  } catch (error) {
    console.error('Delete account error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get account statistics
 * @route   GET /api/accounts/stats
 * @access  Private
 */
const getAccountStats = async (req, res) => {
  try {
    let query = { isActive: true };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // Total accounts
    const total = await Account.countDocuments(query);

    // By type
    const byType = await Account.aggregate([
      { $match: query },
      { $group: { _id: '$accountType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // By industry
    const byIndustry = await Account.aggregate([
      { $match: { ...query, industry: { $ne: null, $ne: '' } } },
      { $group: { _id: '$industry', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // New accounts this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await Account.countDocuments({
      ...query,
      createdAt: { $gte: startOfMonth }
    });

    successResponse(res, 200, 'Statistics retrieved successfully', {
      total,
      newThisMonth,
      byType,
      byIndustry
    });
  } catch (error) {
    console.error('Get account stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getAccounts,
  getAccount,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountStats
};
