# Deployment Guide for Multi-Environment Setup

## Overview
Your CRM application is now configured to run on **port 4000** with centralized configuration management and supports deployment to multiple environments.

## What Changed

### 1. Centralized Configuration
- **Root config.js**: Central configuration file for all environments
- **backend/src/config/env.js**: Backend-specific config loader
- Backend now uses port **4000** instead of 5000

### 2. API Optimization
- **API Request Caching**: Automatically caches GET requests to reduce server load
- **Request Deduplication**: Prevents duplicate API calls from being made simultaneously
- **Auto Cache Invalidation**: Clears related caches when data is updated

### 3. Environment Files
Created environment-specific configuration files:
- `.env.development` - Local development
- `.env.production` - Production deployment
- `.env.staging` - Staging environment
- `.env.preview` - Preview/demo environment
- `.env.test` - Testing environment

## Local Development

### Starting the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on: http://localhost:4000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Frontend will run on: http://localhost:3000

### Configuration Files to Update

**Backend (.env):**
```env
PORT=4000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/saas-multi-tenant
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
```

**Frontend (.env):**
```env
REACT_APP_API_URL=http://localhost:4000/api
REACT_APP_ENV=development
```

## Vercel Deployment

### Deploy Backend to Vercel

1. **Install Vercel CLI (if not already installed):**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to backend folder:**
   ```bash
   cd backend
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel
   ```

4. **Set Environment Variables in Vercel Dashboard:**
   - Go to your project in Vercel Dashboard
   - Navigate to Settings → Environment Variables
   - Add the following variables:

   **For Production:**
   ```
   NODE_ENV=production
   PORT=4000
   MONGODB_URI=<your-production-mongodb-uri>
   CORS_ORIGIN=<your-frontend-vercel-url>
   JWT_SECRET=<strong-random-secret>
   JWT_EXPIRE=7d
   SAAS_OWNER_EMAIL=admin@yourcompany.com
   SAAS_OWNER_PASSWORD=<secure-password>
   ```

   **For Staging:** (Create a new Vercel project)
   - Same as production but with staging database and URLs

   **For Preview:** (Vercel auto-deploys preview from branches)
   - Configure preview environment variables in Vercel

### Deploy Frontend to Vercel

1. **Navigate to frontend folder:**
   ```bash
   cd frontend
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **Set Environment Variables in Vercel Dashboard:**

   **For Production:**
   ```
   REACT_APP_API_URL=<your-backend-vercel-url>/api
   REACT_APP_ENV=production
   ```

   **For Staging:**
   ```
   REACT_APP_API_URL=<your-staging-backend-url>/api
   REACT_APP_ENV=staging
   ```

   **For Preview:**
   ```
   REACT_APP_API_URL=<your-preview-backend-url>/api
   REACT_APP_ENV=preview
   ```

## Managing Multiple Environments

### Environment Strategy

1. **Development** - Local development with local MongoDB
2. **Test** - Automated testing with test database
3. **Preview** - Preview deployments for feature branches
4. **Staging** - Pre-production testing with production-like data
5. **Production** - Live production environment

### Best Practices

1. **Never commit `.env` files** with real credentials to Git
2. **Use different MongoDB databases** for each environment
3. **Use different JWT secrets** for each environment
4. **Update CORS origins** to match your frontend URLs
5. **Test thoroughly in staging** before deploying to production

### Recommended Vercel Setup

Create **4 Vercel projects**:

1. **crm-backend-prod** - Production backend
2. **crm-backend-staging** - Staging backend
3. **crm-frontend-prod** - Production frontend
4. **crm-frontend-staging** - Staging frontend

Preview deployments will be automatically created for each branch.

## API Caching Features

### How It Works

The new API caching system:
- Caches GET requests for configurable time periods
- Prevents duplicate requests from being made simultaneously
- Automatically clears cache when data is updated (POST/PUT/DELETE)
- Configurable cache duration per endpoint

### Cache Configuration

Edit `frontend/src/utils/apiCache.js` to adjust cache timings:

```javascript
export const cacheConfig = {
  leads: { ttl: 2 * 60 * 1000 },        // 2 minutes
  accounts: { ttl: 5 * 60 * 1000 },     // 5 minutes
  roles: { ttl: 15 * 60 * 1000 },       // 15 minutes
  // ... etc
};
```

### Manually Clear Cache

In your components:
```javascript
import { apiCache, invalidateCache } from '../services/api';

// Clear specific cache
invalidateCache.lead();

// Clear all cache
invalidateCache.all();
```

## Troubleshooting

### Port Already in Use
If you see "Port 4000 is already in use":
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:4000 | xargs kill -9
```

### CORS Errors
Ensure your backend CORS_ORIGIN matches your frontend URL:
- Local: `http://localhost:3000`
- Production: Your actual Vercel frontend URL

### Environment Variables Not Loading
1. Restart your development server after changing .env files
2. Check that environment variables don't have quotes
3. For React, ensure variables start with `REACT_APP_`

## Monitoring

### Check Backend Health
```bash
curl http://localhost:4000/health
```

### Vercel Logs
```bash
vercel logs <deployment-url>
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong, unique JWT_SECRET for each environment
- [ ] Add all sensitive .env files to .gitignore
- [ ] Use MongoDB connection strings with authentication
- [ ] Enable HTTPS in production (Vercel does this automatically)
- [ ] Regularly rotate JWT secrets
- [ ] Use environment-specific database instances

## Quick Reference

| Environment | Backend Port | Frontend Port | Database |
|-------------|--------------|---------------|----------|
| Development | 4000 | 3000 | Local MongoDB |
| Test | 4001 | 3001 | Local Test DB |
| Staging | Vercel | Vercel | Staging MongoDB |
| Production | Vercel | Vercel | Production MongoDB |
| Preview | Vercel | Vercel | Preview MongoDB |

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running (for local development)
4. Check Vercel deployment logs for cloud deployments
