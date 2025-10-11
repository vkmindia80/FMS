"""
Test Report Export Functionality
Tests PDF, Excel, and CSV exports for all financial reports
"""
import requests
import os
from datetime import datetime

# Backend URL
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
BASE_URL = f"{BACKEND_URL}/api"

def test_report_exports():
    """Test all report export formats"""
    
    print("=" * 80)
    print("REPORT EXPORT TESTING")
    print("=" * 80)
    
    # Step 1: Register and login
    print("\n1. Registering test user...")
    register_data = {
        "email": f"export_test_{datetime.now().timestamp()}@test.com",
        "password": "TestPass123!",
        "full_name": "Export Test User",
        "company_name": "Export Test Company"
    }
    
    register_response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
    if register_response.status_code == 200:
        print("   ✓ User registered successfully")
    else:
        print(f"   ✗ Registration failed: {register_response.text}")
        return
    
    # Login
    print("\n2. Logging in...")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": register_data["email"],
        "password": register_data["password"]
    })
    
    if login_response.status_code == 200:
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("   ✓ Login successful")
    else:
        print(f"   ✗ Login failed: {login_response.text}")
        return
    
    # Step 2: Setup default accounts
    print("\n3. Setting up default accounts...")
    setup_response = requests.post(f"{BASE_URL}/accounts/setup-defaults", headers=headers)
    if setup_response.status_code == 200:
        print("   ✓ Default accounts created")
    else:
        print(f"   ⚠ Setup response: {setup_response.status_code}")
    
    # Step 3: Generate demo data
    print("\n4. Generating demo data...")
    demo_response = requests.post(f"{BASE_URL}/auth/generate-demo-data", headers=headers)
    if demo_response.status_code == 200:
        print("   ✓ Demo data generated")
    else:
        print(f"   ⚠ Demo data response: {demo_response.status_code}")
    
    # Step 4: Test report exports
    print("\n5. Testing Report Exports...")
    print("-" * 80)
    
    reports = [
        {"name": "Profit & Loss", "endpoint": "/reports/profit-loss"},
        {"name": "Balance Sheet", "endpoint": "/reports/balance-sheet"},
        {"name": "Cash Flow", "endpoint": "/reports/cash-flow"},
        {"name": "Trial Balance", "endpoint": "/reports/trial-balance"},
        {"name": "General Ledger", "endpoint": "/reports/general-ledger"}
    ]
    
    formats = ["json", "csv", "excel", "pdf"]
    
    results = {
        "total_tests": 0,
        "passed": 0,
        "failed": 0,
        "details": []
    }
    
    for report in reports:
        print(f"\n   Testing: {report['name']}")
        print(f"   {'─' * 70}")
        
        for fmt in formats:
            results["total_tests"] += 1
            test_name = f"{report['name']} - {fmt.upper()}"
            
            try:
                # Make request
                url = f"{BASE_URL}{report['endpoint']}?format={fmt}"
                response = requests.get(url, headers=headers)
                
                if response.status_code == 200:
                    # Check content type
                    content_type = response.headers.get('content-type', '')
                    
                    if fmt == "json":
                        expected_type = "application/json"
                        # Verify JSON is valid
                        data = response.json()
                        if "report_id" in data or "summary" in data:
                            print(f"      ✓ {fmt.upper():6} - Valid JSON response")
                            results["passed"] += 1
                            results["details"].append({"test": test_name, "status": "PASS"})
                        else:
                            print(f"      ✗ {fmt.upper():6} - Invalid JSON structure")
                            results["failed"] += 1
                            results["details"].append({"test": test_name, "status": "FAIL", "reason": "Invalid JSON"})
                    
                    elif fmt == "csv":
                        expected_type = "text/csv"
                        if "text/csv" in content_type and len(response.content) > 0:
                            print(f"      ✓ {fmt.upper():6} - Valid CSV (Size: {len(response.content)} bytes)")
                            results["passed"] += 1
                            results["details"].append({"test": test_name, "status": "PASS"})
                        else:
                            print(f"      ✗ {fmt.upper():6} - Invalid CSV response")
                            results["failed"] += 1
                            results["details"].append({"test": test_name, "status": "FAIL", "reason": "Invalid CSV"})
                    
                    elif fmt == "excel":
                        expected_type = "application/vnd.openxmlformats"
                        if expected_type in content_type and len(response.content) > 0:
                            print(f"      ✓ {fmt.upper():6} - Valid Excel (Size: {len(response.content)} bytes)")
                            results["passed"] += 1
                            results["details"].append({"test": test_name, "status": "PASS"})
                        else:
                            print(f"      ✗ {fmt.upper():6} - Invalid Excel response")
                            results["failed"] += 1
                            results["details"].append({"test": test_name, "status": "FAIL", "reason": "Invalid Excel"})
                    
                    elif fmt == "pdf":
                        expected_type = "application/pdf"
                        if "application/pdf" in content_type and len(response.content) > 0:
                            print(f"      ✓ {fmt.upper():6} - Valid PDF (Size: {len(response.content)} bytes)")
                            results["passed"] += 1
                            results["details"].append({"test": test_name, "status": "PASS"})
                        else:
                            print(f"      ✗ {fmt.upper():6} - Invalid PDF response")
                            results["failed"] += 1
                            results["details"].append({"test": test_name, "status": "FAIL", "reason": "Invalid PDF"})
                
                else:
                    print(f"      ✗ {fmt.upper():6} - HTTP {response.status_code}")
                    results["failed"] += 1
                    results["details"].append({
                        "test": test_name, 
                        "status": "FAIL", 
                        "reason": f"HTTP {response.status_code}: {response.text[:100]}"
                    })
            
            except Exception as e:
                print(f"      ✗ {fmt.upper():6} - Exception: {str(e)[:50]}")
                results["failed"] += 1
                results["details"].append({"test": test_name, "status": "FAIL", "reason": str(e)[:100]})
    
    # Print summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Total Tests: {results['total_tests']}")
    print(f"Passed:      {results['passed']} ✓")
    print(f"Failed:      {results['failed']} ✗")
    print(f"Success Rate: {(results['passed']/results['total_tests']*100):.1f}%")
    
    # Print failed tests details
    if results['failed'] > 0:
        print("\nFailed Tests:")
        print("-" * 80)
        for detail in results['details']:
            if detail['status'] == 'FAIL':
                print(f"  ✗ {detail['test']}")
                if 'reason' in detail:
                    print(f"    Reason: {detail['reason']}")
    
    print("\n" + "=" * 80)
    
    return results

if __name__ == "__main__":
    test_report_exports()
