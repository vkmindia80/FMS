"""
Plan Management System
Handles subscription plans and menu access control
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
import logging

from database import database, companies_collection, audit_logs_collection
from auth import get_current_user, log_audit_event
from rbac import is_superadmin

logger = logging.getLogger(__name__)

# Collections
plans_collection = database.plans
company_plans_collection = database.company_plans

plans_router = APIRouter()

# ============================================================================
# MODELS
# ============================================================================

class MenuAccessItem(BaseModel):
    menu_name: str
    menu_path: str
    is_enabled: bool = True

class PlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    display_name: str
    description: Optional[str] = None
    price_monthly: float = 0.0
    price_yearly: float = 0.0
    features: List[str] = []
    menu_access: List[MenuAccessItem] = []
    max_users: Optional[int] = None
    max_companies: Optional[int] = 1
    storage_gb: Optional[int] = 10
    is_active: bool = True

class PlanUpdate(BaseModel):
    display_name: Optional[str] = None
    description: Optional[str] = None
    price_monthly: Optional[float] = None
    price_yearly: Optional[float] = None
    features: Optional[List[str]] = None
    menu_access: Optional[List[MenuAccessItem]] = None
    max_users: Optional[int] = None
    max_companies: Optional[int] = None
    storage_gb: Optional[int] = None
    is_active: Optional[bool] = None

class PlanResponse(BaseModel):
    id: str
    name: str
    display_name: str
    description: Optional[str]
    price_monthly: float
    price_yearly: float
    features: List[str]
    menu_access: List[MenuAccessItem]
    max_users: Optional[int]
    max_companies: Optional[int]
    storage_gb: Optional[int]
    is_active: bool
    company_count: int
    created_at: datetime
    updated_at: datetime

class CompanyPlanAssignment(BaseModel):
    company_id: str
    plan_id: str

# ============================================================================
# PLAN MANAGEMENT
# ============================================================================

@plans_router.post("/plans", response_model=PlanResponse)
async def create_plan(
    plan_data: PlanCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new plan (Superadmin only)"""
    
    if not await is_superadmin(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can create plans"
        )
    
    # Check if plan name already exists
    existing = await plans_collection.find_one({"name": plan_data.name.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan with this name already exists"
        )
    
    plan_id = str(uuid.uuid4())
    plan_doc = {
        "_id": plan_id,
        "name": plan_data.name.lower(),
        "display_name": plan_data.display_name,
        "description": plan_data.description,
        "price_monthly": plan_data.price_monthly,
        "price_yearly": plan_data.price_yearly,
        "features": plan_data.features,
        "menu_access": [item.dict() for item in plan_data.menu_access],
        "max_users": plan_data.max_users,
        "max_companies": plan_data.max_companies,
        "storage_gb": plan_data.storage_gb,
        "is_active": plan_data.is_active,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_user["_id"]
    }
    
    await plans_collection.insert_one(plan_doc)
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="plan_created",
        details={"plan_id": plan_id, "name": plan_data.name}
    )
    
    return PlanResponse(
        id=plan_id,
        name=plan_doc["name"],
        display_name=plan_doc["display_name"],
        description=plan_doc["description"],
        price_monthly=plan_doc["price_monthly"],
        price_yearly=plan_doc["price_yearly"],
        features=plan_doc["features"],
        menu_access=[MenuAccessItem(**item) for item in plan_doc["menu_access"]],
        max_users=plan_doc["max_users"],
        max_companies=plan_doc["max_companies"],
        storage_gb=plan_doc["storage_gb"],
        is_active=plan_doc["is_active"],
        company_count=0,
        created_at=plan_doc["created_at"],
        updated_at=plan_doc["updated_at"]
    )

@plans_router.get("/plans", response_model=List[PlanResponse])
async def list_plans(
    current_user: dict = Depends(get_current_user)
):
    """List all plans"""
    
    plans = await plans_collection.find({}).sort("name", 1).to_list(length=None)
    
    plan_responses = []
    for plan in plans:
        # Count companies using this plan
        company_count = await company_plans_collection.count_documents({"plan_id": plan["_id"]})
        
        plan_responses.append(PlanResponse(
            id=plan["_id"],
            name=plan["name"],
            display_name=plan.get("display_name", plan["name"]),
            description=plan.get("description"),
            price_monthly=plan.get("price_monthly", 0.0),
            price_yearly=plan.get("price_yearly", 0.0),
            features=plan.get("features", []),
            menu_access=[MenuAccessItem(**item) for item in plan.get("menu_access", [])],
            max_users=plan.get("max_users"),
            max_companies=plan.get("max_companies", 1),
            storage_gb=plan.get("storage_gb", 10),
            is_active=plan.get("is_active", True),
            company_count=company_count,
            created_at=plan["created_at"],
            updated_at=plan["updated_at"]
        ))
    
    return plan_responses

@plans_router.get("/plans/{plan_id}", response_model=PlanResponse)
async def get_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get plan details"""
    
    plan = await plans_collection.find_one({"_id": plan_id})
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    company_count = await company_plans_collection.count_documents({"plan_id": plan_id})
    
    return PlanResponse(
        id=plan["_id"],
        name=plan["name"],
        display_name=plan.get("display_name", plan["name"]),
        description=plan.get("description"),
        price_monthly=plan.get("price_monthly", 0.0),
        price_yearly=plan.get("price_yearly", 0.0),
        features=plan.get("features", []),
        menu_access=[MenuAccessItem(**item) for item in plan.get("menu_access", [])],
        max_users=plan.get("max_users"),
        max_companies=plan.get("max_companies", 1),
        storage_gb=plan.get("storage_gb", 10),
        is_active=plan.get("is_active", True),
        company_count=company_count,
        created_at=plan["created_at"],
        updated_at=plan["updated_at"]
    )

@plans_router.put("/plans/{plan_id}", response_model=PlanResponse)
async def update_plan(
    plan_id: str,
    plan_data: PlanUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update plan (Superadmin only)"""
    
    if not await is_superadmin(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can update plans"
        )
    
    plan = await plans_collection.find_one({"_id": plan_id})
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    
    if plan_data.display_name is not None:
        update_data["display_name"] = plan_data.display_name
    
    if plan_data.description is not None:
        update_data["description"] = plan_data.description
    
    if plan_data.price_monthly is not None:
        update_data["price_monthly"] = plan_data.price_monthly
    
    if plan_data.price_yearly is not None:
        update_data["price_yearly"] = plan_data.price_yearly
    
    if plan_data.features is not None:
        update_data["features"] = plan_data.features
    
    if plan_data.menu_access is not None:
        update_data["menu_access"] = [item.dict() for item in plan_data.menu_access]
    
    if plan_data.max_users is not None:
        update_data["max_users"] = plan_data.max_users
    
    if plan_data.max_companies is not None:
        update_data["max_companies"] = plan_data.max_companies
    
    if plan_data.storage_gb is not None:
        update_data["storage_gb"] = plan_data.storage_gb
    
    if plan_data.is_active is not None:
        update_data["is_active"] = plan_data.is_active
    
    await plans_collection.update_one(
        {"_id": plan_id},
        {"$set": update_data}
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="plan_updated",
        details={"plan_id": plan_id}
    )
    
    return await get_plan(plan_id, current_user)

@plans_router.delete("/plans/{plan_id}")
async def delete_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a plan (Superadmin only)"""
    
    if not await is_superadmin(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can delete plans"
        )
    
    plan = await plans_collection.find_one({"_id": plan_id})
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Check if plan is assigned to any companies
    company_count = await company_plans_collection.count_documents({"plan_id": plan_id})
    if company_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete plan. It is assigned to {company_count} company(ies)"
        )
    
    await plans_collection.delete_one({"_id": plan_id})
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="plan_deleted",
        details={"plan_id": plan_id, "plan_name": plan["name"]}
    )
    
    return {"message": "Plan deleted successfully"}

# ============================================================================
# COMPANY PLAN ASSIGNMENT
# ============================================================================

@plans_router.post("/companies/{company_id}/plan")
async def assign_plan_to_company(
    company_id: str,
    assignment: CompanyPlanAssignment,
    current_user: dict = Depends(get_current_user)
):
    """Assign plan to company (Superadmin only)"""
    
    if not await is_superadmin(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can assign plans to companies"
        )
    
    # Verify company exists
    company = await companies_collection.find_one({"_id": company_id})
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Verify plan exists
    plan = await plans_collection.find_one({"_id": assignment.plan_id})
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Remove existing plan assignment
    await company_plans_collection.delete_many({"company_id": company_id})
    
    # Create new assignment
    assignment_doc = {
        "_id": str(uuid.uuid4()),
        "company_id": company_id,
        "plan_id": assignment.plan_id,
        "assigned_at": datetime.utcnow(),
        "assigned_by": current_user["_id"]
    }
    await company_plans_collection.insert_one(assignment_doc)
    
    # Update company document with plan reference
    await companies_collection.update_one(
        {"_id": company_id},
        {"$set": {"plan_id": assignment.plan_id}}
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="company_plan_assigned",
        details={"company_id": company_id, "plan_id": assignment.plan_id}
    )
    
    return {"message": "Plan assigned successfully"}

@plans_router.get("/companies/{company_id}/plan", response_model=PlanResponse)
async def get_company_plan(
    company_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get company's assigned plan"""
    
    # Check permission
    is_super = await is_superadmin(current_user["_id"])
    if not is_super and company_id != current_user["company_id"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view other company's plan"
        )
    
    assignment = await company_plans_collection.find_one({"company_id": company_id})
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No plan assigned to this company"
        )
    
    return await get_plan(assignment["plan_id"], current_user)

# ============================================================================
# MENU ACCESS BASED ON PLAN
# ============================================================================

@plans_router.get("/menus/accessible")
async def get_accessible_menus(
    current_user: dict = Depends(get_current_user)
):
    """Get menus accessible based on company plan"""
    
    # Superadmin has access to all menus
    if await is_superadmin(current_user["_id"]):
        from rbac import list_menus
        return await list_menus(current_user)
    
    # Get company's plan
    company = await companies_collection.find_one({"_id": current_user["company_id"]})
    if not company or not company.get("plan_id"):
        # No plan assigned, return basic menus only
        return []
    
    plan = await plans_collection.find_one({"_id": company["plan_id"]})
    if not plan:
        return []
    
    # Get user's permission-based menus
    from rbac import list_menus
    user_menus = await list_menus(current_user)
    
    # Filter based on plan's menu access
    plan_menu_paths = {item["menu_path"] for item in plan.get("menu_access", []) if item.get("is_enabled")}
    
    accessible_menus = [
        menu for menu in user_menus
        if menu.path in plan_menu_paths
    ]
    
    return accessible_menus
