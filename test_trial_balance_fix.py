"""
Test script to verify Trial Balance report shows account numbers
"""
import asyncio
import sys
sys.path.insert(0, '/app/backend')

from reports import generate_trial_balance, ReportFormat
from database import companies_collection, database
from datetime import date

async def test_trial_balance():
    print("=" * 70)
    print("Testing Trial Balance Report - Account Numbers Fix")
    print("=" * 70)
    
    # Get a company
    company = await companies_collection.find_one({})
    if not company:
        print('❌ No company found in database')
        return
    
    print(f"\n✅ Found company: {company['name']}")
    print(f"   Company ID: {company['_id']}")
    
    # Create a mock current_user
    current_user = {
        '_id': 'test-user-id',
        'company_id': company['_id'],
        'email': 'test@example.com'
    }
    
    print(f"\n🔄 Generating Trial Balance report...")
    
    try:
        # Generate trial balance
        report = await generate_trial_balance(
            as_of_date=date.today(),
            format=ReportFormat.JSON,
            current_user=current_user
        )
        
        print(f"\n✅ Trial Balance Report Generated Successfully!")
        print(f"   Report ID: {report.report_id}")
        print(f"   As of Date: {report.as_of_date}")
        print(f"   Currency: {report.currency}")
        print(f"   Total Accounts: {len(report.accounts)}")
        print(f"   Total Debits: ${report.total_debits:,.2f}")
        print(f"   Total Credits: ${report.total_credits:,.2f}")
        print(f"   Is Balanced: {'✅ Yes' if report.is_balanced else '❌ No'}")
        
        print(f"\n📊 Account Details (showing all accounts):")
        print("-" * 90)
        print(f"{'Acct #':<10} | {'Account Name':<35} | {'Category':<12} | {'Debit':>12} | {'Credit':>12}")
        print("-" * 90)
        
        accounts_with_numbers = 0
        accounts_without_numbers = 0
        
        for acc in report.accounts:
            account_number = acc["account_number"] if acc["account_number"] else "N/A"
            if acc["account_number"]:
                accounts_with_numbers += 1
            else:
                accounts_without_numbers += 1
                
            print(f"{account_number:<10} | {acc['account_name']:<35} | {acc['account_category']:<12} | ${acc['debit_balance']:>11,.2f} | ${acc['credit_balance']:>11,.2f}")
        
        print("-" * 90)
        print(f"{'TOTALS':<10} | {'':<35} | {'':<12} | ${report.total_debits:>11,.2f} | ${report.total_credits:>11,.2f}")
        print("-" * 90)
        
        print(f"\n📈 Summary:")
        print(f"   Accounts WITH account numbers: {accounts_with_numbers}")
        print(f"   Accounts WITHOUT account numbers: {accounts_without_numbers}")
        
        if accounts_without_numbers == 0:
            print(f"\n🎉 SUCCESS! All accounts now have account numbers!")
        else:
            print(f"\n⚠️  Warning: {accounts_without_numbers} accounts still missing account numbers")
        
        print("\n" + "=" * 70)
        
    except Exception as e:
        print(f'\n❌ Error generating report: {e}')
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_trial_balance())
