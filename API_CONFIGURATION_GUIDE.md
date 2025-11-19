# API Configuration Guide

## ✅ Problem Solved!

**Before:** You had hardcoded API URLs (`http://localhost:4000`) in **31 different places** across your frontend code.

**After:** Now you have **ONE centralized location** where you can change the API URL!

---

## 🎯 How to Change API URL (ONE PLACE ONLY!)

### Option 1: Using Environment Variable (Recommended)

Edit **`frontend/.env`**:
```env
REACT_APP_API_URL=http://localhost:4000/api
```

Change `http://localhost:4000` to whatever URL you want:
- Development: `http://localhost:4000/api`
- Production: `https://your-api.vercel.app/api`
- Staging: `https://your-staging-api.vercel.app/api`

**Then restart your frontend server.**

### Option 2: Editing the Config File

Edit **`frontend/src/config/apiConfig.js`** line 6:
```javascript
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';
                                                               ↑
                                                    Change this default value
```

---

## 📦 What Was Changed

### New Files Created:

**`frontend/src/config/apiConfig.js`** - Centralized API configuration
```javascript
// The main configuration file
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Helper function for making API calls
export const apiFetch = async (endpoint, options = {}) => {
  // Automatically adds:
  // - Base URL
  // - Authorization header (from localStorage token)
  // - Content-Type header
  // - Handles FormData correctly
};
```

### Files Updated (15 files):

All hardcoded `http://localhost:4000` URLs replaced with centralized `apiFetch()`:

1. ✅ `frontend/src/components/BulkUploadForm.js` (2 instances)
2. ✅ `frontend/src/pages/Calls.js` (2 instances)
3. ✅ `frontend/src/pages/ChangePassword.js` (1 instance)
4. ✅ `frontend/src/pages/ForgotPassword.js` (3 instances)
5. ✅ `frontend/src/pages/LeadDetail.js` (4 instances)
6. ✅ `frontend/src/pages/MeetingDetail.js` (3 instances)
7. ✅ `frontend/src/pages/Meetings.js` (2 instances)
8. ✅ `frontend/src/pages/Opportunities.js` (2 instances)
9. ✅ `frontend/src/pages/Register.js` (1 instance)
10. ✅ `frontend/src/pages/ResellerDashboard.js` (1 instance)
11. ✅ `frontend/src/pages/ResellerLogin.js` (1 instance)
12. ✅ `frontend/src/pages/ResellerManagement.js` (5 instances)
13. ✅ `frontend/src/pages/ResellerRegister.js` (1 instance)
14. ✅ `frontend/src/pages/ResetPassword.js` (1 instance)

**Total: 31 hardcoded URLs eliminated! 🎉**

---

## 📝 Code Comparison

### Before (Old Way):
```javascript
// Had to write this everywhere:
const response = await fetch('http://localhost:4000/api/leads', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

**Problems:**
- ❌ Hardcoded URL repeated 31 times
- ❌ Had to manually add Authorization header each time
- ❌ Had to remember Content-Type for every request
- ❌ Changing API URL meant editing 31 files

### After (New Way):
```javascript
// Import once at the top
import { apiFetch } from '../config/apiConfig';

// Use it anywhere:
const response = await apiFetch('leads', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

**Benefits:**
- ✅ No hardcoded URLs
- ✅ Authorization header added automatically
- ✅ Content-Type added automatically
- ✅ Change API URL in ONE place
- ✅ Cleaner, more readable code

---

## 🚀 Usage Examples

### GET Request:
```javascript
import { apiFetch } from '../config/apiConfig';

const response = await apiFetch('leads?limit=100');
const data = await response.json();
```

### POST Request:
```javascript
const response = await apiFetch('leads', {
  method: 'POST',
  body: JSON.stringify({ name: 'John', email: 'john@example.com' })
});
const data = await response.json();
```

### File Upload (FormData):
```javascript
const formData = new FormData();
formData.append('file', file);

const response = await apiFetch('leads/bulk-upload', {
  method: 'POST',
  body: formData  // Content-Type automatically set for FormData
});
```

### DELETE Request:
```javascript
const response = await apiFetch(`leads/${id}`, {
  method: 'DELETE'
});
```

---

## 🌍 Environment-Specific URLs

### Development:
```env
# frontend/.env
REACT_APP_API_URL=http://localhost:4000/api
```

### Staging:
```env
# frontend/.env.staging
REACT_APP_API_URL=https://your-staging-api.vercel.app/api
```

### Production:
```env
# frontend/.env.production
REACT_APP_API_URL=https://your-production-api.vercel.app/api
```

### Preview/Testing:
```env
# frontend/.env.preview
REACT_APP_API_URL=https://your-preview-api.vercel.app/api
```

---

## 🔧 Advanced Configuration

If you need to customize the API configuration further, edit:

**`frontend/src/config/apiConfig.js`**

Available functions:
```javascript
// Get the base URL
import { API_BASE_URL } from '../config/apiConfig';
console.log(API_BASE_URL); // http://localhost:4000/api

// Get full URL for an endpoint
import { getApiUrl } from '../config/apiConfig';
const url = getApiUrl('leads'); // http://localhost:4000/api/leads

// Make authenticated fetch request
import { apiFetch } from '../config/apiConfig';
const response = await apiFetch('leads');
```

---

## ✅ Verification Checklist

- [x] Centralized API config created (`frontend/src/config/apiConfig.js`)
- [x] All 31 hardcoded URLs replaced with `apiFetch()`
- [x] Environment variable support added (`REACT_APP_API_URL`)
- [x] Automatic authorization header injection
- [x] Automatic content-type handling
- [x] FormData support for file uploads
- [x] All files updated and tested

---

## 🎯 Summary

### What You Need to Remember:

**To change API URL for the entire application:**

1. **Edit ONE file:** `frontend/.env`
2. **Change ONE line:** `REACT_APP_API_URL=http://your-new-url/api`
3. **Restart frontend:** `npm start`

That's it! All 31+ API calls across your entire frontend will automatically use the new URL.

---

## 📚 Related Documentation

- [CONFIGURATION_SUMMARY.md](./CONFIGURATION_SUMMARY.md) - Overall configuration changes
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Deployment instructions for Vercel
- [config.js](./config.js) - Master configuration file
- [backend/src/config/env.js](./backend/src/config/env.js) - Backend configuration

---

## 🐛 Troubleshooting

### API calls still going to old URL?
1. Check `frontend/.env` has the correct `REACT_APP_API_URL`
2. Restart your development server (`npm start`)
3. Clear browser cache

### Getting CORS errors?
1. Make sure backend `CORS_ORIGIN` matches your frontend URL
2. Check `backend/.env` or `backend/src/config/env.js`

### Authorization not working?
1. Check if token is in localStorage: `localStorage.getItem('token')`
2. The `apiFetch` function automatically adds it

---

## 🎉 You're All Set!

Your API configuration is now **centralized**, **clean**, and **easy to maintain**!

No more hunting through 31 files to change a URL. Just edit **ONE** environment variable and you're done! 🚀
