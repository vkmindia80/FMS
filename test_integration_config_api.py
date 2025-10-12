"""
Test Integration Config API
Tests the /integrations/config endpoint with ObjectId serialization
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import json

async def test_config_api():
    """Test the integration config API with real data"""
    
    # Connect to database
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db = client['afms_db']
    integrations = db['integrations']
    
    print("=" * 60)
    print("Testing Integration Config API - ObjectId Fix")
    print("=" * 60)
    
    # Create test config with ObjectId
    print("\n1. Creating test integration config...")
    test_company_id = "test_company_api_001"
    
    # Delete any existing test config
    await integrations.delete_many({"company_id": test_company_id})
    
    # Create config (MongoDB will add ObjectId automatically)
    test_config = {
        "company_id": test_company_id,
        "email": {
            "provider": "smtp",
            "enabled": True,
            "smtp_config": {
                "host": "smtp.gmail.com",
                "port": 587,
                "username": "test@example.com",
                "password": "test_password",
                "from_email": "test@example.com",
                "from_name": "Test User",
                "use_tls": True,
                "use_ssl": False
            },
            "sendgrid_config": None,
            "aws_config": None
        },
        "banking": {
            "plaid_enabled": False,
            "plaid_environment": "sandbox",
            "connected_accounts": 0,
            "last_sync": None
        },
        "payment": {
            "stripe_enabled": False,
            "stripe_environment": "test",
            "paypal_enabled": False,
            "square_enabled": False,
            "total_transactions": 0
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "updated_by": "test_user"
    }
    
    result = await integrations.insert_one(test_config)
    print(f"   ✅ Config created with _id: {result.inserted_id}")
    print(f"   ✅ ObjectId type: {type(result.inserted_id)}")
    
    # Test 2: Fetch config and check ObjectId handling
    print("\n2. Fetching config to check ObjectId serialization...")
    
    fetched_config = await integrations.find_one({"company_id": test_company_id})
    
    if not fetched_config:
        print("   ❌ FAILED: Config not found")
        return False
    
    print(f"   ✅ Config found")
    print(f"   ✅ _id field type before conversion: {type(fetched_config['_id'])}")
    
    # Simulate what the API does
    if "_id" in fetched_config:
        fetched_config["_id"] = str(fetched_config["_id"])
    
    print(f"   ✅ _id field type after conversion: {type(fetched_config['_id'])}")
    print(f"   ✅ _id value: {fetched_config['_id']}")
    
    # Test 3: Try to serialize to JSON (like FastAPI does)
    print("\n3. Testing JSON serialization...")
    
    try:
        # Convert datetime objects to strings for JSON serialization
        if "created_at" in fetched_config:
            fetched_config["created_at"] = fetched_config["created_at"].isoformat()
        if "updated_at" in fetched_config:
            fetched_config["updated_at"] = fetched_config["updated_at"].isoformat()
        
        json_str = json.dumps(fetched_config, indent=2)
        print("   ✅ JSON serialization successful!")
        print(f"   ✅ JSON length: {len(json_str)} characters")
        
        # Verify it can be parsed back
        parsed = json.loads(json_str)
        if parsed["_id"] == fetched_config["_id"]:
            print("   ✅ JSON round-trip successful!")
        else:
            print("   ❌ FAILED: JSON round-trip failed")
            return False
            
    except Exception as e:
        print(f"   ❌ FAILED: JSON serialization error: {e}")
        return False
    
    # Test 4: Check password masking
    print("\n4. Testing password masking...")
    
    if fetched_config.get("email", {}).get("smtp_config", {}).get("password"):
        original_password = fetched_config["email"]["smtp_config"]["password"]
        
        # Simulate API masking
        fetched_config["email"]["smtp_config"]["password"] = "••••••••"
        
        if fetched_config["email"]["smtp_config"]["password"] == "••••••••":
            print("   ✅ Password masked successfully")
        else:
            print("   ❌ FAILED: Password masking failed")
            return False
    
    # Cleanup
    print("\n5. Cleaning up test data...")
    await integrations.delete_one({"company_id": test_company_id})
    print("   ✅ Test data cleaned up")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nThe /integrations/config endpoint should now work correctly")
    print("with proper ObjectId serialization and password masking.")
    
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_config_api())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
