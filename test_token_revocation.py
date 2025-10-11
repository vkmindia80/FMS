#!/usr/bin/env python3
"""
Test Token Revocation System independently
"""

import requests
import time
import sys

BASE_URL = "http://localhost:8001/api"

def test_token_revocation():
    """Test JWT token revocation system"""
    print("=" * 80)
    print("Token Revocation System Test")
    print("=" * 80)
    print()
    
    # Register a test user
    test_email = f"revoke_test_{int(time.time())}@example.com"
    test_password = "TestPass123!"
    
    print(f"1. Registering test user: {test_email}")
    register_response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "full_name": "Revocation Test User",
            "company_name": "Test Company"
        }
    )
    
    if register_response.status_code != 200:
        print(f"❌ Failed to register user: {register_response.status_code}")
        print(f"   Response: {register_response.json()}")
        sys.exit(1)
    
    print("✅ User registered successfully")
    tokens = register_response.json()
    access_token = tokens["access_token"]
    print(f"   Access token: {access_token[:20]}...")
    print()
    
    # Test 1: Token should work before logout
    print("2. Testing token BEFORE logout...")
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if me_response.status_code == 200:
        user_data = me_response.json()
        print(f"✅ Token is valid - User: {user_data['email']}")
    else:
        print(f"❌ Token failed before logout: {me_response.status_code}")
        sys.exit(1)
    print()
    
    # Test 2: Logout (revoke token)
    print("3. Logging out (revoking token)...")
    logout_response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    
    if logout_response.status_code == 200:
        logout_data = logout_response.json()
        print(f"✅ Logout successful")
        print(f"   Token revoked: {logout_data.get('token_revoked', False)}")
    else:
        print(f"❌ Logout failed: {logout_response.status_code}")
        sys.exit(1)
    print()
    
    # Test 3: Token should NOT work after logout
    print("4. Testing token AFTER logout...")
    me_response_after = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if me_response_after.status_code == 401:
        print("✅ Token correctly rejected after logout (REVOKED)")
        print(f"   Response: {me_response_after.json()['detail']}")
    else:
        print(f"❌ Token still works after logout: {me_response_after.status_code}")
        sys.exit(1)
    print()
    
    # Test 4: Login again to test revoke-all-tokens
    print("5. Logging in again to test revoke-all-tokens...")
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        sys.exit(1)
    
    new_token = login_response.json()["access_token"]
    new_headers = {"Authorization": f"Bearer {new_token}"}
    print(f"✅ Logged in successfully")
    print(f"   New access token: {new_token[:20]}...")
    print()
    
    # Test 5: Revoke all tokens
    print("6. Revoking all user tokens...")
    revoke_all_response = requests.post(
        f"{BASE_URL}/auth/revoke-all-tokens",
        headers=new_headers
    )
    
    if revoke_all_response.status_code == 200:
        print("✅ All tokens revoked successfully")
    else:
        print(f"❌ Revoke all failed: {revoke_all_response.status_code}")
        sys.exit(1)
    print()
    
    # Test 6: Try to use token after revoking all
    print("7. Testing token after revoke-all...")
    me_response_revoked = requests.get(f"{BASE_URL}/auth/me", headers=new_headers)
    
    if me_response_revoked.status_code == 401:
        print("✅ Token correctly rejected after revoke-all")
        print(f"   Response: {me_response_revoked.json()['detail']}")
    else:
        print(f"❌ Token still works after revoke-all: {me_response_revoked.status_code}")
        sys.exit(1)
    print()
    
    print("=" * 80)
    print("🎉 ALL TOKEN REVOCATION TESTS PASSED!")
    print("=" * 80)

if __name__ == "__main__":
    try:
        test_token_revocation()
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Test error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
