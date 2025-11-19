# Multi-Tenant SAAS Application

A comprehensive multi-tenant SAAS platform built with MERN stack (MongoDB, Express, React, Node.js) featuring advanced user management, role-based access control, and customizable UI themes.

## Features

### Multi-Tenancy
- **Organization Registration**: Companies can sign up and get their own isolated workspace
- **Tenant Admin**: First user becomes super admin of their organization
- **Complete Isolation**: Data separation between different tenants

### User Management
- **Role-Based Access Control (RBAC)**: Granular permission system
- **Groups**: Organize users into departments/teams
- **Custom Roles**: Create custom roles with specific permissions
- **User Hierarchy**: SAAS Owner > SAAS Admin > Tenant Admin > Tenant Manager > Tenant User

### SAAS Owner Portal
- **Tenant Management**: View all registered organizations
- **Subscription Management**: Handle billing cycles and plan upgrades
- **Billing & Invoicing**: Automated invoice generation and payment tracking
- **Analytics Dashboard**: Revenue metrics, tenant statistics, and growth insights
- **Tenant Suspension**: Ability to suspend/activate organizations

### Customization
- **White-Labeling**: Each tenant can customize UI colors, logo, and branding
- **Feature Flags**: Control which features each tenant can access based on their plan
- **Flexible Plans**: Free, Basic, Premium, Enterprise tiers

### Security
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Role Middleware**: Protect routes based on user roles and permissions
- **Activity Logging**: Track all important actions for audit trails

## Architecture

### Database Schema

```
User
├── email, password, firstName, lastName
├── userType (SAAS_OWNER, SAAS_ADMIN, TENANT_ADMIN, TENANT_MANAGER, TENANT_USER)
├── tenant (reference)
├── roles (array of Role references)
├── groups (array of Group references)
└── customPermissions (override role permissions)

Tenant
├── organizationName, slug, domain
├── contactEmail, contactPhone
├── subscription (reference)
├── planType (free, basic, premium, enterprise)
├── theme (primaryColor, secondaryColor, logo, companyName)
├── settings (maxUsers, maxStorage, features)
└── isActive, isSuspended

Role
├── name, slug, description
├── tenant (reference, null for system roles)
├── roleType (system, custom)
├── permissions (array of feature-action pairs)
└── level (hierarchy level)

Group
├── name, slug, description
├── tenant (reference)
├── members (array of User references)
├── roles (array of Role references)
└── groupPermissions

Subscription
├── tenant (reference)
├── planType, status
├── pricing (amount, currency, billingCycle)
├── limits (maxUsers, maxStorage, etc.)
├── currentUsage
└── dates (start, end, trial, cancelled)

Billing
├── tenant, subscription (references)
├── invoiceNumber, invoiceDate, dueDate
├── amounts (subtotal, tax, discount, total)
├── paymentStatus (pending, paid, failed, refunded)
└── items (line items)
```

### User Hierarchy

1. **SAAS_OWNER**: Platform owner with full access to all features
2. **SAAS_ADMIN**: Platform employees who manage tenants and billing
3. **TENANT_ADMIN**: Organization super admin, can manage users and settings
4. **TENANT_MANAGER**: Can manage users but limited settings access
5. **TENANT_USER**: Regular user with assigned permissions

## Tech Stack

### Backend
- **Node.js** & **Express**: REST API server
- **MongoDB** & **Mongoose**: Database and ODM
- **JWT**: Authentication
- **bcryptjs**: Password hashing
- **Helmet**: Security headers
- **Morgan**: Request logging
- **CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client
- **Context API**: State management
- **CSS**: Custom styling (no framework dependency)

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd project-1
```

2. **Setup Backend**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup Frontend**
```bash
cd frontend
npm install

# Create .env file (optional)
echo "REACT_APP_API_URL=http://localhost:4000/api" > .env
```

4. **Start MongoDB**
```bash
# Make sure MongoDB is running
# On Windows: net start MongoDB
# On Mac/Linux: sudo systemctl start mongod
```

5. **Run the Application**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

### Initial Setup

1. **Create SAAS Owner Account**
   - First user should be created directly in the database or via seeder script
   - Set userType to 'SAAS_OWNER'

2. **Register a Tenant**
   - Go to http://localhost:3000/register
   - Fill in organization details
   - Admin account is automatically created

3. **Login**
   - Use admin credentials to login
   - SAAS owners see the SAAS dashboard
   - Tenant admins see their organization dashboard

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register-tenant` - Register new organization
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - Get all users (filtered by tenant)
- `GET /api/users/:id` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/assign-roles` - Assign roles
- `POST /api/users/:id/assign-groups` - Assign groups

### Roles
- `GET /api/roles` - Get all roles
- `GET /api/roles/:id` - Get single role
- `POST /api/roles` - Create role
- `PUT /api/roles/:id` - Update role
- `DELETE /api/roles/:id` - Delete role

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get single group
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/members` - Add members
- `DELETE /api/groups/:id/members` - Remove members

### Tenants (SAAS Owner Only)
- `GET /api/tenants` - Get all tenants
- `GET /api/tenants/stats/overview` - Get tenant statistics
- `GET /api/tenants/:id` - Get single tenant
- `PUT /api/tenants/:id` - Update tenant
- `POST /api/tenants/:id/suspend` - Suspend tenant
- `POST /api/tenants/:id/activate` - Activate tenant
- `DELETE /api/tenants/:id` - Delete tenant

### Subscriptions
- `GET /api/subscriptions` - Get subscriptions
- `GET /api/subscriptions/:id` - Get single subscription
- `PUT /api/subscriptions/:id` - Update subscription
- `POST /api/subscriptions/:id/cancel` - Cancel subscription
- `POST /api/subscriptions/:id/renew` - Renew subscription

### Billings
- `GET /api/billings` - Get billings
- `GET /api/billings/stats/overview` - Get billing statistics
- `GET /api/billings/:id` - Get single billing
- `POST /api/billings` - Create billing/invoice
- `PUT /api/billings/:id` - Update billing

## Permission System

Permissions are structured as `feature:action` pairs:

### Features
- `user_management` - User CRUD operations
- `role_management` - Role CRUD operations
- `group_management` - Group CRUD operations
- `tenant_settings` - Tenant configuration
- `billing` - Billing and subscription management

### Actions
- `create` - Create new resources
- `read` - View resources
- `update` - Modify resources
- `delete` - Remove resources
- `manage` - Full access (includes all actions)

### Usage Example
```javascript
// Check if user can create users
if (hasPermission(user, 'user_management', 'create')) {
  // Allow user creation
}
```

## Customization Guide

### Adding New Features

1. **Create Feature Flag** in database:
```javascript
{
  name: "Advanced Analytics",
  slug: "advanced_analytics",
  availableInPlans: ["premium", "enterprise"],
  isCoreFeature: false
}
```

2. **Add Permission Checks** in backend:
```javascript
router.get('/analytics',
  protect,
  requirePermission('advanced_analytics', 'read'),
  analyticsController
);
```

3. **Check in Frontend**:
```javascript
{hasPermission('advanced_analytics', 'read') && (
  <AnalyticsComponent />
)}
```

### Customizing Theme

Each tenant can customize:
- Primary color
- Secondary color
- Logo
- Company name

These are stored in `tenant.theme` and applied via CSS variables.

## Deployment

### Backend Deployment (Example: Heroku)
```bash
cd backend
git init
heroku create your-app-name-api
heroku addons:create mongolab
git add .
git commit -m "Initial commit"
git push heroku master
```

### Frontend Deployment (Example: Vercel/Netlify)
```bash
cd frontend
npm run build
# Deploy the build folder
```

## Future Enhancements

1. **Email Notifications**: Welcome emails, billing reminders
2. **Two-Factor Authentication**: Enhanced security
3. **Advanced Analytics**: Usage metrics, custom reports
4. **API Keys**: Allow programmatic access
5. **Webhooks**: Integration with external services
6. **SSO Integration**: SAML, OAuth providers
7. **Mobile App**: React Native companion app
8. **Advanced Billing**: Metered billing, usage-based pricing

## Security Best Practices

1. **Environment Variables**: Never commit .env files
2. **Password Policy**: Enforce strong passwords
3. **Rate Limiting**: Add to prevent brute force
4. **Input Validation**: Always validate and sanitize inputs
5. **HTTPS**: Use SSL in production
6. **Regular Updates**: Keep dependencies updated

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For questions or issues:
- Open an issue on GitHub
- Check documentation
- Review code comments

---

Built with ❤️ using MERN Stack
