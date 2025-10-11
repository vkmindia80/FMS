# Quick Reference Guide - AFMS Development

**Purpose:** Fast access to common information  
**Updated:** August 2025

---

## 📁 Key Documents

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `ROADMAP.md` | Project roadmap & progress | Planning, status updates |
| `SECURITY_AUDIT_REPORT.md` | Security vulnerabilities | Before prod, security review |
| `SECURITY_FIX_GUIDE.md` | Step-by-step security fixes | Implementing security fixes |
| `TESTING_STRATEGY.md` | Testing approach | Writing tests, CI/CD setup |
| `DEV_BEST_PRACTICES.md` | Coding standards | Daily development |
| `PROJECT_STATUS_SUMMARY.md` | Overall status | Status meetings, planning |
| `QUICK_REFERENCE.md` | This doc | Quick lookups |

---

## 🚨 Critical Security Issues

**⚠️ PRODUCTION BLOCKER - FIX IMMEDIATELY**

| # | Issue | Severity | Time | Status |
|---|-------|----------|------|--------|
| 1 | JWT Secret Not Validated | 🔴 CRITICAL | 2-4h | ❌ |
| 2 | No Token Revocation | 🔴 CRITICAL | 4-6h | ❌ |
| 3 | No Rate Limiting | 🟠 HIGH | 6-8h | ❌ |
| 4 | Weak Password Policy | 🟠 HIGH | 4-6h | ❌ |

**Total Time to Fix Critical + High:** 24-34 hours

---

## 🏗️ Project Structure

```
/app/
├── backend/                # FastAPI backend
│   ├── server.py          # Main application
│   ├── auth.py            # Authentication ⚠️ Security issues
│   ├── accounts.py        # Chart of accounts ✅
│   ├── transactions.py    # Transactions ✅
│   ├── documents.py       # Document upload ✅
│   ├── document_processor.py  # OCR + AI ✅
│   ├── reports.py         # Financial reports ✅
│   ├── admin.py           # Admin endpoints ✅
│   ├── database.py        # MongoDB connection
│   └── requirements.txt   # Dependencies
│
├── frontend/              # React frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   └── contexts/     # State management
│   └── package.json
│
├── tests/                 # Test directory (mostly empty ⚠️)
├── uploads/              # Document uploads
│
└── Documentation/         # New audit documents
    ├── ROADMAP.md
    ├── SECURITY_AUDIT_REPORT.md
    ├── SECURITY_FIX_GUIDE.md
    └── ... (more)
```

---

## 🔑 Environment Variables

### Backend (.env)

```bash
# Required
MONGO_URL=mongodb://localhost:27017/afms_db
JWT_SECRET_KEY=<MUST-BE-32+-CHARS>  # ⚠️ NOT VALIDATED
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# File Upload
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=50000000  # 50MB
ALLOWED_EXTENSIONS=pdf,csv,xlsx,xls,ofx,qfx,qif,jpg,jpeg,png,gif

# AI Integration
EMERGENT_LLM_KEY=<your-emergent-key>  # ⚠️ NOT VALIDATED

# Optional (for security fixes)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
```

### Frontend (.env)

```bash
REACT_APP_BACKEND_URL=http://localhost:8001
REACT_APP_NAME=Advanced Finance Management System
REACT_APP_VERSION=1.0.0
REACT_APP_UPLOAD_MAX_SIZE=50000000
REACT_APP_SUPPORTED_FORMATS=pdf,csv,xlsx,xls,ofx,qfx,qif,jpg,jpeg,png,gif
```

---

## 🚀 Running the Application

### Backend

```bash
cd /app/backend

# Install dependencies
pip install -r requirements.txt

# Start server
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Or with supervisor (production)
sudo supervisorctl restart backend
```

### Frontend

```bash
cd /app/frontend

# Install dependencies
yarn install

# Start development server
yarn start

# Or with supervisor (production)
sudo supervisorctl restart frontend
```

### All Services

```bash
# Restart everything
sudo supervisorctl restart all

# Check status
sudo supervisorctl status
```

---

## 🧪 Running Tests

### Backend Tests

```bash
cd /app/backend

# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::test_password_hash_creation -v
```

### Integration Tests

```bash
# Run existing integration test
python /app/backend_test.py
```

**Note:** Currently only 1 integration test file. Need 80%+ coverage.

---

## 📊 Database Operations

### MongoDB

```bash
# Connect to MongoDB
mongosh afms_db

# Show collections
show collections

# Count documents
db.users.countDocuments()
db.transactions.countDocuments()

# Find user
db.users.findOne({email: "john.doe@testcompany.com"})

# Clear test data
db.transactions.deleteMany({tags: "demo"})
db.documents.deleteMany({tags: "demo"})

# Create indexes (already in startup)
db.users.createIndex({email: 1}, {unique: true})
db.transactions.createIndex({company_id: 1, transaction_date: -1})
```

---

## 🔐 Common Commands

### Generate JWT Secret

```bash
# Generate secure secret (32+ chars)
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Or longer (64 chars)
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:8001/api/health

# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@testcompany.com","password":"testpassword123"}'

# Get current user (with token)
TOKEN="your-access-token-here"
curl http://localhost:8001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Create transaction
curl -X POST http://localhost:8001/api/transactions/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Test","amount":100,"transaction_type":"income","transaction_date":"2025-01-15"}'
```

### Check Logs

```bash
# Backend logs
tail -f /var/log/supervisor/backend.*.log

# All supervisor logs
tail -f /var/log/supervisor/*.log

# Search for errors
grep -i error /var/log/supervisor/backend.*.log
```

---

## 🐛 Common Issues & Fixes

### 1. Backend Won't Start

**Symptom:** `ModuleNotFoundError` or import errors

**Fix:**
```bash
cd /app/backend
pip install -r requirements.txt
supervisorctl restart backend
```

### 2. MongoDB Connection Failed

**Symptom:** "Connection refused" or "Unable to connect to MongoDB"

**Check:**
```bash
# Is MongoDB running?
sudo systemctl status mongodb

# Test connection
mongosh --eval "db.runCommand({ ping: 1 })"

# Check MONGO_URL in .env
cat /app/backend/.env | grep MONGO_URL
```

### 3. JWT Token Invalid

**Symptom:** 401 Unauthorized on protected endpoints

**Possible causes:**
- Token expired (30 minutes for access token)
- Wrong JWT_SECRET_KEY
- Token from different environment

**Fix:**
- Login again to get fresh token
- Check JWT_SECRET_KEY matches in .env
- Clear cookies/local storage

### 4. CORS Errors in Frontend

**Symptom:** "CORS policy: No 'Access-Control-Allow-Origin' header"

**Fix:**
- Ensure backend is running
- Check REACT_APP_BACKEND_URL in frontend/.env
- Verify CORS middleware in server.py

### 5. Document Upload Fails

**Symptom:** "File too large" or "File type not supported"

**Check:**
```bash
# Check upload directory exists
ls -la /app/uploads

# Check permissions
chmod 755 /app/uploads

# Check .env settings
cat /app/backend/.env | grep -E "MAX_FILE_SIZE|ALLOWED_EXTENSIONS"
```

---

## 📈 Performance Checks

### Check System Resources

```bash
# CPU usage
top -bn1 | grep "Cpu(s)"

# Memory usage
free -h

# Disk usage
df -h

# MongoDB stats
mongosh --eval "db.stats()"
```

### Check API Performance

```bash
# Time an API call
time curl http://localhost:8001/api/health

# Load test with ab (Apache Bench)
ab -n 1000 -c 10 http://localhost:8001/api/health
```

---

## 🔄 Git Workflow

### Common Git Commands

```bash
# Check status
git status

# Create feature branch
git checkout -b feature/token-revocation

# Stage changes
git add .

# Commit with message
git commit -m "feat(auth): add token revocation system"

# Push to remote
git push origin feature/token-revocation

# Pull latest changes
git pull origin main

# View recent commits
git log --oneline -10
```

### Commit Message Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, style, refactor, test, chore
Scope: auth, transactions, reports, etc.

Examples:
feat(auth): add token revocation
fix(transactions): prevent duplicate entries
docs(readme): update installation steps
test(accounts): add balance calculation tests
```

---

## 📝 Code Snippets

### Create New API Endpoint

```python
from fastapi import APIRouter, Depends, HTTPException
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter()

class MyRequest(BaseModel):
    field: str

@router.post("/my-endpoint")
async def my_endpoint(
    data: MyRequest,
    current_user: dict = Depends(get_current_user)
):
    """Your endpoint description"""
    
    # Your logic here
    
    return {"success": True}

# In server.py:
# from my_module import router as my_router
# app.include_router(my_router, prefix="/api/my", tags=["My Feature"])
```

### Add Database Query

```python
from database import my_collection

async def get_items(company_id: str):
    """Get items for company"""
    
    cursor = my_collection.find({
        "company_id": company_id,
        "is_active": True
    }).sort("created_at", -1).limit(50)
    
    items = await cursor.to_list(length=50)
    return items
```

### Add Unit Test

```python
import pytest

@pytest.mark.asyncio
class TestMyFeature:
    """Test my feature"""
    
    async def test_something(self):
        """Test something works"""
        result = await my_function()
        assert result is not None
        assert result.status == "success"
```

---

## 🎯 Priority Tasks

### This Week

- [ ] Fix JWT secret validation (2-4h)
- [ ] Implement token revocation (4-6h)
- [ ] Add rate limiting (6-8h)

### Next Week

- [ ] Write unit tests for auth.py (1 day)
- [ ] Write unit tests for accounting (1 day)
- [ ] Set up CI/CD pipeline (2 days)

### This Month

- [ ] Achieve 80% test coverage
- [ ] Complete all security fixes
- [ ] Docker configuration
- [ ] Performance optimization

---

## 📞 Getting Help

### Resources

- **ROADMAP.md** - Full project status
- **SECURITY_AUDIT_REPORT.md** - Security details
- **SECURITY_FIX_GUIDE.md** - Security implementation
- **DEV_BEST_PRACTICES.md** - Coding standards
- **API Docs** - http://localhost:8001/docs

### Common Questions

**Q: How do I add a new API endpoint?**
A: See "Code Snippets" section above, or check existing endpoints in `auth.py`, `transactions.py`, etc.

**Q: How do I test my changes?**
A: Write unit tests (see `TESTING_STRATEGY.md`) and run `pytest`

**Q: Production deployment?**
A: Not ready yet. Fix security issues first. See `PROJECT_STATUS_SUMMARY.md`

**Q: How to add new account type?**
A: Add to `AccountType` enum in `accounts.py`, update `get_account_category()`

**Q: Document processing not working?**
A: Check `EMERGENT_LLM_KEY` is set in `.env`. Check logs for errors.

---

## ⚙️ Configuration Reference

### User Roles

```python
INDIVIDUAL = "individual"    # Personal finance
BUSINESS = "business"        # Small business
CORPORATE = "corporate"      # Enterprise
AUDITOR = "auditor"         # Read-only
ADMIN = "admin"             # Full access
```

### Transaction Types

```python
INCOME = "income"           # Money in
EXPENSE = "expense"         # Money out
TRANSFER = "transfer"       # Between accounts
ADJUSTMENT = "adjustment"   # Corrections
```

### Transaction Status

```python
PENDING = "pending"         # Not yet processed
CLEARED = "cleared"         # Confirmed
RECONCILED = "reconciled"   # Matched with bank
VOID = "void"              # Cancelled
```

### Document Types

```python
RECEIPT = "receipt"
INVOICE = "invoice"
BANK_STATEMENT = "bank_statement"
CREDIT_CARD_STATEMENT = "credit_card_statement"
PAYROLL_STUB = "payroll_stub"
VENDOR_STATEMENT = "vendor_statement"
TAX_DOCUMENT = "tax_document"
OTHER = "other"
```

---

## 🎓 Learning Resources

### FastAPI

- Docs: https://fastapi.tiangolo.com/
- Async tutorial: https://fastapi.tiangolo.com/async/
- Testing: https://fastapi.tiangolo.com/tutorial/testing/

### MongoDB

- Docs: https://www.mongodb.com/docs/
- Motor (async): https://motor.readthedocs.io/
- Aggregation: https://www.mongodb.com/docs/manual/aggregation/

### Testing

- pytest: https://docs.pytest.org/
- pytest-asyncio: https://pytest-asyncio.readthedocs.io/
- Coverage: https://coverage.readthedocs.io/

---

**Last Updated:** August 2025  
**Version:** 1.0  
**For:** Development Team
