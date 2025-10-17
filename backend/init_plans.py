"""
Initialize default subscription plans with menu access control
Run this script to create Basic, Pro, and Enterprise plans
"""

import asyncio
import uuid
from datetime import datetime
from database import database

plans_collection = database.plans


async def init_default_plans():
    """Initialize default subscription plans"""
    
    print("🎯 Initializing default subscription plans...")
    
    # Check if plans already exist
    existing_count = await plans_collection.count_documents({})
    if existing_count > 0:
        print(f"⚠️  Plans already exist ({existing_count} plans found). Skipping initialization.")
        return
    
    # Define default plans with menu access
    default_plans = [
        {
            "_id": str(uuid.uuid4()),
            "name": "basic",
            "display_name": "Basic Plan",
            "description": "Essential features for small businesses and individuals",
            "price_monthly": 29.99,
            "price_yearly": 299.99,
            "features": [
                "Up to 5 users",
                "Core accounting features",
                "Basic reporting",
                "10GB storage",
                "Email support"
            ],
            "menu_access": [
                {"menu_name": "dashboard", "menu_path": "/dashboard", "is_enabled": True},
                {"menu_name": "transactions", "menu_path": "/transactions", "is_enabled": True},
                {"menu_name": "accounts", "menu_path": "/accounts", "is_enabled": True},
                {"menu_name": "documents", "menu_path": "/documents", "is_enabled": True},
            ],
            "max_users": 5,
            "max_companies": 1,
            "storage_gb": 10,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "_id": str(uuid.uuid4()),
            "name": "pro",
            "display_name": "Pro Plan",
            "description": "Advanced features for growing businesses",
            "price_monthly": 79.99,
            "price_yearly": 799.99,
            "features": [
                "Up to 25 users",
                "All Basic features",
                "Advanced reporting & analytics",
                "Bank connections",
                "Payment processing",
                "Receivables management",
                "50GB storage",
                "Priority support"
            ],
            "menu_access": [
                {"menu_name": "dashboard", "menu_path": "/dashboard", "is_enabled": True},
                {"menu_name": "transactions", "menu_path": "/transactions", "is_enabled": True},
                {"menu_name": "accounts", "menu_path": "/accounts", "is_enabled": True},
                {"menu_name": "documents", "menu_path": "/documents", "is_enabled": True},
                {"menu_name": "reports", "menu_path": "/reports", "is_enabled": True},
                {"menu_name": "banking", "menu_path": "/banking", "is_enabled": True},
                {"menu_name": "payments", "menu_path": "/payments", "is_enabled": True},
                {"menu_name": "receivables", "menu_path": "/receivables", "is_enabled": True},
            ],
            "max_users": 25,
            "max_companies": 1,
            "storage_gb": 50,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system"
        },
        {
            "_id": str(uuid.uuid4()),
            "name": "enterprise",
            "display_name": "Enterprise Plan",
            "description": "Complete solution for large organizations",
            "price_monthly": 199.99,
            "price_yearly": 1999.99,
            "features": [
                "Unlimited users",
                "All Pro features",
                "Reconciliation engine",
                "Custom integrations",
                "Multi-currency support",
                "Role-based access control",
                "Audit logs & compliance",
                "Advanced security features",
                "Unlimited storage",
                "Dedicated support & SLA"
            ],
            "menu_access": [
                {"menu_name": "dashboard", "menu_path": "/dashboard", "is_enabled": True},
                {"menu_name": "transactions", "menu_path": "/transactions", "is_enabled": True},
                {"menu_name": "accounts", "menu_path": "/accounts", "is_enabled": True},
                {"menu_name": "documents", "menu_path": "/documents", "is_enabled": True},
                {"menu_name": "reports", "menu_path": "/reports", "is_enabled": True},
                {"menu_name": "banking", "menu_path": "/banking", "is_enabled": True},
                {"menu_name": "payments", "menu_path": "/payments", "is_enabled": True},
                {"menu_name": "receivables", "menu_path": "/receivables", "is_enabled": True},
                {"menu_name": "reconciliation", "menu_path": "/reconciliation", "is_enabled": True},
                {"menu_name": "integrations", "menu_path": "/integrations", "is_enabled": True},
                {"menu_name": "admin", "menu_path": "/admin", "is_enabled": True},
                {"menu_name": "settings", "menu_path": "/settings", "is_enabled": True},
            ],
            "max_users": None,  # Unlimited
            "max_companies": 10,
            "storage_gb": None,  # Unlimited
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "created_by": "system"
        }
    ]
    
    # Insert plans
    for plan in default_plans:
        await plans_collection.insert_one(plan)
        print(f"✅ Created plan: {plan['display_name']}")
    
    print(f"\n🎉 Successfully initialized {len(default_plans)} default plans!")
    print("\nPlans created:")
    print("  - Basic Plan: $29.99/month (5 users, core features)")
    print("  - Pro Plan: $79.99/month (25 users, advanced features)")
    print("  - Enterprise Plan: $199.99/month (unlimited users, all features)")


if __name__ == "__main__":
    asyncio.run(init_default_plans())
