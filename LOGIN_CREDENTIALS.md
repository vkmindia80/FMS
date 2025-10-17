# 🔐 Login Credentials

## Superadmin Account (Full System Access)

**Email:** `superadmin@afms.system`  
**Password:** `admin123`

### What can Superadmin do?
- ✅ Full access to all system features
- ✅ Create and manage Permission Templates
- ✅ Manage all roles and permissions
- ✅ View and manage all users
- ✅ Access Admin Panel at `/admin`
- ✅ Create custom roles with granular permissions
- ✅ Cross-company access (if applicable)

## Demo User Account (Business User)

**Email:** `john.doe@testcompany.com`  
**Password:** *(Check your demo data generation logs)*

### What can Demo User do?
- Basic business operations based on assigned role
- Limited access compared to superadmin

---

## 🚀 Quick Start Guide

### 1. Login as Superadmin
1. Go to: `http://localhost:3000/login`
2. Enter email: `superadmin@afms.system`
3. Enter password: `admin123`
4. Click "Sign In"

### 2. Access Admin Panel
Once logged in:
1. Click on "Administration" in the sidebar
2. OR navigate directly to: `http://localhost:3000/admin`

### 3. Create a Permission Template
1. In Admin Panel, go to "Roles" tab
2. Click "Create Permission Template" button
3. Fill in:
   - Name (e.g., "Finance Manager")
   - Description
   - Select "Admin Users" or "Non-Admin Users"
4. Toggle system permissions (Settings, Users, Roles, etc.)
5. Click matrix cells to set resource permissions
6. Click "Create Template"

### 4. View Existing Roles
- Navigate to Admin Panel → Roles tab
- You'll see 5 default roles:
  - Super Admin (46 permissions)
  - Administrator (44 permissions)
  - Manager (23 permissions)
  - User (10 permissions)
  - Auditor (10 permissions)

---

## 🛡️ Security Notes

⚠️ **IMPORTANT:** Change the superadmin password after first login!

To change password:
1. Login as superadmin
2. Go to Settings
3. Update password
4. Save changes

---

## 📋 Default System Roles

### Super Admin
- **Permissions:** All 46 permissions
- **Use Case:** System administrators, initial setup
- **Cannot be:** Modified or deleted

### Administrator
- **Permissions:** 44 permissions (all except some system-level)
- **Use Case:** Company owners, C-level executives
- **Cannot be:** Deleted (system role)

### Manager
- **Permissions:** 23 permissions (manage operations)
- **Use Case:** Department managers, team leads
- **Cannot be:** Deleted (system role)

### User
- **Permissions:** 10 permissions (basic access)
- **Use Case:** Regular employees, data entry staff
- **Cannot be:** Deleted (system role)

### Auditor
- **Permissions:** 10 permissions (read-only)
- **Use Case:** External auditors, compliance officers
- **Cannot be:** Deleted (system role)

---

## 🔧 Troubleshooting

### Can't login with superadmin credentials?
Run the RBAC initialization script:
```bash
cd /app/backend && python3 init_rbac.py
```

### Forgot superadmin password?
Reset by running the initialization script again (will recreate if doesn't exist)

### Permission Template page not loading?
1. Check if backend is running: `sudo supervisorctl status backend`
2. Check frontend: `sudo supervisorctl status frontend`
3. Restart if needed: `sudo supervisorctl restart all`

---

**Last Updated:** 2025-10-17  
**System Status:** ✅ Operational
