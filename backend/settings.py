"""
Settings API - Comprehensive settings management for multi-tenant application
Handles user profiles, company settings, preferences, and integrations
"""

from fastapi import APIRouter, HTTPException, Depends, status, UploadFile, File
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid
import os
from database import database, users_collection, companies_collection
from auth import get_current_user, get_password_hash, verify_password, log_audit_event, UserRole
import logging

logger = logging.getLogger(__name__)

settings_router = APIRouter()

# ============================================================================
# MODELS
# ============================================================================

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    department: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

class UserPreferences(BaseModel):
    theme: Optional[str] = Field(default="light", pattern="^(light|dark|auto)$")
    language: Optional[str] = Field(default="en")
    timezone: Optional[str] = Field(default="UTC")
    date_format: Optional[str] = Field(default="MM/DD/YYYY")
    time_format: Optional[str] = Field(default="12h", pattern="^(12h|24h)$")
    number_format: Optional[str] = Field(default="en-US")
    currency_display: Optional[str] = Field(default="symbol", pattern="^(symbol|code|name)$")
    notifications_enabled: Optional[bool] = True
    email_notifications: Optional[bool] = True
    desktop_notifications: Optional[bool] = False

class CompanyInfoUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    industry: Optional[str] = None
    address: Optional[Dict[str, str]] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    tax_id: Optional[str] = None
    registration_number: Optional[str] = None

class CompanySettingsUpdate(BaseModel):
    base_currency: Optional[str] = None
    multi_currency_enabled: Optional[bool] = None
    fiscal_year_start: Optional[str] = None
    date_format: Optional[str] = None
    number_format: Optional[str] = None
    timezone: Optional[str] = None
    tax_rate: Optional[float] = None
    tax_name: Optional[str] = None

class IntegrationConfig(BaseModel):
    provider: str
    enabled: bool
    config: Dict[str, Any]

class APIKeyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    expires_at: Optional[datetime] = None

# ============================================================================
# USER PROFILE ENDPOINTS
# ============================================================================

@settings_router.get("/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile information"""
    user = await users_collection.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove sensitive data
    user.pop("password", None)
    
    return {
        "id": user["_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "company_id": user["company_id"],
        "phone": user.get("phone"),
        "job_title": user.get("job_title"),
        "department": user.get("department"),
        "avatar_url": user.get("avatar_url"),
        "is_active": user["is_active"],
        "last_login": user.get("last_login"),
        "created_at": user["created_at"],
        "preferences": user.get("preferences", {})
    }

@settings_router.put("/profile")
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile"""
    
    update_data = {}
    
    if profile_data.full_name is not None:
        update_data["full_name"] = profile_data.full_name
    
    if profile_data.email is not None:
        # Check if email is already in use by another user
        existing_user = await users_collection.find_one({
            "email": profile_data.email,
            "_id": {"$ne": current_user["_id"]}
        })
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        update_data["email"] = profile_data.email
    
    if profile_data.phone is not None:
        update_data["phone"] = profile_data.phone
    
    if profile_data.job_title is not None:
        update_data["job_title"] = profile_data.job_title
    
    if profile_data.department is not None:
        update_data["department"] = profile_data.department
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="profile_updated",
        details={"updated_fields": list(update_data.keys())}
    )
    
    return {"message": "Profile updated successfully"}

@settings_router.post("/profile/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user)
):
    """Change user password"""
    
    # Verify new password and confirmation match
    if password_data.new_password != password_data.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password and confirmation do not match"
        )
    
    # Get user to verify current password
    user = await users_collection.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if not verify_password(password_data.current_password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash and save new password
    hashed_password = get_password_hash(password_data.new_password)
    
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "password": hashed_password,
                "password_changed_at": datetime.utcnow()
            }
        }
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="password_changed",
        details={}
    )
    
    return {"message": "Password changed successfully"}

# ============================================================================
# USER PREFERENCES ENDPOINTS
# ============================================================================

@settings_router.get("/preferences")
async def get_user_preferences(current_user: dict = Depends(get_current_user)):
    """Get current user's preferences"""
    user = await users_collection.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user.get("preferences", {
        "theme": "light",
        "language": "en",
        "timezone": "UTC",
        "date_format": "MM/DD/YYYY",
        "time_format": "12h",
        "number_format": "en-US",
        "currency_display": "symbol",
        "notifications_enabled": True,
        "email_notifications": True,
        "desktop_notifications": False
    })

@settings_router.put("/preferences")
async def update_user_preferences(
    preferences: UserPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's preferences"""
    
    preferences_dict = preferences.dict(exclude_none=True)
    
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "preferences": preferences_dict,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="preferences_updated",
        details={"preferences": list(preferences_dict.keys())}
    )
    
    return {"message": "Preferences updated successfully", "preferences": preferences_dict}

# ============================================================================
# COMPANY SETTINGS ENDPOINTS (Admin/Owner only)
# ============================================================================

@settings_router.get("/company")
async def get_company_info(current_user: dict = Depends(get_current_user)):
    """Get company information"""
    company = await companies_collection.find_one({"_id": current_user["company_id"]})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {
        "id": company["_id"],
        "name": company["name"],
        "type": company.get("type"),
        "industry": company.get("industry"),
        "address": company.get("address"),
        "phone": company.get("phone"),
        "website": company.get("website"),
        "tax_id": company.get("tax_id"),
        "registration_number": company.get("registration_number"),
        "logo_url": company.get("logo_url"),
        "settings": company.get("settings", {}),
        "subscription": company.get("subscription", {}),
        "is_active": company.get("is_active", True),
        "created_at": company.get("created_at")
    }

@settings_router.put("/company/info")
async def update_company_info(
    company_data: CompanyInfoUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update company information (Admin/Business/Corporate only)"""
    
    # Check if user has permission to update company settings
    if current_user["role"] not in [UserRole.ADMIN.value, UserRole.BUSINESS.value, UserRole.CORPORATE.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update company information"
        )
    
    update_data = company_data.dict(exclude_none=True)
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_data["updated_at"] = datetime.utcnow()
    
    await companies_collection.update_one(
        {"_id": current_user["company_id"]},
        {"$set": update_data}
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="company_info_updated",
        details={"updated_fields": list(update_data.keys())}
    )
    
    return {"message": "Company information updated successfully"}

@settings_router.put("/company/settings")
async def update_company_settings(
    settings_data: CompanySettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update company settings (Admin/Business/Corporate only)"""
    
    # Check permissions
    if current_user["role"] not in [UserRole.ADMIN.value, UserRole.BUSINESS.value, UserRole.CORPORATE.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update company settings"
        )
    
    settings_dict = settings_data.dict(exclude_none=True)
    
    if not settings_dict:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No settings to update"
        )
    
    # Prepare update with dot notation for nested settings
    update_data = {}
    for key, value in settings_dict.items():
        update_data[f"settings.{key}"] = value
    
    update_data["updated_at"] = datetime.utcnow()
    
    await companies_collection.update_one(
        {"_id": current_user["company_id"]},
        {"$set": update_data}
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="company_settings_updated",
        details={"updated_settings": list(settings_dict.keys())}
    )
    
    return {"message": "Company settings updated successfully"}

# ============================================================================
# INTEGRATION MANAGEMENT
# ============================================================================

@settings_router.get("/integrations")
async def get_integrations(current_user: dict = Depends(get_current_user)):
    """Get configured integrations for the company"""
    company = await companies_collection.find_one({"_id": current_user["company_id"]})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    integrations = company.get("integrations", {})
    
    # Return integration status without sensitive config
    return {
        "plaid": {
            "enabled": integrations.get("plaid", {}).get("enabled", False),
            "connected_accounts": len(integrations.get("plaid", {}).get("accounts", []))
        },
        "stripe": {
            "enabled": integrations.get("stripe", {}).get("enabled", False),
            "configured": bool(integrations.get("stripe", {}).get("api_key"))
        },
        "quickbooks": {
            "enabled": integrations.get("quickbooks", {}).get("enabled", False),
            "synced_at": integrations.get("quickbooks", {}).get("last_sync")
        }
    }

@settings_router.get("/api-keys")
async def list_api_keys(current_user: dict = Depends(get_current_user)):
    """List API keys for the user (Admin/Corporate only)"""
    
    if current_user["role"] not in [UserRole.ADMIN.value, UserRole.CORPORATE.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to manage API keys"
        )
    
    company = await companies_collection.find_one({"_id": current_user["company_id"]})
    api_keys = company.get("api_keys", [])
    
    # Return keys without actual key values
    return [
        {
            "id": key.get("id"),
            "name": key.get("name"),
            "description": key.get("description"),
            "created_at": key.get("created_at"),
            "expires_at": key.get("expires_at"),
            "last_used": key.get("last_used"),
            "is_active": key.get("is_active", True)
        }
        for key in api_keys
    ]

# ============================================================================
# DATA EXPORT
# ============================================================================

@settings_router.post("/export-data")
async def export_user_data(current_user: dict = Depends(get_current_user)):
    """Request data export (GDPR compliance)"""
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="data_export_requested",
        details={}
    )
    
    # In production, this would trigger an async job to generate the export
    return {
        "message": "Data export request received. You will receive an email when your data is ready for download.",
        "status": "processing"
    }

# ============================================================================
# ACCOUNT MANAGEMENT
# ============================================================================

@settings_router.delete("/account")
async def delete_account(
    password: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete user account (requires password confirmation)"""
    
    # Get user to verify password
    user = await users_collection.find_one({"_id": current_user["_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify password
    if not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )
    
    # Check if user is the only admin in the company
    if current_user["role"] == UserRole.ADMIN.value:
        admin_count = await users_collection.count_documents({
            "company_id": current_user["company_id"],
            "role": UserRole.ADMIN.value,
            "is_active": True
        })
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete account. You are the only admin in your company."
            )
    
    # Soft delete - deactivate instead of actually deleting
    await users_collection.update_one(
        {"_id": current_user["_id"]},
        {
            "$set": {
                "is_active": False,
                "deleted_at": datetime.utcnow()
            }
        }
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="account_deleted",
        details={}
    )
    
    return {"message": "Account has been deactivated successfully"}
