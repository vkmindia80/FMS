#!/usr/bin/env python3
"""
Test script to verify cash balance calculations match between
Superadmin aggregated view and Demo Account view
"""
import asyncio
import sys
sys.path.append('/app/backend')

from database import accounts_collection, companies_collection

async def test_cash_balance_calculation():
    """Test that cash balance calculation is consistent"""
    
    print("=" * 60)
    print("Cash Balance Calculation Test")
    print("=" * 60)
    
    # Test 1: Aggregated cash balance (Superadmin view)
    print("\n1. Testing Superadmin Aggregated View:")
    print("-" * 60)
    
    accounts_pipeline = [
        {"$match": {
            "account_category": "assets",
            "account_type": {"$in": ["cash", "checking", "savings"]},
            "is_active": True
        }},
        {"$group": {
            "_id": None,
            "total_balance": {"$sum": "$balance"}
        }}
    ]
    
    account_totals = await accounts_collection.aggregate(accounts_pipeline).to_list(length=1)
    superadmin_cash_balance = account_totals[0]["total_balance"] if account_totals else 0
    
    print(f"   Superadmin Cash Balance: ${superadmin_cash_balance:,.2f}")
    
    # Get breakdown by account type
    breakdown_pipeline = [
        {"$match": {
            "account_category": "assets",
            "account_type": {"$in": ["cash", "checking", "savings"]},
            "is_active": True
        }},
        {"$group": {
            "_id": "$account_type",
            "count": {"$sum": 1},
            "total": {"$sum": "$balance"}
        }}
    ]
    
    breakdown = await accounts_collection.aggregate(breakdown_pipeline).to_list(length=None)
    print("\n   Breakdown by Account Type:")
    for item in breakdown:
        print(f"   - {item['_id']}: {item['count']} accounts, ${item['total']:,.2f}")
    
    # Test 2: Check individual companies
    print("\n2. Testing Individual Companies:")
    print("-" * 60)
    
    companies = await companies_collection.find({"is_active": True}).to_list(length=None)
    total_from_companies = 0
    
    for company in companies:
        company_pipeline = [
            {"$match": {
                "company_id": company["_id"],
                "account_category": "assets",
                "account_type": {"$in": ["cash", "checking", "savings"]},
                "is_active": True
            }},
            {"$group": {
                "_id": None,
                "total_balance": {"$sum": "$balance"}
            }}
        ]
        
        company_totals = await accounts_collection.aggregate(company_pipeline).to_list(length=1)
        company_cash = company_totals[0]["total_balance"] if company_totals else 0
        total_from_companies += company_cash
        
        print(f"   Company: {company.get('name', 'Unknown')}")
        print(f"   Cash Balance: ${company_cash:,.2f}\n")
    
    print("-" * 60)
    print(f"   Sum of all companies: ${total_from_companies:,.2f}")
    print(f"   Superadmin aggregate: ${superadmin_cash_balance:,.2f}")
    
    if abs(total_from_companies - superadmin_cash_balance) < 0.01:
        print("\n✅ SUCCESS: Cash balances match!")
        return True
    else:
        diff = abs(total_from_companies - superadmin_cash_balance)
        print(f"\n⚠️  WARNING: Difference of ${diff:,.2f} detected")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_cash_balance_calculation())
    sys.exit(0 if result else 1)
