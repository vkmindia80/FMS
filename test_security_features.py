#!/usr/bin/env python3
"""
Comprehensive Security Features Test Script
Tests JWT validation, token revocation, rate limiting, and password complexity
"""

import requests
import time
import json
from typing import Dict, Any

# Base URL for API
BASE_URL = "http://localhost:8001/api"

# Test results tracker
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(test_name: str, passed: bool, message: str):
    """Log test result"""
    test_results["tests"].append({
        "test": test_name,
        "passed": passed,
        "message": message
    })
    if passed:
        test_results["passed"] += 1
        print(f"✅ PASS: {test_name}")
        print(f"   {message}")
    else:
        test_results["failed"] += 1
        print(f"❌ FAIL: {test_name}")
        print(f"   {message}")
    print()

def test_password_complexity():
    """Test password complexity requirements"""
    print("=" * 80)
    print("TEST 1: Password Complexity Validation")
    print("=" * 80)
    
    weak_passwords = [
        ("short", "Password must be at least 8 characters long"),
        ("lowercase", "Password must contain at least one uppercase letter"),
        ("UPPERCASE", "Password must contain at least one lowercase letter"),
        ("NoNumbers!", "Password must contain at least one number"),
        ("NoSpecial123", "Password must contain at least one special character"),
    ]
    
    for password, expected_error in weak_passwords:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": f"test_{int(time.time())}@example.com",
                "password": password,
                "full_name": "Test User",
                "company_name": "Test Company"
            }
        )
        
        if response.status_code == 422:
            error_detail = response.json().get("detail", [])
            # Check if password validation error is present
            password_errors = [e for e in error_detail if "password" in str(e).lower()]
            if password_errors:
                log_test(
                    f"Password Complexity: '{password}'",
                    True,
                    f"Correctly rejected weak password: {expected_error}"
                )
            else:
                log_test(
                    f"Password Complexity: '{password}'",
                    False,
                    f"Expected password error but got: {error_detail}"
                )
        else:
            log_test(
                f"Password Complexity: '{password}'",
                False,
                f"Expected 422 status but got {response.status_code}"
            )
    
    # Test strong password (should succeed)
    strong_password = "StrongPass123!"
    response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": f"test_strong_{int(time.time())}@example.com",
            "password": strong_password,
            "full_name": "Test User",
            "company_name": "Test Company"
        }
    )
    
    if response.status_code == 200:
        log_test(
            "Password Complexity: Strong Password",
            True,
            "Strong password accepted successfully"
        )
    else:
        log_test(
            "Password Complexity: Strong Password",
            False,
            f"Strong password rejected: {response.json()}"
        )

def test_rate_limiting():
    """Test rate limiting on login and register endpoints"""
    print("=" * 80)
    print("TEST 2: Rate Limiting")
    print("=" * 80)
    
    # Test login rate limiting (5 requests per 5 minutes)
    print("Testing login rate limiting (5 requests per 5 minutes)...")
    login_attempts = 0
    rate_limited = False
    
    for i in range(7):  # Try 7 times (should be rate limited after 5)
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "WrongPass123!"
            }
        )
        login_attempts += 1
        
        if response.status_code == 429:
            rate_limited = True
            log_test(
                "Login Rate Limiting",
                True,
                f"Rate limited after {login_attempts} attempts (expected after 5)"
            )
            break
        
        time.sleep(0.5)  # Small delay between requests
    
    if not rate_limited:
        log_test(
            "Login Rate Limiting",
            False,
            f"Not rate limited after {login_attempts} attempts"
        )
    
    # Test register rate limiting (5 requests per 5 minutes)
    print("Testing register rate limiting (5 requests per 5 minutes)...")
    register_attempts = 0
    rate_limited = False
    
    for i in range(7):  # Try 7 times (should be rate limited after 5)
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": f"test_rate_{i}_{int(time.time())}@example.com",
                "password": "StrongPass123!",
                "full_name": "Test User",
                "company_name": "Test Company"
            }
        )
        register_attempts += 1
        
        if response.status_code == 429:
            rate_limited = True
            log_test(
                "Register Rate Limiting",
                True,
                f"Rate limited after {register_attempts} attempts (expected after 5)"
            )
            break
        
        time.sleep(0.5)  # Small delay between requests
    
    if not rate_limited:
        log_test(
            "Register Rate Limiting",
            False,
            f"Not rate limited after {register_attempts} attempts"
        )

def test_token_revocation():
    """Test JWT token revocation system"""
    print("=" * 80)
    print("TEST 3: Token Revocation System")
    print("=" * 80)
    
    # Wait a bit to avoid rate limiting from previous tests
    print("Waiting 2 seconds to avoid rate limiting...")
    time.sleep(2)
    
    # Register a test user
    test_email = f"test_revoke_{int(time.time())}@example.com"
    test_password = "TestPass123!"
    
    register_response = requests.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": test_email,
            "password": test_password,
            "full_name": "Test User",
            "company_name": "Test Company"
        }
    )
    
    if register_response.status_code != 200:
        log_test(
            "Token Revocation: User Registration",
            False,
            f"Failed to register test user: {register_response.json()}"
        )
        return
    
    tokens = register_response.json()
    access_token = tokens["access_token"]
    
    # Test 1: Token should work before logout
    headers = {"Authorization": f"Bearer {access_token}"}
    me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if me_response.status_code == 200:
        log_test(
            "Token Revocation: Token Valid Before Logout",
            True,
            "Token works correctly before logout"
        )
    else:
        log_test(
            "Token Revocation: Token Valid Before Logout",
            False,
            f"Token failed before logout: {me_response.status_code}"
        )
    
    # Test 2: Logout (revoke token)
    logout_response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    
    if logout_response.status_code == 200:
        log_test(
            "Token Revocation: Logout Request",
            True,
            "Logout successful"
        )
    else:
        log_test(
            "Token Revocation: Logout Request",
            False,
            f"Logout failed: {logout_response.status_code}"
        )
    
    # Test 3: Token should NOT work after logout
    me_response_after = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    if me_response_after.status_code == 401:
        log_test(
            "Token Revocation: Token Invalid After Logout",
            True,
            "Token correctly rejected after logout (revoked)"
        )
    else:
        log_test(
            "Token Revocation: Token Invalid After Logout",
            False,
            f"Token still works after logout: {me_response_after.status_code}"
        )
    
    # Test 4: Test revoke all user tokens
    # Login again to get new token
    login_response = requests.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": test_email,
            "password": test_password
        }
    )
    
    if login_response.status_code == 200:
        new_token = login_response.json()["access_token"]
        new_headers = {"Authorization": f"Bearer {new_token}"}
        
        # Revoke all tokens
        revoke_all_response = requests.post(
            f"{BASE_URL}/auth/revoke-all-tokens",
            headers=new_headers
        )
        
        if revoke_all_response.status_code == 200:
            log_test(
                "Token Revocation: Revoke All Tokens Request",
                True,
                "Revoke all tokens request successful"
            )
            
            # Try to use token after revoking all
            me_response_revoked = requests.get(f"{BASE_URL}/auth/me", headers=new_headers)
            
            if me_response_revoked.status_code == 401:
                log_test(
                    "Token Revocation: Token Invalid After Revoke All",
                    True,
                    "Token correctly rejected after revoke-all"
                )
            else:
                log_test(
                    "Token Revocation: Token Invalid After Revoke All",
                    False,
                    f"Token still works after revoke-all: {me_response_revoked.status_code}"
                )
        else:
            log_test(
                "Token Revocation: Revoke All Tokens Request",
                False,
                f"Revoke all failed: {revoke_all_response.status_code}"
            )

def test_jwt_secret_validation():
    """Test that JWT secret is validated on startup"""
    print("=" * 80)
    print("TEST 4: JWT Secret Key Validation")
    print("=" * 80)
    
    # Read backend logs to verify JWT validation
    try:
        with open("/var/log/supervisor/backend.err.log", "r") as f:
            logs = f.read()
        
        if "✅ JWT_SECRET_KEY validated successfully" in logs:
            log_test(
                "JWT Secret Validation: Startup Check",
                True,
                "JWT secret key validated on startup"
            )
        else:
            log_test(
                "JWT Secret Validation: Startup Check",
                False,
                "JWT secret validation message not found in logs"
            )
    except Exception as e:
        log_test(
            "JWT Secret Validation: Startup Check",
            False,
            f"Failed to read logs: {str(e)}"
        )

def print_summary():
    """Print test summary"""
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    total_tests = test_results["passed"] + test_results["failed"]
    pass_rate = (test_results["passed"] / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {test_results['passed']} ✅")
    print(f"Failed: {test_results['failed']} ❌")
    print(f"Pass Rate: {pass_rate:.1f}%")
    
    if test_results["failed"] > 0:
        print("\n🔴 FAILED TESTS:")
        for test in test_results["tests"]:
            if not test["passed"]:
                print(f"  - {test['test']}: {test['message']}")
    else:
        print("\n🎉 ALL TESTS PASSED!")
    
    print("=" * 80)

def main():
    """Run all security tests"""
    print("\n")
    print("🔒" * 40)
    print("   ADVANCED FINANCE MANAGEMENT SYSTEM")
    print("   SECURITY FEATURES TEST SUITE")
    print("🔒" * 40)
    print("\n")
    
    try:
        # Run all tests
        test_jwt_secret_validation()
        test_password_complexity()
        test_rate_limiting()
        test_token_revocation()
        
        # Print summary
        print_summary()
        
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Test suite error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
