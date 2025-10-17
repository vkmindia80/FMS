#!/usr/bin/env python3
"""
Verification script for multi-tenant demo data
"""
import requests
import json

BASE_URL = "http://localhost:8001"

def test_login(email, password, name):
    """Test login for a tenant"""
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": email, "password": password},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            print(f"✅ {name}: Login successful")
            return token
        else:
            print(f"❌ {name}: Login failed - {response.status_code}")
            print(f"   Response: {response.text[:100]}")
            return None
    except Exception as e:
        print(f"❌ {name}: Exception - {str(e)}")
        return None

def get_data_summary(token, name):
    """Get data summary for a tenant"""
    try:
        # Get accounts
        accounts_response = requests.get(
            f"{BASE_URL}/api/accounts/",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        # Get transactions
        transactions_response = requests.get(
            f"{BASE_URL}/api/transactions/?limit=1000",
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        
        accounts_count = len(accounts_response.json()) if accounts_response.status_code == 200 else 0
        
        trans_data = transactions_response.json() if transactions_response.status_code == 200 else {}
        transactions_count = len(trans_data.get('transactions', [])) if isinstance(trans_data, dict) else 0
        
        print(f"   📊 {name}: {accounts_count} accounts, {transactions_count} transactions")
        
    except Exception as e:
        print(f"   ⚠️  {name}: Could not fetch data - {str(e)}")

def main():
    """Main verification"""
    print("\n" + "="*80)
    print("🔍 MULTI-TENANT DEMO DATA VERIFICATION")
    print("="*80 + "\n")
    
    tenants = [
        ("admin@techventure.demo", "Demo123!", "TechVenture SaaS Inc"),
        ("admin@strategicadvisory.demo", "Demo123!", "Strategic Advisory Group"),
        ("admin@urbanstyle.demo", "Demo123!", "Urban Style Boutique"),
        ("alex.thompson@demo.com", "Demo123!", "Alex Thompson (Individual)"),
        ("jordan.martinez@demo.com", "Demo123!", "Jordan Martinez (Individual)"),
    ]
    
    successful_logins = 0
    total_tenants = len(tenants)
    
    for email, password, name in tenants:
        token = test_login(email, password, name)
        if token:
            successful_logins += 1
            get_data_summary(token, name)
        print()
    
    print("="*80)
    print(f"📊 VERIFICATION SUMMARY")
    print("="*80)
    print(f"   Successful Logins: {successful_logins}/{total_tenants}")
    print(f"   Success Rate: {(successful_logins/total_tenants)*100:.1f}%")
    
    if successful_logins == total_tenants:
        print("\n   ✅ ALL TENANTS VERIFIED SUCCESSFULLY!")
    else:
        print(f"\n   ⚠️  {total_tenants - successful_logins} tenant(s) failed verification")
    
    print("="*80 + "\n")

if __name__ == "__main__":
    main()
