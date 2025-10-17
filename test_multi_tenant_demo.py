#!/usr/bin/env python3
"""
Test script for multi-tenant demo data generation
"""
import requests
import json
import time

# Configuration
BASE_URL = "http://localhost:8001"
SUPERADMIN_EMAIL = "superadmin@afms.system"
SUPERADMIN_PASSWORD = "admin123"

def login(email, password):
    """Login and get access token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": email, "password": password}
    )
    
    if response.status_code == 200:
        data = response.json()
        return data.get("access_token")
    else:
        print(f"Login failed: {response.status_code}")
        print(response.text)
        return None

def generate_multi_tenant_demo_data(token):
    """Call the multi-tenant demo data generation endpoint"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print("\n" + "="*80)
    print("🚀 Starting Multi-Tenant Demo Data Generation")
    print("="*80)
    print("This will create:")
    print("  - 3 Companies with different industry profiles")
    print("  - 2 Individuals with personal finance data")
    print("  - ~1000 transactions per company (~200 for individuals)")
    print("  - ~300 documents per company (~60 for individuals)")
    print("  - Invoices, Bills, Payments, Bank Connections")
    print("\n⏱️  This may take 2-5 minutes...")
    print("="*80 + "\n")
    
    start_time = time.time()
    
    response = requests.post(
        f"{BASE_URL}/api/admin/generate-multi-tenant-demo-data",
        headers=headers,
        timeout=600  # 10 minute timeout
    )
    
    elapsed_time = time.time() - start_time
    
    if response.status_code == 200:
        data = response.json()
        print("\n" + "="*80)
        print("✅ MULTI-TENANT DEMO DATA GENERATION COMPLETE!")
        print("="*80)
        print(f"⏱️  Time taken: {elapsed_time:.1f} seconds")
        print("\n📊 Summary:")
        summary = data.get("summary", {})
        print(f"  - Companies Created: {summary.get('companies_created', 0)}")
        print(f"  - Individuals Created: {summary.get('individuals_created', 0)}")
        print(f"  - Total Accounts: {summary.get('total_accounts', 0)}")
        print(f"  - Total Transactions: {summary.get('total_transactions', 0)}")
        print(f"  - Total Documents: {summary.get('total_documents', 0)}")
        print(f"  - Total Invoices (AR): {summary.get('total_invoices', 0)}")
        print(f"  - Total Bills (AP): {summary.get('total_bills', 0)}")
        print(f"  - Total Payments: {summary.get('total_payment_transactions', 0)}")
        print(f"  - Total Bank Connections: {summary.get('total_bank_connections', 0)}")
        
        print("\n🔑 Login Credentials:")
        print("="*80)
        for cred in data.get("credentials", []):
            print(f"\n[{cred['type']}] {cred['name']}")
            if cred['type'] == 'Company':
                print(f"  Industry: {cred.get('industry', 'N/A')}")
            print(f"  Email:    {cred['email']}")
            print(f"  Password: {cred['password']}")
        
        print("\n" + "="*80)
        print("💡 TIP: You can now login with any of the above credentials")
        print("        to explore the multi-tenant demo data!")
        print("="*80 + "\n")
        
        return data
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)
        return None

def main():
    """Main test flow"""
    print("\n🔐 Logging in as superadmin...")
    token = login(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD)
    
    if not token:
        print("❌ Failed to login. Exiting.")
        return
    
    print("✅ Login successful!")
    
    # Generate multi-tenant demo data
    result = generate_multi_tenant_demo_data(token)
    
    if result:
        print("\n✅ Test completed successfully!")
        print("\n📄 Full response saved to: /app/multi_tenant_demo_result.json")
        with open("/app/multi_tenant_demo_result.json", "w") as f:
            json.dump(result, f, indent=2, default=str)
    else:
        print("\n❌ Test failed!")

if __name__ == "__main__":
    main()
