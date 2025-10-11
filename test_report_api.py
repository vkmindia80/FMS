"""
Quick test to verify report API is working
"""
import requests
import os

BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')

def test_reports():
    print("=" * 80)
    print("TESTING REPORT API")
    print("=" * 80)
    
    # Step 1: Login with demo account
    print("\n1. Logging in with demo account...")
    login_response = requests.post(
        f"{BACKEND_URL}/api/auth/login",
        json={
            "email": "john.doe@testcompany.com",
            "password": "testpassword123"
        }
    )
    
    if login_response.status_code != 200:
        print(f"   ✗ Login failed: {login_response.status_code}")
        print(f"   Response: {login_response.text}")
        
        # Try to check if demo account exists
        print("\n   Trying to generate demo data first...")
        # Can't generate without auth, so just inform user
        print("   ⚠️  Demo account might not exist. Please run:")
        print("      POST /api/auth/generate-demo-data")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   ✓ Login successful")
    
    # Step 2: Test each report
    reports = [
        ("Profit & Loss", f"{BACKEND_URL}/api/reports/profit-loss?period=current_month&format=json"),
        ("Balance Sheet", f"{BACKEND_URL}/api/reports/balance-sheet?format=json"),
        ("Cash Flow", f"{BACKEND_URL}/api/reports/cash-flow?period=current_month&format=json"),
        ("Trial Balance", f"{BACKEND_URL}/api/reports/trial-balance?format=json"),
        ("General Ledger", f"{BACKEND_URL}/api/reports/general-ledger?period=current_month&format=json"),
    ]
    
    print("\n2. Testing Report APIs...")
    print("-" * 80)
    
    for name, url in reports:
        try:
            response = requests.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                print(f"   ✓ {name:20} - Success (Report ID: {data.get('report_id', 'N/A')})")
            else:
                print(f"   ✗ {name:20} - Failed: {response.status_code}")
                print(f"      Error: {response.text[:200]}")
        except Exception as e:
            print(f"   ✗ {name:20} - Exception: {str(e)[:100]}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_reports()
