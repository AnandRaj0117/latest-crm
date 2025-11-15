const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Subscription = require('../models/Subscription');
const { generateToken } = require('../utils/jwt');
const { successResponse, errorResponse } = require('../utils/response');
const { logActivity } = require('../middleware/activityLogger');

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    // Find user
    const user = await User.findOne({ email }).populate('roles').populate('tenant');

    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse(res, 401, 'Account is deactivated');
    }

    // Check if tenant is active (for tenant users)
    if (user.tenant && user.tenant.isSuspended) {
      return errorResponse(res, 401, 'Your organization account is suspended');
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Log activity
    await logActivity(
      { user, ip: req.ip, get: req.get.bind(req), method: req.method, originalUrl: req.originalUrl, connection: req.connection },
      'login.success',
      'User',
      user._id
    );

    successResponse(res, 200, 'Login successful', {
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    errorResponse(res, 500, 'Server error during login');
  }
};

/**
 * @desc    Register new tenant organization
 * @route   POST /api/auth/register-tenant
 * @access  Public
 */
const registerTenant = async (req, res) => {
  try {
    const {
      organizationName,
      slug,
      contactEmail,
      contactPhone,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPassword
    } = req.body;

    // Validation
    if (!organizationName || !slug || !contactEmail || !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return errorResponse(res, 400, 'Please provide all required fields');
    }

    // Check if tenant slug already exists
    const existingTenant = await Tenant.findOne({ slug });
    if (existingTenant) {
      return errorResponse(res, 400, 'Organization slug already exists');
    }

    // Check if admin email already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      return errorResponse(res, 400, 'Email already registered');
    }

    // Create tenant
    const tenant = await Tenant.create({
      organizationName,
      slug,
      contactEmail,
      contactPhone,
      planType: 'free',
      isActive: true,
      theme: {
        companyName: organizationName
      }
    });

    // Create subscription
    const subscription = await Subscription.create({
      tenant: tenant._id,
      planType: 'free',
      status: 'trial',
      pricing: {
        amount: 0,
        currency: 'USD',
        billingCycle: 'monthly'
      },
      trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days trial
    });

    // Update tenant with subscription
    tenant.subscription = subscription._id;
    await tenant.save();

    // Find the Super Admin system role
    const Role = require('../models/Role');
    const superAdminRole = await Role.findOne({ slug: 'super-admin', roleType: 'system' });

    // Prepare admin user roles array
    const adminRoles = superAdminRole ? [superAdminRole._id] : [];

    // Create admin user
    const adminUser = await User.create({
      email: adminEmail,
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      userType: 'TENANT_ADMIN',
      tenant: tenant._id,
      roles: adminRoles,
      isActive: true
    });

    // Populate roles for the response
    await adminUser.populate('roles');

    // Generate token
    const token = generateToken(adminUser);

    // Remove password from response
    const userResponse = adminUser.toObject();
    delete userResponse.password;

    successResponse(res, 201, 'Tenant registered successfully', {
      token,
      user: userResponse,
      tenant: {
        _id: tenant._id,
        organizationName: tenant.organizationName,
        slug: tenant.slug,
        planType: tenant.planType
      }
    });
  } catch (error) {
    console.error('Tenant registration error:', error);
    errorResponse(res, 500, 'Server error during registration');
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('roles')
      .populate('groups')
      .populate('tenant')
      .select('-password');

    successResponse(res, 200, 'User profile retrieved', user);
  } catch (error) {
    console.error('Get me error:', error);
    errorResponse(res, 500, 'Server error');
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    // Log activity
    await logActivity(req, 'logout', 'User', req.user._id);

    successResponse(res, 200, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    errorResponse(res, 500, 'Server error during logout');
  }
};

module.exports = {
  login,
  registerTenant,
  getMe,
  logout
};
