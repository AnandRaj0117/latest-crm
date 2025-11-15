# 🎯 How to Use Groups for Access Control

## What are Groups?

Groups let you organize users and assign permissions to multiple users at once. When you assign a role to a group, **all members of that group inherit those permissions**.

---

## 📋 Step-by-Step Guide

### Step 1: Create a Role with Permissions

1. **Go to Settings → Roles**
2. **Click "+ New Role"**
3. **Fill in the form:**
   - **Name:** "Sales Team"
   - **Description:** "Can manage leads and contacts"
4. **Select Permissions:**
   - ✅ Lead Management: `create`, `read`, `update`, `convert`
   - ✅ Contact Management: `create`, `read`, `update`
   - ✅ Account Management: `read`
   - ✅ Activity Management: `create`, `read`, `update`
5. **Click "Create Role"**

---

### Step 2: Create a Group

1. **Go to Settings → Groups**
2. **Click "+ New Group"**
3. **Fill in the form:**
   - **Name:** "Sales Department"
   - **Description:** "Sales team members"
4. **Click "Create Group"**

---

### Step 3: Assign Roles to the Group

1. **In the Groups list, find "Sales Department"**
2. **Click the "Roles" button**
3. **Select the roles you want to assign:**
   - ✅ Sales Team (the role we created)
4. **Click "Update Roles (1)"**

Now the group has the "Sales Team" role assigned!

---

### Step 4: Add Users to the Group

1. **In the Groups list, find "Sales Department"**
2. **Click the "Members" button**
3. **Select users to add:**
   - ✅ John Doe
   - ✅ Jane Smith
   - ✅ Bob Wilson
4. **Click "Update Members (3)"**

✅ **Done!** All three users now have the permissions from the "Sales Team" role!

---

## 🔍 How Group Permissions Work

### Permission Inheritance Flow:

```
User's Total Permissions =
    Direct User Roles
  + Group Roles (inherited from all groups they're in)
  + Custom Permissions
```

### Example:

**User: John Doe**
- **Direct Role:** "Manager" (has user_management permissions)
- **Group Membership:** "Sales Department" → has "Sales Team" role
- **Total Permissions:**
  - From Manager role: user_management (create, read, update, delete)
  - From Sales Team role (via group): lead_management, contact_management, etc.

---

## 📊 Practical Example Scenario

### Company Structure:

```
Organization: TechCorp Inc
├── Sales Department (Group)
│   ├── Role: Sales Team
│   └── Members: 5 sales reps
├── Marketing Department (Group)
│   ├── Role: Marketing Team
│   └── Members: 3 marketers
└── Management (Group)
    ├── Role: Department Manager
    └── Members: 2 managers
```

### Setup:

#### 1. Create Roles:

**Sales Team Role:**
- lead_management: create, read, update, convert, import
- contact_management: create, read, update
- account_management: read, update
- activity_management: create, read, update

**Marketing Team Role:**
- lead_management: create, read, import
- activity_management: create, read

**Department Manager Role:**
- lead_management: all permissions (manage)
- contact_management: all permissions (manage)
- account_management: all permissions (manage)
- activity_management: all permissions (manage)
- user_management: read, update
- report_management: read, create, export

#### 2. Create Groups:

1. **Sales Department** → Assign "Sales Team" role
2. **Marketing Department** → Assign "Marketing Team" role
3. **Management** → Assign "Department Manager" role

#### 3. Add Users:

- Add 5 sales reps to "Sales Department" group
- Add 3 marketers to "Marketing Department" group
- Add 2 managers to "Management" group

#### Result:

✅ All sales reps can create and convert leads
✅ Marketers can create leads but not convert them
✅ Managers have full access to everything
✅ If you need to change permissions, just update the role once (not 5 individual users!)

---

## ✅ How to Verify Permissions

### View a User's Permissions:

1. **Go to Settings → Users**
2. **Click "Permissions" button on any user**
3. **You'll see TWO sections:**

   **📋 Assigned Roles (Direct):**
   - Roles assigned directly to the user

   **👥 Permissions from Groups:**
   - Shows each group the user is in
   - Shows which roles the group has
   - Shows all permissions inherited from those roles

---

## 💡 Best Practices

### ✅ DO:
- Create groups based on departments or job functions
- Assign roles to groups, not individual users
- Use descriptive group names (e.g., "Sales-West-Region")
- Regularly review group memberships

### ❌ DON'T:
- Assign too many direct roles to users (use groups instead)
- Create groups with only 1 member (just assign role directly)
- Use cryptic group names
- Forget to remove users from groups when they change roles

---

## 🎯 Common Use Cases

### 1. Onboarding New Employee:

**Before Groups (Manual):**
1. Create user
2. Assign 5 different roles
3. Configure custom permissions
4. Repeat for each new employee

**With Groups (Easy):**
1. Create user
2. Add to "Sales Department" group
3. Done! They inherit all necessary permissions

### 2. Changing Department Permissions:

**Before Groups:**
- Update permissions for 20 individual users (tedious!)

**With Groups:**
- Update the role once → all 20 group members get the change instantly

### 3. Temporary Project Teams:

**Example:** Special campaign team needs extra permissions for 2 weeks

1. Create group: "Q4-Campaign-Team"
2. Assign role: "Campaign Manager" (with extra permissions)
3. Add 5 members
4. After project: Delete group or remove members

---

## 🔐 Permission Hierarchy

When a user has conflicting permissions from multiple sources, **the most permissive wins**:

```
User has:
- Direct role: read-only access to leads
- Group role: create and update leads

Result: User can create and update leads ✅
```

---

## 📝 Testing Your Setup

### Quick Test:

1. **Create a test user** (e.g., "test.user@example.com")
2. **Add them to a group**
3. **Login as that user**
4. **Try to access features** - you should have the group's permissions
5. **Remove from group** → permissions should be removed
6. **Check "Permissions" view** to see what they have

---

## 🎨 Visual Example

```
Group: "Sales Department"
├── Assigned Roles:
│   └── "Sales Team" (custom role)
│       ├── lead_management: create, read, update, convert
│       ├── contact_management: create, read, update
│       └── activity_management: create, read
│
└── Members:
    ├── Alice (Sales Rep) → Inherits all above permissions
    ├── Bob (Sales Rep) → Inherits all above permissions
    └── Carol (Sales Rep) → Inherits all above permissions
```

When you update the "Sales Team" role, all 3 members automatically get the changes!

---

## 🚀 Quick Start Example

Let's create a complete working example:

### 1. Create "CRM Users" Role:
```
Permissions:
- lead_management: create, read, update, convert, import, export
- contact_management: create, read, update, export
- account_management: create, read, update
- activity_management: create, read, update, delete
```

### 2. Create "CRM Team" Group:
```
Name: CRM Team
Description: All CRM users
```

### 3. Assign Role to Group:
```
Group: CRM Team
Roles: [CRM Users]
```

### 4. Add Users:
```
Add all your team members to "CRM Team" group
```

**Result:** Everyone can now use the full CRM! 🎉

---

## 📞 Need Help?

**Common Issues:**

1. **User doesn't have permissions after adding to group**
   - User needs to logout and login again (token refresh)

2. **Can't see group roles in UI**
   - Check that you're logged in as admin (need group_management.manage permission)

3. **Permissions not showing in User's permission view**
   - Make sure backend populated groups correctly
   - Check backend logs for errors

---

## 🎓 Summary

**Groups are powerful because:**
- ✅ Assign permissions to many users at once
- ✅ Change permissions for entire teams instantly
- ✅ Organize users by department/function
- ✅ Easy onboarding and offboarding
- ✅ Less maintenance than individual role assignments

**Remember:** Users inherit permissions from ALL groups they're members of!

---

**You now have a fully functional group-based permission system! 🚀**
