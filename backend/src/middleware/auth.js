const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/response');
const User = require('../models/User');

/**
 * Protect routes - verify JWT token
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized to access this route');
    }

    // Verify token
    const decoded = verifyToken(token);

    // Get user from database with populated roles and groups (with their roles)
    const user = await User.findById(decoded.id)
      .populate('roles')
      .populate({
        path: 'groups',
        populate: {
          path: 'roles'
        }
      })
      .select('-password');

    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    if (!user.isActive) {
      return errorResponse(res, 401, 'User account is deactivated');
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return errorResponse(res, 401, 'Not authorized to access this route');
  }
};

/**
 * Restrict to specific user types
 * @param  {...String} userTypes - Allowed user types
 */
const restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.user.userType)) {
      return errorResponse(res, 403, 'You do not have permission to perform this action');
    }
    next();
  };
};

/**
 * Ensure user belongs to a tenant
 */
const requireTenant = (req, res, next) => {
  if (!req.user.tenant) {
    return errorResponse(res, 403, 'This action requires tenant context');
  }
  next();
};

/**
 * Ensure user is SAAS owner or admin
 */
const requireSaasAccess = (req, res, next) => {
  if (req.user.userType !== 'SAAS_OWNER' && req.user.userType !== 'SAAS_ADMIN') {
    return errorResponse(res, 403, 'SAAS admin access required');
  }
  next();
};

/**
 * Verify tenant context matches
 * For routes with :tenantId parameter
 */
const verifyTenantContext = (req, res, next) => {
  // SAAS owners can access any tenant
  if (req.user.userType === 'SAAS_OWNER' || req.user.userType === 'SAAS_ADMIN') {
    return next();
  }

  const tenantId = req.params.tenantId || req.body.tenant;

  if (!tenantId) {
    return errorResponse(res, 400, 'Tenant ID required');
  }

  if (req.user.tenant.toString() !== tenantId.toString()) {
    return errorResponse(res, 403, 'Access denied to this tenant');
  }

  next();
};

module.exports = {
  protect,
  restrictTo,
  requireTenant,
  requireSaasAccess,
  verifyTenantContext
};
