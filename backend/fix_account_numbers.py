"""
Migration script to assign account numbers to all accounts that don't have them.
This follows standard accounting numbering conventions:
- 1000-1999: Assets
- 2000-2999: Liabilities
- 3000-3999: Equity
- 4000-4999: Income/Revenue
- 5000-5999: Cost of Goods Sold
- 6000-6999: Operating Expenses
"""

import asyncio
from database import accounts_collection
from accounts import AccountType, AccountCategory, get_account_category

def get_account_number_prefix(account_type: str, account_category: str) -> str:
    """Get the appropriate account number prefix based on account type and category"""
    
    # Map account types to specific number ranges
    account_type_mapping = {
        # Assets (1000-1999)
        AccountType.CASH.value: "1000",
        AccountType.CHECKING.value: "1010",
        AccountType.SAVINGS.value: "1020",
        AccountType.ACCOUNTS_RECEIVABLE.value: "1200",
        AccountType.INVENTORY.value: "1300",
        AccountType.PREPAID_EXPENSES.value: "1400",
        AccountType.FIXED_ASSETS.value: "1500",
        AccountType.EQUIPMENT.value: "1510",
        AccountType.CURRENT_ASSET.value: "1600",
        AccountType.OTHER_ASSETS.value: "1900",
        
        # Liabilities (2000-2999)
        AccountType.ACCOUNTS_PAYABLE.value: "2000",
        AccountType.CREDIT_CARD.value: "2100",
        AccountType.SHORT_TERM_DEBT.value: "2200",
        AccountType.ACCRUED_EXPENSES.value: "2300",
        AccountType.LONG_TERM_DEBT.value: "2500",
        AccountType.LONG_TERM_LIABILITY.value: "2600",
        AccountType.OTHER_LIABILITIES.value: "2900",
        
        # Equity (3000-3999)
        AccountType.OWNER_EQUITY.value: "3000",
        AccountType.COMMON_STOCK.value: "3100",
        AccountType.RETAINED_EARNINGS.value: "3200",
        
        # Income (4000-4999)
        AccountType.REVENUE.value: "4000",
        AccountType.SERVICE_INCOME.value: "4100",
        AccountType.INTEREST_INCOME.value: "4200",
        AccountType.OTHER_INCOME.value: "4900",
        
        # Cost of Goods Sold (5000-5999)
        AccountType.COST_OF_GOODS_SOLD.value: "5000",
        
        # Expenses (6000-6999)
        AccountType.OPERATING_EXPENSES.value: "6000",
        AccountType.OFFICE_SUPPLIES.value: "6100",
        AccountType.RENT.value: "6200",
        AccountType.UTILITIES.value: "6300",
        AccountType.INSURANCE.value: "6400",
        AccountType.TRAVEL.value: "6500",
        AccountType.MARKETING.value: "6600",
        AccountType.SOFTWARE.value: "6700",
        AccountType.PAYROLL.value: "6800",
        AccountType.ADMINISTRATIVE_EXPENSES.value: "6900",
        AccountType.PROFESSIONAL_FEES.value: "6910",
        AccountType.LEGAL_FEES.value: "6920",
        AccountType.INTEREST_EXPENSE.value: "7000",
        AccountType.TAX_EXPENSE.value: "7100",
        AccountType.OTHER_EXPENSES.value: "7900",
    }
    
    # Try to get specific mapping first
    if account_type in account_type_mapping:
        return account_type_mapping[account_type]
    
    # Fallback to category-based numbering
    category_mapping = {
        AccountCategory.ASSETS.value: "1000",
        AccountCategory.LIABILITIES.value: "2000",
        AccountCategory.EQUITY.value: "3000",
        AccountCategory.INCOME.value: "4000",
        AccountCategory.EXPENSES.value: "6000",
    }
    
    return category_mapping.get(account_category, "9000")

async def generate_unique_account_number(company_id: str, account_type: str, account_category: str) -> str:
    """Generate a unique account number for an account"""
    
    base_number = get_account_number_prefix(account_type, account_category)
    
    # Find the next available number in this range
    prefix = base_number[:2]  # e.g., "10" for 1000-1099 range
    
    # Get all existing account numbers with this prefix
    existing_accounts = await accounts_collection.find({
        "company_id": company_id,
        "account_number": {"$regex": f"^{prefix}"}
    }).to_list(length=None)
    
    existing_numbers = set()
    for acc in existing_accounts:
        acc_num = acc.get("account_number")
        if acc_num and acc_num.isdigit():
            existing_numbers.add(int(acc_num))
    
    # Start from base number and find next available
    proposed_number = int(base_number)
    while proposed_number in existing_numbers:
        proposed_number += 1
    
    return str(proposed_number)

async def fix_all_account_numbers():
    """Assign account numbers to all accounts that don't have them"""
    
    print("🔍 Finding accounts without account numbers...")
    
    # Find all accounts without account numbers
    accounts_to_fix = await accounts_collection.find({
        "$or": [
            {"account_number": None},
            {"account_number": ""},
            {"account_number": {"$exists": False}}
        ]
    }).to_list(length=None)
    
    print(f"📋 Found {len(accounts_to_fix)} accounts without account numbers")
    
    if not accounts_to_fix:
        print("✅ All accounts already have account numbers!")
        return
    
    fixed_count = 0
    
    for account in accounts_to_fix:
        account_id = account["_id"]
        account_name = account.get("name", "Unknown")
        account_type = account.get("account_type")
        account_category = account.get("account_category")
        company_id = account.get("company_id")
        
        # If account_category is missing, determine it from account_type
        if not account_category and account_type:
            try:
                account_category = get_account_category(AccountType(account_type)).value
            except:
                account_category = "assets"  # default fallback
        
        # Generate unique account number
        account_number = await generate_unique_account_number(
            company_id, 
            account_type, 
            account_category
        )
        
        # Update the account
        result = await accounts_collection.update_one(
            {"_id": account_id},
            {
                "$set": {
                    "account_number": account_number,
                    "account_category": account_category  # Also ensure category is set
                }
            }
        )
        
        if result.modified_count > 0:
            print(f"✅ {account_name}: assigned account number {account_number}")
            fixed_count += 1
        else:
            print(f"⚠️  {account_name}: failed to update")
    
    print(f"\n🎉 Successfully assigned account numbers to {fixed_count} accounts!")
    
    # Verify the fix
    remaining = await accounts_collection.count_documents({
        "$or": [
            {"account_number": None},
            {"account_number": ""},
            {"account_number": {"$exists": False}}
        ]
    })
    
    if remaining == 0:
        print("✅ Verification passed: All accounts now have account numbers!")
    else:
        print(f"⚠️  Warning: {remaining} accounts still without account numbers")

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 Account Numbers Migration Script")
    print("=" * 60)
    asyncio.run(fix_all_account_numbers())
    print("=" * 60)
