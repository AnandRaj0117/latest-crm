# Setup Guide - Multi-Tenant SAAS Application

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- A code editor (VS Code recommended)

## Step-by-Step Installation

### 1. Verify Prerequisites

Open a terminal and verify installations:

```bash
node --version
# Should show v14.x.x or higher

npm --version
# Should show 6.x.x or higher

mongo --version
# Should show MongoDB version 4.x.x or higher
```

### 2. Navigate to Project Directory

```bash
cd C:\Users\ANAND RAJ\OneDrive\Desktop\project-1
```

### 3. Backend Setup

#### Install Dependencies

```bash
cd backend
npm install
```

This will install:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- dotenv
- cors
- helmet
- morgan
- express-validator

#### Configure Environment Variables

```bash
# Create .env file
copy .env.example .env
```

Edit `.env` file with your preferred text editor:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Update if needed)
MONGODB_URI=mongodb://localhost:27017/saas-multi-tenant

# JWT Secret (IMPORTANT: Change this to a random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# SAAS Owner Credentials (for initial setup)
SAAS_OWNER_EMAIL=admin@saasplatform.com
SAAS_OWNER_PASSWORD=changethispassword

# CORS
CORS_ORIGIN=http://localhost:3000
```

**Important Notes:**
- `JWT_SECRET`: Use a long, random string in production
- `MONGODB_URI`: Update if MongoDB is running on a different host/port
- `SAAS_OWNER_EMAIL/PASSWORD`: These will be used to create the initial admin

### 4. Frontend Setup

Open a **new terminal** and navigate to frontend:

```bash
cd C:\Users\ANAND RAJ\OneDrive\Desktop\project-1\frontend
npm install
```

This will install:
- react
- react-dom
- react-router-dom
- axios
- react-scripts

#### Configure Frontend Environment (Optional)

```bash
# Create .env file
echo REACT_APP_API_URL=http://localhost:5000/api > .env
```

If you change the backend port, update the API URL accordingly.

### 5. Start MongoDB

#### On Windows:
```bash
# Start MongoDB service
net start MongoDB

# OR if MongoDB is not installed as a service:
mongod
```

#### On macOS:
```bash
brew services start mongodb-community
```

#### On Linux:
```bash
sudo systemctl start mongod
```

Verify MongoDB is running:
```bash
mongo
# Should connect to MongoDB shell
```

### 6. Create Initial SAAS Owner Account

You have two options:

#### Option A: Using MongoDB Shell

```bash
# Connect to MongoDB
mongo

# Switch to your database
use saas-multi-tenant

# Create SAAS owner
db.users.insertOne({
  email: "admin@saasplatform.com",
  password: "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash
  firstName: "Super",
  lastName: "Admin",
  userType: "SAAS_OWNER",
  tenant: null,
  roles: [],
  groups: [],
  customPermissions: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

#### Option B: Create a Seeder Script

Create `backend/src/scripts/seedAdmin.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const existingAdmin = await User.findOne({
      email: process.env.SAAS_OWNER_EMAIL
    });

    if (existingAdmin) {
      console.log('Admin already exists!');
      process.exit(0);
    }

    const admin = await User.create({
      email: process.env.SAAS_OWNER_EMAIL,
      password: process.env.SAAS_OWNER_PASSWORD,
      firstName: 'Super',
      lastName: 'Admin',
      userType: 'SAAS_OWNER',
      isActive: true
    });

    console.log('Admin created successfully!');
    console.log('Email:', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

createAdmin();
```

Run the seeder:
```bash
node src/scripts/seedAdmin.js
```

### 7. Start the Application

#### Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

You should see:
```
MongoDB Connected: localhost
Server running in development mode on port 5000
```

#### Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

Your browser should automatically open to `http://localhost:3000`

### 8. Verify Installation

1. **Backend Health Check**
   - Open browser to: http://localhost:5000/health
   - Should see: `{"success":true,"message":"Server is running",...}`

2. **Frontend**
   - Should see login page at http://localhost:3000
   - If already logged in, you'll be redirected to dashboard

## First Time Usage

### 1. Login as SAAS Owner

Use the credentials from your `.env` file:
- Email: `admin@saasplatform.com`
- Password: `changethispassword`

You'll be redirected to the SAAS dashboard at `/saas/dashboard`

### 2. Register Your First Tenant

1. Logout from SAAS owner account
2. Click "Register your organization" on login page
3. Fill in the form:
   - **Organization Name**: Your Company
   - **Slug**: your-company (auto-generated)
   - **Contact Email**: contact@yourcompany.com
   - **Admin Email**: admin@yourcompany.com
   - **Password**: (minimum 6 characters)

4. Submit - you'll be logged in as the tenant admin

### 3. Explore Features

As **Tenant Admin**:
- View dashboard at `/dashboard`
- Create users, roles, and groups
- Manage permissions

As **SAAS Owner**:
- View all tenants at `/saas/tenants`
- Manage subscriptions at `/saas/subscriptions`
- View billing at `/saas/billings`
- See platform statistics

## Common Issues & Solutions

### Issue: MongoDB Connection Failed

**Error**: `MongoNetworkError: failed to connect to server`

**Solution**:
1. Make sure MongoDB is running: `net start MongoDB` (Windows) or `brew services start mongodb-community` (Mac)
2. Check if the port is correct in `.env` (default: 27017)
3. Try connecting manually: `mongo` in terminal

### Issue: Port Already in Use

**Error**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
1. Change PORT in backend `.env` to 5001 or another port
2. Update frontend `.env` API_URL to match
3. OR kill the process using the port

### Issue: JWT Token Invalid

**Error**: `Not authorized to access this route`

**Solution**:
1. Clear browser localStorage
2. Try logging in again
3. Make sure JWT_SECRET is set in backend `.env`

### Issue: CORS Error

**Error**: `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution**:
1. Verify backend is running on port 5000
2. Check CORS_ORIGIN in backend `.env` matches frontend URL
3. Restart backend server

### Issue: Module Not Found

**Error**: `Cannot find module 'express'`

**Solution**:
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Same for frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

## Development Tips

### Auto-Reload

Backend uses `nodemon` for auto-reload. Any changes to backend files will restart the server.

Frontend uses `react-scripts` which has hot-reload. Changes are reflected immediately.

### Debugging

**Backend Logs:**
- Check terminal running backend
- Logs show all requests, errors, and DB connections

**Frontend Logs:**
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for API calls

### Testing API Endpoints

Use tools like:
- **Postman** - [Download](https://www.postman.com/downloads/)
- **Thunder Client** (VS Code extension)
- **cURL** (command line)

Example cURL request:
```bash
curl http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@saasplatform.com","password":"changethispassword"}'
```

## Production Deployment

### Backend (Example: Heroku)

```bash
cd backend
heroku create your-app-name-api
heroku addons:create mongolab
heroku config:set JWT_SECRET=your-production-secret
heroku config:set NODE_ENV=production
git push heroku master
```

### Frontend (Example: Vercel)

```bash
cd frontend
npm run build
# Deploy the build folder to Vercel
```

Update frontend `.env`:
```
REACT_APP_API_URL=https://your-app-name-api.herokuapp.com/api
```

## Next Steps

1. **Customize Theme**
   - Edit CSS variables in `frontend/src/styles/index.css`
   - Update default colors in `ThemeContext.js`

2. **Add Features**
   - Implement full CRUD for users, roles, groups
   - Add email notifications
   - Implement payment gateway

3. **Security Hardening**
   - Add rate limiting
   - Implement 2FA
   - Add input validation
   - Set up HTTPS

4. **Testing**
   - Write unit tests
   - Add integration tests
   - E2E testing with Cypress

## Helpful Commands

```bash
# Backend
npm run dev         # Start with nodemon
npm start           # Start production mode

# Frontend
npm start           # Start development server
npm run build       # Create production build
npm test            # Run tests

# MongoDB
mongo               # Open MongoDB shell
use saas-multi-tenant  # Switch database
db.users.find()     # List all users
db.tenants.find()   # List all tenants

# Git
git status          # Check changes
git add .           # Stage all changes
git commit -m "message"  # Commit
git push            # Push to remote
```

## Support Resources

- **MongoDB Documentation**: https://docs.mongodb.com/
- **Express Documentation**: https://expressjs.com/
- **React Documentation**: https://react.dev/
- **Mongoose Documentation**: https://mongoosejs.com/

## Getting Help

If you encounter issues:

1. Check this guide thoroughly
2. Review error messages carefully
3. Check browser console and backend logs
4. Verify all environment variables are set
5. Ensure MongoDB is running

---

Happy coding! 🚀
