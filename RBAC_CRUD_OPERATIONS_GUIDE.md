# 🛡️ RBAC CRUD Operations Guide

Complete guide for Creating, Reading, Updating, and Deleting Roles and Permissions in the system.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Role Operations](#role-operations)
3. [Permission Operations](#permission-operations)
4. [API Endpoints](#api-endpoints)
5. [UI Walkthrough](#ui-walkthrough)
6. [Best Practices](#best-practices)

---

## Overview

### What is RBAC?
**Role-Based Access Control (RBAC)** allows you to manage user permissions by assigning them to roles. Users inherit all permissions from their assigned roles.

### System Architecture
- **Permissions**: Granular access rights (e.g., `transactions:view`, `users:create`)
- **Roles**: Collections of permissions (e.g., Manager, Auditor)
- **Users**: Assigned one or more roles

### Current System State
- **46 Permissions** across 15 resource types
- **5 Default System Roles** (cannot be deleted)
- **Unlimited Custom Roles** (can be created, edited, deleted)

---

## 🎭 Role Operations

### 1. CREATE Role

#### Method A: Permission Template (Recommended)
**Best for:** Creating roles with visual permission matrix

**Steps:**
1. Login as Superadmin or Admin
2. Navigate to **Admin Panel** → **Roles** tab
3. Click **"Create Permission Template"**
4. Fill in the form:
   ```
   Name: Finance Manager
   Description: Manages financial transactions and reports
   Applicable On: [Admin Users / Non-Admin Users]
   ```
5. Toggle **System Access** permissions (Settings, Users, etc.)
6. Click cells in the **Permission Matrix** to set resource permissions
7. Click **"Create Template"**

**Visual Features:**
- ✅ Green checkmark = Allowed
- ❌ Gray X = Not Allowed  
- ⭕ Gray circle = Not Applicable
- Toggle switches for system permissions

#### Method B: Quick Create
**Best for:** Simple role creation

**Steps:**
1. Navigate to **Admin Panel** → **Roles** tab
2. Click **"Quick Create"**
3. Fill in form:
   - Name
   - Description
   - Select permissions from list
4. Click **"Create Role"**

#### Via API
```bash
curl -X POST http://localhost:8001/api/rbac/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Finance Manager",
    "description": "Manages financial operations",
    "applicable_on": "admin_users",
    "permission_ids": ["perm-id-1", "perm-id-2"]
  }'
```

**Response:**
```json
{
  "id": "role-id",
  "name": "Finance Manager",
  "description": "Manages financial operations",
  "permissions": [...],
  "is_system": false,
  "user_count": 0,
  "applicable_on": "admin_users",
  "created_at": "2025-10-17T...",
  "updated_at": "2025-10-17T..."
}
```

---

### 2. READ Roles

#### View All Roles
**UI:**
1. Navigate to **Admin Panel**
2. Click **"Roles"** tab
3. View all roles in card format

**Each card shows:**
- Role name and description
- System/Custom badge
- Admin/Non-Admin badge (if applicable)
- Permission count
- User count
- Action buttons (Edit, Delete)

#### View Single Role
**UI:**
1. Click on any role card
2. Or click the shield icon (🛡️) to view in template format

**Via API:**
```bash
# List all roles
curl -X GET http://localhost:8001/api/rbac/roles \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get single role
curl -X GET http://localhost:8001/api/rbac/roles/{role_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. UPDATE Role

#### Method A: Permission Template Editor
**Steps:**
1. Navigate to **Admin Panel** → **Roles** tab
2. Find the role you want to edit
3. Click the **shield icon (🛡️)** on the role card
4. Modify:
   - Name and description
   - Applicable On setting
   - System access toggles
   - Permission matrix selections
5. Click **"Update Template"**

#### Method B: Quick Edit
**Steps:**
1. Navigate to **Admin Panel** → **Roles** tab
2. Click the **pencil icon** on the role card
3. Modify permissions in the modal
4. Click **"Update Role"**

#### Via API
```bash
curl -X PUT http://localhost:8001/api/rbac/roles/{role_id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Senior Finance Manager",
    "description": "Updated description",
    "applicable_on": "admin_users",
    "permission_ids": ["new-perm-id-1", "new-perm-id-2"]
  }'
```

#### What Can Be Updated?
- ✅ Role name
- ✅ Description
- ✅ Permission assignments
- ✅ Applicable On setting
- ❌ System role flag (protected)

---

### 4. DELETE Role

#### Via UI
**Steps:**
1. Navigate to **Admin Panel** → **Roles** tab
2. Find the custom role (non-system role)
3. Click the **trash icon (🗑️)**
4. Confirm deletion

**Restrictions:**
- ❌ Cannot delete system roles (Superadmin, Admin, Manager, User, Auditor)
- ❌ Cannot delete roles assigned to users
- ✅ Can delete custom roles with no users

#### Via API
```bash
curl -X DELETE http://localhost:8001/api/rbac/roles/{role_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (Success):**
```json
{
  "message": "Role deleted successfully"
}
```

**Response (Error - Role in use):**
```json
{
  "detail": "Cannot delete role. It is assigned to 5 user(s)"
}
```

---

## 🔑 Permission Operations

### 1. CREATE Permission

**Who can create:** Superadmin only

#### Via UI
Currently, permission creation is not available in the UI. Use the API or initialization script.

#### Via API
```bash
curl -X POST http://localhost:8001/api/rbac/permissions \
  -H "Authorization: Bearer SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "projects:view",
    "resource": "projects",
    "action": "view",
    "description": "View projects"
  }'
```

#### Via Script
Add to `/app/backend/init_rbac.py` in `DEFAULT_PERMISSIONS` array:
```python
{"name": "projects:view", "resource": "projects", "action": "view", "description": "View projects"},
{"name": "projects:create", "resource": "projects", "action": "create", "description": "Create projects"},
```

Then run:
```bash
cd /app/backend && python3 init_rbac.py
```

---

### 2. READ Permissions

#### View All Permissions
**UI:**
1. Navigate to **Admin Panel**
2. Click **"Permissions"** tab
3. Toggle between **Table View** and **Grid View**

**Table View shows:**
- Permission name
- Resource
- Action
- Description
- Type (System/Custom)

**Grid View shows:**
- Grouped by resource
- Permission cards with actions
- Visual badges

#### Via API
```bash
# List all permissions
curl -X GET http://localhost:8001/api/rbac/permissions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by resource
curl -X GET "http://localhost:8001/api/rbac/permissions?resource=transactions" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 3. UPDATE Permission

**Note:** Permission updates are not recommended as they affect all roles using them.

If needed, use the API:
```bash
curl -X PUT http://localhost:8001/api/rbac/permissions/{permission_id} \
  -H "Authorization: Bearer SUPERADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description"
  }'
```

---

### 4. DELETE Permission

**Warning:** Deleting a permission removes it from all roles!

#### Via API
```bash
curl -X DELETE http://localhost:8001/api/rbac/permissions/{permission_id} \
  -H "Authorization: Bearer SUPERADMIN_TOKEN"
```

**Recommendation:** Instead of deleting, consider:
- Creating new permissions
- Modifying role assignments
- Deactivating rather than deleting

---

## 🔌 API Endpoints Reference

### Roles
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/rbac/roles` | List all roles | Yes |
| GET | `/api/rbac/roles/{id}` | Get role details | Yes |
| POST | `/api/rbac/roles` | Create new role | Admin+ |
| PUT | `/api/rbac/roles/{id}` | Update role | Admin+ |
| DELETE | `/api/rbac/roles/{id}` | Delete role | Admin+ |

### Permissions
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/rbac/permissions` | List all permissions | Yes |
| GET | `/api/rbac/permissions/{id}` | Get permission details | Yes |
| POST | `/api/rbac/permissions` | Create permission | Superadmin |

### User Roles
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/rbac/users/{id}/roles` | Get user's roles | Admin+ |
| POST | `/api/rbac/users/{id}/roles` | Assign roles to user | Admin+ |
| GET | `/api/rbac/users/{id}/permissions` | Get user's permissions | Admin+ |

---

## 🎨 UI Walkthrough

### Admin Panel Layout

```
┌─────────────────────────────────────────────────────────┐
│  Admin Panel                      [Create Permission    │
│  Manage users, roles, and         Template]             │
│  permissions                                             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  [Users (2)] [Roles (5)] [Permissions (46)]             │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  🔍 Search roles...                                      │
└─────────────────────────────────────────────────────────┘
┌──────────────────┐  ┌──────────────────┐
│  🛡️ Super Admin  │  │  🛡️ Administrator│
│  [System]         │  │  [System]         │
│  46 permissions   │  │  44 permissions   │
│  [🛡️] [✏️] [🗑️]   │  │  [🛡️] [✏️] [🗑️]   │
└──────────────────┘  └──────────────────┘
```

### Permission Template Layout

```
┌─────────────────────────────────────────────────────────┐
│  ← Create Permission Template                            │
│  Define role-based access control with granular perms    │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Name: [_______________]  *Required                      │
│  Description: [_______________]                          │
│  Applicable On: ○ Non-Admin Users  ● Admin Users        │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Restrict Access                                         │
│  Settings     [ON]  Allowed                              │
│  Users        [OFF]                                      │
│  Roles        [ON]  Allowed                              │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Assign Permissions                                      │
│              View  Create  Edit  Delete  Export  Import  │
│  Transactions  ✅    ✅     ✅     ❌      ✅      ❌     │
│  Accounts      ✅    ❌     ❌     ❌      ⭕      ⭕     │
│  Reports       ✅    ✅     ⭕     ⭕      ✅      ⭕     │
└─────────────────────────────────────────────────────────┘
                           [Cancel] [Create Template]
```

---

## ✅ Best Practices

### 1. Role Design
- ✅ **Use descriptive names:** "Finance Manager" not "Role1"
- ✅ **Add clear descriptions:** Explain the role's purpose
- ✅ **Follow least privilege:** Grant minimum necessary permissions
- ✅ **Group by function:** Create roles based on job functions
- ❌ **Avoid too many roles:** Keep it manageable (5-15 roles)

### 2. Permission Management
- ✅ **Use existing permissions:** Before creating new ones
- ✅ **Follow naming convention:** `resource:action` format
- ✅ **Document custom permissions:** Explain their purpose
- ❌ **Don't delete system permissions:** They're used by default roles

### 3. Role Assignment
- ✅ **Assign multiple roles:** Users can have multiple roles
- ✅ **Review regularly:** Audit user role assignments quarterly
- ✅ **Remove inactive assignments:** Clean up when users change roles
- ❌ **Don't assign Superadmin casually:** Reserve for system admins

### 4. System Roles
- ✅ **Use as templates:** Clone and modify for custom roles
- ✅ **Understand their scope:** Know what each role can do
- ❌ **Don't try to modify:** They're protected for system integrity
- ❌ **Don't delete:** They can't be deleted anyway

### 5. Testing Changes
1. Create test role with limited permissions
2. Assign to test user account
3. Login as test user
4. Verify access is correct
5. Adjust permissions as needed
6. Deploy to production users

---

## 🔒 Security Considerations

### Protection Mechanisms
- ✅ **System roles protected:** Cannot be deleted
- ✅ **Permission validation:** Invalid permissions rejected
- ✅ **User assignment check:** Roles with users can't be deleted
- ✅ **Audit logging:** All changes logged
- ✅ **Company isolation:** Roles scoped to companies

### Access Control
- **Superadmin:** Full access to all operations
- **Administrator:** Can manage roles and users
- **Others:** Cannot modify RBAC settings

### Audit Trail
Every RBAC operation is logged with:
- User who performed the action
- Timestamp
- Action type (create/update/delete)
- Entity affected
- Changes made

---

## 🧪 Testing CRUD Operations

Run the comprehensive test script:
```bash
cd /app && python3 test_rbac_crud.py
```

This tests all operations:
- ✅ Create permission
- ✅ Read permission
- ✅ Create role
- ✅ Read role
- ✅ Update role
- ✅ Update role permissions
- ✅ List all roles
- ✅ Delete role
- ✅ Delete permission

---

## 📞 Support

### Common Issues

**Q: Can't create role - "Insufficient permissions"**
A: Only Admins and Superadmins can create roles. Check your user role.

**Q: Can't delete role - "Role is assigned to users"**
A: First remove the role from all users, then delete it.

**Q: Permission changes not taking effect**
A: Users need to log out and log back in for permission changes to apply.

**Q: System role shows "Cannot modify"**
A: System roles are protected and cannot be edited or deleted.

### Getting Help
- Review documentation: `/app/RBAC_DOCUMENTATION.md`
- Check implementation guide: `/app/PERMISSION_TEMPLATE_IMPLEMENTATION.md`
- View login credentials: `/app/LOGIN_CREDENTIALS.md`

---

**Version:** 1.0  
**Last Updated:** 2025-10-17  
**Status:** ✅ Production Ready
