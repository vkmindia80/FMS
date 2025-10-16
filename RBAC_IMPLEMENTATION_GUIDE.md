# RBAC System Implementation Guide

## Overview

A comprehensive Role-Based Access Control (RBAC) system with Menu-Based Access Control has been implemented for the AFMS application.

## Features Implemented

### 1. **Permission Management**
- 46 default system permissions across all modules
- Granular permissions (view, create, edit, delete, manage, etc.)
- Organized by resources (dashboard, transactions, accounts, etc.)

### 2. **Role Management**
- 5 default system roles: Super Admin, Administrator, Manager, User, Auditor
- Support for custom role creation
- Dynamic permission assignment to roles
- Protected system roles cannot be deleted

### 3. **User Role Assignment**
- Assign multiple roles to users
- Aggregate permissions from all assigned roles
- View user permissions and roles

### 4. **Menu-Based Access Control**
- 11 default menus with permission requirements
- Dynamic menu rendering based on user permissions
- Hierarchical menu structure support

### 5. **Superadmin Account**
- Email: `superadmin@afms.system`
- Password: `admin123`
- Full system access
- Cannot be deleted or modified

## Database Collections

### `permissions`
Stores all system permissions
```json
{
  "_id": "uuid",
  "name": "transactions:view",
  "resource": "transactions",
  "action": "view",
  "description": "View transactions",
  "is_system": true,
  "company_id": null,
  "created_at": "datetime"
}
```

### `roles`
Stores roles with their permissions
```json
{
  "_id": "uuid",
  "name": "admin",
  "display_name": "Administrator",
  "description": "Company administrator",
  "permission_ids": ["perm1_id", "perm2_id"],
  "is_system": true,
  "company_id": "company_id",
  "created_at": "datetime"
}
```

### `user_roles`
Maps users to roles
```json
{
  "_id": "uuid",
  "user_id": "user_id",
  "role_id": "role_id",
  "company_id": "company_id",
  "assigned_at": "datetime"
}
```

### `menus`
Defines menu structure with permissions
```json
{
  "_id": "uuid",
  "name": "transactions",
  "label": "Transactions",
  "icon": "receipt",
  "path": "/transactions",
  "parent_id": null,
  "order": 2,
  "required_permissions": ["transactions:view"],
  "is_active": true
}
```

## API Endpoints

### Authentication
```
POST /api/auth/login
Body: {"email": "superadmin@afms.system", "password": "admin123"}
```

### Permissions
```
GET    /api/rbac/permissions          # List all permissions
POST   /api/rbac/permissions          # Create permission (superadmin only)
GET    /api/rbac/permissions?resource=transactions  # Filter by resource
```

### Roles
```
GET    /api/rbac/roles                # List all roles
POST   /api/rbac/roles                # Create role
GET    /api/rbac/roles/{id}           # Get role details
PUT    /api/rbac/roles/{id}           # Update role
DELETE /api/rbac/roles/{id}           # Delete role
```

### User Role Assignment
```
POST   /api/rbac/users/{user_id}/roles         # Assign roles to user
GET    /api/rbac/users/{user_id}/roles         # Get user's roles
GET    /api/rbac/users/{user_id}/permissions   # Get user's permissions
```

### Menus
```
GET    /api/rbac/menus                # Get accessible menus for current user
POST   /api/rbac/menus                # Create menu (superadmin only)
```

## Default Permissions

### Dashboard
- `dashboard:view` - View dashboard

### Transactions
- `transactions:view` - View transactions
- `transactions:create` - Create transactions
- `transactions:edit` - Edit transactions
- `transactions:delete` - Delete transactions
- `transactions:export` - Export transactions
- `transactions:import` - Import transactions

### Accounts
- `accounts:view` - View chart of accounts
- `accounts:create` - Create accounts
- `accounts:edit` - Edit accounts
- `accounts:delete` - Delete accounts

### Documents
- `documents:view` - View documents
- `documents:create` - Upload documents
- `documents:edit` - Edit documents
- `documents:delete` - Delete documents

### Reports
- `reports:view` - View reports
- `reports:create` - Create reports
- `reports:export` - Export reports

### Invoices
- `invoices:view` - View invoices
- `invoices:create` - Create invoices
- `invoices:edit` - Edit invoices
- `invoices:delete` - Delete invoices

### Payments
- `payments:view` - View payments
- `payments:create` - Process payments

### Bank Connections
- `bank_connections:view` - View bank connections
- `bank_connections:create` - Connect banks
- `bank_connections:manage` - Manage bank connections

### Reconciliation
- `reconciliation:view` - View reconciliations
- `reconciliation:create` - Create reconciliations
- `reconciliation:approve` - Approve reconciliations

### Users
- `users:view` - View users
- `users:create` - Create users
- `users:edit` - Edit users
- `users:delete` - Delete users
- `users:manage` - Manage user roles

### Roles
- `roles:view` - View roles
- `roles:create` - Create roles
- `roles:edit` - Edit roles
- `roles:delete` - Delete roles

### Settings
- `settings:view` - View settings
- `settings:edit` - Edit settings

### Audit Logs
- `audit_logs:view` - View audit logs

### Integrations
- `integrations:view` - View integrations
- `integrations:manage` - Manage integrations

### Company
- `company:view` - View company info
- `company:edit` - Edit company info

## Default Roles

### 1. Super Admin (46 permissions)
- Full system access
- All permissions
- Cannot be deleted or modified
- Superadmin user has this role

### 2. Administrator (44 permissions)
- Company administrator
- Cannot delete roles or users
- Full access to all modules except system management

### 3. Manager (23 permissions)
- Can manage transactions, reports, and view most data
- Cannot manage users or roles
- Can create/edit transactions, invoices, documents

### 4. User (10 permissions)
- Basic user with limited permissions
- Can view most data
- Can create transactions and documents
- Cannot delete or manage system

### 5. Auditor (10 permissions)
- Read-only access for auditing
- Can view all data
- Can export reports
- Cannot create, edit, or delete

## Default Menus

1. **Dashboard** (`/dashboard`) - Requires `dashboard:view`
2. **Transactions** (`/transactions`) - Requires `transactions:view`
3. **Chart of Accounts** (`/accounts`) - Requires `accounts:view`
4. **Documents** (`/documents`) - Requires `documents:view`
5. **Reports** (`/reports`) - Requires `reports:view`
6. **Invoices** (`/invoices`) - Requires `invoices:view`
7. **Payments** (`/payments`) - Requires `payments:view`
8. **Banking** (`/banking`) - Requires `bank_connections:view`
9. **Reconciliation** (`/reconciliation`) - Requires `reconciliation:view`
10. **Settings** (`/settings`) - Requires `settings:view`
11. **Administration** (`/admin`) - Requires `users:manage` OR `roles:view`

## Usage Examples

### Login as Superadmin
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@afms.system",
    "password": "admin123"
  }'
```

### Create a Custom Role
```bash
curl -X POST http://localhost:8001/api/rbac/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Accountant",
    "description": "Handles accounting tasks",
    "permission_ids": [
      "permission_id_1",
      "permission_id_2"
    ],
    "is_system": false
  }'
```

### Assign Roles to User
```bash
curl -X POST http://localhost:8001/api/rbac/users/USER_ID/roles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "USER_ID",
    "role_ids": ["role_id_1", "role_id_2"]
  }'
```

### Get User's Menus
```bash
curl -X GET http://localhost:8001/api/rbac/menus \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Helper Functions

### Check if User Has Permission
```python
from rbac import has_permission

if await has_permission(user_id, "transactions:create"):
    # User can create transactions
    pass
```

### Check if User is Superadmin
```python
from rbac import is_superadmin

if await is_superadmin(user_id):
    # User is superadmin
    pass
```

### Require Permission Decorator
```python
from rbac import require_permission
from fastapi import Depends

@app.get("/api/transactions")
async def list_transactions(
    current_user: dict = Depends(require_permission("transactions:view"))
):
    # Only users with transactions:view permission can access
    pass
```

## Initialization

The RBAC system is initialized automatically by running:
```bash
cd /app/backend
python init_rbac.py
```

This creates:
- 46 default permissions
- 5 default roles
- 11 default menus
- Superadmin user account
- System company

## Security Features

1. **System Roles Protection** - System roles (superadmin, admin, etc.) cannot be deleted
2. **Permission Aggregation** - Users get all permissions from all assigned roles
3. **Superadmin Bypass** - Superadmin has access to everything
4. **Company Isolation** - Roles are scoped to companies (except system roles)
5. **Audit Logging** - All RBAC operations are logged
6. **Token-Based Auth** - All endpoints require valid JWT token

## Frontend Integration

### Checking Permissions
```javascript
// Get user's permissions
const response = await fetch('/api/rbac/users/me/permissions', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const permissions = await response.json();

// Check if user has permission
const hasPermission = permissions.some(p => p.name === 'transactions:create');
```

### Getting Menus
```javascript
// Get menus based on user permissions
const response = await fetch('/api/rbac/menus', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const menus = await response.json();

// Render menus dynamically
menus.forEach(menu => {
  // Render menu item
});
```

## Multi-Tenancy

- System roles (with `company_id: null`) are shared across all companies
- Custom roles are scoped to specific companies
- Users can only see and manage roles within their company
- Superadmin can see all roles across all companies

## Best Practices

1. **Use System Roles** - For most users, assign system roles (Admin, Manager, User)
2. **Create Custom Roles** - For specific needs, create custom roles with specific permissions
3. **Assign Multiple Roles** - Users can have multiple roles for maximum flexibility
4. **Check Permissions** - Always check permissions before showing UI elements
5. **Audit Regularly** - Review audit logs for unauthorized access attempts
6. **Change Superadmin Password** - Change the default password immediately after setup

## Troubleshooting

### User Cannot Access Endpoint
1. Check if user has required permission
2. Check if user's roles include the permission
3. Check if endpoint requires the permission
4. Check JWT token is valid

### Role Cannot Be Deleted
1. Check if role is a system role
2. Check if role is assigned to any users
3. Check if user has `roles:delete` permission

### Menu Not Showing
1. Check if user has required permissions for the menu
2. Check if menu is active (`is_active: true`)
3. Check if menu path is correct

## Files Created

1. `/app/backend/rbac.py` - Main RBAC module with all endpoints
2. `/app/backend/init_rbac.py` - Initialization script
3. `/app/backend/database.py` - Updated with RBAC collections
4. `/app/backend/server.py` - Updated with RBAC router
5. `/app/RBAC_IMPLEMENTATION_GUIDE.md` - This documentation

## Next Steps

1. ✅ Backend RBAC system implemented
2. ⏳ Frontend admin UI (recommended next step)
3. ⏳ Role management interface
4. ⏳ User management with role assignment
5. ⏳ Dynamic menu rendering based on permissions

---

**Version:** 1.0  
**Date:** October 2025  
**Author:** E1 Advanced Code Analysis System
