from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal
from enum import Enum
import uuid
from database import database, accounts_collection, transactions_collection
from auth import get_current_user, log_audit_event
import logging

logger = logging.getLogger(__name__)

accounts_router = APIRouter()

class AccountType(str, Enum):
    # Assets
    CASH = "cash"
    CHECKING = "checking"
    SAVINGS = "savings"
    ACCOUNTS_RECEIVABLE = "accounts_receivable"
    INVENTORY = "inventory"
    PREPAID_EXPENSES = "prepaid_expenses"
    FIXED_ASSETS = "fixed_assets"
    EQUIPMENT = "equipment"
    CURRENT_ASSET = "current_asset"
    OTHER_ASSETS = "other_assets"
    
    # Liabilities
    ACCOUNTS_PAYABLE = "accounts_payable"
    CREDIT_CARD = "credit_card"
    SHORT_TERM_DEBT = "short_term_debt"
    LONG_TERM_DEBT = "long_term_debt"
    LONG_TERM_LIABILITY = "long_term_liability"
    ACCRUED_EXPENSES = "accrued_expenses"
    OTHER_LIABILITIES = "other_liabilities"
    
    # Equity
    OWNER_EQUITY = "owner_equity"
    RETAINED_EARNINGS = "retained_earnings"
    COMMON_STOCK = "common_stock"
    
    # Income
    REVENUE = "revenue"
    SERVICE_INCOME = "service_income"
    INTEREST_INCOME = "interest_income"
    OTHER_INCOME = "other_income"
    
    # Expenses
    COST_OF_GOODS_SOLD = "cost_of_goods_sold"
    OPERATING_EXPENSES = "operating_expenses"
    ADMINISTRATIVE_EXPENSES = "administrative_expenses"
    INTEREST_EXPENSE = "interest_expense"
    TAX_EXPENSE = "tax_expense"
    OTHER_EXPENSES = "other_expenses"
    OFFICE_SUPPLIES = "office_supplies"
    TRAVEL = "travel"
    UTILITIES = "utilities"
    RENT = "rent"
    INSURANCE = "insurance"
    PROFESSIONAL_FEES = "professional_fees"
    LEGAL_FEES = "legal_fees"
    MARKETING = "marketing"
    SOFTWARE = "software"
    PAYROLL = "payroll"

class AccountCategory(str, Enum):
    ASSETS = "assets"
    LIABILITIES = "liabilities"
    EQUITY = "equity"
    INCOME = "income"
    EXPENSES = "expenses"

class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_type: AccountType
    account_number: Optional[str] = None
    parent_account_id: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    opening_balance: Optional[Decimal] = Field(default=0, ge=0)
    currency_code: str = Field(default="USD", min_length=3, max_length=3)

class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    account_number: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class AccountResponse(BaseModel):
    id: str
    name: str
    account_type: AccountType
    account_category: AccountCategory
    account_number: Optional[str]
    parent_account_id: Optional[str]
    description: Optional[str]
    is_active: bool
    current_balance: Decimal
    currency_code: str
    created_at: datetime
    updated_at: datetime
    sub_accounts: List[str]

def get_account_category(account_type: AccountType) -> AccountCategory:
    """Determine account category based on account type"""
    
    asset_types = {
        AccountType.CASH, AccountType.CHECKING, AccountType.SAVINGS,
        AccountType.ACCOUNTS_RECEIVABLE, AccountType.INVENTORY,
        AccountType.PREPAID_EXPENSES, AccountType.FIXED_ASSETS,
        AccountType.OTHER_ASSETS
    }
    
    liability_types = {
        AccountType.ACCOUNTS_PAYABLE, AccountType.CREDIT_CARD,
        AccountType.SHORT_TERM_DEBT, AccountType.LONG_TERM_DEBT,
        AccountType.ACCRUED_EXPENSES, AccountType.OTHER_LIABILITIES
    }
    
    equity_types = {
        AccountType.OWNER_EQUITY, AccountType.RETAINED_EARNINGS,
        AccountType.COMMON_STOCK
    }
    
    income_types = {
        AccountType.REVENUE, AccountType.SERVICE_INCOME,
        AccountType.INTEREST_INCOME, AccountType.OTHER_INCOME
    }
    
    expense_types = {
        AccountType.COST_OF_GOODS_SOLD, AccountType.OPERATING_EXPENSES,
        AccountType.ADMINISTRATIVE_EXPENSES, AccountType.INTEREST_EXPENSE,
        AccountType.TAX_EXPENSE, AccountType.OTHER_EXPENSES
    }
    
    if account_type in asset_types:
        return AccountCategory.ASSETS
    elif account_type in liability_types:
        return AccountCategory.LIABILITIES
    elif account_type in equity_types:
        return AccountCategory.EQUITY
    elif account_type in income_types:
        return AccountCategory.INCOME
    elif account_type in expense_types:
        return AccountCategory.EXPENSES
    else:
        return AccountCategory.ASSETS  # Default fallback

async def calculate_account_balance(account_id: str, company_id: str) -> Decimal:
    """Calculate current account balance from journal entries"""
    
    # Get all transactions that affect this account
    pipeline = [
        {
            "$match": {
                "company_id": company_id,
                "status": {"$ne": "void"},
                "journal_entries.account_id": account_id
            }
        },
        {
            "$unwind": "$journal_entries"
        },
        {
            "$match": {
                "journal_entries.account_id": account_id
            }
        },
        {
            "$group": {
                "_id": None,
                # Support both old field names (debit/credit) and new field names (debit_amount/credit_amount)
                "total_debits": {
                    "$sum": {
                        "$ifNull": [
                            "$journal_entries.debit_amount",
                            {"$ifNull": ["$journal_entries.debit", 0]}
                        ]
                    }
                },
                "total_credits": {
                    "$sum": {
                        "$ifNull": [
                            "$journal_entries.credit_amount",
                            {"$ifNull": ["$journal_entries.credit", 0]}
                        ]
                    }
                }
            }
        }
    ]
    
    result = await transactions_collection.aggregate(pipeline).to_list(length=1)
    
    if not result:
        return Decimal("0")
    
    total_debits = Decimal(str(result[0]["total_debits"]))
    total_credits = Decimal(str(result[0]["total_credits"]))
    
    # Get account info to determine normal balance
    account = await accounts_collection.find_one({"_id": account_id})
    if not account:
        return Decimal("0")
    
    account_category = get_account_category(AccountType(account["account_type"]))
    
    # Calculate balance based on account category
    # Assets and Expenses: Debit increases balance
    # Liabilities, Equity, and Income: Credit increases balance
    if account_category in [AccountCategory.ASSETS, AccountCategory.EXPENSES]:
        balance = total_debits - total_credits
    else:
        balance = total_credits - total_debits
    
    # Add opening balance
    opening_balance = Decimal(str(account.get("opening_balance", 0)))
    return balance + opening_balance

async def create_default_accounts(company_id: str) -> List[str]:
    """Create default chart of accounts for a new company"""
    
    default_accounts = [
        # Assets
        {"name": "Cash", "account_type": AccountType.CASH, "account_number": "1000"},
        {"name": "Checking Account", "account_type": AccountType.CHECKING, "account_number": "1010"},
        {"name": "Savings Account", "account_type": AccountType.SAVINGS, "account_number": "1020"},
        {"name": "Accounts Receivable", "account_type": AccountType.ACCOUNTS_RECEIVABLE, "account_number": "1200"},
        {"name": "Inventory", "account_type": AccountType.INVENTORY, "account_number": "1300"},
        {"name": "Equipment", "account_type": AccountType.FIXED_ASSETS, "account_number": "1500"},
        
        # Liabilities
        {"name": "Accounts Payable", "account_type": AccountType.ACCOUNTS_PAYABLE, "account_number": "2000"},
        {"name": "Credit Card", "account_type": AccountType.CREDIT_CARD, "account_number": "2100"},
        {"name": "Short-term Debt", "account_type": AccountType.SHORT_TERM_DEBT, "account_number": "2200"},
        
        # Equity
        {"name": "Owner's Equity", "account_type": AccountType.OWNER_EQUITY, "account_number": "3000"},
        {"name": "Retained Earnings", "account_type": AccountType.RETAINED_EARNINGS, "account_number": "3200"},
        
        # Income
        {"name": "Revenue", "account_type": AccountType.REVENUE, "account_number": "4000"},
        {"name": "Service Income", "account_type": AccountType.SERVICE_INCOME, "account_number": "4100"},
        {"name": "Interest Income", "account_type": AccountType.INTEREST_INCOME, "account_number": "4200"},
        
        # Expenses
        {"name": "Cost of Goods Sold", "account_type": AccountType.COST_OF_GOODS_SOLD, "account_number": "5000"},
        {"name": "Office Supplies", "account_type": AccountType.OPERATING_EXPENSES, "account_number": "6000"},
        {"name": "Rent Expense", "account_type": AccountType.OPERATING_EXPENSES, "account_number": "6100"},
        {"name": "Utilities", "account_type": AccountType.OPERATING_EXPENSES, "account_number": "6200"},
        {"name": "Insurance", "account_type": AccountType.OPERATING_EXPENSES, "account_number": "6300"},
        {"name": "Professional Services", "account_type": AccountType.ADMINISTRATIVE_EXPENSES, "account_number": "6400"},
    ]
    
    created_account_ids = []
    
    for account_data in default_accounts:
        account_id = str(uuid.uuid4())
        account_doc = {
            "_id": account_id,
            "company_id": company_id,
            "name": account_data["name"],
            "account_type": account_data["account_type"],
            "account_number": account_data["account_number"],
            "description": f"Default {account_data['name']} account",
            "is_active": True,
            "opening_balance": 0,
            "currency_code": "USD",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "parent_account_id": None
        }
        
        await accounts_collection.insert_one(account_doc)
        created_account_ids.append(account_id)
    
    return created_account_ids

@accounts_router.post("/", response_model=AccountResponse)
async def create_account(
    account_data: AccountCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new account"""
    
    # Check if account with same name exists
    existing_account = await accounts_collection.find_one({
        "company_id": current_user["company_id"],
        "name": account_data.name,
        "is_active": True
    })
    
    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this name already exists"
        )
    
    # Validate parent account if specified
    if account_data.parent_account_id:
        parent_account = await accounts_collection.find_one({
            "_id": account_data.parent_account_id,
            "company_id": current_user["company_id"]
        })
        if not parent_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parent account not found"
            )
    
    # Generate account ID
    account_id = str(uuid.uuid4())
    
    # Determine account category
    account_category = get_account_category(account_data.account_type)
    
    # Create account document
    account_doc = {
        "_id": account_id,
        "company_id": current_user["company_id"],
        "name": account_data.name,
        "account_type": account_data.account_type,
        "account_category": account_category,
        "account_number": account_data.account_number,
        "parent_account_id": account_data.parent_account_id,
        "description": account_data.description,
        "is_active": account_data.is_active,
        "opening_balance": float(account_data.opening_balance) if account_data.opening_balance else 0,
        "currency_code": account_data.currency_code,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "created_by": current_user["_id"]
    }
    
    # Insert account
    await accounts_collection.insert_one(account_doc)
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="account_created",
        details={
            "account_id": account_id,
            "account_name": account_data.name,
            "account_type": account_data.account_type
        }
    )
    
    # Calculate current balance
    current_balance = await calculate_account_balance(account_id, current_user["company_id"])
    
    return AccountResponse(
        id=account_id,
        name=account_doc["name"],
        account_type=account_doc["account_type"],
        account_category=account_category,
        account_number=account_doc["account_number"],
        parent_account_id=account_doc["parent_account_id"],
        description=account_doc["description"],
        is_active=account_doc["is_active"],
        current_balance=current_balance,
        currency_code=account_doc["currency_code"],
        created_at=account_doc["created_at"],
        updated_at=account_doc["updated_at"],
        sub_accounts=[]
    )

@accounts_router.get("/", response_model=List[AccountResponse])
async def list_accounts(
    account_type: Optional[AccountType] = None,
    account_category: Optional[AccountCategory] = None,
    is_active: Optional[bool] = None,
    include_balances: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """List company's chart of accounts"""
    
    # Build query
    query = {"company_id": current_user["company_id"]}
    
    if account_type:
        query["account_type"] = account_type
    
    if account_category:
        query["account_category"] = account_category
    
    if is_active is not None:
        query["is_active"] = is_active
    
    # Execute query
    cursor = accounts_collection.find(query).sort([("account_number", 1), ("name", 1)])
    accounts = await cursor.to_list(length=None)
    
    # Convert to response format
    response_accounts = []
    for account in accounts:
        # Calculate balance if requested
        current_balance = Decimal("0")
        if include_balances:
            current_balance = await calculate_account_balance(account["_id"], current_user["company_id"])
        
        # Find sub-accounts
        sub_accounts = []
        if account.get("parent_account_id") is None:  # Only for parent accounts
            sub_account_cursor = accounts_collection.find({
                "company_id": current_user["company_id"],
                "parent_account_id": account["_id"]
            })
            sub_account_docs = await sub_account_cursor.to_list(length=None)
            sub_accounts = [sub_acc["_id"] for sub_acc in sub_account_docs]
        
        account_category = get_account_category(AccountType(account["account_type"]))
        
        response_accounts.append(AccountResponse(
            id=account["_id"],
            name=account["name"],
            account_type=account["account_type"],
            account_category=account_category,
            account_number=account.get("account_number"),
            parent_account_id=account.get("parent_account_id"),
            description=account.get("description"),
            is_active=account["is_active"],
            current_balance=current_balance,
            currency_code=account.get("currency_code", "USD"),
            created_at=account["created_at"],
            updated_at=account["updated_at"],
            sub_accounts=sub_accounts
        ))
    
    return response_accounts

@accounts_router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific account details"""
    
    account = await accounts_collection.find_one({
        "_id": account_id,
        "company_id": current_user["company_id"]
    })
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Calculate current balance
    current_balance = await calculate_account_balance(account_id, current_user["company_id"])
    
    # Find sub-accounts
    sub_account_cursor = accounts_collection.find({
        "company_id": current_user["company_id"],
        "parent_account_id": account_id
    })
    sub_account_docs = await sub_account_cursor.to_list(length=None)
    sub_accounts = [sub_acc["_id"] for sub_acc in sub_account_docs]
    
    account_category = get_account_category(AccountType(account["account_type"]))
    
    return AccountResponse(
        id=account["_id"],
        name=account["name"],
        account_type=account["account_type"],
        account_category=account_category,
        account_number=account.get("account_number"),
        parent_account_id=account.get("parent_account_id"),
        description=account.get("description"),
        is_active=account["is_active"],
        current_balance=current_balance,
        currency_code=account.get("currency_code", "USD"),
        created_at=account["created_at"],
        updated_at=account["updated_at"],
        sub_accounts=sub_accounts
    )

@accounts_router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: str,
    update_data: AccountUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update account details"""
    
    # Check if account exists and belongs to user's company
    account = await accounts_collection.find_one({
        "_id": account_id,
        "company_id": current_user["company_id"]
    })
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Prepare update data
    update_fields = {"updated_at": datetime.utcnow()}
    
    if update_data.name is not None:
        # Check if account with same name exists
        existing_account = await accounts_collection.find_one({
            "company_id": current_user["company_id"],
            "name": update_data.name,
            "is_active": True,
            "_id": {"$ne": account_id}
        })
        if existing_account:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Account with this name already exists"
            )
        update_fields["name"] = update_data.name
    
    if update_data.account_number is not None:
        update_fields["account_number"] = update_data.account_number
    
    if update_data.description is not None:
        update_fields["description"] = update_data.description
    
    if update_data.is_active is not None:
        update_fields["is_active"] = update_data.is_active
    
    # Update account
    await accounts_collection.update_one(
        {"_id": account_id},
        {"$set": update_fields}
    )
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="account_updated",
        details={
            "account_id": account_id,
            "updated_fields": [k for k in update_fields.keys() if k != "updated_at"]
        }
    )
    
    # Return updated account
    return await get_account(account_id, current_user)

@accounts_router.delete("/{account_id}")
async def delete_account(
    account_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Deactivate an account (cannot delete accounts with transactions)"""
    
    # Check if account exists and belongs to user's company
    account = await accounts_collection.find_one({
        "_id": account_id,
        "company_id": current_user["company_id"]
    })
    
    if not account:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found"
        )
    
    # Check if account has transactions
    transaction_count = await transactions_collection.count_documents({
        "company_id": current_user["company_id"],
        "journal_entries.account_id": account_id,
        "status": {"$ne": "void"}
    })
    
    if transaction_count > 0:
        # Deactivate instead of delete
        await accounts_collection.update_one(
            {"_id": account_id},
            {"$set": {
                "is_active": False,
                "updated_at": datetime.utcnow()
            }}
        )
        
        message = f"Account deactivated (has {transaction_count} transactions)"
        action = "account_deactivated"
    else:
        # Safe to delete
        await accounts_collection.delete_one({"_id": account_id})
        message = "Account deleted successfully"
        action = "account_deleted"
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action=action,
        details={
            "account_id": account_id,
            "account_name": account["name"],
            "transaction_count": transaction_count
        }
    )
    
    return {"message": message}

@accounts_router.post("/setup-defaults")
async def setup_default_accounts(current_user: dict = Depends(get_current_user)):
    """Create default chart of accounts for company"""
    
    # Check if company already has accounts
    existing_count = await accounts_collection.count_documents({
        "company_id": current_user["company_id"]
    })
    
    if existing_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Company already has accounts configured"
        )
    
    # Create default accounts
    created_account_ids = await create_default_accounts(current_user["company_id"])
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="default_accounts_created",
        details={
            "account_count": len(created_account_ids),
            "account_ids": created_account_ids
        }
    )
    
    return {
        "message": f"Created {len(created_account_ids)} default accounts",
        "account_ids": created_account_ids
    }