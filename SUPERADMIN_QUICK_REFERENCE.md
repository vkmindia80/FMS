# 🔑 SUPERADMIN QUICK REFERENCE

## LOGIN CREDENTIALS

```
Email:    superadmin@afms.system
Password: admin123
```

⚠️ **Change password after first login!**

---

## ✅ STATUS CHECK

Backend logs show on startup:
```
INFO:server:✅ Superadmin role verified: [id]
INFO:server:🔑 Superadmin login: superadmin@afms.system / admin123
```

---

## 🔧 QUICK FIX

If login fails, run:
```bash
cd /app/backend && python fix_superadmin.py
sudo supervisorctl restart backend
```

---

## 🧪 TEST LOGIN

```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "superadmin@afms.system", "password": "admin123"}'
```

---

## 📋 VERIFY STATUS

```bash
cd /app/backend && python -c "
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

async def check():
    client = AsyncIOMotorClient(os.getenv('MONGO_URL'))
    db = client.afms_db
    
    role = await db.roles.find_one({'name': 'superadmin', 'is_system': True})
    user = await db.users.find_one({'email': 'superadmin@afms.system'})
    
    print(f'Role: {\"✅\" if role else \"❌\"}')
    print(f'User: {\"✅\" if user else \"❌\"}')
    print(f'Active: {\"✅\" if user and user.get(\"is_active\") else \"❌\"}')

asyncio.run(check())
"
```

---

## 🛡️ AUTOMATIC FIX

The system now:
- ✅ Checks superadmin on every startup
- ✅ Creates if missing
- ✅ Ensures user is active
- ✅ Assigns role automatically

**No manual intervention needed!**

---

## 📁 IMPORTANT FILES

- Fix Script: `/app/backend/fix_superadmin.py`
- Full Docs: `/app/SUPERADMIN_FIX_DOCUMENTATION.md`
- Backend: `/app/backend/server.py` (has auto-fix)

---

## 🔄 RESTART BACKEND

```bash
sudo supervisorctl restart backend
```

Check logs:
```bash
tail -f /var/log/supervisor/backend.err.log | grep -i superadmin
```
