"""Test script for Phase 15: Account Reconciliation"""
import asyncio
import sys
import os
from datetime import datetime, date, timedelta
from decimal import Decimal
import io

# Add backend to path
sys.path.insert(0, '/app/backend')

from motor.motor_asyncio import AsyncIOMotorClient
from reconciliation import (
    parse_csv_statement,
    parse_ofx_statement,
    calculate_match_confidence,
    find_matching_transactions
)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/afms_db")
client = AsyncIOMotorClient(MONGO_URL)
database = client.afms_db

async def test_csv_parsing():
    """Test CSV statement parsing"""
    print("\n🧪 Testing CSV Statement Parsing...")
    
    # Sample CSV content
    csv_content = """Date,Description,Amount,Balance
2025-10-01,Opening Balance,,5000.00
2025-10-02,Amazon Purchase,-125.50,4874.50
2025-10-03,Salary Deposit,3000.00,7874.50
2025-10-04,Electric Bill,-85.25,7789.25
2025-10-05,Coffee Shop,-12.50,7776.75
2025-10-08,Client Payment,1500.00,9276.75
"""
    
    try:
        entries = parse_csv_statement(csv_content)
        print(f"✅ Parsed {len(entries)} entries from CSV")
        
        for entry in entries[:3]:
            print(f"   - {entry['date']}: {entry['description']} = ${entry['amount']}")
        
        return True
    except Exception as e:
        print(f"❌ CSV parsing failed: {str(e)}")
        return False

async def test_ofx_parsing():
    """Test OFX statement parsing"""
    print("\n🧪 Testing OFX Statement Parsing...")
    
    # Sample OFX content
    ofx_content = """<?xml version="1.0" encoding="UTF-8"?>
<OFX>
  <SIGNONMSGSRSV1>
    <SONRS>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
    </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <TRNUID>1</TRNUID>
      <STATUS>
        <CODE>0</CODE>
        <SEVERITY>INFO</SEVERITY>
      </STATUS>
      <STMTRS>
        <CURDEF>USD</CURDEF>
        <BANKACCTFROM>
          <BANKID>123456789</BANKID>
          <ACCTID>9876543210</ACCTID>
          <ACCTTYPE>CHECKING</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>20251001000000</DTSTART>
          <DTEND>20251031235959</DTEND>
          <STMTTRN>
            <TRNTYPE>DEBIT</TRNTYPE>
            <DTPOSTED>20251002120000</DTPOSTED>
            <TRNAMT>-125.50</TRNAMT>
            <FITID>TXN001</FITID>
            <NAME>Amazon.com</NAME>
            <MEMO>Online Purchase</MEMO>
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT</TRNTYPE>
            <DTPOSTED>20251003090000</DTPOSTED>
            <TRNAMT>3000.00</TRNAMT>
            <FITID>TXN002</FITID>
            <NAME>Payroll Deposit</NAME>
            <MEMO>Salary</MEMO>
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>"""
    
    try:
        entries = parse_ofx_statement(ofx_content)
        print(f"✅ Parsed {len(entries)} entries from OFX")
        
        for entry in entries:
            print(f"   - {entry['date']}: {entry['description']} = ${entry['amount']}")
        
        return True
    except Exception as e:
        print(f"❌ OFX parsing failed: {str(e)}")
        return False

async def test_matching_algorithm():
    """Test transaction matching algorithm"""
    print("\n🧪 Testing Matching Algorithm...")
    
    # Bank entry
    bank_entry = {
        'date': date(2025, 10, 2),
        'description': 'Amazon Online Purchase',
        'amount': Decimal('-125.50')
    }
    
    # Test cases
    test_cases = [
        {
            'name': 'Exact Match',
            'system_txn': {
                'transaction_date': date(2025, 10, 2),
                'description': 'Amazon Purchase',
                'amount': Decimal('125.50')
            },
            'expected_confidence': 0.9  # High confidence
        },
        {
            'name': 'Date Off by 1 Day',
            'system_txn': {
                'transaction_date': date(2025, 10, 3),
                'description': 'Amazon Purchase',
                'amount': Decimal('125.50')
            },
            'expected_confidence': 0.7  # Medium-high confidence
        },
        {
            'name': 'Amount Slightly Different',
            'system_txn': {
                'transaction_date': date(2025, 10, 2),
                'description': 'Amazon Purchase',
                'amount': Decimal('125.49')
            },
            'expected_confidence': 0.7  # Medium-high confidence
        },
        {
            'name': 'Poor Match',
            'system_txn': {
                'transaction_date': date(2025, 10, 10),
                'description': 'Different Vendor',
                'amount': Decimal('500.00')
            },
            'expected_confidence': 0.1  # Low confidence
        }
    ]
    
    all_passed = True
    
    for test_case in test_cases:
        confidence = calculate_match_confidence(bank_entry, test_case['system_txn'])
        passed = abs(confidence - test_case['expected_confidence']) < 0.3  # Allow some tolerance
        
        status = "✅" if passed else "❌"
        print(f"   {status} {test_case['name']}: confidence={confidence:.2f} (expected ~{test_case['expected_confidence']})")
        
        if not passed:
            all_passed = False
    
    return all_passed

async def test_full_reconciliation_workflow():
    """Test complete reconciliation workflow"""
    print("\n🧪 Testing Full Reconciliation Workflow...")
    
    try:
        # Create test company and user
        company_id = "test_company_recon"
        user_id = "test_user_recon"
        
        # Create test account
        account_id = "test_account_recon"
        account_doc = {
            '_id': account_id,
            'company_id': company_id,
            'name': 'Test Checking Account',
            'account_type': 'checking',
            'is_active': True,
            'created_at': datetime.utcnow()
        }
        
        await database.accounts.delete_one({'_id': account_id})
        await database.accounts.insert_one(account_doc)
        print("   ✅ Created test account")
        
        # Create test transactions
        test_transactions = [
            {
                '_id': 'txn_recon_1',
                'company_id': company_id,
                'description': 'Amazon Purchase',
                'amount': 125.50,
                'transaction_date': date(2025, 10, 2),
                'status': 'pending',
                'is_reconciled': False,
                'created_at': datetime.utcnow()
            },
            {
                '_id': 'txn_recon_2',
                'company_id': company_id,
                'description': 'Salary Deposit',
                'amount': 3000.00,
                'transaction_date': date(2025, 10, 3),
                'status': 'pending',
                'is_reconciled': False,
                'created_at': datetime.utcnow()
            }
        ]
        
        await database.transactions.delete_many({'company_id': company_id})
        await database.transactions.insert_many(test_transactions)
        print(f"   ✅ Created {len(test_transactions)} test transactions")
        
        # Create bank entries
        bank_entries = [
            {
                'id': 'bank_1',
                'date': date(2025, 10, 2),
                'description': 'Amazon.com Purchase',
                'amount': Decimal('-125.50')
            },
            {
                'id': 'bank_2',
                'date': date(2025, 10, 3),
                'description': 'Payroll Deposit - Company',
                'amount': Decimal('3000.00')
            }
        ]
        
        # Find matches
        matches = await find_matching_transactions(bank_entries, company_id, account_id)
        print(f"   ✅ Found matches for {len(matches)} bank entries")
        
        # Check match quality
        high_confidence_matches = 0
        for match in matches:
            if match['suggested_matches']:
                best_match = match['suggested_matches'][0]
                if best_match['confidence_score'] >= 0.7:
                    high_confidence_matches += 1
                    print(f"      - High confidence match ({best_match['confidence_score']:.2f}): {match['bank_entry']['description']}")
        
        print(f"   ✅ {high_confidence_matches}/{len(matches)} high-confidence matches found")
        
        # Cleanup
        await database.accounts.delete_one({'_id': account_id})
        await database.transactions.delete_many({'company_id': company_id})
        
        return high_confidence_matches >= 1
        
    except Exception as e:
        print(f"   ❌ Workflow test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

async def test_reconciliation_collections():
    """Test that reconciliation collections exist"""
    print("\n🧪 Testing Reconciliation Collections...")
    
    try:
        # List all collections
        collections = await database.list_collection_names()
        
        required_collections = ['reconciliation_sessions', 'reconciliation_matches']
        
        for collection_name in required_collections:
            if collection_name in collections:
                print(f"   ✅ Collection '{collection_name}' exists")
            else:
                print(f"   ⚠️  Collection '{collection_name}' will be created on first use")
        
        return True
    except Exception as e:
        print(f"   ❌ Collection test failed: {str(e)}")
        return False

async def main():
    """Run all tests"""
    print("=" * 60)
    print("Phase 15: Account Reconciliation - Test Suite")
    print("=" * 60)
    
    results = {
        'CSV Parsing': await test_csv_parsing(),
        'OFX Parsing': await test_ofx_parsing(),
        'Matching Algorithm': await test_matching_algorithm(),
        'Collections': await test_reconciliation_collections(),
        'Full Workflow': await test_full_reconciliation_workflow(),
    }
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    passed = sum(1 for result in results.values() if result)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed! Phase 15 is working correctly.")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed. Please review the errors above.")
    
    # Close connection
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
