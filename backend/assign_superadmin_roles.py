"""
Script to assign superadmin role to admin@afms.com user
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

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/afms_db")
client = AsyncIOMotorClient(MONGO_URL)
database = client.afms_db

# Collections
roles_collection = database.roles
user_roles_collection = database.user_roles
users_collection = database.users
companies_collection = database.companies

async def assign_superadmin_role_to_admin():
    """Assign superadmin role to admin@afms.com"""
    print("=" * 60)
    print("ASSIGNING SUPERADMIN ROLE TO admin@afms.com")
    print("=" * 60)
    
    try:
        # Find the superadmin role
        superadmin_role = await roles_collection.find_one({
            "name": "superadmin",
            "is_system": True
        })
        
        if not superadmin_role:
            print("❌ Superadmin role not found! Run init_rbac.py first.")
            return
        
        print(f"✓ Found superadmin role: {superadmin_role['_id']}")
        
        # Find admin@afms.com user
        admin_user = await users_collection.find_one({"email": "admin@afms.com"})
        
        if not admin_user:
            print("\n❌ admin@afms.com user not found!")
            print("Creating admin@afms.com user...")
            
            # Create company for admin
            company_id = str(uuid.uuid4())
            company_doc = {
                "_id": company_id,
                "name": "AFMS Administration",
                "type": "corporate",
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
            print(f"  ✓ Created company: {company_id}")
            
            # Create admin user
            user_id = str(uuid.uuid4())
            hashed_password = get_password_hash("Admin@123456")
            
            user_doc = {
                "_id": user_id,
                "email": "admin@afms.com",
                "password": hashed_password,
                "full_name": "Primary Administrator",
                "role": "admin",
                "company_id": company_id,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "preferences": {
                    "theme": "light",
                    "language": "en",
                    "notifications": True
                }
            }
            await users_collection.insert_one(user_doc)
            print(f"  ✓ Created admin user: admin@afms.com")
            print(f"  ✓ Password: Admin@123456")
            
            admin_user = user_doc
        else:
            print(f"✓ Found admin user: {admin_user['_id']}")
            user_id = admin_user["_id"]
            company_id = admin_user["company_id"]
        
        # Check if role is already assigned
        existing_assignment = await user_roles_collection.find_one({
            "user_id": user_id,
            "role_id": superadmin_role["_id"]
        })
        
        if existing_assignment:
            print(f"✓ Superadmin role already assigned to admin@afms.com")
        else:
            # Assign superadmin role
            assignment_doc = {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "role_id": superadmin_role["_id"],
                "company_id": company_id,
                "assigned_at": datetime.utcnow(),
                "assigned_by": "system"
            }
            await user_roles_collection.insert_one(assignment_doc)
            print(f"✓ Assigned superadmin role to admin@afms.com")
        
        # Also assign Administrator role for compatibility
        admin_role = await roles_collection.find_one({
            "name": "admin",
            "is_system": True
        })
        
        if admin_role:
            existing_admin_assignment = await user_roles_collection.find_one({
                "user_id": user_id,
                "role_id": admin_role["_id"]
            })
            
            if not existing_admin_assignment:
                assignment_doc = {
                    "_id": str(uuid.uuid4()),
                    "user_id": user_id,
                    "role_id": admin_role["_id"],
                    "company_id": company_id,
                    "assigned_at": datetime.utcnow(),
                    "assigned_by": "system"
                }
                await user_roles_collection.insert_one(assignment_doc)
                print(f"✓ Assigned Administrator role to admin@afms.com")
        
        # Get all role assignments for this user
        assignments = await user_roles_collection.find({"user_id": user_id}).to_list(length=None)
        print(f"\nTotal roles assigned to admin@afms.com: {len(assignments)}")
        
        for assignment in assignments:
            role = await roles_collection.find_one({"_id": assignment["role_id"]})
            if role:
                print(f"  - {role['display_name']}")
        
        print("\n" + "=" * 60)
        print("ASSIGNMENT COMPLETE!")
        print("=" * 60)
        print("\nYou can now login with:")
        print("  Email: admin@afms.com")
        print("  Password: Admin@123456")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(assign_superadmin_role_to_admin())
