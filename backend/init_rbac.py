"""
RBAC Initialization Script
Creates default permissions, roles, menus, and superadmin user
Run this once to bootstrap the RBAC system
"""

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import sys

# Add parent directory to path
sys.path.append('/app/backend')

from auth import get_password_hash

load_dotenv()

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/afms_db")
client = AsyncIOMotorClient(MONGO_URL)
database = client.afms_db

# Collections
permissions_collection = database.permissions
roles_collection = database.roles
user_roles_collection = database.user_roles
menus_collection = database.menus
users_collection = database.users
companies_collection = database.companies

# ============================================================================
# DEFAULT PERMISSIONS
# ============================================================================

DEFAULT_PERMISSIONS = [
    # Dashboard
    {"name": "dashboard:view", "resource": "dashboard", "action": "view", "description": "View dashboard"},
    
    # Transactions
    {"name": "transactions:view", "resource": "transactions", "action": "view", "description": "View transactions"},
    {"name": "transactions:create", "resource": "transactions", "action": "create", "description": "Create transactions"},
    {"name": "transactions:edit", "resource": "transactions", "action": "edit", "description": "Edit transactions"},
    {"name": "transactions:delete", "resource": "transactions", "action": "delete", "description": "Delete transactions"},
    {"name": "transactions:export", "resource": "transactions", "action": "export", "description": "Export transactions"},
    {"name": "transactions:import", "resource": "transactions", "action": "import", "description": "Import transactions"},
    
    # Accounts
    {"name": "accounts:view", "resource": "accounts", "action": "view", "description": "View chart of accounts"},
    {"name": "accounts:create", "resource": "accounts", "action": "create", "description": "Create accounts"},
    {"name": "accounts:edit", "resource": "accounts", "action": "edit", "description": "Edit accounts"},
    {"name": "accounts:delete", "resource": "accounts", "action": "delete", "description": "Delete accounts"},
    
    # Documents
    {"name": "documents:view", "resource": "documents", "action": "view", "description": "View documents"},
    {"name": "documents:create", "resource": "documents", "action": "create", "description": "Upload documents"},
    {"name": "documents:edit", "resource": "documents", "action": "edit", "description": "Edit documents"},
    {"name": "documents:delete", "resource": "documents", "action": "delete", "description": "Delete documents"},
    
    # Reports
    {"name": "reports:view", "resource": "reports", "action": "view", "description": "View reports"},
    {"name": "reports:create", "resource": "reports", "action": "create", "description": "Create reports"},
    {"name": "reports:export", "resource": "reports", "action": "export", "description": "Export reports"},
    
    # Invoices
    {"name": "invoices:view", "resource": "invoices", "action": "view", "description": "View invoices"},
    {"name": "invoices:create", "resource": "invoices", "action": "create", "description": "Create invoices"},
    {"name": "invoices:edit", "resource": "invoices", "action": "edit", "description": "Edit invoices"},
    {"name": "invoices:delete", "resource": "invoices", "action": "delete", "description": "Delete invoices"},
    
    # Payments
    {"name": "payments:view", "resource": "payments", "action": "view", "description": "View payments"},
    {"name": "payments:create", "resource": "payments", "action": "create", "description": "Process payments"},
    
    # Bank Connections
    {"name": "bank_connections:view", "resource": "bank_connections", "action": "view", "description": "View bank connections"},
    {"name": "bank_connections:create", "resource": "bank_connections", "action": "create", "description": "Connect banks"},
    {"name": "bank_connections:manage", "resource": "bank_connections", "action": "manage", "description": "Manage bank connections"},
    
    # Reconciliation
    {"name": "reconciliation:view", "resource": "reconciliation", "action": "view", "description": "View reconciliations"},
    {"name": "reconciliation:create", "resource": "reconciliation", "action": "create", "description": "Create reconciliations"},
    {"name": "reconciliation:approve", "resource": "reconciliation", "action": "approve", "description": "Approve reconciliations"},
    
    # Users
    {"name": "users:view", "resource": "users", "action": "view", "description": "View users"},
    {"name": "users:create", "resource": "users", "action": "create", "description": "Create users"},
    {"name": "users:edit", "resource": "users", "action": "edit", "description": "Edit users"},
    {"name": "users:delete", "resource": "users", "action": "delete", "description": "Delete users"},
    {"name": "users:manage", "resource": "users", "action": "manage", "description": "Manage user roles"},
    
    # Roles
    {"name": "roles:view", "resource": "roles", "action": "view", "description": "View roles"},
    {"name": "roles:create", "resource": "roles", "action": "create", "description": "Create roles"},
    {"name": "roles:edit", "resource": "roles", "action": "edit", "description": "Edit roles"},
    {"name": "roles:delete", "resource": "roles", "action": "delete", "description": "Delete roles"},
    
    # Settings
    {"name": "settings:view", "resource": "settings", "action": "view", "description": "View settings"},
    {"name": "settings:edit", "resource": "settings", "action": "edit", "description": "Edit settings"},
    
    # Audit Logs
    {"name": "audit_logs:view", "resource": "audit_logs", "action": "view", "description": "View audit logs"},
    
    # Integrations
    {"name": "integrations:view", "resource": "integrations", "action": "view", "description": "View integrations"},
    {"name": "integrations:manage", "resource": "integrations", "action": "manage", "description": "Manage integrations"},
    
    # Company
    {"name": "company:view", "resource": "company", "action": "view", "description": "View company info"},
    {"name": "company:edit", "resource": "company", "action": "edit", "description": "Edit company info"},
]

# ============================================================================
# DEFAULT ROLES
# ============================================================================

async def create_default_permissions():
    """Create default permissions"""
    print("Creating default permissions...")
    
    permission_ids = {}
    
    for perm_data in DEFAULT_PERMISSIONS:
        # Check if permission already exists
        existing = await permissions_collection.find_one({"name": perm_data["name"]})
        
        if existing:
            permission_ids[perm_data["name"]] = existing["_id"]
            print(f"  ✓ Permission '{perm_data['name']}' already exists")
        else:
            perm_id = str(uuid.uuid4())
            perm_doc = {
                "_id": perm_id,
                "name": perm_data["name"],
                "resource": perm_data["resource"],
                "action": perm_data["action"],
                "description": perm_data["description"],
                "is_system": True,
                "company_id": None,
                "created_at": datetime.utcnow(),
                "created_by": "system"
            }
            await permissions_collection.insert_one(perm_doc)
            permission_ids[perm_data["name"]] = perm_id
            print(f"  ✓ Created permission '{perm_data['name']}'")
    
    return permission_ids

async def create_default_roles(permission_ids):
    """Create default system roles"""
    print("\nCreating default roles...")
    
    # Define role configurations
    roles_config = {
        "superadmin": {
            "display_name": "Super Admin",
            "description": "Full system access - cannot be modified or deleted",
            "permissions": list(permission_ids.keys()),  # All permissions
            "is_system": True
        },
        "admin": {
            "display_name": "Administrator",
            "description": "Company administrator with full access except system management",
            "permissions": [
                "dashboard:view",
                "transactions:view", "transactions:create", "transactions:edit", "transactions:delete",
                "transactions:export", "transactions:import",
                "accounts:view", "accounts:create", "accounts:edit", "accounts:delete",
                "documents:view", "documents:create", "documents:edit", "documents:delete",
                "reports:view", "reports:create", "reports:export",
                "invoices:view", "invoices:create", "invoices:edit", "invoices:delete",
                "payments:view", "payments:create",
                "bank_connections:view", "bank_connections:create", "bank_connections:manage",
                "reconciliation:view", "reconciliation:create", "reconciliation:approve",
                "users:view", "users:create", "users:edit", "users:manage",
                "roles:view", "roles:create", "roles:edit",
                "settings:view", "settings:edit",
                "audit_logs:view",
                "integrations:view", "integrations:manage",
                "company:view", "company:edit"
            ],
            "is_system": True
        },
        "manager": {
            "display_name": "Manager",
            "description": "Can manage transactions, reports, and view most data",
            "permissions": [
                "dashboard:view",
                "transactions:view", "transactions:create", "transactions:edit",
                "transactions:export",
                "accounts:view",
                "documents:view", "documents:create", "documents:edit",
                "reports:view", "reports:create", "reports:export",
                "invoices:view", "invoices:create", "invoices:edit",
                "payments:view", "payments:create",
                "bank_connections:view",
                "reconciliation:view", "reconciliation:create",
                "users:view",
                "settings:view",
                "company:view"
            ],
            "is_system": True
        },
        "user": {
            "display_name": "User",
            "description": "Basic user with limited permissions",
            "permissions": [
                "dashboard:view",
                "transactions:view", "transactions:create",
                "accounts:view",
                "documents:view", "documents:create",
                "reports:view",
                "invoices:view",
                "payments:view",
                "settings:view"
            ],
            "is_system": True
        },
        "auditor": {
            "display_name": "Auditor",
            "description": "Read-only access for auditing purposes",
            "permissions": [
                "dashboard:view",
                "transactions:view",
                "accounts:view",
                "documents:view",
                "reports:view", "reports:export",
                "invoices:view",
                "payments:view",
                "audit_logs:view",
                "company:view"
            ],
            "is_system": True
        }
    }
    
    role_ids = {}
    
    for role_name, role_config in roles_config.items():
        # Check if role already exists
        existing = await roles_collection.find_one({"name": role_name, "is_system": True})
        
        if existing:
            role_ids[role_name] = existing["_id"]
            print(f"  ✓ Role '{role_config['display_name']}' already exists")
        else:
            role_id = str(uuid.uuid4())
            
            # Convert permission names to IDs
            perm_ids = [permission_ids[pname] for pname in role_config["permissions"] if pname in permission_ids]
            
            role_doc = {
                "_id": role_id,
                "name": role_name,
                "display_name": role_config["display_name"],
                "description": role_config["description"],
                "permission_ids": perm_ids,
                "is_system": role_config["is_system"],
                "company_id": None,  # System-wide role
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "created_by": "system"
            }
            
            await roles_collection.insert_one(role_doc)
            role_ids[role_name] = role_id
            print(f"  ✓ Created role '{role_config['display_name']}' with {len(perm_ids)} permissions")
    
    return role_ids

async def create_default_menus():
    """Create default menu structure"""
    print("\nCreating default menus...")
    
    menus = [
        {
            "name": "dashboard",
            "label": "Dashboard",
            "icon": "dashboard",
            "path": "/dashboard",
            "parent_id": None,
            "order": 1,
            "required_permissions": ["dashboard:view"],
            "is_active": True
        },
        {
            "name": "transactions",
            "label": "Transactions",
            "icon": "receipt",
            "path": "/transactions",
            "parent_id": None,
            "order": 2,
            "required_permissions": ["transactions:view"],
            "is_active": True
        },
        {
            "name": "accounts",
            "label": "Chart of Accounts",
            "icon": "account_balance",
            "path": "/accounts",
            "parent_id": None,
            "order": 3,
            "required_permissions": ["accounts:view"],
            "is_active": True
        },
        {
            "name": "documents",
            "label": "Documents",
            "icon": "description",
            "path": "/documents",
            "parent_id": None,
            "order": 4,
            "required_permissions": ["documents:view"],
            "is_active": True
        },
        {
            "name": "reports",
            "label": "Reports",
            "icon": "bar_chart",
            "path": "/reports",
            "parent_id": None,
            "order": 5,
            "required_permissions": ["reports:view"],
            "is_active": True
        },
        {
            "name": "invoices",
            "label": "Invoices",
            "icon": "receipt_long",
            "path": "/invoices",
            "parent_id": None,
            "order": 6,
            "required_permissions": ["invoices:view"],
            "is_active": True
        },
        {
            "name": "payments",
            "label": "Payments",
            "icon": "payment",
            "path": "/payments",
            "parent_id": None,
            "order": 7,
            "required_permissions": ["payments:view"],
            "is_active": True
        },
        {
            "name": "banking",
            "label": "Banking",
            "icon": "account_balance",
            "path": "/banking",
            "parent_id": None,
            "order": 8,
            "required_permissions": ["bank_connections:view"],
            "is_active": True
        },
        {
            "name": "reconciliation",
            "label": "Reconciliation",
            "icon": "compare_arrows",
            "path": "/reconciliation",
            "parent_id": None,
            "order": 9,
            "required_permissions": ["reconciliation:view"],
            "is_active": True
        },
        {
            "name": "settings",
            "label": "Settings",
            "icon": "settings",
            "path": "/settings",
            "parent_id": None,
            "order": 10,
            "required_permissions": ["settings:view"],
            "is_active": True
        },
        {
            "name": "admin",
            "label": "Administration",
            "icon": "admin_panel_settings",
            "path": "/admin",
            "parent_id": None,
            "order": 11,
            "required_permissions": ["users:manage", "roles:view"],
            "is_active": True
        }
    ]
    
    for menu_data in menus:
        existing = await menus_collection.find_one({"name": menu_data["name"]})
        
        if existing:
            print(f"  ✓ Menu '{menu_data['label']}' already exists")
        else:
            menu_id = str(uuid.uuid4())
            menu_doc = {
                "_id": menu_id,
                **menu_data,
                "created_at": datetime.utcnow(),
                "created_by": "system"
            }
            await menus_collection.insert_one(menu_doc)
            print(f"  ✓ Created menu '{menu_data['label']}'")

async def create_superadmin_user(role_ids):
    """Create superadmin user"""
    print("\nCreating superadmin user...")
    
    # Check if superadmin already exists
    existing_superadmin = await users_collection.find_one({"email": "superadmin@afms.system"})
    
    if existing_superadmin:
        print("  ℹ Superadmin user already exists")
        return existing_superadmin["_id"]
    
    # Create system company for superadmin
    system_company_id = str(uuid.uuid4())
    company_doc = {
        "_id": system_company_id,
        "name": "System Administration",
        "type": "system",
        "is_active": True,
        "settings": {
            "base_currency": "USD",
            "fiscal_year_start": "01-01",
            "date_format": "MM/DD/YYYY",
            "number_format": "US",
            "timezone": "UTC"
        },
        "created_at": datetime.utcnow()
    }
    await companies_collection.insert_one(company_doc)
    print(f"  ✓ Created system company: {system_company_id}")
    
    # Create superadmin user
    user_id = str(uuid.uuid4())
    hashed_password = get_password_hash("admin123")
    
    user_doc = {
        "_id": user_id,
        "email": "superadmin@afms.system",
        "password": hashed_password,
        "full_name": "Super Administrator",
        "role": "admin",  # Legacy field
        "company_id": system_company_id,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "phone": None,
        "job_title": "System Administrator",
        "department": "IT",
        "preferences": {}
    }
    
    await users_collection.insert_one(user_doc)
    print(f"  ✓ Created superadmin user: superadmin@afms.system")
    print(f"  ✓ Password: admin123")
    
    # Assign superadmin role
    if "superadmin" in role_ids:
        assignment_doc = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "role_id": role_ids["superadmin"],
            "company_id": system_company_id,
            "assigned_at": datetime.utcnow(),
            "assigned_by": "system"
        }
        await user_roles_collection.insert_one(assignment_doc)
        print(f"  ✓ Assigned superadmin role")
    
    return user_id

async def initialize_rbac():
    """Main initialization function"""
    print("=" * 60)
    print("RBAC SYSTEM INITIALIZATION")
    print("=" * 60)
    
    try:
        # Create permissions
        permission_ids = await create_default_permissions()
        print(f"\n✓ Created/verified {len(permission_ids)} permissions")
        
        # Create roles
        role_ids = await create_default_roles(permission_ids)
        print(f"\n✓ Created/verified {len(role_ids)} roles")
        
        # Create menus
        await create_default_menus()
        print(f"\n✓ Created/verified default menu structure")
        
        # Create superadmin user
        superadmin_id = await create_superadmin_user(role_ids)
        print(f"\n✓ Created/verified superadmin user")
        
        print("\n" + "=" * 60)
        print("RBAC INITIALIZATION COMPLETE!")
        print("=" * 60)
        print("\nSuperadmin Credentials:")
        print("  Email: superadmin@afms.system")
        print("  Password: admin123")
        print("\n⚠️  IMPORTANT: Change the superadmin password after first login!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(initialize_rbac())
