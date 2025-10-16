# Super Admin Cross-Tenant Access Implementation

## 🎯 Overview
Super Admin now has full cross-tenant access to view data from all companies in the system. This implements a secure, audited approach to multi-tenant data access.

---

## ✅ What's Implemented

### **1. Backend Changes**

#### **A. Core Files Modified:**
- `/app/backend/admin.py` - Enhanced admin endpoints with cross-tenant support
- `/app/backend/transactions.py` - Added company_id filter parameter for Super Admin
- `/app/backend/tenant_utils.py` - Created utility functions for tenant filtering

#### **B. New Functionality:**

**Super Admin Can Now:**
- ✅ View all users across all companies
- ✅ View all companies in the system
- ✅ View all transactions across all tenants
- ✅ Optionally filter by specific company_id
- ✅ Access all audit logs system-wide
- ✅ View system-wide statistics

**Regular Admins:**
- ✅ Can only see their own company data (tenant isolation maintained)
- ✅ Existing security boundaries preserved

---

## 📊 API Endpoints Enhanced

### **1. Users Endpoint**
```bash
GET /api/admin/users?company_id={optional}
```
**Behavior:**
- **Super Admin (no company_id):** Returns all users from all companies
- **Super Admin (with company_id):** Returns users from specific company
- **Regular Admin:** Returns only their company users (company_id ignored)

**Example:**
```bash
# Get all users (Super Admin only)
curl -X GET "http://localhost:8001/api/admin/users" \
  -H "Authorization: Bearer {super_admin_token}"

# Get users from specific company (Super Admin only)
curl -X GET "http://localhost:8001/api/admin/users?company_id=abc-123" \
  -H "Authorization: Bearer {super_admin_token}"
```

---

### **2. Companies Endpoint**
```bash
GET /api/admin/companies
```
**Behavior:**
- **Super Admin:** Returns all companies in system
- **Regular Admin:** 403 Forbidden

**Example:**
```bash
curl -X GET "http://localhost:8001/api/admin/companies" \
  -H "Authorization: Bearer {super_admin_token}"
```

**Response:**
```json
[
  {
    "id": "company-1",
    "name": "Global Enterprises Ltd.",
    "type": "small_business",
    "user_count": 15,
    "is_active": true,
    "created_at": "2025-01-15T10:00:00"
  },
  {
    "id": "company-2",
    "name": "Tech Startup Inc.",
    "type": "corporation",
    "user_count": 8,
    "is_active": true,
    "created_at": "2025-02-01T14:30:00"
  }
]
```

---

### **3. Transactions Endpoint**
```bash
GET /api/transactions?company_id={optional}
```
**Behavior:**
- **Super Admin (no company_id):** Returns all transactions from all companies
- **Super Admin (with company_id):** Returns transactions from specific company
- **Regular User:** Returns only their company transactions

**Example:**
```bash
# Get all transactions (Super Admin only)
curl -X GET "http://localhost:8001/api/transactions" \
  -H "Authorization: Bearer {super_admin_token}"

# Get transactions from specific company
curl -X GET "http://localhost:8001/api/transactions?company_id=abc-123" \
  -H "Authorization: Bearer {super_admin_token}"
```

---

### **4. Check Super Admin Status**
```bash
GET /api/admin/check-superadmin
```
**Behavior:**
Returns whether current user is a Super Admin

**Example:**
```bash
curl -X GET "http://localhost:8001/api/admin/check-superadmin" \
  -H "Authorization: Bearer {token}"
```

**Response:**
```json
{
  "is_superadmin": true,
  "user_id": "user-123",
  "email": "superadmin@afms.system",
  "company_id": "system-company",
  "cross_tenant_access": true
}
```

---

## 🔐 Security Features

### **1. Role-Based Access Control**
- ✅ Only users with `superadmin` role can access cross-tenant data
- ✅ Regular admins and users maintain strict tenant isolation
- ✅ Permission checks at every endpoint

### **2. Audit Logging**
All cross-tenant access is logged with special markers:
```
🔍 Super Admin user@example.com viewing transactions across ALL companies
🔍 Super Admin user@example.com viewing users from company: abc-123
```

### **3. Tenant Isolation Maintained**
- Regular users: Always filtered by their company_id
- Regular admins: Can only see their company data
- Super Admin: Can see all OR filter by specific company

---

## 🛠️ Utility Functions

### **tenant_utils.py**

#### **1. is_superadmin(user_id)**
```python
# Check if user is Super Admin
is_super = await is_superadmin(user_id)
```

#### **2. build_tenant_filter(current_user, is_superadmin, company_id_override)**
```python
# Build MongoDB filter based on role
filter = build_tenant_filter(current_user, True, None)
# Returns: {} (no filter - see all)

filter = build_tenant_filter(current_user, True, "company-123")
# Returns: {"company_id": "company-123"}

filter = build_tenant_filter(current_user, False, None)
# Returns: {"company_id": "user_company_id"}
```

#### **3. build_tenant_query(current_user, company_id_filter, additional_filters)**
```python
# Build complete query with tenant filtering
query = await build_tenant_query(
    current_user,
    company_id_filter="optional-company-id",
    additional_filters={"status": "active"}
)
```

---

## 📋 Migration Checklist

### **Endpoints to Update (Recommended)**

The following endpoints should be updated to support Super Admin cross-tenant access:

#### **High Priority:**
- [x] `/api/admin/users` - ✅ Completed
- [x] `/api/admin/companies` - ✅ Completed  
- [x] `/api/transactions` - ✅ Completed
- [ ] `/api/documents` - Add company_id parameter
- [ ] `/api/accounts` - Add company_id parameter
- [ ] `/api/reports/*` - Add company_id parameter

#### **Medium Priority:**
- [ ] `/api/invoices` - Add company_id parameter
- [ ] `/api/payments` - Add company_id parameter
- [ ] `/api/reconciliation` - Add company_id parameter
- [ ] `/api/banking/connections` - Add company_id parameter

#### **Low Priority:**
- [ ] `/api/admin/audit-logs` - Already has cross-tenant logic
- [ ] `/api/settings/*` - Company-specific settings

---

## 🎨 Frontend Integration

### **Step 1: Check if User is Super Admin**
```javascript
// In AuthContext or new hook
const [isSuperAdmin, setIsSuperAdmin] = useState(false);

useEffect(() => {
  const checkSuperAdmin = async () => {
    try {
      const response = await api.get('/admin/check-superadmin');
      setIsSuperAdmin(response.data.is_superadmin);
    } catch (error) {
      setIsSuperAdmin(false);
    }
  };
  
  if (user) {
    checkSuperAdmin();
  }
}, [user]);
```

### **Step 2: Add Company Selector (Super Admin Only)**
```javascript
// Component for Super Admin to select tenant
{isSuperAdmin && (
  <div className="mb-4">
    <label>View Data From:</label>
    <select 
      value={selectedCompanyId} 
      onChange={(e) => setSelectedCompanyId(e.target.value)}
    >
      <option value="">All Companies</option>
      {companies.map(company => (
        <option key={company.id} value={company.id}>
          {company.name}
        </option>
      ))}
    </select>
  </div>
)}
```

### **Step 3: Pass company_id in API Calls**
```javascript
// Fetch transactions with optional company filter
const fetchTransactions = async () => {
  const params = isSuperAdmin && selectedCompanyId 
    ? { company_id: selectedCompanyId }
    : {};
    
  const response = await api.get('/transactions', { params });
  setTransactions(response.data);
};
```

### **Step 4: Visual Indicator**
```javascript
// Show banner when Super Admin is viewing cross-tenant data
{isSuperAdmin && !selectedCompanyId && (
  <div className="bg-purple-100 border border-purple-300 p-3 rounded">
    🔍 Viewing data from ALL companies (Super Admin mode)
  </div>
)}

{isSuperAdmin && selectedCompanyId && (
  <div className="bg-blue-100 border border-blue-300 p-3 rounded">
    🔍 Viewing data from: {getCompanyName(selectedCompanyId)}
  </div>
)}
```

---

## 🧪 Testing

### **1. Create Super Admin User**
```bash
# Super Admin is auto-created during RBAC initialization
python3 /app/backend/init_rbac.py
```

**Credentials:**
```
Email: superadmin@afms.system
Password: admin123
```

### **2. Test Cross-Tenant Access**
```bash
# Login as Super Admin
TOKEN=$(curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@afms.system","password":"admin123"}' \
  | jq -r '.access_token')

# Check Super Admin status
curl -X GET http://localhost:8001/api/admin/check-superadmin \
  -H "Authorization: Bearer $TOKEN"

# View all companies
curl -X GET http://localhost:8001/api/admin/companies \
  -H "Authorization: Bearer $TOKEN"

# View all users
curl -X GET http://localhost:8001/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

# View all transactions
curl -X GET http://localhost:8001/api/transactions \
  -H "Authorization: Bearer $TOKEN"

# Filter by specific company
curl -X GET "http://localhost:8001/api/transactions?company_id=COMPANY_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### **3. Test Regular Admin (Should Fail)**
```bash
# Login as demo user (Manager role)
TOKEN=$(curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@testcompany.com","password":"testpassword123"}' \
  | jq -r '.access_token')

# Try to view all companies (should fail with 403)
curl -X GET http://localhost:8001/api/admin/companies \
  -H "Authorization: Bearer $TOKEN"
# Expected: {"detail":"Only Super Admin can view all companies"}
```

---

## 📈 Benefits

1. **✅ Complete Visibility:** Super Admin can monitor all tenant activity
2. **✅ Support & Debugging:** Easy access to any tenant's data for troubleshooting
3. **✅ Compliance & Auditing:** Cross-tenant reporting and compliance checks
4. **✅ System Management:** Manage users and settings across all tenants
5. **✅ Security Maintained:** Regular users remain isolated to their tenant
6. **✅ Audit Trail:** All cross-tenant access is logged

---

## ⚠️ Important Notes

### **Security Considerations:**
1. **Super Admin Account Security**
   - Use strong passwords
   - Enable 2FA (when implemented)
   - Limit number of Super Admin users
   - Regular audit of Super Admin actions

2. **Logging**
   - All cross-tenant access is logged with 🔍 emoji
   - Monitor audit logs for unusual Super Admin activity
   - Set up alerts for excessive cross-tenant queries

3. **Data Privacy**
   - Ensure Super Admin users sign confidentiality agreements
   - Regular training on data privacy regulations
   - Clear policies on when cross-tenant access is appropriate

### **Performance Considerations:**
1. **Pagination:** Always use limit/offset when querying cross-tenant data
2. **Indexes:** Ensure company_id is indexed on all collections
3. **Caching:** Consider caching company list for Super Admin selector

---

## 🔄 Future Enhancements

1. **Company Switcher UI:** Dropdown in navbar for Super Admin
2. **Cross-Tenant Dashboard:** System-wide metrics and KPIs
3. **Bulk Operations:** Manage settings across multiple tenants
4. **Data Export:** Export data from all tenants for analysis
5. **Impersonation:** Allow Super Admin to impersonate users in other tenants

---

## 📞 Support

### If Regular Admin Tries Cross-Tenant Access:
**Error:** 403 Forbidden - "Only Super Admin can view all companies"
**Solution:** User needs Super Admin role assignment

### If Super Admin Can't See Data:
1. Verify role assignment: `python3 /app/backend/assign_superadmin_roles.py`
2. Check audit logs for access attempts
3. Verify token is valid and not expired
4. Check backend logs: `/var/log/supervisor/backend.err.log`

---

**Status:** ✅ **IMPLEMENTED - Core functionality complete**  
**Date:** October 16, 2025  
**Version:** v1.0  
**Next Steps:** Frontend integration & additional endpoint updates
