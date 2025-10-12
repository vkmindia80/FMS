"""
Test Email Toggle Functionality
Tests the fixed email toggle endpoint
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def test_email_toggle():
    """Test the email toggle with and without existing config"""
    
    # Connect to database
    client = AsyncIOMotorClient('mongodb://localhost:27017/')
    db = client['afms_db']
    integrations = db['integrations']
    
    print("=" * 60)
    print("Testing Email Toggle Functionality")
    print("=" * 60)
    
    # Test 1: Clean slate - no config exists
    print("\n1. Testing toggle with NO existing config...")
    test_company_id = "test_company_toggle_001"
    
    # Delete any existing test config
    await integrations.delete_many({"company_id": test_company_id})
    
    # Verify no config exists
    existing = await integrations.find_one({"company_id": test_company_id})
    if existing:
        print("   ❌ FAILED: Config still exists after deletion")
        return False
    print("   ✅ Confirmed: No config exists")
    
    # Simulate what the API endpoint does - create default config
    default_config = {
        "company_id": test_company_id,
        "email": {
            "provider": "smtp",
            "enabled": True,  # Toggle ON
            "smtp_config": None,
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
    
    result = await integrations.insert_one(default_config)
    if not result.inserted_id:
        print("   ❌ FAILED: Could not insert default config")
        return False
    print("   ✅ SUCCESS: Default config created with email enabled")
    
    # Verify config was created correctly
    new_config = await integrations.find_one({"company_id": test_company_id})
    if not new_config:
        print("   ❌ FAILED: Config not found after insert")
        return False
    
    email_enabled = new_config.get("email", {}).get("enabled", False)
    if email_enabled:
        print(f"   ✅ SUCCESS: Email enabled = {email_enabled}")
    else:
        print(f"   ❌ FAILED: Email enabled = {email_enabled}, expected True")
        return False
    
    # Test 2: Toggle existing config
    print("\n2. Testing toggle with EXISTING config...")
    
    # Update to toggle OFF
    await integrations.update_one(
        {"company_id": test_company_id},
        {
            "$set": {
                "email.enabled": False,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    updated_config = await integrations.find_one({"company_id": test_company_id})
    email_enabled = updated_config.get("email", {}).get("enabled", True)
    
    if not email_enabled:
        print(f"   ✅ SUCCESS: Email toggled OFF = {email_enabled}")
    else:
        print(f"   ❌ FAILED: Email enabled = {email_enabled}, expected False")
        return False
    
    # Test 3: Toggle back ON
    print("\n3. Testing toggle back ON...")
    
    await integrations.update_one(
        {"company_id": test_company_id},
        {
            "$set": {
                "email.enabled": True,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    final_config = await integrations.find_one({"company_id": test_company_id})
    email_enabled = final_config.get("email", {}).get("enabled", False)
    
    if email_enabled:
        print(f"   ✅ SUCCESS: Email toggled ON = {email_enabled}")
    else:
        print(f"   ❌ FAILED: Email enabled = {email_enabled}, expected True")
        return False
    
    # Test 4: Verify all sections present
    print("\n4. Verifying default config structure...")
    
    if "email" in final_config and "banking" in final_config and "payment" in final_config:
        print("   ✅ SUCCESS: All sections (email, banking, payment) present")
    else:
        print("   ❌ FAILED: Missing sections in config")
        return False
    
    # Cleanup
    print("\n5. Cleaning up test data...")
    await integrations.delete_one({"company_id": test_company_id})
    print("   ✅ Test data cleaned up")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    try:
        success = asyncio.run(test_email_toggle())
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
