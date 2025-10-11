# Testing Strategy - Advanced Finance Management System

**Target Coverage:** 80%+  
**Current Coverage:** ~5% (integration tests only)  
**Priority:** HIGH (after security fixes)

---

## Testing Pyramid

```
        /\
       /E2E\         10% - End-to-End Tests (User flows)
      /------\
     /Integration\   30% - API Integration Tests
    /------------\
   /   Unit Tests  \ 60% - Unit Tests (Business logic)
  /----------------\
```

---

## Phase 1: Unit Tests (Week 1-2)

### Priority 1: Authentication Module (`auth.py`)

**Target Coverage:** 90%

#### Test Cases:

```python
# /app/backend/tests/test_auth.py

import pytest
from datetime import datetime, timedelta
from auth import (
    verify_password, get_password_hash, create_access_token,
    create_refresh_token, get_current_user, UserRole
)

class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_password_hash_creation(self):
        """Test password is properly hashed"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert hashed != password
        assert len(hashed) > 50  # Bcrypt hashes are long
        assert hashed.startswith('$2b$')  # Bcrypt identifier
    
    def test_password_verification_success(self):
        """Test correct password verification"""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        assert verify_password(password, hashed) is True
    
    def test_password_verification_failure(self):
        """Test incorrect password rejection"""
        password = "TestPassword123!"
        wrong_password = "WrongPassword456!"
        hashed = get_password_hash(password)
        
        assert verify_password(wrong_password, hashed) is False
    
    def test_same_password_different_hashes(self):
        """Test password hashing uses salt (different hash each time)"""
        password = "TestPassword123!"
        hash1 = get_password_hash(password)
        hash2 = get_password_hash(password)
        
        assert hash1 != hash2  # Different salts
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True


class TestJWTTokens:
    """Test JWT token creation and validation"""
    
    def test_access_token_creation(self):
        """Test access token is created with correct claims"""
        user_id = "test-user-123"
        token = create_access_token(data={"sub": user_id})
        
        assert token is not None
        assert len(token) > 100  # JWT tokens are long
        
        # Decode and verify
        from jose import jwt
        import os
        payload = jwt.decode(token, os.getenv("JWT_SECRET_KEY"), algorithms=["HS256"])
        
        assert payload["sub"] == user_id
        assert payload["type"] == "access"
        assert "exp" in payload
    
    def test_refresh_token_creation(self):
        """Test refresh token has longer expiry"""
        user_id = "test-user-123"
        token = create_refresh_token(data={"sub": user_id})
        
        from jose import jwt
        import os
        payload = jwt.decode(token, os.getenv("JWT_SECRET_KEY"), algorithms=["HS256"])
        
        assert payload["type"] == "refresh"
        
        # Verify expiry is ~7 days
        exp_time = datetime.fromtimestamp(payload["exp"])
        now = datetime.utcnow()
        days_until_expiry = (exp_time - now).days
        
        assert 6 <= days_until_expiry <= 8  # Allow some variance
    
    def test_access_token_expiry(self):
        """Test access token expires correctly"""
        from jose import jwt, JWTError
        import os
        
        # Create token that expired 1 hour ago
        past_time = datetime.utcnow() - timedelta(hours=1)
        token = create_access_token(
            data={"sub": "test-user"},
            expires_delta=timedelta(seconds=-3600)  # Negative delta
        )
        
        # Should raise JWTError when decoding expired token
        with pytest.raises(JWTError):
            jwt.decode(token, os.getenv("JWT_SECRET_KEY"), algorithms=["HS256"])


class TestUserRoles:
    """Test role-based access control"""
    
    def test_all_roles_defined(self):
        """Test all required roles are defined"""
        expected_roles = ["individual", "business", "corporate", "auditor", "admin"]
        actual_roles = [role.value for role in UserRole]
        
        assert set(expected_roles) == set(actual_roles)
    
    def test_role_hierarchy(self):
        """Test role permissions hierarchy"""
        from auth import require_role, require_admin, require_business_or_above
        
        # Admin should have highest privileges
        admin_roles = require_admin()
        assert UserRole.ADMIN in admin_roles
        
        # Business or above includes multiple roles
        business_roles = require_business_or_above()
        assert UserRole.BUSINESS in business_roles
        assert UserRole.CORPORATE in business_roles
        assert UserRole.ADMIN in business_roles


@pytest.mark.asyncio
class TestAuthentication:
    """Test authentication endpoints"""
    
    async def test_register_user_success(self, test_db):
        """Test successful user registration"""
        from auth import register_user
        
        user_data = {
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "full_name": "New User",
            "company_name": "Test Company"
        }
        
        result = await register_user(user_data)
        
        assert result["access_token"] is not None
        assert result["refresh_token"] is not None
        assert result["user"]["email"] == user_data["email"]
        assert "password" not in result["user"]  # Password should not be returned
    
    async def test_register_duplicate_email(self, test_db):
        """Test registration fails with duplicate email"""
        from auth import register_user
        from fastapi import HTTPException
        
        user_data = {
            "email": "existing@example.com",
            "password": "SecurePass123!",
            "full_name": "User"
        }
        
        # Register first time
        await register_user(user_data)
        
        # Try to register again with same email
        with pytest.raises(HTTPException) as exc:
            await register_user(user_data)
        
        assert exc.value.status_code == 400
        assert "already registered" in str(exc.value.detail).lower()
    
    async def test_login_success(self, test_db, test_user):
        """Test successful login"""
        from auth import login_user
        
        credentials = {
            "email": test_user["email"],
            "password": "testpass123"
        }
        
        result = await login_user(credentials)
        
        assert result["access_token"] is not None
        assert result["user"]["id"] == test_user["id"]
    
    async def test_login_wrong_password(self, test_db, test_user):
        """Test login fails with wrong password"""
        from auth import login_user
        from fastapi import HTTPException
        
        credentials = {
            "email": test_user["email"],
            "password": "wrongpassword"
        }
        
        with pytest.raises(HTTPException) as exc:
            await login_user(credentials)
        
        assert exc.value.status_code == 401
        assert "invalid credentials" in str(exc.value.detail).lower()


# Fixtures
@pytest.fixture
async def test_db():
    """Setup test database"""
    from database import database
    # Setup test database
    yield database
    # Cleanup after test


@pytest.fixture
async def test_user(test_db):
    """Create a test user"""
    from auth import register_user
    
    user_data = {
        "email": "testuser@example.com",
        "password": "testpass123",
        "full_name": "Test User"
    }
    
    result = await register_user(user_data)
    return result["user"]
```

**Run tests:**
```bash
cd /app/backend
pytest tests/test_auth.py -v --cov=auth --cov-report=html
```

---

### Priority 2: Accounting Module (`accounts.py`, `transactions.py`)

**Target Coverage:** 85%

#### Test Cases:

```python
# /app/backend/tests/test_accounting.py

import pytest
from decimal import Decimal
from accounts import (
    get_account_category, calculate_account_balance,
    AccountType, AccountCategory
)
from transactions import (
    validate_journal_entries, create_auto_journal_entries,
    TransactionType
)

class TestAccountCategories:
    """Test account categorization"""
    
    def test_asset_account_category(self):
        """Test asset accounts are categorized correctly"""
        assert get_account_category(AccountType.CASH) == AccountCategory.ASSETS
        assert get_account_category(AccountType.CHECKING) == AccountCategory.ASSETS
        assert get_account_category(AccountType.ACCOUNTS_RECEIVABLE) == AccountCategory.ASSETS
    
    def test_liability_account_category(self):
        """Test liability accounts are categorized correctly"""
        assert get_account_category(AccountType.ACCOUNTS_PAYABLE) == AccountCategory.LIABILITIES
        assert get_account_category(AccountType.CREDIT_CARD) == AccountCategory.LIABILITIES
    
    def test_income_account_category(self):
        """Test income accounts are categorized correctly"""
        assert get_account_category(AccountType.REVENUE) == AccountCategory.INCOME
        assert get_account_category(AccountType.SERVICE_INCOME) == AccountCategory.INCOME


class TestDoubleEntryAccounting:
    """Test double-entry bookkeeping rules"""
    
    def test_journal_entries_must_balance(self):
        """Test that debits must equal credits"""
        # Balanced entries
        balanced_entries = [
            {"account_id": "acc1", "debit_amount": 100, "credit_amount": 0},
            {"account_id": "acc2", "debit_amount": 0, "credit_amount": 100}
        ]
        
        is_valid, message = validate_journal_entries(balanced_entries)
        assert is_valid is True
    
    def test_unbalanced_journal_entries_rejected(self):
        """Test unbalanced entries are rejected"""
        # Unbalanced entries
        unbalanced_entries = [
            {"account_id": "acc1", "debit_amount": 100, "credit_amount": 0},
            {"account_id": "acc2", "debit_amount": 0, "credit_amount": 50}  # Wrong!
        ]
        
        is_valid, message = validate_journal_entries(unbalanced_entries)
        assert is_valid is False
        assert "must balance" in message.lower()
    
    def test_minimum_two_entries_required(self):
        """Test at least two journal entries required"""
        single_entry = [
            {"account_id": "acc1", "debit_amount": 100, "credit_amount": 0}
        ]
        
        is_valid, message = validate_journal_entries(single_entry)
        assert is_valid is False
        assert "at least two" in message.lower()


@pytest.mark.asyncio
class TestAccountBalance:
    """Test account balance calculations"""
    
    async def test_asset_account_balance(self, test_db, test_company):
        """Test asset account balance increases with debits"""
        # Create cash account
        account_id = await create_test_account(
            test_company["id"],
            "Cash",
            AccountType.CASH
        )
        
        # Add transaction: Debit $100 to cash
        await create_test_transaction(
            test_company["id"],
            account_id,
            debit=100,
            credit=0
        )
        
        balance = await calculate_account_balance(account_id, test_company["id"])
        
        assert balance == Decimal("100")
    
    async def test_liability_account_balance(self, test_db, test_company):
        """Test liability account balance increases with credits"""
        # Create accounts payable account
        account_id = await create_test_account(
            test_company["id"],
            "Accounts Payable",
            AccountType.ACCOUNTS_PAYABLE
        )
        
        # Add transaction: Credit $500 to AP
        await create_test_transaction(
            test_company["id"],
            account_id,
            debit=0,
            credit=500
        )
        
        balance = await calculate_account_balance(account_id, test_company["id"])
        
        assert balance == Decimal("500")
    
    async def test_multiple_transactions_balance(self, test_db, test_company):
        """Test balance with multiple transactions"""
        account_id = await create_test_account(
            test_company["id"],
            "Cash",
            AccountType.CASH
        )
        
        # Multiple transactions
        await create_test_transaction(test_company["id"], account_id, debit=100, credit=0)
        await create_test_transaction(test_company["id"], account_id, debit=50, credit=0)
        await create_test_transaction(test_company["id"], account_id, debit=0, credit=30)
        
        balance = await calculate_account_balance(account_id, test_company["id"])
        
        assert balance == Decimal("120")  # 100 + 50 - 30


class TestTransactionCreation:
    """Test transaction creation and validation"""
    
    def test_auto_journal_entries_income(self):
        """Test automatic journal entries for income transactions"""
        transaction = {
            "transaction_type": TransactionType.INCOME,
            "amount": Decimal("1000"),
            "description": "Client payment"
        }
        
        entries = create_auto_journal_entries(transaction, "company-id")
        
        assert len(entries) == 2
        
        # Find debit and credit entries
        debit_entry = next(e for e in entries if e["debit_amount"] > 0)
        credit_entry = next(e for e in entries if e["credit_amount"] > 0)
        
        assert debit_entry["debit_amount"] == 1000  # Cash received
        assert credit_entry["credit_amount"] == 1000  # Revenue earned
    
    def test_auto_journal_entries_expense(self):
        """Test automatic journal entries for expense transactions"""
        transaction = {
            "transaction_type": TransactionType.EXPENSE,
            "amount": Decimal("500"),
            "description": "Office supplies"
        }
        
        entries = create_auto_journal_entries(transaction, "company-id")
        
        assert len(entries) == 2
        
        # Expense account debited, cash credited
        debit_entry = next(e for e in entries if e["debit_amount"] > 0)
        credit_entry = next(e for e in entries if e["credit_amount"] > 0)
        
        assert debit_entry["debit_amount"] == 500  # Expense incurred
        assert credit_entry["credit_amount"] == 500  # Cash paid
```

**Run tests:**
```bash
pytest tests/test_accounting.py -v --cov=accounts --cov=transactions
```

---

### Priority 3: Document Processing (`document_processor.py`)

**Target Coverage:** 75%

#### Test Cases:

```python
# /app/backend/tests/test_document_processing.py

import pytest
from document_processor import DocumentProcessor
from unittest.mock import Mock, patch, AsyncMock

class TestDocumentProcessor:
    """Test document processing functionality"""
    
    def test_processor_initialization(self):
        """Test processor initializes correctly"""
        processor = DocumentProcessor()
        
        assert processor is not None
        assert hasattr(processor, 'emergent_llm_key')
    
    def test_processor_without_llm_key(self):
        """Test graceful degradation without LLM key"""
        with patch.dict('os.environ', {}, clear=True):
            processor = DocumentProcessor()
            assert processor.emergent_llm_key is None


@pytest.mark.asyncio
class TestOCRProcessing:
    """Test OCR text extraction"""
    
    async def test_ocr_extracts_text_from_image(self, sample_receipt_image):
        """Test OCR successfully extracts text from image"""
        processor = DocumentProcessor()
        
        text = processor._extract_text_with_ocr(sample_receipt_image)
        
        assert text is not None
        assert len(text) > 0
        assert isinstance(text, str)
    
    async def test_ocr_handles_invalid_image(self):
        """Test OCR handles invalid image gracefully"""
        processor = DocumentProcessor()
        
        text = processor._extract_text_with_ocr("/invalid/path.jpg")
        
        assert text == ""  # Should return empty string, not crash


class TestConfidenceScoring:
    """Test confidence score calculations"""
    
    def test_confidence_with_all_fields(self):
        """Test high confidence when all fields extracted"""
        processor = DocumentProcessor()
        
        structured_data = {
            "amount": 100.50,
            "date": "2025-01-15",
            "vendor": "Test Vendor",
            "description": "Test purchase"
        }
        
        confidence = processor._calculate_confidence_score(
            ocr_text="Sample OCR text",
            structured_data=structured_data,
            ai_analysis={"ai_confidence": 0.9}
        )
        
        assert confidence >= 0.8
        assert confidence <= 1.0
    
    def test_confidence_with_missing_fields(self):
        """Test lower confidence with missing fields"""
        processor = DocumentProcessor()
        
        structured_data = {
            "amount": 100.50
            # Missing date, vendor, description
        }
        
        confidence = processor._calculate_confidence_score(
            ocr_text="",
            structured_data=structured_data,
            ai_analysis={}
        )
        
        assert confidence < 0.5


@pytest.mark.asyncio
class TestAIAnalysis:
    """Test AI-powered document analysis"""
    
    @patch('document_processor.LlmChat')
    async def test_ai_analysis_success(self, mock_llm):
        """Test successful AI analysis"""
        # Mock AI response
        mock_llm_instance = AsyncMock()
        mock_llm_instance.send_message.return_value = '''{
            "amount": 150.00,
            "date": "2025-01-15",
            "vendor": "Test Store",
            "category": "office_supplies"
        }'''
        mock_llm.return_value.with_model.return_value = mock_llm_instance
        
        processor = DocumentProcessor()
        processor.emergent_llm_key = "test-key"
        
        result = await processor._analyze_with_ai(
            "/test/document.pdf",
            "receipt",
            "Sample OCR text"
        )
        
        assert "structured_data" in result
        assert result["structured_data"]["amount"] == 150.00
        assert result["structured_data"]["vendor"] == "Test Store"
    
    @patch('document_processor.LlmChat')
    async def test_ai_analysis_fallback_on_invalid_json(self, mock_llm):
        """Test fallback when AI returns invalid JSON"""
        # Mock AI response with invalid JSON
        mock_llm_instance = AsyncMock()
        mock_llm_instance.send_message.return_value = "Not valid JSON at all"
        mock_llm.return_value.with_model.return_value = mock_llm_instance
        
        processor = DocumentProcessor()
        processor.emergent_llm_key = "test-key"
        
        result = await processor._analyze_with_ai(
            "/test/document.pdf",
            "receipt"
        )
        
        # Should have structured_data even with parse failure
        assert "structured_data" in result
        assert "parsing_error" in result


# Fixtures
@pytest.fixture
def sample_receipt_image():
    """Create a sample receipt image for testing"""
    import cv2
    import numpy as np
    
    # Create simple test image
    img = np.ones((200, 300, 3), dtype=np.uint8) * 255
    cv2.putText(img, "TEST RECEIPT", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 0), 2)
    
    path = "/tmp/test_receipt.jpg"
    cv2.imwrite(path, img)
    
    yield path
    
    # Cleanup
    import os
    os.remove(path)
```

---

## Phase 2: Integration Tests (Week 3)

### API Integration Tests

```python
# /app/backend/tests/test_api_integration.py

import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
class TestAuthenticationFlow:
    """Test complete authentication flow"""
    
    async def test_register_login_access_logout(self):
        """Test full user journey"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # 1. Register
            response = await client.post("/api/auth/register", json={
                "email": "integration@test.com",
                "password": "SecurePass123!",
                "full_name": "Integration Test"
            })
            assert response.status_code == 200
            tokens = response.json()
            access_token = tokens["access_token"]
            
            # 2. Access protected endpoint
            response = await client.get(
                "/api/auth/me",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            assert response.status_code == 200
            user = response.json()
            assert user["email"] == "integration@test.com"
            
            # 3. Logout
            response = await client.post(
                "/api/auth/logout",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            assert response.status_code == 200


@pytest.mark.asyncio
class TestTransactionFlow:
    """Test transaction creation and reporting"""
    
    async def test_create_transaction_appears_in_report(self, authenticated_client):
        """Test transaction appears in financial reports"""
        # 1. Create income transaction
        response = await authenticated_client.post("/api/transactions/", json={
            "description": "Test income",
            "amount": 1000.00,
            "transaction_type": "income",
            "transaction_date": "2025-01-15"
        })
        assert response.status_code == 200
        
        # 2. Generate P&L report
        response = await authenticated_client.get("/api/reports/profit-loss")
        assert response.status_code == 200
        
        report = response.json()
        assert report["total_revenue"] >= 1000.00
```

---

## Phase 3: End-to-End Tests (Week 4)

### Using Playwright

```python
# /app/tests/e2e/test_user_flows.py

import pytest
from playwright.async_api import async_playwright

@pytest.mark.asyncio
class TestUserJourneys:
    """Test complete user journeys through the UI"""
    
    async def test_new_user_onboarding(self):
        """Test new user can register and complete onboarding"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # 1. Navigate to app
            await page.goto("http://localhost:3000")
            
            # 2. Click register
            await page.click('button:has-text("Sign Up")')
            
            # 3. Fill registration form
            await page.fill('input[name="email"]', 'newuser@test.com')
            await page.fill('input[name="password"]', 'SecurePass123!')
            await page.fill('input[name="full_name"]', 'Test User')
            
            # 4. Submit
            await page.click('button[type="submit"]')
            
            # 5. Should redirect to dashboard
            await page.wait_for_url("**/dashboard")
            
            # 6. Verify dashboard loads
            assert await page.is_visible('text=Welcome')
            
            await browser.close()
    
    async def test_create_transaction_flow(self, authenticated_page):
        """Test user can create a transaction"""
        # Navigate to transactions
        await authenticated_page.click('text=Transactions')
        
        # Click new transaction
        await authenticated_page.click('button:has-text("New Transaction")')
        
        # Fill form
        await authenticated_page.fill('input[name="description"]', 'Test expense')
        await authenticated_page.fill('input[name="amount"]', '150.00')
        await authenticated_page.select_option('select[name="type"]', 'expense')
        
        # Submit
        await authenticated_page.click('button:has-text("Create")')
        
        # Verify appears in list
        await authenticated_page.wait_for_selector('text=Test expense')
        assert await authenticated_page.is_visible('text=$150.00')
```

---

## Test Configuration

### pytest.ini

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = 
    -v
    --strict-markers
    --cov=backend
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Slow running tests
asyncio_mode = auto
```

### conftest.py

```python
# /app/backend/tests/conftest.py

import pytest
import asyncio
from httpx import AsyncClient
from main import app
from database import database

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def test_db():
    """Setup test database"""
    # Use separate test database
    test_db_name = "afms_test"
    # Setup
    yield database
    # Teardown - drop all collections
    for collection_name in await database.list_collection_names():
        await database[collection_name].drop()

@pytest.fixture
async def authenticated_client(test_db):
    """HTTP client with authentication"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register and login
        response = await client.post("/api/auth/register", json={
            "email": "test@example.com",
            "password": "TestPass123!",
            "full_name": "Test User"
        })
        tokens = response.json()
        
        # Add auth header
        client.headers["Authorization"] = f"Bearer {tokens['access_token']}"
        
        yield client
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/tests.yml

name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
      
      redis:
        image: redis:alpine
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio httpx
      
      - name: Run unit tests
        run: |
          cd backend
          pytest tests/test_*.py --cov=. --cov-report=xml
        env:
          MONGO_URL: mongodb://localhost:27017/afms_test
          JWT_SECRET_KEY: test-secret-key-minimum-32-chars
          REDIS_HOST: localhost
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
      
      - name: Check coverage threshold
        run: |
          cd backend
          pytest --cov=. --cov-fail-under=80
```

---

## Coverage Goals

### Minimum Coverage by Module

| Module | Target | Priority |
|--------|--------|----------|
| auth.py | 90% | CRITICAL |
| accounts.py | 85% | HIGH |
| transactions.py | 85% | HIGH |
| document_processor.py | 75% | MEDIUM |
| reports.py | 80% | HIGH |
| documents.py | 75% | MEDIUM |
| Overall | 80% | TARGET |

---

## Testing Timeline

### Week 1: Core Unit Tests
- Day 1-2: Authentication tests
- Day 3-4: Accounting tests
- Day 5: Document processing tests

### Week 2: More Unit Tests
- Day 1-2: Reports tests
- Day 3-4: Remaining modules
- Day 5: Achieve 80% coverage

### Week 3: Integration Tests
- Day 1-2: API integration tests
- Day 3-4: Database integration tests
- Day 5: Error handling tests

### Week 4: E2E Tests
- Day 1-2: Setup Playwright
- Day 3-4: Critical user flows
- Day 5: Complete E2E suite

---

## Monitoring & Maintenance

### Test Health Metrics

- Test pass rate (target: 100%)
- Code coverage (target: 80%+)
- Test execution time (target: <5 minutes)
- Flaky test rate (target: <1%)

### Regular Activities

- Weekly: Review failed tests
- Monthly: Update test cases for new features
- Quarterly: Performance test review
- Annually: Complete test suite audit

---

**Created:** August 2025  
**Owner:** Development Team  
**Status:** Implementation Pending
