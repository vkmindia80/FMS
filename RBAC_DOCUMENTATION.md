# RBAC System Documentation

## Overview

The Advanced Finance Management System (AFMS) now includes a complete Role-Based Access Control (RBAC) system that allows fine-grained permission management for users, roles, and UI elements.

## Features

### ✅ Implemented Features

1. **Permission Management**
   - 46 predefined system permissions
   - Organized by resource (dashboard, transactions, accounts, etc.)
   - Actions: view, create, edit, delete, export, import, approve, manage

2. **Role Management**
   - 5 default system roles: Superadmin, Admin, Manager, User, Auditor
   - Custom role creation with flexible permission assignment
   - Role editing and deletion (except system roles)
   - User count tracking per role

3. **User Management**
   - View all users in the company
   - Assign multiple roles to users
   - View user permissions (aggregated from roles)
   - First registered user automatically becomes superadmin

4. **Dynamic Menu Rendering**
   - Sidebar menu items automatically hide/show based on user permissions
   - Permission-based navigation
   - Responsive mobile and desktop layouts

5. **Permission-Based UI Elements**
   - PermissionGuard component for conditional rendering
   - useHasPermission, useHasAnyPermission, useHasAllPermissions hooks
   - Easy integration into existing components

## Default Roles & Permissions

### Superadmin
- **Description**: Full system access - cannot be modified or deleted
- **Permissions**: All 46 permissions
- **Use Case**: System administrators, first user

### Administrator
- **Description**: Company administrator with full access except system management
- **Permissions**: 44 permissions (all except some system-level operations)
- **Use Case**: Company owners, C-level executives

### Manager
- **Description**: Can manage transactions, reports, and view most data
- **Permissions**: 23 permissions (view, create, edit transactions, reports, etc.)
- **Use Case**: Department managers, team leads

### User
- **Description**: Basic user with limited permissions
- **Permissions**: 10 permissions (basic view and create)
- **Use Case**: Regular employees, data entry staff

### Auditor
- **Description**: Read-only access for auditing purposes
- **Permissions**: 10 permissions (view only)
- **Use Case**: External auditors, compliance officers

## API Endpoints

### Permissions
- `GET /api/rbac/permissions` - List all permissions
- `POST /api/rbac/permissions` - Create permission (superadmin only)

### Roles
- `GET /api/rbac/roles` - List all roles
- `GET /api/rbac/roles/{role_id}` - Get role details
- `POST /api/rbac/roles` - Create new role
- `PUT /api/rbac/roles/{role_id}` - Update role
- `DELETE /api/rbac/roles/{role_id}` - Delete role

### User Roles
- `GET /api/rbac/users/{user_id}/roles` - Get user's roles
- `GET /api/rbac/users/{user_id}/permissions` - Get user's permissions
- `POST /api/rbac/users/{user_id}/roles` - Assign roles to user

### Menus
- `GET /api/rbac/menus` - Get menu structure for current user

## Usage Guide

### 1. Admin Panel Access

Navigate to `/admin` to access the Admin Panel (requires `users:manage` or `roles:view` permission).

The Admin Panel has three tabs:
- **Users**: View users, manage their roles
- **Roles**: Create, edit, delete roles with permission assignment
- **Permissions**: View all available permissions grouped by resource

### 2. Using Permission Guards in Components

#### Basic Usage
```jsx
import PermissionGuard from '../components/common/PermissionGuard';

function MyComponent() {
  return (
    <PermissionGuard permission="transactions:create">
      <button>Create Transaction</button>
    </PermissionGuard>
  );
}
```

#### With Fallback
```jsx
<PermissionGuard 
  permission="transactions:delete"
  fallback={<div>You don't have permission to delete</div>}
>
  <button>Delete Transaction</button>
</PermissionGuard>
```

#### Multiple Permissions (ANY)
```jsx
<PermissionGuard 
  permission={['transactions:edit', 'transactions:create']}
  requireAll={false}
>
  <button>Edit or Create</button>
</PermissionGuard>
```

#### Multiple Permissions (ALL)
```jsx
<PermissionGuard 
  permission={['transactions:edit', 'transactions:delete']}
  requireAll={true}
>
  <button>Full Access Actions</button>
</PermissionGuard>
```

### 3. Using Permission Hooks

```jsx
import { useHasPermission, useHasAnyPermission } from '../components/common/PermissionGuard';

function MyComponent() {
  const canEdit = useHasPermission('transactions:edit');
  const canManage = useHasAnyPermission(['users:create', 'users:edit']);

  return (
    <div>
      {canEdit && <button>Edit</button>}
      {canManage && <button>Manage Users</button>}
    </div>
  );
}
```

### 4. Example: Permission-Based Table Actions

```jsx
<table>
  <tbody>
    <tr>
      <td>Transaction #1</td>
      <td>
        {/* Always visible */}
        <button><EyeIcon /></button>
        
        {/* Only for users with edit permission */}
        <PermissionGuard permission="transactions:edit">
          <button><PencilIcon /></button>
        </PermissionGuard>
        
        {/* Only for users with delete permission */}
        <PermissionGuard permission="transactions:delete">
          <button><TrashIcon /></button>
        </PermissionGuard>
      </td>
    </tr>
  </tbody>
</table>
```

### 5. Creating Custom Roles

1. Go to Admin Panel → Roles tab
2. Click "Create Role"
3. Enter role name and description
4. Select permissions from the list
5. Click "Create Role"

### 6. Assigning Roles to Users

1. Go to Admin Panel → Users tab
2. Find the user
3. Click "Manage Roles"
4. Select one or more roles
5. Click "Save Changes"

## Permission Naming Convention

Permissions follow the pattern: `resource:action`

Examples:
- `dashboard:view` - View dashboard
- `transactions:create` - Create transactions
- `transactions:edit` - Edit transactions
- `users:manage` - Manage users and their roles
- `roles:create` - Create new roles

## Available Permissions

### Dashboard
- `dashboard:view`

### Transactions
- `transactions:view`
- `transactions:create`
- `transactions:edit`
- `transactions:delete`
- `transactions:export`
- `transactions:import`

### Accounts
- `accounts:view`
- `accounts:create`
- `accounts:edit`
- `accounts:delete`

### Documents
- `documents:view`
- `documents:create`
- `documents:edit`
- `documents:delete`

### Reports
- `reports:view`
- `reports:create`
- `reports:export`

### Invoices
- `invoices:view`
- `invoices:create`
- `invoices:edit`
- `invoices:delete`

### Payments
- `payments:view`
- `payments:create`

### Bank Connections
- `bank_connections:view`
- `bank_connections:create`
- `bank_connections:manage`

### Reconciliation
- `reconciliation:view`
- `reconciliation:create`
- `reconciliation:approve`

### Users
- `users:view`
- `users:create`
- `users:edit`
- `users:delete`
- `users:manage`

### Roles
- `roles:view`
- `roles:create`
- `roles:edit`
- `roles:delete`

### Settings
- `settings:view`
- `settings:edit`

### Audit Logs
- `audit_logs:view`

### Integrations
- `integrations:view`
- `integrations:manage`

### Company
- `company:view`
- `company:edit`

## Security Features

1. **First User Auto-Superadmin**: The first registered user automatically receives the superadmin role for initial system setup.

2. **System Role Protection**: System roles (Superadmin, Admin, Manager, User, Auditor) cannot be deleted and can only be modified by superadmins.

3. **Permission Inheritance**: Users can have multiple roles, and their permissions are aggregated from all assigned roles.

4. **Dynamic Menu**: Navigation menu items automatically appear/disappear based on user permissions.

5. **API Protection**: All sensitive API endpoints check for appropriate permissions before allowing access.

## Best Practices

1. **Principle of Least Privilege**: Assign users only the permissions they need to perform their job.

2. **Use Roles, Not Individual Permissions**: Create roles that represent job functions and assign roles to users rather than individual permissions.

3. **Regular Audit**: Periodically review user roles and permissions to ensure they're still appropriate.

4. **Custom Roles for Special Cases**: Create custom roles for unique job functions that don't fit standard roles.

5. **Test Permission Changes**: After changing roles or permissions, test to ensure users can still access what they need.

## Troubleshooting

### User can't see expected menu items
- Check if user has the required permissions for that menu item
- Go to Admin Panel → Users → Select user → Manage Roles
- Verify assigned roles include the necessary permissions

### Permission changes not taking effect
- User may need to log out and log back in
- Permissions are cached in the AuthContext during login

### Can't delete a role
- System roles cannot be deleted
- Roles assigned to users cannot be deleted (unassign first)

### First user not getting superadmin
- Check backend logs for errors during registration
- RBAC initialization must be run first: `python /app/backend/init_rbac.py`

## Development Notes

### Adding New Permissions

1. Add permission to `/app/backend/init_rbac.py` in `DEFAULT_PERMISSIONS`
2. Run initialization script: `python /app/backend/init_rbac.py`
3. Update role permission assignments if needed

### Adding New Menu Items

1. Add menu item to `/app/backend/init_rbac.py` in `create_default_menus()`
2. Specify `required_permissions` array
3. Run initialization script
4. Add route in frontend App.js

### Frontend Integration

All frontend pages are wrapped with PermissionsProvider:
```jsx
<ThemeProvider>
  <AuthProvider>
    <PermissionsProvider>
      <AppContent />
    </PermissionsProvider>
  </AuthProvider>
</ThemeProvider>
```

This makes permission checking available throughout the app via hooks and components.

## Files Modified/Created

### Backend
- `/app/backend/rbac.py` - RBAC API endpoints (existing)
- `/app/backend/init_rbac.py` - Initialization script (existing)
- `/app/backend/auth.py` - Modified to auto-assign superadmin to first user
- `/app/backend/database.py` - RBAC collections (existing)

### Frontend
- `/app/frontend/src/contexts/PermissionsContext.js` - Permission state management (new)
- `/app/frontend/src/services/rbac.js` - RBAC API service layer (new)
- `/app/frontend/src/pages/admin/AdminPanelPage.js` - Admin panel UI (new)
- `/app/frontend/src/components/common/PermissionGuard.js` - Permission guard component (new)
- `/app/frontend/src/components/common/PermissionGuardExamples.js` - Usage examples (new)
- `/app/frontend/src/components/layout/Sidebar.js` - Modified for dynamic menus
- `/app/frontend/src/App.js` - Modified to include PermissionsProvider and admin route

## Support

For questions or issues:
1. Check this documentation first
2. Review the PermissionGuardExamples component for usage patterns
3. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
4. Check frontend console for errors

---

**Version**: 1.0.0  
**Last Updated**: 2025  
**Status**: Production Ready ✅
