"""
Multi-Tenant Utility Functions
Provides helpers for Super Admin cross-tenant access
"""

from typing import Optional, Dict, Any
from fastapi import Query
from database import user_roles_collection, roles_collection
from rbac import SystemRole
import logging

logger = logging.getLogger(__name__)


async def is_superadmin(user_id: str) -> bool:
    """
    Check if user is a superadmin
    Super Admins have cross-tenant access to all data
    """
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


def build_tenant_filter(
    current_user: dict,
    is_superadmin: bool,
    company_id_override: Optional[str] = None
) -> Dict[str, Any]:
    """
    Build MongoDB filter for tenant isolation
    
    Args:
        current_user: Current authenticated user
        is_superadmin: Whether user is a superadmin
        company_id_override: Optional company_id filter for superadmin
    
    Returns:
        Dict with company_id filter or empty dict for superadmin
    
    Example:
        Regular user: {"company_id": "user_company_id"}
        Super Admin (no override): {} # Can see all data
        Super Admin (with override): {"company_id": "specific_company_id"}
    """
    if is_superadmin:
        # Super Admin can see all tenants
        if company_id_override:
            # Optionally filter by specific company
            return {"company_id": company_id_override}
        else:
            # No filter - see all companies
            return {}
    else:
        # Regular users can only see their own company data
        return {"company_id": current_user["company_id"]}


async def build_tenant_query(
    current_user: dict,
    company_id_filter: Optional[str] = None,
    additional_filters: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Build complete MongoDB query with tenant filtering
    
    Args:
        current_user: Current authenticated user
        company_id_filter: Optional company_id filter (for superadmin)
        additional_filters: Additional query filters to merge
    
    Returns:
        Complete MongoDB query dict
    """
    # Check if user is superadmin
    is_super = await is_superadmin(current_user["_id"])
    
    # Build tenant filter
    tenant_filter = build_tenant_filter(current_user, is_super, company_id_filter)
    
    # Merge with additional filters
    query = {**tenant_filter}
    if additional_filters:
        query.update(additional_filters)
    
    # Log cross-tenant access for audit purposes
    if is_super and not tenant_filter:
        logger.info(f"🔍 Super Admin {current_user['email']} accessing cross-tenant data")
    elif is_super and company_id_filter:
        logger.info(f"🔍 Super Admin {current_user['email']} filtering by company: {company_id_filter}")
    
    return query


class TenantFilter:
    """
    FastAPI dependency for tenant filtering
    Automatically handles tenant isolation based on user role
    """
    def __init__(
        self,
        company_id: Optional[str] = Query(
            None,
            description="Company ID filter (Super Admin only). If not provided, Super Admin sees all tenants."
        )
    ):
        self.company_id = company_id
    
    async def get_query(self, current_user: dict) -> Dict[str, Any]:
        """Build tenant query for current user"""
        return await build_tenant_query(current_user, self.company_id)


# Query parameter dependency for optional company_id filtering
def company_id_param(
    company_id: Optional[str] = Query(
        None,
        description="Filter by company ID (Super Admin only)"
    )
) -> Optional[str]:
    """Query parameter for company_id filtering"""
    return company_id
