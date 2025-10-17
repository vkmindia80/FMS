"""
Role-Based Access Control (RBAC) System
Implements Menu-Based Access Control with Permissions
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid
import logging

from database import (
    database, 
    users_collection, 
    companies_collection,
    audit_logs_collection
)
from auth import get_current_user, log_audit_event

logger = logging.getLogger(__name__)

# New RBAC Collections
permissions_collection = database.permissions
roles_collection = database.roles
user_roles_collection = database.user_roles
menus_collection = database.menus

rbac_router = APIRouter()

# ============================================================================
# ENUMS & CONSTANTS
# ============================================================================

class ResourceType(str, Enum):
    """System resources that can have permissions"""
    DASHBOARD = "dashboard"
    TRANSACTIONS = "transactions"
    ACCOUNTS = "accounts"
    DOCUMENTS = "documents"
    REPORTS = "reports"
    INVOICES = "invoices"
    PAYMENTS = "payments"
    BANK_CONNECTIONS = "bank_connections"
    RECONCILIATION = "reconciliation"
    USERS = "users"
    ROLES = "roles"
    SETTINGS = "settings"
    AUDIT_LOGS = "audit_logs"
    INTEGRATIONS = "integrations"
    COMPANY = "company"

class ActionType(str, Enum):
    """Actions that can be performed on resources"""
    VIEW = "view"
    CREATE = "create"
    EDIT = "edit"
    DELETE = "delete"
    EXPORT = "export"
    IMPORT = "import"
    APPROVE = "approve"
    MANAGE = "manage"

class SystemRole(str, Enum):
    """Protected system roles that cannot be deleted"""
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    AUDITOR = "auditor"

# ============================================================================
# MODELS
# ============================================================================

class PermissionCreate(BaseModel):
    name: str = Field(..., description="Permission name (e.g., transactions:view)")
    resource: ResourceType
    action: ActionType
    description: Optional[str] = None

class PermissionResponse(BaseModel):
    id: str
    name: str
    resource: str
    action: str
    description: Optional[str]
    created_at: datetime
    is_system: bool

class RoleCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    description: Optional[str] = None
    permission_ids: List[str] = []
    is_system: bool = False
    applicable_on: Optional[str] = None  # "admin_users", "non_admin_users", or "all"

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[List[str]] = None
    applicable_on: Optional[str] = None

class RoleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    permissions: List[PermissionResponse]
    is_system: bool
    user_count: int
    created_at: datetime
    updated_at: datetime
    applicable_on: Optional[str] = None

class UserRoleAssignment(BaseModel):
    user_id: str
    role_ids: List[str]

class MenuCreate(BaseModel):
    name: str
    label: str
    icon: Optional[str] = None
    path: str
    parent_id: Optional[str] = None
    order: int = 0
    required_permissions: List[str] = []
    is_active: bool = True

class MenuResponse(BaseModel):
    id: str
    name: str
    label: str
    icon: Optional[str]
    path: str
    parent_id: Optional[str]
    order: int
    required_permissions: List[str]
    is_active: bool
    children: List['MenuResponse'] = []

# ============================================================================
# PERMISSION MANAGEMENT
# ============================================================================

@rbac_router.post("/permissions", response_model=PermissionResponse)
async def create_permission(
    permission_data: PermissionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new permission (Superadmin only)"""
    
    # Check if user is superadmin
    if not await is_superadmin(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can create permissions"
        )
    
    # Check if permission already exists
    existing = await permissions_collection.find_one({
        "name": permission_data.name,
        "company_id": {"$in": [None, current_user["company_id"]]}
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permission already exists"
        )
    
    permission_id = str(uuid.uuid4())
    permission_doc = {
        "_id": permission_id,
        "name": permission_data.name,
        "resource": permission_data.resource,
        "action": permission_data.action,
        "description": permission_data.description,
        "is_system": False,
        "company_id": None,  # System-wide permission
        "created_at": datetime.utcnow(),
        "created_by": current_user["_id"]
    }
    
    await permissions_collection.insert_one(permission_doc)
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="permission_created",
        details={"permission_id": permission_id, "name": permission_data.name}
    )
    
    return PermissionResponse(
        id=permission_id,
        name=permission_doc["name"],
        resource=permission_doc["resource"],
        action=permission_doc["action"],
        description=permission_doc["description"],
        created_at=permission_doc["created_at"],
        is_system=permission_doc["is_system"]
    )

@rbac_router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    resource: Optional[ResourceType] = None,
    current_user: dict = Depends(get_current_user)
):
    """List all available permissions"""
    
    query = {"company_id": {"$in": [None, current_user["company_id"]]}}
    
    if resource:
        query["resource"] = resource
    
    permissions = await permissions_collection.find(query).sort("resource", 1).to_list(length=None)
    
    return [
        PermissionResponse(
            id=perm["_id"],
            name=perm["name"],
            resource=perm["resource"],
            action=perm["action"],
            description=perm.get("description"),
            created_at=perm["created_at"],
            is_system=perm.get("is_system", False)
        )
        for perm in permissions
    ]

# ============================================================================
# ROLE MANAGEMENT
# ============================================================================

@rbac_router.post("/roles", response_model=RoleResponse)
async def create_role(
    role_data: RoleCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new role (Admin/Superadmin only)"""
    
    # Check if user has permission
    if not await has_permission(current_user["_id"], "roles:create"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to create roles"
        )
    
    # Check if role name already exists in company
    existing = await roles_collection.find_one({
        "name": role_data.name.lower(),
        "company_id": current_user["company_id"]
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role with this name already exists"
        )
    
    # Validate permissions exist
    if role_data.permission_ids:
        perms = await permissions_collection.count_documents({
            "_id": {"$in": role_data.permission_ids}
        })
        if perms != len(role_data.permission_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some permission IDs are invalid"
            )
    
    role_id = str(uuid.uuid4())
    role_doc = {
        "_id": role_id,
        "name": role_data.name.lower(),
        "display_name": role_data.name,
        "description": role_data.description,
        "permission_ids": role_data.permission_ids,
        "is_system": role_data.is_system,
        "company_id": current_user["company_id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_user["_id"]
    }
    
    await roles_collection.insert_one(role_doc)
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="role_created",
        details={"role_id": role_id, "name": role_data.name}
    )
    
    # Get permissions for response
    permissions = await get_role_permissions(role_id)
    
    return RoleResponse(
        id=role_id,
        name=role_doc["display_name"],
        description=role_doc["description"],
        permissions=permissions,
        is_system=role_doc["is_system"],
        user_count=0,
        created_at=role_doc["created_at"],
        updated_at=role_doc["updated_at"]
    )

@rbac_router.get("/roles", response_model=List[RoleResponse])
async def list_roles(
    current_user: dict = Depends(get_current_user)
):
    """List all roles in the company"""
    
    roles = await roles_collection.find({
        "company_id": {"$in": [None, current_user["company_id"]]}
    }).sort("name", 1).to_list(length=None)
    
    role_responses = []
    for role in roles:
        # Get permissions
        permissions = await get_role_permissions(role["_id"])
        
        # Count users with this role
        user_count = await user_roles_collection.count_documents({
            "role_id": role["_id"]
        })
        
        role_responses.append(RoleResponse(
            id=role["_id"],
            name=role.get("display_name", role["name"]),
            description=role.get("description"),
            permissions=permissions,
            is_system=role.get("is_system", False),
            user_count=user_count,
            created_at=role["created_at"],
            updated_at=role["updated_at"]
        ))
    
    return role_responses

@rbac_router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get role details"""
    
    role = await roles_collection.find_one({
        "_id": role_id,
        "company_id": {"$in": [None, current_user["company_id"]]}
    })
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    permissions = await get_role_permissions(role_id)
    user_count = await user_roles_collection.count_documents({"role_id": role_id})
    
    return RoleResponse(
        id=role["_id"],
        name=role.get("display_name", role["name"]),
        description=role.get("description"),
        permissions=permissions,
        is_system=role.get("is_system", False),
        user_count=user_count,
        created_at=role["created_at"],
        updated_at=role["updated_at"]
    )

@rbac_router.put("/roles/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: str,
    role_data: RoleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update role (Admin/Superadmin only)"""
    
    if not await has_permission(current_user["_id"], "roles:edit"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to update roles"
        )
    
    role = await roles_collection.find_one({
        "_id": role_id,
        "company_id": {"$in": [None, current_user["company_id"]]}
    })
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Cannot modify system roles (except by superadmin)
    if role.get("is_system") and not await is_superadmin(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot modify system roles"
        )
    
    update_data = {"updated_at": datetime.utcnow()}
    
    if role_data.name is not None:
        update_data["display_name"] = role_data.name
        update_data["name"] = role_data.name.lower()
    
    if role_data.description is not None:
        update_data["description"] = role_data.description
    
    if role_data.permission_ids is not None:
        # Validate permissions
        perms = await permissions_collection.count_documents({
            "_id": {"$in": role_data.permission_ids}
        })
        if perms != len(role_data.permission_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Some permission IDs are invalid"
            )
        update_data["permission_ids"] = role_data.permission_ids
    
    await roles_collection.update_one(
        {"_id": role_id},
        {"$set": update_data}
    )
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="role_updated",
        details={"role_id": role_id}
    )
    
    return await get_role(role_id, current_user)

@rbac_router.delete("/roles/{role_id}")
async def delete_role(
    role_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a role (Admin/Superadmin only)"""
    
    if not await has_permission(current_user["_id"], "roles:delete"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to delete roles"
        )
    
    role = await roles_collection.find_one({
        "_id": role_id,
        "company_id": {"$in": [None, current_user["company_id"]]}
    })
    
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    
    # Cannot delete system roles
    if role.get("is_system"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete system roles"
        )
    
    # Check if role is assigned to users
    user_count = await user_roles_collection.count_documents({"role_id": role_id})
    if user_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete role. It is assigned to {user_count} user(s)"
        )
    
    await roles_collection.delete_one({"_id": role_id})
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="role_deleted",
        details={"role_id": role_id, "role_name": role["name"]}
    )
    
    return {"message": "Role deleted successfully"}

# ============================================================================
# USER ROLE ASSIGNMENT
# ============================================================================

@rbac_router.post("/users/{user_id}/roles")
async def assign_roles_to_user(
    user_id: str,
    assignment: UserRoleAssignment,
    current_user: dict = Depends(get_current_user)
):
    """Assign roles to a user (Admin/Superadmin only)"""
    
    if not await has_permission(current_user["_id"], "users:manage"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to assign roles"
        )
    
    # Verify user exists and belongs to same company
    user = await users_collection.find_one({
        "_id": assignment.user_id,
        "company_id": current_user["company_id"]
    })
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate roles exist
    roles = await roles_collection.find({
        "_id": {"$in": assignment.role_ids},
        "company_id": {"$in": [None, current_user["company_id"]]}
    }).to_list(length=None)
    
    if len(roles) != len(assignment.role_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Some role IDs are invalid"
        )
    
    # Remove existing role assignments
    await user_roles_collection.delete_many({"user_id": assignment.user_id})
    
    # Create new assignments
    for role_id in assignment.role_ids:
        assignment_doc = {
            "_id": str(uuid.uuid4()),
            "user_id": assignment.user_id,
            "role_id": role_id,
            "company_id": current_user["company_id"],
            "assigned_at": datetime.utcnow(),
            "assigned_by": current_user["_id"]
        }
        await user_roles_collection.insert_one(assignment_doc)
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="roles_assigned",
        details={"target_user_id": assignment.user_id, "role_ids": assignment.role_ids}
    )
    
    return {"message": "Roles assigned successfully", "role_count": len(assignment.role_ids)}

@rbac_router.get("/users/{user_id}/roles", response_model=List[RoleResponse])
async def get_user_roles(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get roles assigned to a user"""
    
    # Users can view their own roles, admins can view any user's roles
    if user_id != current_user["_id"] and not await has_permission(current_user["_id"], "users:view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    # Get role assignments
    assignments = await user_roles_collection.find({"user_id": user_id}).to_list(length=None)
    role_ids = [a["role_id"] for a in assignments]
    
    if not role_ids:
        return []
    
    # Get role details
    roles = await roles_collection.find({"_id": {"$in": role_ids}}).to_list(length=None)
    
    role_responses = []
    for role in roles:
        permissions = await get_role_permissions(role["_id"])
        user_count = await user_roles_collection.count_documents({"role_id": role["_id"]})
        
        role_responses.append(RoleResponse(
            id=role["_id"],
            name=role.get("display_name", role["name"]),
            description=role.get("description"),
            permissions=permissions,
            is_system=role.get("is_system", False),
            user_count=user_count,
            created_at=role["created_at"],
            updated_at=role["updated_at"]
        ))
    
    return role_responses

@rbac_router.get("/users/{user_id}/permissions", response_model=List[PermissionResponse])
async def get_user_permissions(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get all permissions for a user (aggregated from roles)"""
    
    # Users can view their own permissions, admins can view any user's permissions
    if user_id != current_user["_id"] and not await has_permission(current_user["_id"], "users:view"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    permissions = await get_user_all_permissions(user_id)
    return permissions

# ============================================================================
# MENU MANAGEMENT
# ============================================================================

@rbac_router.post("/menus", response_model=MenuResponse)
async def create_menu(
    menu_data: MenuCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a menu item (Superadmin only)"""
    
    if not await is_superadmin(current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only superadmin can create menus"
        )
    
    menu_id = str(uuid.uuid4())
    menu_doc = {
        "_id": menu_id,
        "name": menu_data.name,
        "label": menu_data.label,
        "icon": menu_data.icon,
        "path": menu_data.path,
        "parent_id": menu_data.parent_id,
        "order": menu_data.order,
        "required_permissions": menu_data.required_permissions,
        "is_active": menu_data.is_active,
        "created_at": datetime.utcnow(),
        "created_by": current_user["_id"]
    }
    
    await menus_collection.insert_one(menu_doc)
    
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="menu_created",
        details={"menu_id": menu_id, "name": menu_data.name}
    )
    
    return MenuResponse(**menu_doc, id=menu_id, children=[])

@rbac_router.get("/menus", response_model=List[MenuResponse])
async def list_menus(
    current_user: dict = Depends(get_current_user)
):
    """Get menu structure for current user based on permissions"""
    
    # Get all active menus
    all_menus = await menus_collection.find({"is_active": True}).sort("order", 1).to_list(length=None)
    
    # Get user permissions
    user_permissions = await get_user_all_permissions(current_user["_id"])
    user_permission_names = [p.name for p in user_permissions]
    
    # Check if user is superadmin
    is_super = await is_superadmin(current_user["_id"])
    
    # Filter menus based on permissions
    accessible_menus = []
    for menu in all_menus:
        required_perms = menu.get("required_permissions", [])
        
        # Superadmin can see all menus
        if is_super:
            accessible = True
        # Check if user has all required permissions
        elif not required_perms:
            accessible = True
        else:
            accessible = all(perm in user_permission_names for perm in required_perms)
        
        if accessible:
            menu_response = MenuResponse(
                id=menu["_id"],
                name=menu["name"],
                label=menu["label"],
                icon=menu.get("icon"),
                path=menu["path"],
                parent_id=menu.get("parent_id"),
                order=menu["order"],
                required_permissions=menu.get("required_permissions", []),
                is_active=menu["is_active"],
                children=[]
            )
            accessible_menus.append(menu_response)
    
    # Build hierarchical structure
    menu_dict = {menu.id: menu for menu in accessible_menus}
    root_menus = []
    
    for menu in accessible_menus:
        if menu.parent_id and menu.parent_id in menu_dict:
            menu_dict[menu.parent_id].children.append(menu)
        elif not menu.parent_id:
            root_menus.append(menu)
    
    return root_menus

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

async def get_role_permissions(role_id: str) -> List[PermissionResponse]:
    """Get all permissions for a role"""
    role = await roles_collection.find_one({"_id": role_id})
    if not role or not role.get("permission_ids"):
        return []
    
    permissions = await permissions_collection.find({
        "_id": {"$in": role["permission_ids"]}
    }).to_list(length=None)
    
    return [
        PermissionResponse(
            id=perm["_id"],
            name=perm["name"],
            resource=perm["resource"],
            action=perm["action"],
            description=perm.get("description"),
            created_at=perm["created_at"],
            is_system=perm.get("is_system", False)
        )
        for perm in permissions
    ]

async def get_user_all_permissions(user_id: str) -> List[PermissionResponse]:
    """Get all permissions for a user (aggregated from all roles)"""
    
    # Get user's role assignments
    assignments = await user_roles_collection.find({"user_id": user_id}).to_list(length=None)
    role_ids = [a["role_id"] for a in assignments]
    
    if not role_ids:
        return []
    
    # Get all roles
    roles = await roles_collection.find({"_id": {"$in": role_ids}}).to_list(length=None)
    
    # Collect all permission IDs (use set to avoid duplicates)
    permission_ids = set()
    for role in roles:
        if role.get("permission_ids"):
            permission_ids.update(role["permission_ids"])
    
    if not permission_ids:
        return []
    
    # Get permission details
    permissions = await permissions_collection.find({
        "_id": {"$in": list(permission_ids)}
    }).to_list(length=None)
    
    return [
        PermissionResponse(
            id=perm["_id"],
            name=perm["name"],
            resource=perm["resource"],
            action=perm["action"],
            description=perm.get("description"),
            created_at=perm["created_at"],
            is_system=perm.get("is_system", False)
        )
        for perm in permissions
    ]

async def has_permission(user_id: str, permission_name: str) -> bool:
    """Check if user has a specific permission"""
    
    # Check if superadmin (has all permissions)
    if await is_superadmin(user_id):
        return True
    
    # Get user permissions
    permissions = await get_user_all_permissions(user_id)
    permission_names = [p.name for p in permissions]
    
    return permission_name in permission_names

async def is_superadmin(user_id: str) -> bool:
    """Check if user is a superadmin"""
    
    # Check if user has superadmin role
    superadmin_role = await roles_collection.find_one({
        "name": SystemRole.SUPERADMIN,
        "is_system": True
    })
    
    if not superadmin_role:
        return False
    
    assignment = await user_roles_collection.find_one({
        "user_id": user_id,
        "role_id": superadmin_role["_id"]
    })
    
    return assignment is not None

# ============================================================================
# PERMISSION DECORATOR
# ============================================================================

def require_permission(permission_name: str):
    """Decorator to require specific permission"""
    async def permission_checker(current_user: dict = Depends(get_current_user)):
        if not await has_permission(current_user["_id"], permission_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission_name} required"
            )
        return current_user
    return permission_checker
