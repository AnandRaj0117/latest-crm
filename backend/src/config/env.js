// Backend Environment Configuration Loader
// This file loads configuration from the centralized config.js

require('dotenv').config();

const config = {
  // Server
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/saas-multi-tenant',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Email
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
  },

  // SAAS Owner
  saasOwner: {
    email: process.env.SAAS_OWNER_EMAIL || 'admin@saasplatform.com',
    password: process.env.SAAS_OWNER_PASSWORD || 'changethispassword',
  }
};

module.exports = config;
