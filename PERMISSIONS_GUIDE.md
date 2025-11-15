# 🔐 Permissions & Role Management Guide

## What's New - Permission System Explained!

I've added **complete permission visibility and role assignment** to your user management system. Now you can:

✅ **Assign roles when creating/editing users**
✅ **View exactly what permissions each user has**
✅ **Understand what each permission allows**
✅ **See role-based access control in action**

---

## How It Works Now

### 1. Creating a User with Roles

**Before:** You could create users but couldn't assign roles
**Now:** Role assignment is built into user creation!

**Steps:**
1. Go to **Users** → Click **"+ Add User"**
2. Fill in basic details (name, email, password)
3. **NEW: Assign Roles section** appears
4. Check the boxes for roles you want to assign
5. Click **"Create User"**

**What Happens:**
- User gets all permissions from assigned roles
- Multiple roles combine their permissions
- User can now access features based on their roles

---

### 2. Viewing User Permissions

**The Problem You Had:** "Where are permissions? I can't see what users can do!"

**The Solution:** Click **"Permissions"** button on any user!

**What You'll See:**
1. **User Summary**
   - Email, User Type, Status

2. **Assigned Roles**
   - All roles assigned to this user
   - Each role shows its permissions

3. **Detailed Permissions**
   - **Feature**: What area (user_management, role_management, etc.)
   - **Actions**: What they can do (create, read, update, delete, manage)

4. **Permission Guide**
   - Explanation of what each action means

5. **Feature Descriptions**
   - What each feature controls

---

## Permission System Explained

### Permission Structure

```
Role → Permissions → Feature + Actions
```

**Example:**
```
Role: "Team Lead"
└─ Permissions:
   ├─ user_management: [read, update]
   ├─ group_management: [read]
   └─ role_management: [] (no access)
```

**What This User CAN Do:**
✅ View users (read)
✅ Edit users (update)
✅ View groups (read)

**What This User CANNOT Do:**
❌ Create new users (no create)
❌ Delete users (no delete)
❌ Manage groups (only read)
❌ Do anything with roles (no permissions)

---

## The 5 Actions Explained

### 1. **create**
- Can add new records
- Example: Create new users, Create new roles, Create new groups

### 2. **read**
- Can view and list records
- Example: See user list, View role details, Browse groups

### 3. **update**
- Can edit existing records
- Example: Edit user profile, Modify role permissions, Change group name

### 4. **delete**
- Can remove records
- Example: Delete users, Remove roles, Delete groups

### 5. **manage** ⭐ (Most Powerful)
- **Includes ALL actions** (create + read + update + delete + special)
- Example: Full control over users, Complete role management, Total group control

---

## The 3 Features Explained

### 1. **user_management**

**Controls:** Everything related to user accounts

**What Each Action Allows:**

| Action | Can Do |
|--------|--------|
| create | Add new employees to organization |
| read | View user list, See user profiles |
| update | Edit user details, Change user type, Assign roles |
| delete | Remove users from organization |
| manage | Everything above + Assign permissions, Manage user access |

### 2. **role_management**

**Controls:** Creating and managing roles

**What Each Action Allows:**

| Action | Can Do |
|--------|--------|
| create | Create custom roles |
| read | View existing roles, See role permissions |
| update | Edit role names, Modify permissions |
| delete | Remove custom roles (system roles protected) |
| manage | Everything above + Full role control |

### 3. **group_management**

**Controls:** Organizing users into groups

**What Each Action Allows:**

| Action | Can Do |
|--------|--------|
| create | Create new groups |
| read | View groups, See group members |
| update | Edit group details, Change group name |
| delete | Remove groups |
| manage | Everything above + Add/remove members, Assign group roles |

---

## Real-World Examples

### Example 1: HR Manager

**Needs:**
- Add new employees
- Edit employee details
- View all users
- Cannot delete users (needs approval)

**Solution - Create "HR Manager" Role:**
```
Permissions:
- user_management: [create, read, update]
- group_management: [read, manage]
```

**Result:**
✅ Can add employees
✅ Can edit profiles
✅ Can view everyone
✅ Can manage groups
❌ Cannot delete users
❌ Cannot create/edit roles

---

### Example 2: Team Lead

**Needs:**
- View team members
- Update team info
- View groups
- No user creation/deletion

**Solution - Create "Team Lead" Role:**
```
Permissions:
- user_management: [read, update]
- group_management: [read]
```

**Result:**
✅ Can see all users
✅ Can edit user details
✅ Can view groups
❌ Cannot add/delete users
❌ Cannot create roles
❌ Cannot manage groups

---

### Example 3: Super Admin

**Needs:**
- Full control over everything

**Solution - Use System "Super Admin" Role:**
```
Permissions:
- user_management: [manage]
- role_management: [manage]
- group_management: [manage]
```

**Result:**
✅ Full access to everything
✅ Can do all actions
✅ Complete control

---

## How to Use the New Features

### Creating a Role with Permissions

1. Go to **Roles** → Click **"+ Create Role"**
2. Enter name: "Project Manager"
3. Add description
4. **Check Permission Boxes:**
   - User Management: ✅ read, ✅ update
   - Role Management: ✅ read
   - Group Management: ✅ read, ✅ manage
5. Click **"Create Role"**

**Now you have:** A role that can view/edit users, view roles, and fully manage groups!

---

### Assigning Roles to Users

**Method 1: During User Creation**
1. Click **"+ Add User"**
2. Fill in details
3. Scroll to **"Assign Roles"**
4. Check roles to assign
5. Create user

**Method 2: Edit Existing User**
1. Click **"Edit"** on any user
2. Scroll to **"Assign Roles"**
3. Check/uncheck roles
4. Update user

**Pro Tip:** You can assign multiple roles! Permissions combine.

---

### Viewing What a User Can Do

1. Go to **Users**
2. Find any user
3. Click **"Permissions"** button
4. **See Everything:**
   - Their roles
   - All permissions from each role
   - Explanation of what each permission means
   - Guide to understand features

**Use This To:**
- Verify user has correct access
- Debug why user can't do something
- Understand permission structure
- Plan new roles

---

## Permission Inheritance

### Multiple Roles = Combined Permissions

**Example:**
User has 2 roles:

**Role 1: "Viewer"**
- user_management: [read]

**Role 2: "Editor"**
- user_management: [update]

**User's Total Permissions:**
- user_management: [read, update] ✅ Combined!

### No Role = No Access

**Important:** Users without roles have **ZERO** permissions!

If you create a user and don't assign any roles:
❌ Cannot access any features
❌ Can only login and see empty dashboard
❌ Needs at least one role to do anything

---

## Visual Guide to the UI

### User List Table

```
Name | Email | Type | Status | Roles | Actions
------------------------------------------------
John | john@ | USER | Active | 2    | [Permissions] [Edit] [Delete]
                                       ↑ NEW BUTTON!
```

**Click "Permissions"** → See everything they can do!

### Permissions Modal Shows:

```
┌─────────────────────────────────────┐
│ Permissions - John Doe              │
├─────────────────────────────────────┤
│ User Summary:                       │
│ • Email: john@company.com           │
│ • Type: TENANT_USER                 │
│ • Status: Active                    │
├─────────────────────────────────────┤
│ Assigned Roles (2):                 │
│                                     │
│ ┌─── Role: Team Lead ────┐         │
│ │ Permissions:           │         │
│ │ • user_management:     │         │
│ │   [read] [update]      │         │
│ │ • group_management:    │         │
│ │   [read]               │         │
│ └────────────────────────┘         │
│                                     │
│ ┌─── Role: Editor ───────┐         │
│ │ Permissions:           │         │
│ │ • user_management:     │         │
│ │   [update] [delete]    │         │
│ └────────────────────────┘         │
├─────────────────────────────────────┤
│ Permission Guide:                   │
│ • create → Can create records       │
│ • read → Can view records           │
│ • update → Can edit records         │
│ • delete → Can remove records       │
│ • manage → Full access              │
├─────────────────────────────────────┤
│ Available Features:                 │
│ • user_management → User accounts   │
│ • role_management → Roles           │
│ • group_management → Groups         │
└─────────────────────────────────────┘
```

---

## Best Practices

### 1. Create Roles First
Before adding users, create roles for common positions:
- Admin
- Manager
- Employee
- Viewer

### 2. Use Descriptive Names
✅ Good: "HR Manager", "Team Lead", "Read Only"
❌ Bad: "Role1", "Test", "New Role"

### 3. Document in Description
Always add role description explaining:
- Who should have this role
- What they can do
- Any limitations

### 4. Assign Multiple Roles When Needed
Don't create "HR Manager who can also edit groups" role.
Instead: Assign both "HR Manager" + "Group Editor" roles

### 5. Review Permissions Regularly
Click "Permissions" button to verify users have correct access

### 6. Use "manage" Sparingly
Only give "manage" action to admins. Regular users should have specific actions.

---

## Common Questions

### Q: Why can't my user access something?

**A:** Click "Permissions" button to check:
1. Do they have any roles assigned?
2. Do their roles have the required permission?
3. Do they have the required action? (read vs update vs manage)

### Q: What's the difference between update and manage?

**A:**
- **update**: Can edit existing records
- **manage**: Can do EVERYTHING (create, read, update, delete, + special features like assigning roles)

### Q: Can I remove permissions from a user?

**A:** Yes! Edit user → Uncheck roles → Update user

### Q: How do I give someone full access?

**A:** Assign the "Super Admin" system role (has manage on everything)

### Q: What happens if roles conflict?

**A:** They don't conflict! Permissions COMBINE. More roles = more permissions.

---

## Troubleshooting

### User says: "I can't create users"

**Check:**
1. Click "Permissions" on their user
2. Look for: `user_management: [create]` or `[manage]`
3. If missing → Edit user → Assign role with create permission

### User has role but no access?

**Check:**
1. Is the role active? (should show green "Active" badge)
2. Does the role actually have permissions?
3. Click "Permissions" to verify

### Can't assign roles to user?

**Check:**
1. Do you have `user_management: update` or `manage`?
2. If not, you need higher permissions

---

## Summary

✅ **Assign roles** when creating/editing users
✅ **Click "Permissions"** to see what users can do
✅ **Permissions combine** from multiple roles
✅ **No role = no access** - always assign at least one role
✅ **"manage" action** = full access to that feature
✅ **Use the guide** in permissions modal to understand features

---

**Your permission system is now complete and fully operational!** 🎉

**Try it now:**
1. Create a role with specific permissions
2. Create a user and assign that role
3. Click "Permissions" to verify
4. See exactly what they can do!

---

Need help? Check the inline guides in the Permissions modal!
