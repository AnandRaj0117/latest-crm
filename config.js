// Centralized Configuration File
// This file manages all environment-specific settings for both frontend and backend

const environments = {
  development: {
    backend: {
      port: 4000,
      mongoUri: 'mongodb://localhost:27017/saas-multi-tenant',
      corsOrigin: 'http://localhost:3000',
      jwtSecret: 'your-super-secret-jwt-key-change-this-in-production',
      jwtExpire: '7d',
    },
    frontend: {
      apiUrl: 'http://localhost:4000/api',
    }
  },

  production: {
    backend: {
      port: process.env.PORT || 4000,
      mongoUri: process.env.MONGODB_URI,
      corsOrigin: process.env.CORS_ORIGIN || '*',
      jwtSecret: process.env.JWT_SECRET,
      jwtExpire: process.env.JWT_EXPIRE || '7d',
    },
    frontend: {
      apiUrl: process.env.REACT_APP_API_URL || '/api',
    }
  },

  staging: {
    backend: {
      port: process.env.PORT || 4000,
      mongoUri: process.env.MONGODB_URI,
      corsOrigin: process.env.CORS_ORIGIN || '*',
      jwtSecret: process.env.JWT_SECRET,
      jwtExpire: process.env.JWT_EXPIRE || '7d',
    },
    frontend: {
      apiUrl: process.env.REACT_APP_API_URL || '/api',
    }
  },

  test: {
    backend: {
      port: 4001,
      mongoUri: 'mongodb://localhost:27017/saas-multi-tenant-test',
      corsOrigin: 'http://localhost:3001',
      jwtSecret: 'test-jwt-secret',
      jwtExpire: '1d',
    },
    frontend: {
      apiUrl: 'http://localhost:4001/api',
    }
  },

  preview: {
    backend: {
      port: process.env.PORT || 4000,
      mongoUri: process.env.MONGODB_URI,
      corsOrigin: process.env.CORS_ORIGIN || '*',
      jwtSecret: process.env.JWT_SECRET,
      jwtExpire: process.env.JWT_EXPIRE || '7d',
    },
    frontend: {
      apiUrl: process.env.REACT_APP_API_URL || '/api',
    }
  }
};

const currentEnv = process.env.NODE_ENV || 'development';

module.exports = {
  env: currentEnv,
  config: environments[currentEnv] || environments.development,
  allEnvironments: environments,
};
