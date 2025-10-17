# SUPERADMIN ACCESS - PERMANENT FIX DOCUMENTATION

## ✅ PERMANENT FIX APPLIED

The superadmin access issue has been permanently fixed with automatic initialization on every server startup.

---

## 🔑 DEFAULT SUPERADMIN CREDENTIALS

**Email:** `superadmin@afms.system`  
**Password:** `admin123`

⚠️ **IMPORTANT:** Change this password after first login for security!

---

## 🛡️ WHAT WAS FIXED

### 1. **Automatic RBAC Initialization on Startup**
   - The backend server now automatically verifies RBAC system on every startup
   - Creates superadmin role if missing
   - Ensures superadmin user exists and is active
   - Automatically assigns superadmin role to the user

### 2. **Startup Verification Log**
   When the backend starts, you'll see:
   ```
   INFO:server:🛡️  Ensuring RBAC system is initialized...
   INFO:server:✅ Superadmin role verified: [role-id]
   INFO:server:🔑 Superadmin login: superadmin@afms.system / admin123
   ```

### 3. **Manual Fix Script Available**
   Located at: `/app/backend/fix_superadmin.py`
   
   Run manually if needed:
   ```bash
   cd /app/backend && python fix_superadmin.py
   ```

---

## 📋 VERIFICATION STEPS

### Check if Superadmin Exists:
```bash
cd /app/backend && python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URL = os.getenv('MONGO_URL')

async def check():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.afms_db
    
    # Check superadmin role
    role = await db.roles.find_one({'name': 'superadmin', 'is_system': True})
    print(f'✅ Superadmin role exists: {role is not None}')
    
    # Check superadmin user
    user = await db.users.find_one({'email': 'superadmin@afms.system'})
    print(f'✅ Superadmin user exists: {user is not None}')
    if user:
        print(f'   Active: {user.get(\"is_active\", True)}')
    
    # Check role assignment
    if role and user:
        assignment = await db.user_roles.find_one({
            'user_id': user['_id'],
            'role_id': role['_id']
        })
        print(f'✅ Role assigned: {assignment is not None}')

asyncio.run(check())
"
```

### Test Login:
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@afms.system",
    "password": "admin123"
  }'
```

Expected response: Access token and user details

---

## 🔧 TROUBLESHOOTING

### If Login Still Fails:

1. **Run the fix script manually:**
   ```bash
   cd /app/backend && python fix_superadmin.py
   ```

2. **Restart the backend:**
   ```bash
   sudo supervisorctl restart backend
   ```

3. **Check backend logs:**
   ```bash
   tail -f /var/log/supervisor/backend.err.log | grep -i "superadmin\|rbac"
   ```

4. **Verify database connection:**
   ```bash
   cd /app/backend && python -c "
   from motor.motor_asyncio import AsyncIOMotorClient
   import os
   from dotenv import load_dotenv
   
   load_dotenv()
   MONGO_URL = os.getenv('MONGO_URL')
   print(f'MongoDB URL: {MONGO_URL}')
   
   import asyncio
   async def test():
       client = AsyncIOMotorClient(MONGO_URL)
       try:
           await client.server_info()
           print('✅ Database connection successful')
       except Exception as e:
           print(f'❌ Database connection failed: {e}')
   
   asyncio.run(test())
   "
   ```

### If You Need to Reset Superadmin Password:

```bash
cd /app/backend && python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from auth import get_password_hash

load_dotenv()
MONGO_URL = os.getenv('MONGO_URL')

async def reset_password():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.afms_db
    
    new_password = 'admin123'  # Change this to your desired password
    hashed = get_password_hash(new_password)
    
    result = await db.users.update_one(
        {'email': 'superadmin@afms.system'},
        {'\$set': {'password': hashed}}
    )
    
    if result.modified_count > 0:
        print(f'✅ Password reset successfully')
        print(f'   Email: superadmin@afms.system')
        print(f'   Password: {new_password}')
    else:
        print('❌ User not found')

asyncio.run(reset_password())
"
```

---

## 📁 FILES CREATED/MODIFIED

### New Files:
- `/app/backend/fix_superadmin.py` - Manual fix script
- `/app/backend/plans.py` - Plans management system
- `/app/SUPERADMIN_FIX_DOCUMENTATION.md` - This file

### Modified Files:
- `/app/backend/server.py` - Added `ensure_rbac_initialized()` function and startup hook
- `/app/backend/admin.py` - Enhanced with user CRUD operations
- `/app/frontend/src/services/rbac.js` - Added user and plan API calls

---

## 🚀 WHAT HAPPENS ON SERVER RESTART

Every time the backend restarts:

1. ✅ Validates security configuration (JWT, API keys)
2. ✅ Creates database indexes
3. ✅ **Verifies RBAC system and superadmin**
4. ✅ Initializes multi-currency support
5. ✅ Starts report scheduling

The superadmin verification happens automatically at step 3.

---

## 🔐 SECURITY NOTES

1. **Default Password:** The default password `admin123` is insecure
2. **Change Immediately:** After first login, go to Settings → Change Password
3. **System Company:** Superadmin is associated with a "System" company
4. **Full Access:** Superadmin has ALL permissions across ALL companies
5. **Cannot Be Deleted:** The superadmin role is protected and cannot be deleted

---

## ✨ ADDITIONAL FEATURES

### Assign Superadmin to Another User:

Use the fix script or run:
```bash
cd /app/backend && python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import uuid
from datetime import datetime

load_dotenv()
MONGO_URL = os.getenv('MONGO_URL')

async def assign_superadmin(email):
    client = AsyncIOMotorClient(MONGO_URL)
    db = client.afms_db
    
    user = await db.users.find_one({'email': email})
    if not user:
        print(f'❌ User {email} not found')
        return
    
    role = await db.roles.find_one({'name': 'superadmin', 'is_system': True})
    if not role:
        print('❌ Superadmin role not found')
        return
    
    # Check if already assigned
    existing = await db.user_roles.find_one({
        'user_id': user['_id'],
        'role_id': role['_id']
    })
    
    if existing:
        print(f'✅ User {email} already has superadmin role')
        return
    
    # Assign role
    await db.user_roles.insert_one({
        '_id': str(uuid.uuid4()),
        'user_id': user['_id'],
        'role_id': role['_id'],
        'company_id': user['company_id'],
        'assigned_at': datetime.utcnow(),
        'assigned_by': 'system'
    })
    
    print(f'✅ Assigned superadmin role to {email}')

# Change the email below to the user you want to promote
asyncio.run(assign_superadmin('your.email@example.com'))
"
```

---

## 📞 SUPPORT

If you encounter any issues:

1. Check this documentation
2. Run `/app/backend/fix_superadmin.py`
3. Check backend logs: `tail -f /var/log/supervisor/backend.err.log`
4. Verify database connection
5. Restart backend: `sudo supervisorctl restart backend`

---

**Last Updated:** December 2024  
**Status:** ✅ Permanently Fixed  
**Version:** 1.0.0
