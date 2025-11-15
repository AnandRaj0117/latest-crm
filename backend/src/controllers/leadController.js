const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
const Opportunity = require('../models/Opportunity');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Get all leads
 * @route   GET /api/leads
 * @access  Private
 */
const getLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      leadStatus,
      leadSource,
      rating,
      owner
    } = req.query;

    let query = { 
      isActive: true,
      isConverted: true 
    };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    // Filters
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (leadStatus) query.leadStatus = leadStatus;
    if (leadSource) query.leadSource = leadSource;
    if (rating) query.rating = rating;
    if (owner) query.owner = owner;

    console.log('Lead query:', query);

    const total = await Lead.countDocuments(query);
    console.log('Total leads found:', total);

    const leads = await Lead.find(query)
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean();

    console.log('Leads retrieved:', leads.length);

    successResponse(res, 200, 'Leads retrieved successfully', {
      leads,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get single lead
 * @route   GET /api/leads/:id
 * @access  Private
 */
const getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('owner', 'firstName lastName email')
      .populate('tenant', 'organizationName')
      .populate('convertedAccount', 'accountName accountType')
      .populate('convertedContact', 'firstName lastName email')
      .populate('convertedOpportunity', 'opportunityName amount stage');

    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant._id.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    successResponse(res, 200, 'Lead retrieved successfully', lead);
  } catch (error) {
    console.error('Get lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Create new lead
 * @route   POST /api/leads
 * @access  Private
 */
const createLead = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      mobilePhone,
      fax,
      company,
      jobTitle,
      website,
      leadSource,
      leadStatus,
      industry,
      numberOfEmployees,
      annualRevenue,
      rating,
      emailOptOut,
      doNotCall,
      skypeId,
      secondaryEmail,
      twitter,
      linkedIn,
      street,
      city,
      state,
      country,
      zipCode,
      flatHouseNo,
      latitude,
      longitude,
      description
    } = req.body;

    console.log('Create lead request body:', req.body);

    // Basic validation - at least one identifying field required
    if (!firstName && !lastName && !email && !company) {
      return errorResponse(res, 400, 'Please provide at least one of: First Name, Last Name, Email, or Company');
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

    // Check for duplicate email in same tenant (if email provided)
    if (email) {
      const existingLead = await Lead.findOne({ 
        email, 
        tenant, 
        isActive: true,
        isConverted: false
      });
      
      if (existingLead) {
        return errorResponse(res, 400, 'Lead with this email already exists');
      }
    }

    // Create lead
    const lead = await Lead.create({
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      phone,
      mobilePhone,
      fax,
      company,
      jobTitle,
      website,
      leadSource,
      leadStatus: leadStatus || 'New',
      industry,
      numberOfEmployees,
      annualRevenue,
      rating,
      emailOptOut: emailOptOut || false,
      doNotCall: doNotCall || false,
      skypeId,
      secondaryEmail,
      twitter,
      linkedIn,
      street,
      city,
      state,
      country,
      zipCode,
      flatHouseNo,
      latitude,
      longitude,
      description,
      owner: req.body.owner || req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await lead.populate('owner', 'firstName lastName email');

    await logActivity(req, 'lead.created', 'Lead', lead._id, {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      company: lead.company
    });

    console.log('Lead created successfully:', lead._id);

    successResponse(res, 201, 'Lead created successfully', lead);
  } catch (error) {
    console.error('Create lead error:', error);
    errorResponse(res, 500, error.message || 'Server error');
  }
};

/**
 * @desc    Update lead
 * @route   PUT /api/leads/:id
 * @access  Private
 */
const updateLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    // Check if already converted
    if (lead.isConverted) {
      return errorResponse(res, 400, 'Cannot update a converted lead');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Update fields
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'mobilePhone', 'fax',
      'company', 'jobTitle', 'website', 'leadSource', 'leadStatus',
      'industry', 'numberOfEmployees', 'annualRevenue', 'rating',
      'emailOptOut', 'doNotCall', 'skypeId', 'secondaryEmail', 'twitter',
      'linkedIn', 'street', 'city', 'state', 'country', 'zipCode',
      'flatHouseNo', 'latitude', 'longitude', 'description', 'owner', 'tags'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    lead.lastModifiedBy = req.user._id;
    await lead.save();

    await lead.populate('owner', 'firstName lastName email');

    await logActivity(req, 'lead.updated', 'Lead', lead._id);

    successResponse(res, 200, 'Lead updated successfully', lead);
  } catch (error) {
    console.error('Update lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Delete lead (soft delete)
 * @route   DELETE /api/leads/:id
 * @access  Private
 */
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Soft delete
    lead.isActive = false;
    lead.lastModifiedBy = req.user._id;
    await lead.save();

    await logActivity(req, 'lead.deleted', 'Lead', lead._id, {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email
    });

    successResponse(res, 200, 'Lead deleted successfully');
  } catch (error) {
    console.error('Delete lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Convert lead to account/contact/opportunity
 * @route   POST /api/leads/:id/convert
 * @access  Private
 */
const convertLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);

    if (!lead) {
      return errorResponse(res, 404, 'Lead not found');
    }

    if (lead.isConverted) {
      return errorResponse(res, 400, 'Lead is already converted');
    }

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    const {
      createAccount,
      createContact,
      createOpportunity,
      accountData,
      contactData,
      opportunityData
    } = req.body;

    let account = null;
    let contact = null;
    let opportunity = null;

    // Create Account
    if (createAccount && accountData) {
      account = await Account.create({
        ...accountData,
        owner: req.user._id,
        tenant: lead.tenant,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      });
      lead.convertedAccount = account._id;
    }

    // Create Contact
    if (createContact && contactData) {
      contact = await Contact.create({
        ...contactData,
        account: account ? account._id : null,
        owner: req.user._id,
        tenant: lead.tenant,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      });
      lead.convertedContact = contact._id;
    }

    // Create Opportunity
    if (createOpportunity && opportunityData) {
      opportunity = await Opportunity.create({
        ...opportunityData,
        account: account ? account._id : (opportunityData.account || null),
        contact: contact ? contact._id : null,
        lead: lead._id,
        owner: req.user._id,
        tenant: lead.tenant,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id
      });
      lead.convertedOpportunity = opportunity._id;
    }

    // Mark lead as converted
    lead.isConverted = true;
    lead.convertedDate = new Date();
    lead.lastModifiedBy = req.user._id;
    await lead.save();

    await logActivity(req, 'lead.converted', 'Lead', lead._id, {
      accountCreated: !!account,
      contactCreated: !!contact,
      opportunityCreated: !!opportunity
    });

    successResponse(res, 200, 'Lead converted successfully', {
      lead,
      account,
      contact,
      opportunity
    });
  } catch (error) {
    console.error('Convert lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Bulk import leads from CSV
 * @route   POST /api/leads/bulk-import
 * @access  Private
 */
const bulkImportLeads = async (req, res) => {
  try {
    const { leads } = req.body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return errorResponse(res, 400, 'Please provide an array of leads');
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

    const results = {
      success: [],
      failed: []
    };

    for (const leadData of leads) {
      try {
        const lead = await Lead.create({
          ...leadData,
          owner: req.user._id,
          tenant,
          createdBy: req.user._id,
          lastModifiedBy: req.user._id
        });
        results.success.push(lead);
      } catch (error) {
        results.failed.push({
          data: leadData,
          error: error.message
        });
      }
    }

    await logActivity(req, 'leads.bulk_import', 'Lead', null, {
      total: leads.length,
      success: results.success.length,
      failed: results.failed.length
    });

    successResponse(res, 201, 'Bulk import completed', results);
  } catch (error) {
    console.error('Bulk import error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  convertLead,
  bulkImportLeads
};