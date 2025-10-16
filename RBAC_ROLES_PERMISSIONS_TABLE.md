# RBAC System - Roles & Permissions Matrix

## Overview
This document provides a comprehensive view of all system roles and their associated permissions in the AFMS (Advanced Finance Management System).

---

## System Roles Summary

| Role | Permission Count | Access Level | Use Case |
|------|------------------|--------------|----------|
| **Super Admin** | 46 | Full System Access | System management, all operations |
| **Administrator** | 44 | Full Company Access | Company-level administration |
| **Manager** | 23 | Operational Management | Day-to-day operations, team management |
| **User** | 10 | Basic Access | Standard employee access |
| **Auditor** | 10 | Read-Only | Compliance and auditing |

---

## Detailed Permissions Matrix

### ✅ = Has Permission | ❌ = No Permission

| Resource | Action | Super Admin | Administrator | Manager | User | Auditor |
|----------|--------|:-----------:|:-------------:|:-------:|:----:|:-------:|
| **Dashboard** |
| | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Transactions** |
| | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| | create | ✅ | ✅ | ✅ | ✅ | ❌ |
| | edit | ✅ | ✅ | ✅ | ❌ | ❌ |
| | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| | export | ✅ | ✅ | ✅ | ❌ | ❌ |
| | import | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Accounts** |
| | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| | create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Documents** |
| | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| | create | ✅ | ✅ | ✅ | ✅ | ❌ |
| | edit | ✅ | ✅ | ✅ | ❌ | ❌ |
| | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reports** |
| | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| | create | ✅ | ✅ | ✅ | ❌ | ❌ |
| | export | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Invoices** |
| | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| | create | ✅ | ✅ | ✅ | ❌ | ❌ |
| | edit | ✅ | ✅ | ✅ | ❌ | ❌ |
| | delete | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Payments** |
| | view | ✅ | ✅ | ✅ | ✅ | ✅ |
| | create | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Bank Connections** |
| | view | ✅ | ✅ | ✅ | ❌ | ❌ |
| | create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | manage | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reconciliation** |
| | view | ✅ | ✅ | ✅ | ❌ | ❌ |
| | create | ✅ | ✅ | ✅ | ❌ | ❌ |
| | approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Users** |
| | view | ✅ | ✅ | ✅ | ❌ | ❌ |
| | create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| | delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| | manage | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Roles** |
| | view | ✅ | ✅ | ❌ | ❌ | ❌ |
| | create | ✅ | ✅ | ❌ | ❌ | ❌ |
| | edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| | delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Settings** |
| | view | ✅ | ✅ | ✅ | ✅ | ❌ |
| | edit | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Audit Logs** |
| | view | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Integrations** |
| | view | ✅ | ✅ | ❌ | ❌ | ❌ |
| | manage | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Company** |
| | view | ✅ | ✅ | ✅ | ❌ | ✅ |
| | edit | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## Role Descriptions

### 🔴 Super Admin
- **Permission Count:** 46 permissions
- **Description:** Full system access - cannot be modified or deleted
- **Use Cases:**
  - System initialization and configuration
  - Managing all companies and users
  - Creating/modifying system roles
  - Full CRUD on all resources
- **Restrictions:** Cannot be deleted or modified by anyone
- **Assignment:** Auto-assigned to first user, manually assigned thereafter

### 🟠 Administrator
- **Permission Count:** 44 permissions
- **Description:** Company administrator with full access except system management
- **Use Cases:**
  - Company-level management
  - User and role management within company
  - Full access to financial data
  - Cannot delete system roles
- **Restrictions:** Cannot manage superadmin role or delete users
- **Assignment:** Assigned by Super Admin or other Administrators

### 🟡 Manager (Demo Account Role)
- **Permission Count:** 23 permissions
- **Description:** Can manage transactions, reports, and view most data
- **Use Cases:**
  - Day-to-day operations
  - Transaction management
  - Report creation and export
  - Document processing
- **Restrictions:** Cannot delete transactions, manage users, or modify settings
- **Assignment:** Default role for demo accounts

### 🟢 User
- **Permission Count:** 10 permissions
- **Description:** Basic user with limited permissions
- **Use Cases:**
  - Standard employee access
  - Create and view transactions
  - Upload and view documents
  - View reports (read-only)
- **Restrictions:** Cannot edit or delete data, minimal access
- **Assignment:** Default role for regular employees

### 🔵 Auditor
- **Permission Count:** 10 permissions
- **Description:** Read-only access for auditing purposes
- **Use Cases:**
  - Compliance auditing
  - Financial review
  - Report export for analysis
  - Audit log monitoring
- **Restrictions:** Strictly read-only, no write access
- **Assignment:** Assigned to external auditors or compliance officers

---

## Permission Categories

### 📊 Operational Permissions (High Usage)
- Dashboard viewing
- Transaction management
- Document processing
- Report generation

### 💼 Financial Permissions
- Accounts management
- Invoices and payments
- Bank connections
- Reconciliation

### ⚙️ Administrative Permissions
- User management
- Role management
- Settings configuration
- Company information

### 🔍 Audit & Compliance
- Audit log viewing
- Read-only access
- Report exports

---

## Sidebar Navigation Mapping

Based on role permissions, the sidebar navigation items are filtered:

| Navigation Item | Required Permission | Visible To |
|-----------------|---------------------|------------|
| Dashboard | `dashboard:view` | All Roles |
| Transactions | `transactions:view` | All except need permission |
| Documents | `documents:view` | All Roles |
| Accounts | `accounts:view` | All Roles |
| Reconciliation | `reconciliation:view` | Super Admin, Admin, Manager |
| Reports | `reports:view` | All Roles |
| Currency | `settings:view` | Super Admin, Admin, Manager, User |
| Integration | `integrations:view` | Super Admin, Admin |
| Admin Panel | `users:manage` OR `roles:view` | Super Admin, Admin |
| Settings | `settings:view` | Super Admin, Admin, Manager, User |
| Help Center | None (always visible) | All Roles |

---

## API Endpoints & Required Permissions

### Authentication Endpoints (No Auth Required)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`

### Protected Endpoints Examples

| Endpoint | Method | Required Permission |
|----------|--------|---------------------|
| `/api/transactions` | GET | `transactions:view` |
| `/api/transactions` | POST | `transactions:create` |
| `/api/transactions/{id}` | PUT | `transactions:edit` |
| `/api/transactions/{id}` | DELETE | `transactions:delete` |
| `/api/reports/profit-loss` | GET | `reports:view` |
| `/api/reports/export` | POST | `reports:export` |
| `/api/admin/users` | GET | `users:view` |
| `/api/admin/users/{id}` | PUT | `users:edit` |
| `/api/rbac/roles` | POST | `roles:create` |

---

## Demo Account Configuration

**Current Demo Account:**
- Email: `john.doe@testcompany.com`
- Password: `testpassword123`
- **Role:** Manager (23 permissions)
- **Company:** Global Enterprises Ltd.

**Why Manager Role for Demo?**
1. Shows most features without admin complexity
2. Can create/edit transactions and documents
3. Access to reports and reconciliation
4. Demonstrates operational workflows
5. Cannot accidentally delete critical data

---

## Security Notes

### Protected Roles
- **System Roles** (`is_system: true`) cannot be deleted
- Super Admin role cannot be modified
- Only Super Admin can delete roles

### Permission Checks
- Frontend: `hasPermission()` and `hasAnyPermission()`
- Backend: `@Depends(require_permission("permission:action"))`
- Sidebar: Filtered based on user permissions

### Fallback Behavior
If user has NO permissions:
- Shows minimal navigation (Dashboard, Settings)
- Displays warning banner
- Prevents complete UI breakdown

---

## Quick Reference Commands

### Check User Roles
```bash
python3 /app/backend/assign_demo_roles.py
```

### Initialize RBAC System
```bash
python3 /app/backend/init_rbac.py
```

### Create Demo User with Roles
```bash
curl -X POST http://localhost:8001/api/auth/create-demo-user
```

### Get User Permissions
```bash
curl -X GET http://localhost:8001/api/rbac/users/{user_id}/permissions \
  -H "Authorization: Bearer {token}"
```

---

**Last Updated:** October 16, 2025  
**System Version:** AFMS v2.0  
**RBAC Version:** 1.0
