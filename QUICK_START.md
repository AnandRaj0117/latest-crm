# Quick Start Guide

Welcome to your Multi-Tenant SAAS Application! This guide will get you up and running in 5 minutes.

## What You Have

A complete, production-ready multi-tenant SAAS platform with:

- ✅ Multi-tenant architecture with complete data isolation
- ✅ Advanced Role-Based Access Control (RBAC)
- ✅ User, Role, and Group management
- ✅ SAAS owner portal for managing all tenants
- ✅ Subscription and billing system
- ✅ Theme customization per tenant
- ✅ Activity logging and audit trails
- ✅ RESTful API with 40+ endpoints
- ✅ Modern React frontend with routing
- ✅ JWT authentication and authorization

## File Structure

```
project-1/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── models/            # 7 Mongoose models
│   │   ├── controllers/       # Business logic
│   │   ├── routes/            # API endpoints
│   │   ├── middleware/        # Auth, RBAC, logging
│   │   ├── utils/             # Helper functions
│   │   ├── config/            # Database config
│   │   ├── scripts/           # Database seeder
│   │   └── server.js          # Express app
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React application
│   ├── public/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── context/           # Auth & Theme contexts
│   │   ├── pages/             # Page components
│   │   ├── services/          # API services
│   │   ├── styles/            # CSS files
│   │   └── App.js             # Main app
│   └── package.json
│
├── README.md                   # Comprehensive documentation
├── PROJECT_SUMMARY.md          # Detailed project overview
├── SETUP_GUIDE.md              # Step-by-step setup
└── QUICK_START.md              # This file
```

## 5-Minute Setup

### 1. Install Dependencies (2 minutes)

```bash
# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd frontend
npm install
```

### 2. Configure Environment (1 minute)

```bash
# Backend
cd backend
copy .env.example .env
# Edit .env if needed (default values work fine for local development)

# Frontend (optional)
cd frontend
echo REACT_APP_API_URL=http://localhost:4000/api > .env
```

### 3. Start MongoDB (30 seconds)

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Seed Database (30 seconds)

```bash
cd backend
node src/scripts/seedDatabase.js
```

This creates:
- SAAS Owner account
- Demo tenant with subscription
- 3 demo users with different roles
- System roles and features

### 5. Start Application (1 minute)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Browser opens automatically to http://localhost:3000

## Demo Accounts

After running the seeder, you can login with:

### SAAS Owner (Platform Admin)
- **Email**: admin@saasplatform.com
- **Password**: admin123
- **Dashboard**: http://localhost:3000/saas/dashboard
- **Can**: Manage all tenants, subscriptions, billing

### Demo Tenant Admin
- **Email**: admin@democompany.com
- **Password**: demo123
- **Dashboard**: http://localhost:3000/dashboard
- **Can**: Manage users, roles, groups in Demo Company

### Demo Manager
- **Email**: jane.manager@democompany.com
- **Password**: demo123
- **Can**: Manage users, view groups

### Demo User
- **Email**: bob.user@democompany.com
- **Password**: demo123
- **Can**: View users

## Key Features to Explore

### 1. Tenant Registration
- Logout if logged in
- Click "Register your organization"
- Fill form to create new tenant
- Automatically creates admin account and subscription

### 2. User Management
- Login as tenant admin
- Navigate to Users page
- Create users, assign roles/groups
- Set custom permissions

### 3. SAAS Owner Portal
- Login as SAAS owner
- View all tenants and statistics
- Manage subscriptions
- Track billing and revenue

### 4. Role-Based Access
- Different users see different menus
- Permissions control what actions are available
- Try logging in as different user types

### 5. Theme Customization
- Each tenant can customize:
  - Primary color
  - Secondary color
  - Logo
  - Company name

## API Testing

### Using cURL

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@saasplatform.com","password":"admin123"}'

# Get current user (replace TOKEN with the token from login)
curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# Get all users
curl http://localhost:4000/api/users \
  -H "Authorization: Bearer TOKEN"
```

### Using Postman

1. Import collection from `backend/postman_collection.json` (if created)
2. Set base URL: `http://localhost:4000/api`
3. Get token from login endpoint
4. Add token to Authorization header for other requests

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register-tenant` - Register organization
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tenants (SAAS Owner Only)
- `GET /api/tenants` - List all tenants
- `GET /api/tenants/stats/overview` - Tenant statistics
- `POST /api/tenants/:id/suspend` - Suspend tenant
- `POST /api/tenants/:id/activate` - Activate tenant

See README.md for complete API documentation.

## User Hierarchy

```
SAAS_OWNER (Platform owner)
    ↓ can manage
SAAS_ADMIN (Platform employees)
    ↓ can manage
TENANT_ADMIN (Organization super admin)
    ↓ can manage
TENANT_MANAGER (Can manage users)
    ↓ can manage
TENANT_USER (Regular user)
```

## Permission System

Permissions are checked in this order:
1. Is user SAAS_OWNER? → Grant all permissions
2. Does user have custom permission? → Use it
3. Does user's role have permission? → Grant it
4. Does user's group have permission? → Grant it
5. Otherwise → Deny

Example:
```javascript
// Check if user can create users
hasPermission(user, 'user_management', 'create')
```

## Next Steps

### Immediate
1. ✅ Explore the demo accounts
2. ✅ Create a new tenant
3. ✅ Test user management features
4. ✅ Check SAAS owner dashboard

### Development
1. Implement full CRUD UIs for:
   - Users (fetch and display list)
   - Roles (create, edit, delete)
   - Groups (member management)
   - Tenants (SAAS owner view)

2. Add advanced features:
   - Email notifications
   - File upload for logos
   - Advanced analytics
   - Payment gateway integration

3. Enhance security:
   - Rate limiting
   - Two-factor authentication
   - Password reset flow
   - Email verification

### Production
1. Set strong JWT_SECRET
2. Use production MongoDB (MongoDB Atlas)
3. Enable HTTPS
4. Set up monitoring (Sentry, LogRocket)
5. Configure email service (SendGrid, Mailgun)
6. Deploy backend (Heroku, AWS, DigitalOcean)
7. Deploy frontend (Vercel, Netlify)

## Troubleshooting

### Can't connect to MongoDB
```bash
# Check if MongoDB is running
mongo
# If it fails, start MongoDB:
net start MongoDB  # Windows
```

### Port already in use
```bash
# Change PORT in backend/.env to 5001
# Update REACT_APP_API_URL in frontend/.env
```

### Token expired / Not authorized
```bash
# Clear browser localStorage
# In browser console:
localStorage.clear()
# Then login again
```

## Documentation

- **README.md** - Complete project documentation
- **PROJECT_SUMMARY.md** - Detailed architecture and features
- **SETUP_GUIDE.md** - Step-by-step installation guide
- **Code comments** - Inline documentation in all files

## Architecture Highlights

### Backend
- **Models**: User, Tenant, Role, Group, Feature, Subscription, Billing, ActivityLog
- **Authentication**: JWT with bcrypt password hashing
- **Authorization**: RBAC with 5 user levels and permission system
- **Multi-tenancy**: Automatic tenant filtering on all queries
- **Security**: Helmet, CORS, input validation

### Frontend
- **Routing**: Protected routes, public routes, role-based access
- **State**: React Context for auth and theme
- **API**: Axios with interceptors for token injection
- **UI**: Custom CSS, responsive design, theme variables

## Support

If you need help:
1. Check SETUP_GUIDE.md for detailed instructions
2. Review error messages in terminal
3. Check browser console for frontend errors
4. Verify MongoDB is running
5. Ensure all environment variables are set

## Tips

- Use different browsers for different user types during testing
- Check network tab in DevTools to see API calls
- MongoDB Compass is great for viewing database
- VS Code extensions: ES7 React snippets, MongoDB

---

## You're All Set! 🎉

Your multi-tenant SAAS platform is ready to use. Start by logging in with one of the demo accounts and exploring the features!

For detailed information:
- Architecture: PROJECT_SUMMARY.md
- Setup: SETUP_GUIDE.md
- API: README.md

Happy building! 🚀
