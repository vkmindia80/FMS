from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from enum import Enum
import uuid
from database import database, users_collection, companies_collection, audit_logs_collection
from auth import get_current_user, log_audit_event, UserRole, require_admin, require_corporate_or_above
from rbac import is_superadmin
import logging

logger = logging.getLogger(__name__)

admin_router = APIRouter()

class UserManagement(BaseModel):
    id: str
    email: str
    full_name: str
    role: UserRole
    company_id: str
    company_name: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime

class CompanySettings(BaseModel):
    base_currency: str
    fiscal_year_start: str
    date_format: str
    number_format: str
    timezone: str

class CompanyManagement(BaseModel):
    id: str
    name: str
    type: str
    settings: CompanySettings
    is_active: bool
    user_count: int
    created_at: datetime

class AuditLogEntry(BaseModel):
    id: str
    user_id: str
    user_email: Optional[str]
    company_id: str
    action: str
    details: Dict[str, Any]
    timestamp: datetime
    ip_address: Optional[str]
    user_agent: Optional[str]

class SystemStats(BaseModel):
    total_companies: int
    active_companies: int
    total_users: int
    active_users: int
    total_transactions: int
    total_documents: int
    storage_used: int  # in bytes
    api_calls_today: int

@admin_router.get("/users", response_model=List[UserManagement])
async def list_all_users(
    company_id: Optional[str] = Query(None, description="Filter by company ID"),
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    limit: int = Query(50, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """
    List users with tenant isolation
    - Regular Admins: See only their company users
    - Super Admin: See all users across all companies (optionally filter by company_id)
    """
    
    # Check if user is superadmin
    is_super = await is_superadmin(current_user["_id"])
    
    if not is_super:
        # Regular users/admins can only see their own company
        # Verify user has admin permissions for their company
        from rbac import has_permission
        if not await has_permission(current_user["_id"], "users:view"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view users"
            )
        # Force filter by user's company
        company_id = current_user["company_id"]
    
    # Build query
    query = {}
    
    # Apply tenant filtering
    if is_super and company_id:
        # Super Admin filtering by specific company
        query["company_id"] = company_id
        logger.info(f"🔍 Super Admin {current_user['email']} viewing users from company: {company_id}")
    elif is_super:
        # Super Admin viewing all companies
        logger.info(f"🔍 Super Admin {current_user['email']} viewing users across ALL companies")
        # No company_id filter - see all
    else:
        # Regular admin - only their company
        query["company_id"] = company_id
    
    if role:
        query["role"] = role
    
    if is_active is not None:
        query["is_active"] = is_active
    
    # Execute query
    cursor = users_collection.find(query).sort("created_at", -1).skip(offset).limit(limit)
    users = await cursor.to_list(length=limit)
    
    # Get company information for each user
    company_ids = list(set(user["company_id"] for user in users))
    companies = {}
    if company_ids:
        company_cursor = companies_collection.find({"_id": {"$in": company_ids}})
        company_list = await company_cursor.to_list(length=None)
        companies = {company["_id"]: company for company in company_list}
    
    # Convert to response format
    response_users = []
    for user in users:
        company = companies.get(user["company_id"], {})
        
        response_users.append(UserManagement(
            id=user["_id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            company_id=user["company_id"],
            company_name=company.get("name", "Unknown"),
            is_active=user["is_active"],
            last_login=user.get("last_login"),
            created_at=user["created_at"]
        ))
    
    return response_users

@admin_router.get("/companies", response_model=List[CompanyManagement])
async def list_all_companies(
    is_active: Optional[bool] = None,
    limit: int = Query(50, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_admin())
):
    """List all companies (admin only)"""
    
    # Build query
    query = {}
    if is_active is not None:
        query["is_active"] = is_active
    
    # Execute query
    cursor = companies_collection.find(query).sort("created_at", -1).skip(offset).limit(limit)
    companies = await cursor.to_list(length=limit)
    
    # Get user counts for each company
    response_companies = []
    for company in companies:
        user_count = await users_collection.count_documents({
            "company_id": company["_id"],
            "is_active": True
        })
        
        response_companies.append(CompanyManagement(
            id=company["_id"],
            name=company["name"],
            type=company["type"],
            settings=CompanySettings(**company.get("settings", {
                "base_currency": "USD",
                "fiscal_year_start": "01-01",
                "date_format": "MM/DD/YYYY",
                "number_format": "US",
                "timezone": "UTC"
            })),
            is_active=company["is_active"],
            user_count=user_count,
            created_at=company["created_at"]
        ))
    
    return response_companies

@admin_router.get("/audit-logs", response_model=List[AuditLogEntry])
async def list_audit_logs(
    company_id: Optional[str] = None,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = Query(100, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(require_corporate_or_above())
):
    """List audit logs with filtering"""
    
    # Build query - corporate users can only see their company's logs
    if current_user["role"] == UserRole.CORPORATE:
        query = {"company_id": current_user["company_id"]}
    else:  # Admin can see all
        query = {}
    
    if company_id and current_user["role"] == UserRole.ADMIN:
        query["company_id"] = company_id
    
    if user_id:
        query["user_id"] = user_id
    
    if action:
        query["action"] = {"$regex": action, "$options": "i"}
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["timestamp"] = date_query
    
    # Execute query
    cursor = audit_logs_collection.find(query).sort("timestamp", -1).skip(offset).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    # Get user information for each log entry
    user_ids = list(set(log["user_id"] for log in logs if log.get("user_id")))
    users = {}
    if user_ids:
        user_cursor = users_collection.find({"_id": {"$in": user_ids}})
        user_list = await user_cursor.to_list(length=None)
        users = {user["_id"]: user for user in user_list}
    
    # Convert to response format
    response_logs = []
    for log in logs:
        user = users.get(log.get("user_id"))
        
        response_logs.append(AuditLogEntry(
            id=log["_id"],
            user_id=log.get("user_id", ""),
            user_email=user.get("email") if user else None,
            company_id=log["company_id"],
            action=log["action"],
            details=log.get("details", {}),
            timestamp=log["timestamp"],
            ip_address=log.get("ip_address"),
            user_agent=log.get("user_agent")
        ))
    
    return response_logs

@admin_router.get("/system-stats", response_model=SystemStats)
async def get_system_stats(current_user: dict = Depends(require_admin())):
    """Get system-wide statistics (admin only)"""
    
    # Count companies
    total_companies = await companies_collection.count_documents({})
    active_companies = await companies_collection.count_documents({"is_active": True})
    
    # Count users
    total_users = await users_collection.count_documents({})
    active_users = await users_collection.count_documents({"is_active": True})
    
    # Count transactions
    from database import transactions_collection
    total_transactions = await transactions_collection.count_documents({})
    
    # Count documents
    from database import documents_collection
    total_documents = await documents_collection.count_documents({})
    
    # Calculate storage used (simplified)
    storage_pipeline = [
        {
            "$group": {
                "_id": None,
                "total_size": {"$sum": "$file_size"}
            }
        }
    ]
    storage_result = await documents_collection.aggregate(storage_pipeline).to_list(length=1)
    storage_used = storage_result[0]["total_size"] if storage_result else 0
    
    # API calls today (simplified - would need proper metrics collection)
    today = datetime.utcnow().date()
    api_calls_today = await audit_logs_collection.count_documents({
        "timestamp": {
            "$gte": datetime.combine(today, datetime.min.time()),
            "$lt": datetime.combine(today, datetime.max.time())
        },
        "action": {"$regex": "api_", "$options": "i"}
    })
    
    return SystemStats(
        total_companies=total_companies,
        active_companies=active_companies,
        total_users=total_users,
        active_users=active_users,
        total_transactions=total_transactions,
        total_documents=total_documents,
        storage_used=storage_used,
        api_calls_today=api_calls_today
    )

@admin_router.put("/users/{user_id}/activate")
async def activate_user(
    user_id: str,
    current_user: dict = Depends(require_admin())
):
    """Activate a user account (admin only)"""
    
    # Find user
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user status
    await users_collection.update_one(
        {"_id": user_id},
        {"$set": {"is_active": True}}
    )
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="admin_user_activated",
        details={
            "target_user_id": user_id,
            "target_user_email": user["email"]
        }
    )
    
    return {"message": "User activated successfully"}

@admin_router.put("/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: str,
    current_user: dict = Depends(require_admin())
):
    """Deactivate a user account (admin only)"""
    
    # Find user
    user = await users_collection.find_one({"_id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deactivating themselves
    if user_id == current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Update user status
    await users_collection.update_one(
        {"_id": user_id},
        {"$set": {"is_active": False}}
    )
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="admin_user_deactivated",
        details={
            "target_user_id": user_id,
            "target_user_email": user["email"]
        }
    )
    
    return {"message": "User deactivated successfully"}

@admin_router.put("/companies/{company_id}/settings")
async def update_company_settings(
    company_id: str,
    settings: CompanySettings,
    current_user: dict = Depends(require_corporate_or_above())
):
    """Update company settings"""
    
    # Corporate users can only update their own company
    if current_user["role"] == UserRole.CORPORATE and company_id != current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only update your own company settings"
        )
    
    # Find company
    company = await companies_collection.find_one({"_id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update settings
    await companies_collection.update_one(
        {"_id": company_id},
        {"$set": {"settings": settings.dict()}}
    )
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="company_settings_updated",
        details={
            "target_company_id": company_id,
            "updated_settings": settings.dict()
        }
    )
    
    return {"message": "Company settings updated successfully"}

@admin_router.get("/companies/{company_id}/users", response_model=List[UserManagement])
async def list_company_users(
    company_id: str,
    is_active: Optional[bool] = None,
    current_user: dict = Depends(require_corporate_or_above())
):
    """List users in a specific company"""
    
    # Corporate users can only view their own company
    if current_user["role"] == UserRole.CORPORATE and company_id != current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view users in your own company"
        )
    
    # Build query
    query = {"company_id": company_id}
    if is_active is not None:
        query["is_active"] = is_active
    
    # Execute query
    cursor = users_collection.find(query).sort("created_at", -1)
    users = await cursor.to_list(length=None)
    
    # Get company information
    company = await companies_collection.find_one({"_id": company_id})
    company_name = company["name"] if company else "Unknown"
    
    # Convert to response format
    response_users = []
    for user in users:
        response_users.append(UserManagement(
            id=user["_id"],
            email=user["email"],
            full_name=user["full_name"],
            role=user["role"],
            company_id=user["company_id"],
            company_name=company_name,
            is_active=user["is_active"],
            last_login=user.get("last_login"),
            created_at=user["created_at"]
        ))
    
    return response_users

@admin_router.post("/maintenance/cleanup-audit-logs")
async def cleanup_audit_logs(
    days_to_keep: int = Query(365, ge=30, le=3650),
    current_user: dict = Depends(require_admin())
):
    """Clean up old audit logs (admin only)"""
    
    # Calculate cutoff date
    cutoff_date = datetime.utcnow() - timedelta(days=days_to_keep)
    
    # Count logs to be deleted
    logs_to_delete = await audit_logs_collection.count_documents({
        "timestamp": {"$lt": cutoff_date}
    })
    
    # Delete old logs
    delete_result = await audit_logs_collection.delete_many({
        "timestamp": {"$lt": cutoff_date}
    })
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="admin_audit_logs_cleanup",
        details={
            "days_to_keep": days_to_keep,
            "logs_deleted": delete_result.deleted_count,
            "cutoff_date": cutoff_date.isoformat()
        }
    )
    
    return {
        "message": f"Deleted {delete_result.deleted_count} old audit log entries",
        "deleted_count": delete_result.deleted_count,
        "cutoff_date": cutoff_date
    }