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

@auth_router.post("/refresh", response_model=Dict[str, str])
async def refresh_access_token(refresh_token: str):
    """Refresh access token using refresh token"""
    
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
async def require_role(required_roles: List[UserRole]):
    """Factory function for role-based access control"""
    async def check_role(current_user: dict = Depends(get_current_user)):
        if UserRole(current_user["role"]) not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return check_role

# Convenience functions for specific roles
require_business_or_above = lambda: require_role([UserRole.BUSINESS, UserRole.CORPORATE, UserRole.ADMIN])
require_corporate_or_above = lambda: require_role([UserRole.CORPORATE, UserRole.ADMIN])
require_admin = lambda: require_role([UserRole.ADMIN])