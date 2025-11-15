const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const Account = require('../models/Account');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all contacts
 * @route   GET /api/contacts
 * @access  Private
 */
const getContacts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      account,
      title
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
        { firstName: { $regex: search, $options: 'i' }},
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (account) query.account = account;
    if (title) query.title = { $regex: title, $options: 'i' };

    // Get total count
    const total = await Contact.countDocuments(query);

    // Get contacts with pagination
    const contacts = await Contact.find(query)
      .populate({
        path: 'account',
        select: 'accountName accountNumber'
      })
      .populate({
        path: 'owner',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'tenant',
        select: 'organizationName'
      })
      .populate({
        path: 'reportsTo',
        select: 'firstName lastName email title'
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    successResponse(res, 200, 'Contacts retrieved successfully', {
      contacts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    errorResponse(res, 500, `Server error: ${error.message}`);
  }
};

/**
 * @desc    Get single contact
 * @route   GET /api/contacts/:id
 * @access  Private
 */
const getContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id)
      .populate('account', 'accountName accountNumber phone website')
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .populate('reportsTo', 'firstName lastName email title');

    if (!contact) {
      return errorResponse(res, 404, 'Contact not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (contact.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Contact retrieved successfully', contact);
  } catch (error) {
    console.error('Get contact error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new contact
 * @route   POST /api/contacts
 * @access  Private
 */
const createContact = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      mobile,
      account,
      title,
      department,
      reportsTo,
      leadSource,
      isPrimary,
      doNotCall,
      emailOptOut,
      mailingStreet,
      mailingCity,
      mailingState,
      mailingCountry,
      mailingZipCode,
      description
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return errorResponse(res, 400, 'Please provide firstName, lastName, and email');
    }

    if (!account) {
      return errorResponse(res, 400, 'Account is required for contact');
    }

    // Verify account exists
    const accountExists = await Account.findById(account);
    if (!accountExists) {
      return errorResponse(res, 404, 'Account not found');
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

    // Check for duplicate email in same account
    const existingContact = await Contact.findOne({
      email,
      account,
      isActive: true
    });
    if (existingContact) {
      return errorResponse(res, 400, 'Contact with this email already exists for this account');
    }

    // Create contact
    const contact = await Contact.create({
      firstName,
      lastName,
      email,
      phone,
      mobile,
      account,
      title,
      department,
      reportsTo: reportsTo || null,
      leadSource,
      isPrimary: isPrimary || false,
      doNotCall: doNotCall || false,
      emailOptOut: emailOptOut || false,
      mailingAddress: {
        street: mailingStreet,
        city: mailingCity,
        state: mailingState,
        country: mailingCountry,
        zipCode: mailingZipCode
      },
      description,
      owner: req.body.owner || req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await contact.populate('account', 'accountName accountNumber');
    await contact.populate('owner', 'firstName lastName email');

    // Log activity
    await logActivity(req, 'contact.created', 'Contact', contact._id, {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email
    });

    successResponse(res, 201, 'Contact created successfully', contact);
  } catch (error) {
    console.error('Create contact error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Update contact
 * @route   PUT /api/contacts/:id
 * @access  Private
 */
const updateContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return errorResponse(res, 404, 'Contact not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (contact.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      mobile,
      title,
      department,
      reportsTo,
      isPrimary,
      doNotCall,
      emailOptOut,
      mailingStreet,
      mailingCity,
      mailingState,
      mailingCountry,
      mailingZipCode,
      description
    } = req.body;

    // Update fields
    if (firstName) contact.firstName = firstName;
    if (lastName) contact.lastName = lastName;
    if (email) contact.email = email;
    if (phone !== undefined) contact.phone = phone;
    if (mobile !== undefined) contact.mobile = mobile;
    if (title !== undefined) contact.title = title;
    if (department !== undefined) contact.department = department;
    if (reportsTo !== undefined) contact.reportsTo = reportsTo;
    if (isPrimary !== undefined) contact.isPrimary = isPrimary;
    if (doNotCall !== undefined) contact.doNotCall = doNotCall;
    if (emailOptOut !== undefined) contact.emailOptOut = emailOptOut;
    if (description !== undefined) contact.description = description;

    // Update address
    if (mailingStreet !== undefined) contact.mailingAddress.street = mailingStreet;
    if (mailingCity !== undefined) contact.mailingAddress.city = mailingCity;
    if (mailingState !== undefined) contact.mailingAddress.state = mailingState;
    if (mailingCountry !== undefined) contact.mailingAddress.country = mailingCountry;
    if (mailingZipCode !== undefined) contact.mailingAddress.zipCode = mailingZipCode;

    contact.lastModifiedBy = req.user._id;
    await contact.save();

    await contact.populate('account', 'accountName accountNumber');
    await contact.populate('owner', 'firstName lastName email');

    // Log activity
    await logActivity(req, 'contact.updated', 'Contact', contact._id, {
      firstName: contact.firstName,
      lastName: contact.lastName
    });

    successResponse(res, 200, 'Contact updated successfully', contact);
  } catch (error) {
    console.error('Update contact error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete contact (soft delete)
 * @route   DELETE /api/contacts/:id
 * @access  Private
 */
const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return errorResponse(res, 404, 'Contact not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (contact.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Soft delete
    contact.isActive = false;
    contact.lastModifiedBy = req.user._id;
    await contact.save();

    // Log activity
    await logActivity(req, 'contact.deleted', 'Contact', contact._id, {
      firstName: contact.firstName,
      lastName: contact.lastName
    });

    successResponse(res, 200, 'Contact deleted successfully');
  } catch (error) {
    console.error('Delete contact error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get contact statistics
 * @route   GET /api/contacts/stats
 * @access  Private
 */
const getContactStats = async (req, res) => {
  try {
    let query = { isActive: true };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // Total contacts
    const total = await Contact.countDocuments(query);

    // Primary contacts
    const primaryContacts = await Contact.countDocuments({
      ...query,
      isPrimary: true
    });

    // By department
    const byDepartment = await Contact.aggregate([
      { $match: { ...query, department: { $ne: null, $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // New contacts this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newThisMonth = await Contact.countDocuments({
      ...query,
      createdAt: { $gte: startOfMonth }
    });

    successResponse(res, 200, 'Statistics retrieved successfully', {
      total,
      primaryContacts,
      newThisMonth,
      byDepartment
    });
  } catch (error) {
    console.error('Get contact stats error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  getContactStats
};
