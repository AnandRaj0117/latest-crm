const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Account = require('../models/Account');
const Contact = require('../models/Contact');
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

    // Build query
    let query = { isActive: true };

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
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    if (leadStatus) query.leadStatus = leadStatus;
    if (leadSource) query.leadSource = leadSource;
    if (rating) query.rating = rating;
    if (owner) query.owner = owner;

    // Exclude converted leads by default
    if (!req.query.includeConverted) {
      query.isConverted = false;
    }

    console.log('Lead query:', JSON.stringify(query));

    // Get total count
    const total = await Lead.countDocuments(query);
    console.log('Total leads found:', total);

    // Get leads with pagination
    const leads = await Lead.find(query)
      .populate({
        path: 'owner',
        select: 'firstName lastName email'
      })
      .populate({
        path: 'tenant',
        select: 'organizationName'
      })
      .select('-customFields')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .lean(); // Convert to plain JavaScript objects

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
    console.error('Error stack:', error.stack);
    errorResponse(res, 500, `Server error: ${error.message}`);
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
      .populate('convertedTo.account', 'accountName')
      .populate('convertedTo.contact', 'firstName lastName');

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
      company,
      jobTitle,
      leadSource,
      leadStatus,
      industry,
      street,
      city,
      state,
      country,
      zipCode,
      leadScore,
      rating,
      description,
      website,
      annualRevenue,
      numberOfEmployees,
      tags
    } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return errorResponse(res, 400, 'Please provide firstName, lastName, and email');
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

    // Check for duplicate email in same tenant
    const existingLead = await Lead.findOne({ email, tenant, isActive: true });
    if (existingLead) {
      return errorResponse(res, 400, 'Lead with this email already exists');
    }

    // Create lead
    const lead = await Lead.create({
      firstName,
      lastName,
      email,
      phone,
      company,
      jobTitle,
      leadSource: leadSource || 'Other',
      leadStatus: leadStatus || 'New',
      industry,
      street,
      city,
      state,
      country,
      zipCode,
      leadScore: leadScore || 0,
      rating: rating || 'Warm',
      description,
      website,
      annualRevenue,
      numberOfEmployees,
      tags: tags || [],
      owner: req.body.owner || req.user._id,
      tenant,
      createdBy: req.user._id,
      lastModifiedBy: req.user._id
    });

    await lead.populate('owner', 'firstName lastName email');

    // Log activity
    await logActivity(req, 'lead.created', 'Lead', lead._id, {
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email
    });

    successResponse(res, 201, 'Lead created successfully', lead);
  } catch (error) {
    console.error('Create lead error:', error);
    errorResponse(res, 500, 'Server error');
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

    // Check access
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      if (lead.tenant.toString() !== req.user.tenant.toString()) {
        return errorResponse(res, 403, 'Access denied');
      }
    }

    // Prevent editing converted leads
    if (lead.isConverted && !req.body.allowConvertedEdit) {
      return errorResponse(res, 400, 'Cannot edit converted lead');
    }

    // Update fields
    const allowedFields = [
      'firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle',
      'leadSource', 'leadStatus', 'industry', 'street', 'city', 'state',
      'country', 'zipCode', 'leadScore', 'rating', 'description', 'website',
      'annualRevenue', 'numberOfEmployees', 'tags', 'owner'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lead[field] = req.body[field];
      }
    });

    lead.lastModifiedBy = req.user._id;
    await lead.save();

    await lead.populate('owner', 'firstName lastName email');

    // Log activity
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

    // Log activity
    await logActivity(req, 'lead.deleted', 'Lead', lead._id, {
      firstName: lead.firstName,
      lastName: lead.lastName
    });

    successResponse(res, 200, 'Lead deleted successfully');
  } catch (error) {
    console.error('Delete lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Convert lead to account and contact
 * @route   POST /api/leads/:id/convert
 * @access  Private
 */
const convertLead = async (req, res) => {
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

    // Check if already converted
    if (lead.isConverted) {
      return errorResponse(res, 400, 'Lead is already converted');
    }

    const { createAccount, createContact, accountData, contactData } = req.body;

    let account = null;
    let contact = null;

    // Create Account if requested
    if (createAccount) {
      account = await Account.create({
        accountName: accountData?.accountName || lead.company || `${lead.firstName} ${lead.lastName}`,
        accountType: accountData?.accountType || 'Prospect',
        industry: accountData?.industry || lead.industry,
        website: accountData?.website || lead.website,
        phone: accountData?.phone || lead.phone,
        email: accountData?.email || lead.email,
        annualRevenue: accountData?.annualRevenue || lead.annualRevenue,
        numberOfEmployees: accountData?.numberOfEmployees || lead.numberOfEmployees,
        billingAddress: {
          street: accountData?.street || lead.street,
          city: accountData?.city || lead.city,
          state: accountData?.state || lead.state,
          country: accountData?.country || lead.country,
          zipCode: accountData?.zipCode || lead.zipCode
        },
        owner: lead.owner,
        tenant: lead.tenant,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id,
        description: `Converted from lead: ${lead.firstName} ${lead.lastName}`
      });

      await logActivity(req, 'account.created', 'Account', account._id, {
        source: 'lead_conversion',
        leadId: lead._id
      });
    }

    // Create Contact if requested
    if (createContact) {
      contact = await Contact.create({
        firstName: contactData?.firstName || lead.firstName,
        lastName: contactData?.lastName || lead.lastName,
        email: contactData?.email || lead.email,
        phone: contactData?.phone || lead.phone,
        mobilePhone: contactData?.mobilePhone,
        jobTitle: contactData?.jobTitle || lead.jobTitle,
        department: contactData?.department,
        account: account ? account._id : contactData?.account,
        mailingAddress: {
          street: contactData?.street || lead.street,
          city: contactData?.city || lead.city,
          state: contactData?.state || lead.state,
          country: contactData?.country || lead.country,
          zipCode: contactData?.zipCode || lead.zipCode
        },
        leadSource: lead.leadSource,
        owner: lead.owner,
        tenant: lead.tenant,
        createdBy: req.user._id,
        lastModifiedBy: req.user._id,
        description: `Converted from lead: ${lead.firstName} ${lead.lastName}`
      });

      await logActivity(req, 'contact.created', 'Contact', contact._id, {
        source: 'lead_conversion',
        leadId: lead._id
      });
    }

    // Update lead
    lead.isConverted = true;
    lead.convertedDate = new Date();
    lead.leadStatus = 'Converted';
    lead.convertedTo = {
      account: account ? account._id : null,
      contact: contact ? contact._id : null
    };
    lead.lastModifiedBy = req.user._id;
    await lead.save();

    await logActivity(req, 'lead.converted', 'Lead', lead._id, {
      accountId: account?._id,
      contactId: contact?._id
    });

    successResponse(res, 200, 'Lead converted successfully', {
      lead,
      account,
      contact
    });
  } catch (error) {
    console.error('Convert lead error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Bulk upload leads from CSV
 * @route   POST /api/leads/bulk-upload
 * @access  Private
 */
const bulkUploadLeads = async (req, res) => {
  try {
    const { leads, options } = req.body;

    if (!leads || !Array.isArray(leads) || leads.length === 0) {
      return errorResponse(res, 400, 'Please provide leads array');
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

    const skipDuplicates = options?.skipDuplicates !== false;
    const defaultOwner = options?.assignToMe ? req.user._id : req.body.defaultOwner || req.user._id;
    const defaultLeadSource = options?.leadSource || 'Bulk Upload';
    const defaultLeadStatus = options?.leadStatus || 'New';

    const results = {
      created: [],
      duplicates: [],
      errors: []
    };

    for (let i = 0; i < leads.length; i++) {
      const leadData = leads[i];

      try {
        // Validate required fields
        if (!leadData.firstName || !leadData.lastName || !leadData.email) {
          results.errors.push({
            row: i + 1,
            data: leadData,
            error: 'Missing required fields: firstName, lastName, or email'
          });
          continue;
        }

        // Check for duplicates
        if (skipDuplicates) {
          const existing = await Lead.findOne({
            email: leadData.email,
            tenant,
            isActive: true
          });

          if (existing) {
            results.duplicates.push({
              row: i + 1,
              email: leadData.email,
              reason: 'Email already exists'
            });
            continue;
          }
        }

        // Create lead
        const lead = await Lead.create({
          ...leadData,
          leadSource: leadData.leadSource || defaultLeadSource,
          leadStatus: leadData.leadStatus || defaultLeadStatus,
          owner: leadData.owner || defaultOwner,
          tenant,
          createdBy: req.user._id,
          lastModifiedBy: req.user._id
        });

        results.created.push({
          row: i + 1,
          id: lead._id,
          email: lead.email
        });

      } catch (err) {
        results.errors.push({
          row: i + 1,
          data: leadData,
          error: err.message
        });
      }
    }

    await logActivity(req, 'leads.bulk_upload', 'Lead', null, {
      totalRows: leads.length,
      created: results.created.length,
      duplicates: results.duplicates.length,
      errors: results.errors.length
    });

    successResponse(res, 200, 'Bulk upload completed', results);
  } catch (error) {
    console.error('Bulk upload error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Get lead statistics
 * @route   GET /api/leads/stats
 * @access  Private
 */
const getLeadStats = async (req, res) => {
  try {
    const query = { isActive: true };

    // Tenant filtering
    if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
      query.tenant = req.user.tenant;
    }

    const [
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      bySource,
      byStatus,
      byRating
    ] = await Promise.all([
      Lead.countDocuments(query),
      Lead.countDocuments({ ...query, leadStatus: 'New' }),
      Lead.countDocuments({ ...query, leadStatus: 'Contacted' }),
      Lead.countDocuments({ ...query, leadStatus: 'Qualified' }),
      Lead.countDocuments({ ...query, isConverted: true }),
      Lead.aggregate([
        { $match: query },
        { $group: { _id: '$leadSource', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Lead.aggregate([
        { $match: query },
        { $group: { _id: '$leadStatus', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Lead.aggregate([
        { $match: query },
        { $group: { _id: '$rating', count: { $sum: 1 } } }
      ])
    ]);

    successResponse(res, 200, 'Lead statistics retrieved successfully', {
      total: totalLeads,
      byStatus: {
        new: newLeads,
        contacted: contactedLeads,
        qualified: qualifiedLeads,
        converted: convertedLeads
      },
      bySource,
      byStatusDetailed: byStatus,
      byRating
    });
  } catch (error) {
    console.error('Get lead stats error:', error);
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
  bulkUploadLeads,
  getLeadStats
};
