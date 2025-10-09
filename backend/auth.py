from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import os
from enum import Enum
from motor.motor_asyncio import AsyncIOMotorDatabase
import uuid
from database import database, users_collection, companies_collection, audit_logs_collection
import logging

logger = logging.getLogger(__name__)

# Security configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

auth_router = APIRouter()

class UserRole(str, Enum):
    INDIVIDUAL = "individual"
    BUSINESS = "business"
    CORPORATE = "corporate"
    AUDITOR = "auditor"
    ADMIN = "admin"

class CompanyType(str, Enum):
    INDIVIDUAL = "individual"
    SMALL_BUSINESS = "small_business"
    CORPORATION = "corporation"
    NONPROFIT = "nonprofit"

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    company_name: Optional[str] = None
    company_type: CompanyType = CompanyType.INDIVIDUAL
    role: UserRole = UserRole.INDIVIDUAL

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    user: dict

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    company_id: str
    company_name: str
    is_active: bool
    created_at: datetime

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        if payload.get("type") != "access":
            raise credentials_exception
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    user = await users_collection.find_one({"_id": user_id})
    if user is None:
        raise credentials_exception
        
    return user

async def log_audit_event(user_id: str, company_id: str, action: str, details: Dict[str, Any]):
    """Log audit event"""
    audit_event = {
        "_id": str(uuid.uuid4()),
        "user_id": user_id,
        "company_id": company_id,
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow(),
        "ip_address": None,  # TODO: Extract from request
        "user_agent": None   # TODO: Extract from request
    }
    
    try:
        await audit_logs_collection.insert_one(audit_event)
    except Exception as e:
        logger.error(f"Failed to log audit event: {e}")

@auth_router.post("/register", response_model=Token)
async def register_user(user_data: UserRegister):
    """Register a new user and company"""
    
    # Check if user already exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create company first
    company_id = str(uuid.uuid4())
    company_doc = {
        "_id": company_id,
        "name": user_data.company_name or f"{user_data.full_name}'s Company",
        "type": user_data.company_type,
        "created_at": datetime.utcnow(),
        "is_active": True,
        "settings": {
            "base_currency": "USD",
            "fiscal_year_start": "01-01",
            "date_format": "MM/DD/YYYY",
            "number_format": "US",
            "timezone": "UTC"
        },
        "subscription": {
            "plan": "basic",
            "status": "active",
            "expires_at": datetime.utcnow() + timedelta(days=30)
        }
    }
    
    await companies_collection.insert_one(company_doc)
    
    # Create user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash(user_data.password)
    
    user_doc = {
        "_id": user_id,
        "email": user_data.email,
        "password": hashed_password,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "company_id": company_id,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "last_login": None,
        "preferences": {
            "theme": "light",
            "language": "en",
            "notifications": True
        }
    }
    
    await users_collection.insert_one(user_doc)
    
    # Create tokens
    access_token = create_access_token(data={"sub": user_id})
    refresh_token = create_refresh_token(data={"sub": user_id})
    
    # Log audit event
    await log_audit_event(
        user_id=user_id,
        company_id=company_id,
        action="user_registered",
        details={"email": user_data.email, "role": user_data.role}
    )
    
    # Prepare user response
    user_response = {
        "id": user_id,
        "email": user_data.email,
        "full_name": user_data.full_name,
        "role": user_data.role,
        "company_id": company_id,
        "company_name": company_doc["name"],
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )

@auth_router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    """Authenticate user and return tokens"""
    
    # Find user
    user = await users_collection.find_one({"email": user_credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Verify password
    if not verify_password(user_credentials.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Get company information
    company = await companies_collection.find_one({"_id": user["company_id"]})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Company not found"
        )
    
    # Update last login
    await users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_login": datetime.utcnow()}}
    )
    
    # Create tokens
    access_token = create_access_token(data={"sub": user["_id"]})
    refresh_token = create_refresh_token(data={"sub": user["_id"]})
    
    # Log audit event
    await log_audit_event(
        user_id=user["_id"],
        company_id=user["company_id"],
        action="user_login",
        details={"email": user_credentials.email}
    )
    
    # Prepare user response
    user_response = {
        "id": user["_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "company_id": user["company_id"],
        "company_name": company["name"],
        "is_active": user["is_active"],
        "created_at": user["created_at"]
    }
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )

@auth_router.post("/refresh")
async def refresh_access_token(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    refresh_token = request.refresh_token
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token"
    )
    
    try:
        payload = jwt.decode(refresh_token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        if payload.get("type") != "refresh":
            raise credentials_exception
            
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Verify user still exists and is active
    user = await users_collection.find_one({"_id": user_id, "is_active": True})
    if not user:
        raise credentials_exception
    
    # Create new access token
    access_token = create_access_token(data={"sub": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@auth_router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    
    # Get company information
    company = await companies_collection.find_one({"_id": current_user["company_id"]})
    
    return UserResponse(
        id=current_user["_id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        role=current_user["role"],
        company_id=current_user["company_id"],
        company_name=company["name"] if company else "Unknown",
        is_active=current_user["is_active"],
        created_at=current_user["created_at"]
    )

@auth_router.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    """Logout user (token invalidation handled client-side)"""
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="user_logout",
        details={"email": current_user["email"]}
    )
    
    return {"message": "Successfully logged out"}

# Role-based dependency functions
def require_role(required_roles: List[UserRole]):
    """Factory function for role-based access control"""
    def check_role(current_user: dict = Depends(get_current_user)):
        if UserRole(current_user["role"]) not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return check_role

# Convenience functions for specific roles
def require_business_or_above():
    return require_role([UserRole.BUSINESS, UserRole.CORPORATE, UserRole.ADMIN])

def require_corporate_or_above():
    return require_role([UserRole.CORPORATE, UserRole.ADMIN])

def require_admin():
    return require_role([UserRole.ADMIN])

@auth_router.post("/generate-demo-data")
async def generate_demo_data():
    """Generate comprehensive demo data for the demo user account"""
    from datetime import timedelta
    from decimal import Decimal
    import random
    
    # Demo user credentials
    DEMO_EMAIL = "john.doe@testcompany.com"
    
    try:
        # Find demo user
        demo_user = await users_collection.find_one({"email": DEMO_EMAIL})
        if not demo_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Demo user not found. Please ensure the demo account exists."
            )
        
        company_id = demo_user["company_id"]
        user_id = demo_user["_id"]
        
        # Import necessary collections and functions
        from database import accounts_collection, transactions_collection, documents_collection
        from accounts import create_default_accounts, AccountType
        from transactions import TransactionType, TransactionCategory, TransactionStatus
        
        # Clear existing data for demo company
        await accounts_collection.delete_many({"company_id": company_id})
        await transactions_collection.delete_many({"company_id": company_id})
        await documents_collection.delete_many({"company_id": company_id})
        
        # 1. Create default accounts
        account_ids = await create_default_accounts(company_id)
        
        # Get all created accounts for transactions
        accounts = await accounts_collection.find({"company_id": company_id}).to_list(length=None)
        accounts_by_type = {}
        for account in accounts:
            acc_type = account["account_type"]
            if acc_type not in accounts_by_type:
                accounts_by_type[acc_type] = []
            accounts_by_type[acc_type].append(account["_id"])
        
        # 2. Generate transactions for last 2 years
        transactions_created = 0
        current_date = datetime.utcnow()
        start_date = current_date - timedelta(days=730)  # 2 years
        
        # Transaction templates for realistic data
        income_transactions = [
            {"desc": "Monthly Salary - John Doe", "amount": (5000, 8000), "category": TransactionCategory.SALARY},
            {"desc": "Client Payment - ABC Corp", "amount": (2000, 15000), "category": TransactionCategory.BUSINESS_INCOME},
            {"desc": "Consulting Services", "amount": (1500, 10000), "category": TransactionCategory.BUSINESS_INCOME},
            {"desc": "Project Completion Bonus", "amount": (3000, 12000), "category": TransactionCategory.BUSINESS_INCOME},
            {"desc": "Investment Returns", "amount": (500, 3000), "category": TransactionCategory.OTHER_INCOME},
        ]
        
        expense_transactions = [
            {"desc": "Office Rent Payment", "amount": (1200, 2500), "category": TransactionCategory.RENT},
            {"desc": "Electric Bill", "amount": (100, 300), "category": TransactionCategory.UTILITIES},
            {"desc": "Internet & Phone", "amount": (150, 250), "category": TransactionCategory.UTILITIES},
            {"desc": "Office Supplies - Staples", "amount": (50, 500), "category": TransactionCategory.OFFICE_SUPPLIES},
            {"desc": "Business Insurance Premium", "amount": (200, 800), "category": TransactionCategory.INSURANCE},
            {"desc": "Legal Consultation", "amount": (500, 3000), "category": TransactionCategory.PROFESSIONAL_SERVICES},
            {"desc": "Accounting Services", "amount": (300, 1500), "category": TransactionCategory.PROFESSIONAL_SERVICES},
            {"desc": "Marketing Campaign", "amount": (500, 5000), "category": TransactionCategory.MARKETING},
            {"desc": "Business Lunch - Client Meeting", "amount": (50, 200), "category": TransactionCategory.MEALS},
            {"desc": "Conference Travel", "amount": (500, 3000), "category": TransactionCategory.TRAVEL},
            {"desc": "Software Subscription", "amount": (50, 500), "category": TransactionCategory.SOFTWARE},
            {"desc": "Equipment Purchase", "amount": (500, 5000), "category": TransactionCategory.EQUIPMENT},
        ]
        
        # Generate transactions month by month
        for month_offset in range(24):  # 24 months = 2 years
            month_date = start_date + timedelta(days=30 * month_offset)
            
            # Generate 2-4 income transactions per month
            for _ in range(random.randint(2, 4)):
                template = random.choice(income_transactions)
                amount = round(random.uniform(template["amount"][0], template["amount"][1]), 2)
                transaction_date = month_date + timedelta(days=random.randint(1, 28))
                
                # Get appropriate accounts
                cash_account = random.choice(accounts_by_type.get(AccountType.CHECKING, accounts_by_type.get(AccountType.CASH, account_ids[:1])))
                revenue_account = random.choice(accounts_by_type.get(AccountType.REVENUE, accounts_by_type.get(AccountType.SERVICE_INCOME, account_ids[:1])))
                
                transaction_doc = {
                    "_id": str(uuid.uuid4()),
                    "company_id": company_id,
                    "created_by": user_id,
                    "description": template["desc"],
                    "amount": amount,
                    "transaction_type": TransactionType.INCOME,
                    "category": template["category"],
                    "transaction_date": transaction_date,
                    "status": TransactionStatus.CLEARED,
                    "reference_number": f"REF{random.randint(1000, 9999)}",
                    "payee": template["desc"].split("-")[0].strip() if "-" in template["desc"] else "Customer",
                    "memo": f"Generated demo transaction",
                    "tags": ["demo", "income"],
                    "created_at": transaction_date,
                    "updated_at": transaction_date,
                    "journal_entries": [
                        {
                            "account_id": cash_account,
                            "debit_amount": amount,
                            "credit_amount": 0,
                            "description": f"Cash received - {template['desc']}"
                        },
                        {
                            "account_id": revenue_account,
                            "debit_amount": 0,
                            "credit_amount": amount,
                            "description": f"Revenue - {template['desc']}"
                        }
                    ],
                    "confidence_score": 1.0,
                    "is_reconciled": True,
                    "document_id": None,
                    "metadata": {"source": "demo_data_generator"}
                }
                await transactions_collection.insert_one(transaction_doc)
                transactions_created += 1
            
            # Generate 4-8 expense transactions per month
            for _ in range(random.randint(4, 8)):
                template = random.choice(expense_transactions)
                amount = round(random.uniform(template["amount"][0], template["amount"][1]), 2)
                transaction_date = month_date + timedelta(days=random.randint(1, 28))
                
                # Get appropriate accounts
                cash_account = random.choice(accounts_by_type.get(AccountType.CHECKING, accounts_by_type.get(AccountType.CASH, account_ids[:1])))
                expense_account = random.choice(accounts_by_type.get(AccountType.OPERATING_EXPENSES, accounts_by_type.get(AccountType.ADMINISTRATIVE_EXPENSES, account_ids[:1])))
                
                transaction_doc = {
                    "_id": str(uuid.uuid4()),
                    "company_id": company_id,
                    "created_by": user_id,
                    "description": template["desc"],
                    "amount": amount,
                    "transaction_type": TransactionType.EXPENSE,
                    "category": template["category"],
                    "transaction_date": transaction_date,
                    "status": TransactionStatus.CLEARED,
                    "reference_number": f"REF{random.randint(1000, 9999)}",
                    "payee": template["desc"].split("-")[0].strip(),
                    "memo": f"Generated demo transaction",
                    "tags": ["demo", "expense"],
                    "created_at": transaction_date,
                    "updated_at": transaction_date,
                    "journal_entries": [
                        {
                            "account_id": expense_account,
                            "debit_amount": amount,
                            "credit_amount": 0,
                            "description": f"Expense - {template['desc']}"
                        },
                        {
                            "account_id": cash_account,
                            "debit_amount": 0,
                            "credit_amount": amount,
                            "description": f"Cash paid - {template['desc']}"
                        }
                    ],
                    "confidence_score": 1.0,
                    "is_reconciled": True,
                    "document_id": None,
                    "metadata": {"source": "demo_data_generator"}
                }
                await transactions_collection.insert_one(transaction_doc)
                transactions_created += 1
        
        # 3. Generate sample documents
        documents_created = 0
        document_types = ["invoice", "receipt", "bank_statement", "contract"]
        
        for month_offset in range(24):
            month_date = start_date + timedelta(days=30 * month_offset)
            
            # Generate 2-3 documents per month
            for _ in range(random.randint(2, 3)):
                doc_type = random.choice(document_types)
                doc_date = month_date + timedelta(days=random.randint(1, 28))
                
                document_doc = {
                    "_id": str(uuid.uuid4()),
                    "company_id": company_id,
                    "uploaded_by": user_id,
                    "filename": f"demo_{doc_type}_{doc_date.strftime('%Y%m%d')}_{random.randint(100, 999)}.pdf",
                    "original_filename": f"{doc_type}_{doc_date.strftime('%Y%m%d')}.pdf",
                    "file_path": f"/demo/documents/{doc_type}_{random.randint(1000, 9999)}.pdf",
                    "file_size": random.randint(50000, 500000),
                    "mime_type": "application/pdf",
                    "document_type": doc_type,
                    "status": "processed",
                    "uploaded_at": doc_date,
                    "processed_at": doc_date + timedelta(minutes=random.randint(1, 30)),
                    "created_at": doc_date,
                    "updated_at": doc_date,
                    "extracted_data": {
                        "vendor": f"Demo Vendor {random.randint(1, 10)}",
                        "date": doc_date.isoformat(),
                        "total_amount": round(random.uniform(100, 5000), 2),
                        "currency": "USD",
                        "items": []
                    },
                    "ocr_text": f"Demo OCR text for {doc_type}",
                    "confidence_score": random.uniform(0.85, 0.99),
                    "tags": ["demo", doc_type],
                    "metadata": {
                        "pages": 1,
                        "source": "demo_data_generator"
                    }
                }
                await documents_collection.insert_one(document_doc)
                documents_created += 1
        
        # Log audit event
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="demo_data_generated",
            details={
                "accounts_created": len(account_ids),
                "transactions_created": transactions_created,
                "documents_created": documents_created,
                "date_range": "2 years"
            }
        )
        
        return {
            "success": True,
            "message": "Demo data generated successfully",
            "data": {
                "accounts_created": len(account_ids),
                "transactions_created": transactions_created,
                "documents_created": documents_created,
                "date_range": "Last 2 years",
                "demo_user": DEMO_EMAIL
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating demo data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate demo data: {str(e)}"
        )