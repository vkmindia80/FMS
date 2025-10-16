"""
Script to assign roles to demo account
"""

import asyncio
import uuid
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
import sys

sys.path.append('/app/backend')

load_dotenv()

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/afms_db")
client = AsyncIOMotorClient(MONGO_URL)
database = client.afms_db

# Collections
roles_collection = database.roles
user_roles_collection = database.user_roles
users_collection = database.users

async def assign_roles_to_demo():
    """Assign appropriate roles to demo account"""
    print("=" * 60)
    print("ASSIGNING ROLES TO DEMO ACCOUNT")
    print("=" * 60)
    
    try:
        # Find demo user
        demo_user = await users_collection.find_one({"email": "john.doe@testcompany.com"})
        
        if not demo_user:
            print("❌ Demo user not found!")
            print("\n💡 TIP: Create demo user first using:")
            print("   curl -X POST http://localhost:8001/api/auth/create-demo-user")
            return
        
        print(f"✓ Found demo user: {demo_user['_id']}")
        user_id = demo_user["_id"]
        company_id = demo_user["company_id"]
        
        # Find the Manager role (good for demo users)
        manager_role = await roles_collection.find_one({
            "name": "manager",
            "is_system": True
        })
        
        if not manager_role:
            print("❌ Manager role not found!")
            print("\n💡 TIP: Initialize RBAC first using:")
            print("   python3 /app/backend/init_rbac.py")
            return
        
        print(f"✓ Found manager role: {manager_role['_id']}")
        
        # Check if role is already assigned
        existing_assignment = await user_roles_collection.find_one({
            "user_id": user_id,
            "role_id": manager_role["_id"]
        })
        
        if existing_assignment:
            print(f"✅ Manager role already assigned to demo account")
        else:
            # Assign manager role
            assignment_doc = {
                "_id": str(uuid.uuid4()),
                "user_id": user_id,
                "role_id": manager_role["_id"],
                "company_id": company_id,
                "assigned_at": datetime.utcnow(),
                "assigned_by": "system"
            }
            await user_roles_collection.insert_one(assignment_doc)
            print(f"✅ Assigned Manager role to demo account")
        
        # Get all role assignments for this user
        assignments = await user_roles_collection.find({"user_id": user_id}).to_list(length=None)
        print(f"\n📊 Total roles assigned to demo account: {len(assignments)}")
        
        for assignment in assignments:
            role = await roles_collection.find_one({"_id": assignment["role_id"]})
            if role:
                print(f"  - {role['display_name']} ({len(role.get('permission_ids', []))} permissions)")
        
        print("\n" + "=" * 60)
        print("✅ ASSIGNMENT COMPLETE!")
        print("=" * 60)
        print("\n🔑 Demo account credentials:")
        print("  Email: john.doe@testcompany.com")
        print("  Password: testpassword123")
        print("\n📋 Manager role includes permissions for:")
        print("  - Dashboard, Transactions, Documents, Accounts")
        print("  - Reports, Invoices, Payments, Reconciliation")
        print("  - View users and settings")
        print("  - Integration Center, Currency Management")
        print("\n✨ The sidebar will now be visible in the demo account!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(assign_roles_to_demo())
