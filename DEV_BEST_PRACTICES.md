# Development Best Practices - AFMS

**Purpose:** Maintain code quality, security, and consistency  
**Audience:** All developers contributing to AFMS  
**Last Updated:** August 2025

---

## 🔒 Security First

### 1. Never Hardcode Secrets

**❌ BAD:**
```python
JWT_SECRET = "my-secret-key"
API_KEY = "sk-1234567890"
DATABASE_URL = "mongodb://admin:password@localhost"
```

**✅ GOOD:**
```python
import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET_KEY")
API_KEY = os.getenv("API_KEY")
DATABASE_URL = os.getenv("MONGO_URL")

# Validate on startup
if not JWT_SECRET or len(JWT_SECRET) < 32:
    raise ValueError("JWT_SECRET_KEY must be set and secure")
```

### 2. Input Validation Always

**❌ BAD:**
```python
@app.post("/api/users/{user_id}")
async def update_user(user_id: str, data: dict):
    # Direct database query with user input
    await users.update_one({"_id": user_id}, {"$set": data})
```

**✅ GOOD:**
```python
from pydantic import BaseModel, validator

class UserUpdate(BaseModel):
    full_name: str
    email: EmailStr
    
    @validator('full_name')
    def validate_name(cls, v):
        if len(v) < 2:
            raise ValueError("Name too short")
        return v.strip()

@app.post("/api/users/{user_id}")
async def update_user(
    user_id: str,
    data: UserUpdate,  # Validated input
    current_user: dict = Depends(get_current_user)
):
    # Check authorization
    if user_id != current_user["_id"] and not is_admin(current_user):
        raise HTTPException(403, "Not authorized")
    
    # Safe update
    await users.update_one(
        {"_id": user_id},
        {"$set": data.dict(exclude_unset=True)}
    )
```

### 3. Rate Limiting

**✅ ALWAYS Add Rate Limits:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/auth/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(request: Request, credentials: UserLogin):
    pass

@app.post("/api/documents/upload")
@limiter.limit("10/minute")  # 10 uploads per minute
async def upload_document(request: Request, ...):
    pass
```

### 4. Secure Error Messages

**❌ BAD:**
```python
except Exception as e:
    return {"error": str(e)}  # May leak sensitive info
```

**✅ GOOD:**
```python
import logging

logger = logging.getLogger(__name__)

try:
    # ... operation
except SpecificException as e:
    logger.error(f"Operation failed: {e}", exc_info=True)
    raise HTTPException(
        status_code=500,
        detail="Operation failed. Please try again."  # Generic message
    )
```

---

## 📝 Code Quality

### 1. Type Hints Everywhere

**❌ BAD:**
```python
def calculate_balance(account_id, company_id):
    # What types? What returns?
    pass
```

**✅ GOOD:**
```python
from decimal import Decimal
from typing import Optional

async def calculate_balance(
    account_id: str,
    company_id: str
) -> Decimal:
    """
    Calculate account balance from journal entries.
    
    Args:
        account_id: UUID of the account
        company_id: UUID of the company (for isolation)
    
    Returns:
        Current balance as Decimal
    
    Raises:
        HTTPException: If account not found
    """
    pass
```

### 2. Use Pydantic Models

**❌ BAD:**
```python
@app.post("/api/transactions/")
async def create_transaction(data: dict):
    # No validation!
    amount = data["amount"]  # What if missing?
    pass
```

**✅ GOOD:**
```python
from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import date

class TransactionCreate(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    transaction_date: date
    category: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "description": "Office supplies",
                "amount": 150.50,
                "transaction_date": "2025-01-15",
                "category": "office_supplies"
            }
        }

@app.post("/api/transactions/")
async def create_transaction(data: TransactionCreate):
    # data is validated!
    pass
```

### 3. Async/Await Correctly

**❌ BAD:**
```python
# Blocking operations in async function
async def process_document(file_path: str):
    # Blocks event loop!
    with open(file_path, 'r') as f:
        content = f.read()
```

**✅ GOOD:**
```python
import aiofiles

async def process_document(file_path: str):
    # Non-blocking
    async with aiofiles.open(file_path, 'r') as f:
        content = await f.read()
```

### 4. Proper Exception Handling

**❌ BAD:**
```python
try:
    result = await some_operation()
except:  # Catches everything!
    pass  # Silent failure!
```

**✅ GOOD:**
```python
try:
    result = await some_operation()
except ValidationError as e:
    logger.warning(f"Validation failed: {e}")
    raise HTTPException(400, f"Invalid data: {e}")
except DatabaseError as e:
    logger.error(f"Database error: {e}", exc_info=True)
    raise HTTPException(500, "Database operation failed")
except Exception as e:
    logger.critical(f"Unexpected error: {e}", exc_info=True)
    # Re-raise or handle appropriately
    raise
```

---

## 🗄️ Database Best Practices

### 1. Always Use Company ID Filter

**❌ BAD:**
```python
# Missing multi-tenant isolation!
transactions = await transactions_collection.find({
    "status": "pending"
}).to_list(100)
```

**✅ GOOD:**
```python
# Proper multi-tenant isolation
transactions = await transactions_collection.find({
    "company_id": current_user["company_id"],  # Always filter by company
    "status": "pending"
}).to_list(100)
```

### 2. Use Indexes

**✅ Create Indexes:**
```python
@app.on_event("startup")
async def create_indexes():
    # Composite indexes for common queries
    await transactions_collection.create_index([
        ("company_id", 1),
        ("transaction_date", -1)
    ])
    
    await documents_collection.create_index([
        ("company_id", 1),
        ("processing_status", 1),
        ("created_at", -1)
    ])
```

### 3. Pagination for Large Results

**❌ BAD:**
```python
# Could return millions of records!
transactions = await transactions_collection.find({
    "company_id": company_id
}).to_list(length=None)
```

**✅ GOOD:**
```python
@app.get("/api/transactions/")
async def list_transactions(
    limit: int = Query(50, le=1000),  # Max 1000
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    cursor = transactions_collection.find({
        "company_id": current_user["company_id"]
    }).sort("transaction_date", -1).skip(offset).limit(limit)
    
    transactions = await cursor.to_list(length=limit)
    total = await transactions_collection.count_documents({
        "company_id": current_user["company_id"]
    })
    
    return {
        "data": transactions,
        "total": total,
        "limit": limit,
        "offset": offset
    }
```

### 4. Use Aggregation Pipelines

**✅ For Complex Queries:**
```python
# Calculate monthly revenue
pipeline = [
    {
        "$match": {
            "company_id": company_id,
            "transaction_type": "income",
            "status": {"$ne": "void"}
        }
    },
    {
        "$group": {
            "_id": {
                "year": {"$year": "$transaction_date"},
                "month": {"$month": "$transaction_date"}
            },
            "total_revenue": {"$sum": "$amount"},
            "transaction_count": {"$sum": 1}
        }
    },
    {
        "$sort": {"_id.year": -1, "_id.month": -1}
    }
]

results = await transactions_collection.aggregate(pipeline).to_list(12)
```

---

## 🧪 Testing Practices

### 1. Write Tests for New Features

**REQUIRED:**
```python
# Every new endpoint needs tests

# Feature: New transaction type
def test_create_transfer_transaction():
    """Test transfer transaction creation"""
    response = client.post("/api/transactions/", json={
        "transaction_type": "transfer",
        "amount": 100.00,
        "from_account_id": "account-1",
        "to_account_id": "account-2"
    })
    
    assert response.status_code == 200
    
    # Verify both accounts updated
    assert check_account_balance("account-1") == -100.00
    assert check_account_balance("account-2") == 100.00
```

### 2. Test Error Cases

**✅ Test Failures Too:**
```python
def test_create_transaction_insufficient_funds():
    """Test transaction fails with insufficient funds"""
    with pytest.raises(HTTPException) as exc:
        create_transaction({
            "amount": 10000,  # More than available
            "from_account_id": "account-with-100"
        })
    
    assert exc.value.status_code == 400
    assert "insufficient funds" in str(exc.value.detail).lower()
```

### 3. Use Fixtures

**✅ Reusable Test Data:**
```python
@pytest.fixture
async def test_account(test_db, test_company):
    """Create test account"""
    account = await accounts_collection.insert_one({
        "_id": str(uuid.uuid4()),
        "company_id": test_company["id"],
        "name": "Test Cash Account",
        "account_type": "cash",
        "balance": Decimal("1000.00")
    })
    
    yield account
    
    # Cleanup
    await accounts_collection.delete_one({"_id": account.inserted_id})
```

---

## 📊 Logging Best Practices

### 1. Use Structured Logging

**✅ GOOD:**
```python
import logging

logger = logging.getLogger(__name__)

# Use appropriate levels
logger.debug("Detailed debug info")
logger.info("Transaction created", extra={
    "transaction_id": txn_id,
    "amount": amount,
    "user_id": user_id
})
logger.warning("Low confidence score", extra={
    "confidence": 0.45,
    "document_id": doc_id
})
logger.error("Processing failed", extra={
    "error": str(e),
    "document_id": doc_id
}, exc_info=True)
```

### 2. Don't Log Sensitive Data

**❌ BAD:**
```python
logger.info(f"User logged in: {user.email} with password {password}")
logger.debug(f"JWT token: {token}")
```

**✅ GOOD:**
```python
logger.info(f"User logged in", extra={
    "user_id": user.id,  # ID, not email
    "company_id": user.company_id
})
logger.debug(f"Token generated for user {user.id}")  # Don't log token
```

---

## 🔄 Git Workflow

### 1. Commit Messages

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples:**
```
feat(auth): add token revocation system

Implements Redis-based token blacklist for JWT revocation.
Adds new /auth/revoke-all-tokens endpoint.

Closes #123
```

```
fix(transactions): prevent duplicate journal entries

Fixed bug where rapid submissions created duplicate entries.
Added transaction locking mechanism.

Fixes #456
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

### 2. Branch Naming

```
feature/token-revocation
bugfix/transaction-duplicate
hotfix/security-vulnerability
refactor/cleanup-auth-module
```

### 3. Pull Request Template

```markdown
## Description
What does this PR do?

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manually tested

## Security
- [ ] No new security vulnerabilities
- [ ] Secrets not hardcoded
- [ ] Input validation added

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No warnings in tests
```

---

## 📚 Documentation

### 1. Code Comments

**When to Comment:**
```python
# DON'T comment obvious code
x = x + 1  # Add 1 to x  ❌

# DO comment WHY
x = x + 1  # Skip header row in CSV  ✅

# DO comment complex logic
# Calculate weighted average confidence using:
# - OCR quality (30%)
# - AI extraction completeness (40%)  
# - Field validation success (30%)
confidence = (ocr_quality * 0.3) + (ai_complete * 0.4) + (validation * 0.3)
```

### 2. Docstrings

**✅ Every Function:**
```python
async def calculate_account_balance(
    account_id: str,
    company_id: str,
    as_of_date: Optional[datetime] = None
) -> Decimal:
    """
    Calculate account balance from journal entries using double-entry rules.
    
    Aggregates all journal entries for the account, applying the following rules:
    - Assets/Expenses: Balance = Debits - Credits
    - Liabilities/Equity/Income: Balance = Credits - Debits
    
    Args:
        account_id: UUID of the account to calculate
        company_id: Company UUID for multi-tenant isolation
        as_of_date: Calculate balance as of this date (None = current)
    
    Returns:
        Current balance as Decimal (2 decimal places)
    
    Raises:
        HTTPException: 404 if account not found
        HTTPException: 500 if calculation fails
    
    Example:
        >>> balance = await calculate_account_balance("acc-123", "comp-456")
        >>> print(balance)
        Decimal('1234.56')
    """
    pass
```

---

## 🚀 Performance Tips

### 1. Use Bulk Operations

**❌ SLOW:**
```python
for transaction in transactions:
    await transactions_collection.insert_one(transaction)  # N queries!
```

**✅ FAST:**
```python
await transactions_collection.insert_many(transactions)  # 1 query!
```

### 2. Select Only Needed Fields

**❌ SLOW:**
```python
users = await users_collection.find({}).to_list(1000)  # All fields!
```

**✅ FAST:**
```python
users = await users_collection.find(
    {},
    {"email": 1, "full_name": 1, "_id": 1}  # Only needed fields
).to_list(1000)
```

### 3. Cache Expensive Operations

**✅ Use Redis:**
```python
import redis
cache = redis.Redis()

async def get_dashboard_summary(company_id: str):
    # Check cache first
    cached = cache.get(f"dashboard:{company_id}")
    if cached:
        return json.loads(cached)
    
    # Calculate if not cached
    summary = await calculate_summary(company_id)
    
    # Cache for 5 minutes
    cache.setex(
        f"dashboard:{company_id}",
        300,
        json.dumps(summary)
    )
    
    return summary
```

---

## 🐛 Debugging

### 1. Use Debugger

```python
# Add breakpoint
import pdb; pdb.set_trace()

# Or in async code
import asyncio
await asyncio.sleep(0)  # Allows debugger to catch up
```

### 2. Request ID Tracking

```python
import uuid
from fastapi import Request

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    logger.info(f"Request started", extra={"request_id": request_id})
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    return response
```

---

## ✅ Pre-Commit Checklist

Before committing code:

- [ ] Code follows style guide (black, isort, flake8)
- [ ] All tests pass locally
- [ ] No hardcoded secrets
- [ ] Input validation added
- [ ] Error handling added
- [ ] Logging added for important operations
- [ ] Documentation updated
- [ ] Security implications considered
- [ ] Performance impact assessed
- [ ] Multi-tenant isolation maintained

---

## 🎯 Code Review Checklist

When reviewing PRs:

**Security:**
- [ ] No secrets in code
- [ ] Input validated
- [ ] Authorization checked
- [ ] Rate limiting where needed

**Quality:**
- [ ] Type hints present
- [ ] Proper error handling
- [ ] Tests included
- [ ] Documentation updated

**Performance:**
- [ ] Database queries optimized
- [ ] No N+1 queries
- [ ] Pagination for large results
- [ ] Appropriate indexes used

**Maintainability:**
- [ ] Code is readable
- [ ] Complex logic explained
- [ ] No unnecessary complexity
- [ ] Follows project patterns

---

**Last Updated:** August 2025  
**Maintainer:** Development Team  
**Status:** Living Document
