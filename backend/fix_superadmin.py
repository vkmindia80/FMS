"""
Superadmin Fix Script
Permanently fixes superadmin access by:
1. Ensuring RBAC is initialized
2. Creating/verifying superadmin role
3. Assigning superadmin to specified user or creating default superadmin
"""

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import sys

sys.path.append('/app/backend')
from auth import get_password_hash

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/afms_db")
client = AsyncIOMotorClient(MONGO_URL)
database = client.afms_db

# Collections
permissions_collection = database.permissions
roles_collection = database.roles
user_roles_collection = database.user_roles
users_collection = database.users
companies_collection = database.companies

async def ensure_superadmin_role():
    """Ensure superadmin role exists with all permissions"""
    print("🔍 Checking for superadmin role...")
    
    # Get all permissions
    all_permissions = await permissions_collection.find({}).to_list(length=None)
    permission_ids = [p["_id"] for p in all_permissions]
    
    # Check if superadmin role exists
    superadmin_role = await roles_collection.find_one({
        "name": "superadmin",
        "is_system": True
    })
    
    if not superadmin_role:
        print("  ⚠️  Superadmin role not found. Creating...")
        role_id = str(uuid.uuid4())
        superadmin_role = {
            "_id": role_id,
            "name": "superadmin",
            "display_name": "Super Admin",
            "description": "Full system access - cannot be modified or deleted",
            "permission_ids": permission_ids,
            "is_system": True,
            "applicable_on": "all",
            "company_id": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system"
        }
        await roles_collection.insert_one(superadmin_role)
        print(f"  ✅ Created superadmin role: {role_id}")
    else:
        print(f"  ✅ Superadmin role exists: {superadmin_role['_id']}")
        # Update permissions to ensure it has all
        await roles_collection.update_one(
            {"_id": superadmin_role["_id"]},
            {"$set": {"permission_ids": permission_ids}}
        )
        print(f"  ✅ Updated superadmin role with {len(permission_ids)} permissions")
    
    return superadmin_role["_id"] if superadmin_role else role_id

async def ensure_system_company():
    """Ensure system company exists"""
    print("🔍 Checking for system company...")
    
    system_company = await companies_collection.find_one({"name": "System"})
    
    if not system_company:
        print("  ⚠️  System company not found. Creating...")
        company_id = str(uuid.uuid4())
        system_company = {
            "_id": company_id,
            "name": "System",
            "type": "system",
            "created_at": datetime.utcnow(),
            "is_active": True,
            "settings": {
                "base_currency": "USD",
                "fiscal_year_start": "01-01",
                "date_format": "MM/DD/YYYY",
                "number_format": "US",
                "timezone": "UTC"
            }
        }
        await companies_collection.insert_one(system_company)
        print(f"  ✅ Created system company: {company_id}")
    else:
        company_id = system_company["_id"]
        print(f"  ✅ System company exists: {company_id}")
    
    return company_id

async def assign_superadmin_to_user(user_email, superadmin_role_id):
    """Assign superadmin role to a user"""
    print(f"🔍 Assigning superadmin role to {user_email}...")
    
    user = await users_collection.find_one({"email": user_email})
    if not user:
        print(f"  ❌ User {user_email} not found")
        return False
    
    # Check if already assigned
    existing_assignment = await user_roles_collection.find_one({
        "user_id": user["_id"],
        "role_id": superadmin_role_id
    })
    
    if existing_assignment:
        print(f"  ✅ User already has superadmin role")
        return True
    
    # Assign role
    assignment_id = str(uuid.uuid4())
    assignment = {
        "_id": assignment_id,
        "user_id": user["_id"],
        "role_id": superadmin_role_id,
        "company_id": user["company_id"],
        "assigned_at": datetime.utcnow(),
        "assigned_by": "system"
    }
    await user_roles_collection.insert_one(assignment)
    print(f"  ✅ Assigned superadmin role to {user_email}")
    return True

async def create_default_superadmin(superadmin_role_id, company_id):
    """Create default superadmin user if it doesn't exist"""
    print("🔍 Checking for default superadmin user...")
    
    superadmin_user = await users_collection.find_one({"email": "superadmin@afms.system"})
    
    if not superadmin_user:
        print("  ⚠️  Default superadmin user not found. Creating...")
        user_id = str(uuid.uuid4())
        hashed_password = get_password_hash("admin123")
        
        superadmin_user = {
            "_id": user_id,
            "email": "superadmin@afms.system",
            "password": hashed_password,
            "full_name": "System Administrator",
            "role": "admin",
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
        await users_collection.insert_one(superadmin_user)
        print(f"  ✅ Created superadmin user: {user_id}")
    else:
        user_id = superadmin_user["_id"]
        print(f"  ✅ Superadmin user exists: {user_id}")
        
        # Ensure user is active
        if not superadmin_user.get("is_active", True):
            await users_collection.update_one(
                {"_id": user_id},
                {"$set": {"is_active": True}}
            )
            print("  ✅ Activated superadmin user")
    
    # Assign superadmin role
    await assign_superadmin_to_user("superadmin@afms.system", superadmin_role_id)
    
    return user_id

async def main():
    print("=" * 60)
    print("SUPERADMIN FIX SCRIPT")
    print("=" * 60)
    
    # Ensure superadmin role exists
    superadmin_role_id = await ensure_superadmin_role()
    
    # Ensure system company exists
    company_id = await ensure_system_company()
    
    # Create/verify default superadmin user
    await create_default_superadmin(superadmin_role_id, company_id)
    
    # List all users
    print("\n📋 All users in database:")
    users = await users_collection.find({}).to_list(length=None)
    for user in users:
        # Check if user has superadmin role
        has_superadmin = await user_roles_collection.find_one({
            "user_id": user["_id"],
            "role_id": superadmin_role_id
        })
        superadmin_marker = " [SUPERADMIN]" if has_superadmin else ""
        status = "✅" if user.get("is_active", True) else "❌"
        print(f"  {status} {user['email']}{superadmin_marker}")
    
    print("\n" + "=" * 60)
    print("SUPERADMIN FIX COMPLETE!")
    print("=" * 60)
    print("\n🔑 Default Superadmin Credentials:")
    print("   Email: superadmin@afms.system")
    print("   Password: admin123")
    print("\n⚠️  IMPORTANT: Change password after first login!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(main())
