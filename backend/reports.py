from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
from enum import Enum
import uuid
from database import database, transactions_collection, accounts_collection, companies_collection
from auth import get_current_user, log_audit_event
from accounts import AccountCategory, AccountType, calculate_account_balance
import logging

logger = logging.getLogger(__name__)

async def get_company_base_currency(company_id: str) -> str:
    """Get the base currency for a company"""
    company = await companies_collection.find_one({"_id": company_id})
    if company and company.get("settings", {}).get("base_currency"):
        return company["settings"]["base_currency"]
    return "USD"  # Default fallback

reports_router = APIRouter()

class ReportFormat(str, Enum):
    JSON = "json"
    CSV = "csv"
    EXCEL = "excel"
    PDF = "pdf"

class ReportPeriod(str, Enum):
    CURRENT_MONTH = "current_month"
    LAST_MONTH = "last_month"
    CURRENT_QUARTER = "current_quarter"
    LAST_QUARTER = "last_quarter"
    CURRENT_YEAR = "current_year"
    LAST_YEAR = "last_year"
    CUSTOM = "custom"

class ProfitLossReport(BaseModel):
    model_config = {"json_encoders": {Decimal: float}}
    
    report_id: str
    company_id: str
    report_name: str
    period_start: date
    period_end: date
    generated_at: datetime
    currency: str
    
    # Revenue section
    total_revenue: Decimal
    revenue_accounts: List[Dict[str, Any]]
    
    # Expenses section
    total_expenses: Decimal
    expense_accounts: List[Dict[str, Any]]
    
    # Totals
    gross_profit: Decimal
    net_income: Decimal

class BalanceSheetReport(BaseModel):
    model_config = {"json_encoders": {Decimal: float}}
    
    report_id: str
    company_id: str
    report_name: str
    as_of_date: date
    generated_at: datetime
    currency: str
    
    # Assets
    total_assets: Decimal
    current_assets: Decimal
    non_current_assets: Decimal
    asset_accounts: List[Dict[str, Any]]
    
    # Liabilities
    total_liabilities: Decimal
    current_liabilities: Decimal
    long_term_liabilities: Decimal
    liability_accounts: List[Dict[str, Any]]
    
    # Equity
    total_equity: Decimal
    equity_accounts: List[Dict[str, Any]]
    
    # Balance check
    assets_minus_liabilities: Decimal
    is_balanced: bool

class CashFlowReport(BaseModel):
    model_config = {"json_encoders": {Decimal: float}}
    
    report_id: str
    company_id: str
    report_name: str
    period_start: date
    period_end: date
    generated_at: datetime
    currency: str
    
    # Operating Activities
    net_income: Decimal
    operating_cash_flow: Decimal
    operating_activities: List[Dict[str, Any]]
    
    # Investing Activities
    investing_cash_flow: Decimal
    investing_activities: List[Dict[str, Any]]
    
    # Financing Activities
    financing_cash_flow: Decimal
    financing_activities: List[Dict[str, Any]]
    
    # Net Change
    net_change_in_cash: Decimal
    beginning_cash: Decimal


class TrialBalanceReport(BaseModel):
    model_config = {"json_encoders": {Decimal: float}}
    
    report_id: str
    company_id: str
    report_name: str
    as_of_date: date
    generated_at: datetime
    currency: str
    accounts: List[Dict[str, Any]]
    total_debits: Decimal
    total_credits: Decimal
    is_balanced: bool

class GeneralLedgerReport(BaseModel):
    model_config = {"json_encoders": {Decimal: float}}
    
    report_id: str
    company_id: str
    report_name: str
    period_start: date
    period_end: date
    generated_at: datetime
    currency: str
    accounts: List[Dict[str, Any]]

@reports_router.get("/trial-balance", response_model=TrialBalanceReport)
async def generate_trial_balance(
    as_of_date: Optional[date] = Query(None),
    format: ReportFormat = ReportFormat.JSON,
    current_user: dict = Depends(get_current_user)
):
    """Generate Trial Balance report"""
    
    if not as_of_date:
        as_of_date = date.today()
    
    # Get all active accounts
    accounts = await accounts_collection.find({
        "company_id": current_user["company_id"],
        "is_active": True
    }).sort("account_number", 1).to_list(length=None)
    
    account_balances = []
    total_debits = Decimal("0")
    total_credits = Decimal("0")
    
    for account in accounts:
        # Calculate balance for each account
        balance = await calculate_account_balance(account["_id"], current_user["company_id"])
        
        account_category = AccountCategory(account.get("account_category", "assets"))
        
        # Determine debit or credit balance based on account category
        # Assets and Expenses have debit balances
        # Liabilities, Equity, and Income have credit balances
        if account_category in [AccountCategory.ASSETS, AccountCategory.EXPENSES]:
            debit_balance = balance if balance > 0 else Decimal("0")
            credit_balance = abs(balance) if balance < 0 else Decimal("0")
        else:
            debit_balance = abs(balance) if balance < 0 else Decimal("0")
            credit_balance = balance if balance > 0 else Decimal("0")
        
        total_debits += debit_balance
        total_credits += credit_balance
        
        account_balances.append({
            "account_id": account["_id"],
            "account_number": account.get("account_number", ""),
            "account_name": account["name"],
            "account_type": account["account_type"],
            "account_category": account_category,
            "debit_balance": debit_balance,
            "credit_balance": credit_balance
        })
    
    # Check if balanced
    is_balanced = abs(total_debits - total_credits) < Decimal("0.01")
    
    report_id = str(uuid.uuid4())
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="trial_balance_report_generated",
        details={
            "report_id": report_id,
            "as_of_date": as_of_date.isoformat(),
            "total_debits": float(total_debits),
            "total_credits": float(total_credits),
            "is_balanced": is_balanced
        }
    )
    
    # Get company base currency
    base_currency = await get_company_base_currency(current_user["company_id"])
    
    report_data = TrialBalanceReport(
        report_id=report_id,
        company_id=current_user["company_id"],
        report_name=f"Trial Balance as of {as_of_date}",
        as_of_date=as_of_date,
        generated_at=datetime.utcnow(),
        currency=base_currency,
        accounts=account_balances,
        total_debits=total_debits,
        total_credits=total_credits,
        is_balanced=is_balanced
    )
    
    # Handle export formats
    if format == ReportFormat.PDF:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        report_dict['company_name'] = (await companies_collection.find_one({"_id": current_user["company_id"]}))["name"]
        return ReportExporter.export_to_pdf(report_dict, "trial_balance")
    elif format == ReportFormat.EXCEL:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_excel(report_dict, "trial_balance")
    elif format == ReportFormat.CSV:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_csv(report_dict, "trial_balance")
    
    return report_data

@reports_router.get("/general-ledger", response_model=GeneralLedgerReport)
async def generate_general_ledger(
    period: ReportPeriod = ReportPeriod.CURRENT_MONTH,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    account_id: Optional[str] = Query(None),
    format: ReportFormat = ReportFormat.JSON,
    current_user: dict = Depends(get_current_user)
):
    """Generate General Ledger report (detailed transaction listing by account)"""
    
    # Get period dates
    period_start, period_end = get_period_dates(period, start_date, end_date)
    
    # Get accounts to include in report
    account_query = {"company_id": current_user["company_id"], "is_active": True}
    if account_id:
        account_query["_id"] = account_id
    
    accounts = await accounts_collection.find(account_query).sort("account_number", 1).to_list(length=None)
    
    account_ledgers = []
    
    for account in accounts:
        # Get all transactions affecting this account
        pipeline = [
            {
                "$match": {
                    "company_id": current_user["company_id"],
                    "transaction_date": {"$gte": period_start, "$lte": period_end},
                    "status": {"$ne": "void"},
                    "journal_entries.account_id": account["_id"]
                }
            },
            {
                "$sort": {"transaction_date": 1, "created_at": 1}
            },
            {
                "$project": {
                    "transaction_date": 1,
                    "description": 1,
                    "reference_number": 1,
                    "journal_entries": {
                        "$filter": {
                            "input": "$journal_entries",
                            "as": "entry",
                            "cond": {"$eq": ["$$entry.account_id", account["_id"]]}
                        }
                    }
                }
            }
        ]
        
        transactions = await transactions_collection.aggregate(pipeline).to_list(length=None)
        
        # Calculate running balance
        running_balance = Decimal("0")
        transaction_list = []
        
        for txn in transactions:
            for entry in txn.get("journal_entries", []):
                debit = Decimal(str(entry.get("debit_amount", 0)))
                credit = Decimal(str(entry.get("credit_amount", 0)))
                
                # Update running balance based on account category
                account_category = AccountCategory(account.get("account_category", "assets"))
                if account_category in [AccountCategory.ASSETS, AccountCategory.EXPENSES]:
                    running_balance += (debit - credit)
                else:
                    running_balance += (credit - debit)
                
                transaction_list.append({
                    "date": txn["transaction_date"].strftime('%Y-%m-%d') if isinstance(txn["transaction_date"], datetime) else str(txn["transaction_date"]),
                    "description": entry.get("description", txn.get("description", "")),
                    "reference": txn.get("reference_number", ""),
                    "debit": debit,
                    "credit": credit,
                    "balance": running_balance
                })
        
        if transaction_list:  # Only include accounts with transactions
            account_ledgers.append({
                "account_id": account["_id"],
                "account_number": account.get("account_number", ""),
                "account_name": account["name"],
                "account_type": account["account_type"],
                "opening_balance": Decimal("0"),  # Simplified - would need to calculate from period start
                "closing_balance": running_balance,
                "transactions": transaction_list
            })
    
    report_id = str(uuid.uuid4())
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="general_ledger_report_generated",
        details={
            "report_id": report_id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "account_count": len(account_ledgers)
        }
    )
    
    # Get company base currency
    base_currency = await get_company_base_currency(current_user["company_id"])
    
    report_data = GeneralLedgerReport(
        report_id=report_id,
        company_id=current_user["company_id"],
        report_name=f"General Ledger - {period_start.date()} to {period_end.date()}",
        period_start=period_start.date() if isinstance(period_start, datetime) else period_start,
        period_end=period_end.date() if isinstance(period_end, datetime) else period_end,
        generated_at=datetime.utcnow(),
        currency=base_currency,
        accounts=account_ledgers
    )
    
    # Handle export formats
    if format == ReportFormat.PDF:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        report_dict['company_name'] = (await companies_collection.find_one({"_id": current_user["company_id"]}))["name"]
        return ReportExporter.export_to_pdf(report_dict, "general_ledger")
    elif format == ReportFormat.EXCEL:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_excel(report_dict, "general_ledger")
    elif format == ReportFormat.CSV:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_csv(report_dict, "general_ledger")
    
    return report_data

def get_period_dates(period: ReportPeriod, custom_start: Optional[date] = None, custom_end: Optional[date] = None):
    """Get start and end dates for report period"""
    today = date.today()
    
    if period == ReportPeriod.CURRENT_MONTH:
        start_date = datetime.combine(date(today.year, today.month, 1), datetime.min.time())
        if today.month == 12:
            end_date = datetime.combine(date(today.year + 1, 1, 1) - timedelta(days=1), datetime.max.time())
        else:
            end_date = datetime.combine(date(today.year, today.month + 1, 1) - timedelta(days=1), datetime.max.time())
    elif period == ReportPeriod.LAST_MONTH:
        if today.month == 1:
            start_date = datetime.combine(date(today.year - 1, 12, 1), datetime.min.time())
            end_date = datetime.combine(date(today.year, 1, 1) - timedelta(days=1), datetime.max.time())
        else:
            start_date = datetime.combine(date(today.year, today.month - 1, 1), datetime.min.time())
            end_date = datetime.combine(date(today.year, today.month, 1) - timedelta(days=1), datetime.max.time())
    elif period == ReportPeriod.CURRENT_QUARTER:
        quarter = (today.month - 1) // 3 + 1
        start_date = datetime.combine(date(today.year, (quarter - 1) * 3 + 1, 1), datetime.min.time())
        if quarter == 4:
            end_date = datetime.combine(date(today.year + 1, 1, 1) - timedelta(days=1), datetime.max.time())
        else:
            end_date = datetime.combine(date(today.year, quarter * 3 + 1, 1) - timedelta(days=1), datetime.max.time())
    elif period == ReportPeriod.CURRENT_YEAR:
        start_date = datetime.combine(date(today.year, 1, 1), datetime.min.time())
        end_date = datetime.combine(date(today.year, 12, 31), datetime.max.time())
    elif period == ReportPeriod.LAST_YEAR:
        start_date = datetime.combine(date(today.year - 1, 1, 1), datetime.min.time())
        end_date = datetime.combine(date(today.year - 1, 12, 31), datetime.max.time())
    elif period == ReportPeriod.CUSTOM:
        if not custom_start or not custom_end:
            raise HTTPException(
                status_code=400,
                detail="Custom period requires start_date and end_date"
            )
        start_date = datetime.combine(custom_start, datetime.min.time()) if isinstance(custom_start, date) else custom_start
        end_date = datetime.combine(custom_end, datetime.max.time()) if isinstance(custom_end, date) else custom_end
    else:
        raise HTTPException(
            status_code=400,
            detail="Invalid report period"
        )
    
    return start_date, end_date

@reports_router.get("/profit-loss", response_model=ProfitLossReport)
async def generate_profit_loss_report(
    period: ReportPeriod = ReportPeriod.CURRENT_MONTH,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    format: ReportFormat = ReportFormat.JSON,
    current_user: dict = Depends(get_current_user)
):
    """Generate Profit & Loss statement"""
    
    # Get period dates
    period_start, period_end = get_period_dates(period, start_date, end_date)
    
    # Get all income and expense accounts
    income_accounts = await accounts_collection.find({
        "company_id": current_user["company_id"],
        "account_type": {"$in": [
            AccountType.REVENUE.value,
            AccountType.SERVICE_INCOME.value,
            AccountType.INTEREST_INCOME.value,
            AccountType.OTHER_INCOME.value
        ]},
        "is_active": True
    }).to_list(length=None)
    
    expense_accounts = await accounts_collection.find({
        "company_id": current_user["company_id"],
        "account_type": {"$in": [
            AccountType.COST_OF_GOODS_SOLD.value,
            AccountType.OPERATING_EXPENSES.value,
            AccountType.ADMINISTRATIVE_EXPENSES.value,
            AccountType.INTEREST_EXPENSE.value,
            AccountType.TAX_EXPENSE.value,
            AccountType.OTHER_EXPENSES.value,
            # Specific expense types
            AccountType.OFFICE_SUPPLIES.value,
            AccountType.TRAVEL.value,
            AccountType.UTILITIES.value,
            AccountType.RENT.value,
            AccountType.INSURANCE.value,
            AccountType.PROFESSIONAL_FEES.value,
            AccountType.LEGAL_FEES.value,
            AccountType.MARKETING.value,
            AccountType.SOFTWARE.value,
            AccountType.PAYROLL.value
        ]},
        "is_active": True
    }).to_list(length=None)
    
    # Calculate revenue
    revenue_data = []
    total_revenue = Decimal("0")
    
    for account in income_accounts:
        # Get transactions for this account in the period
        pipeline = [
            {
                "$match": {
                    "company_id": current_user["company_id"],
                    "transaction_date": {"$gte": period_start, "$lte": period_end},
                    "status": {"$ne": "void"},
                    "journal_entries.account_id": account["_id"]
                }
            },
            {
                "$unwind": "$journal_entries"
            },
            {
                "$match": {
                    "journal_entries.account_id": account["_id"]
                }
            },
            {
                "$group": {
                    "_id": None,
                    "total_credits": {
                        "$sum": {
                            "$ifNull": [
                                "$journal_entries.credit_amount",
                                {"$ifNull": ["$journal_entries.credit", 0]}
                            ]
                        }
                    },
                    "total_debits": {
                        "$sum": {
                            "$ifNull": [
                                "$journal_entries.debit_amount",
                                {"$ifNull": ["$journal_entries.debit", 0]}
                            ]
                        }
                    }
                }
            }
        ]
        
        result = await transactions_collection.aggregate(pipeline).to_list(length=1)
        
        if result:
            # For income accounts, credits increase the balance
            account_revenue = Decimal(str(result[0]["total_credits"] - result[0]["total_debits"]))
        else:
            account_revenue = Decimal("0")
        
        revenue_data.append({
            "account_id": account["_id"],
            "account_name": account["name"],
            "account_number": account.get("account_number"),
            "amount": account_revenue
        })
        
        total_revenue += account_revenue
    
    # Calculate expenses
    expense_data = []
    total_expenses = Decimal("0")
    
    for account in expense_accounts:
        # Get transactions for this account in the period
        pipeline = [
            {
                "$match": {
                    "company_id": current_user["company_id"],
                    "transaction_date": {"$gte": period_start, "$lte": period_end},
                    "status": {"$ne": "void"},
                    "journal_entries.account_id": account["_id"]
                }
            },
            {
                "$unwind": "$journal_entries"
            },
            {
                "$match": {
                    "journal_entries.account_id": account["_id"]
                }
            },
            {
                "$group": {
                    "_id": None,
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
        
        if result:
            # For expense accounts, debits increase the balance
            account_expense = Decimal(str(result[0]["total_debits"] - result[0]["total_credits"]))
        else:
            account_expense = Decimal("0")
        
        expense_data.append({
            "account_id": account["_id"],
            "account_name": account["name"],
            "account_number": account.get("account_number"),
            "amount": account_expense
        })
        
        total_expenses += account_expense
    
    # Calculate totals
    gross_profit = total_revenue
    net_income = total_revenue - total_expenses
    
    report_id = str(uuid.uuid4())
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="profit_loss_report_generated",
        details={
            "report_id": report_id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "total_revenue": float(total_revenue),
            "total_expenses": float(total_expenses),
            "net_income": float(net_income)
        }
    )
    
    # Get company base currency
    base_currency = await get_company_base_currency(current_user["company_id"])
    
    report_data = ProfitLossReport(
        report_id=report_id,
        company_id=current_user["company_id"],
        report_name=f"Profit & Loss Statement - {period_start} to {period_end}",
        period_start=period_start.date() if isinstance(period_start, datetime) else period_start,
        period_end=period_end.date() if isinstance(period_end, datetime) else period_end,
        generated_at=datetime.utcnow(),
        currency=base_currency,
        total_revenue=total_revenue,
        revenue_accounts=revenue_data,
        total_expenses=total_expenses,
        expense_accounts=expense_data,
        gross_profit=gross_profit,
        net_income=net_income
    )
    
    # Handle export formats
    if format == ReportFormat.PDF:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        report_dict['company_name'] = (await companies_collection.find_one({"_id": current_user["company_id"]}))["name"]
        return ReportExporter.export_to_pdf(report_dict, "profit_loss")
    elif format == ReportFormat.EXCEL:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_excel(report_dict, "profit_loss")
    elif format == ReportFormat.CSV:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_csv(report_dict, "profit_loss")
    
    return report_data

@reports_router.get("/balance-sheet", response_model=BalanceSheetReport)
async def generate_balance_sheet_report(
    as_of_date: Optional[date] = Query(None),
    format: ReportFormat = ReportFormat.JSON,
    current_user: dict = Depends(get_current_user)
):
    """Generate Balance Sheet report"""
    
    if not as_of_date:
        as_of_date = date.today()
    
    # Get all balance sheet accounts
    asset_accounts = await accounts_collection.find({
        "company_id": current_user["company_id"],
        "account_type": {"$in": [
            AccountType.CASH.value,
            AccountType.CHECKING.value,
            AccountType.SAVINGS.value,
            AccountType.ACCOUNTS_RECEIVABLE.value,
            AccountType.INVENTORY.value,
            AccountType.PREPAID_EXPENSES.value,
            AccountType.FIXED_ASSETS.value,
            AccountType.OTHER_ASSETS.value
        ]},
        "is_active": True
    }).to_list(length=None)
    
    liability_accounts = await accounts_collection.find({
        "company_id": current_user["company_id"],
        "account_type": {"$in": [
            AccountType.ACCOUNTS_PAYABLE.value,
            AccountType.CREDIT_CARD.value,
            AccountType.SHORT_TERM_DEBT.value,
            AccountType.LONG_TERM_DEBT.value,
            AccountType.ACCRUED_EXPENSES.value,
            AccountType.OTHER_LIABILITIES.value
        ]},
        "is_active": True
    }).to_list(length=None)
    
    equity_accounts = await accounts_collection.find({
        "company_id": current_user["company_id"],
        "account_type": {"$in": [
            AccountType.OWNER_EQUITY.value,
            AccountType.RETAINED_EARNINGS.value,
            AccountType.COMMON_STOCK.value
        ]},
        "is_active": True
    }).to_list(length=None)
    
    # Calculate asset balances
    asset_data = []
    total_assets = Decimal("0")
    current_assets = Decimal("0")
    
    for account in asset_accounts:
        balance = await calculate_account_balance(account["_id"], current_user["company_id"])
        
        # Determine if current or non-current asset
        is_current_asset = account["account_type"] in [
            AccountType.CASH.value,
            AccountType.CHECKING.value,
            AccountType.SAVINGS.value,
            AccountType.ACCOUNTS_RECEIVABLE.value,
            AccountType.INVENTORY.value,
            AccountType.PREPAID_EXPENSES.value
        ]
        
        asset_data.append({
            "account_id": account["_id"],
            "account_name": account["name"],
            "account_number": account.get("account_number"),
            "balance": balance,
            "is_current": is_current_asset
        })
        
        total_assets += balance
        if is_current_asset:
            current_assets += balance
    
    non_current_assets = total_assets - current_assets
    
    # Calculate liability balances
    liability_data = []
    total_liabilities = Decimal("0")
    current_liabilities = Decimal("0")
    
    for account in liability_accounts:
        balance = await calculate_account_balance(account["_id"], current_user["company_id"])
        
        # Determine if current or long-term liability
        is_current_liability = account["account_type"] in [
            AccountType.ACCOUNTS_PAYABLE.value,
            AccountType.CREDIT_CARD.value,
            AccountType.SHORT_TERM_DEBT.value,
            AccountType.ACCRUED_EXPENSES.value
        ]
        
        liability_data.append({
            "account_id": account["_id"],
            "account_name": account["name"],
            "account_number": account.get("account_number"),
            "balance": balance,
            "is_current": is_current_liability
        })
        
        total_liabilities += balance
        if is_current_liability:
            current_liabilities += balance
    
    long_term_liabilities = total_liabilities - current_liabilities
    
    # Calculate equity balances
    equity_data = []
    total_equity = Decimal("0")
    
    for account in equity_accounts:
        balance = await calculate_account_balance(account["_id"], current_user["company_id"])
        
        equity_data.append({
            "account_id": account["_id"],
            "account_name": account["name"],
            "account_number": account.get("account_number"),
            "balance": balance
        })
        
        total_equity += balance
    
    # Add retained earnings (net income from P&L)
    # This is a simplified calculation - in practice, you'd need more sophisticated retained earnings tracking
    
    # Balance check
    assets_minus_liabilities = total_assets - total_liabilities
    is_balanced = abs(assets_minus_liabilities - total_equity) < Decimal("0.01")
    
    report_id = str(uuid.uuid4())
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="balance_sheet_report_generated",
        details={
            "report_id": report_id,
            "as_of_date": as_of_date.isoformat(),
            "total_assets": float(total_assets),
            "total_liabilities": float(total_liabilities),
            "total_equity": float(total_equity),
            "is_balanced": is_balanced
        }
    )
    
    # Get company base currency
    base_currency = await get_company_base_currency(current_user["company_id"])
    
    report_data = BalanceSheetReport(
        report_id=report_id,
        company_id=current_user["company_id"],
        report_name=f"Balance Sheet as of {as_of_date}",
        as_of_date=as_of_date,
        generated_at=datetime.utcnow(),
        currency=base_currency,
        total_assets=total_assets,
        current_assets=current_assets,
        non_current_assets=non_current_assets,
        asset_accounts=asset_data,
        total_liabilities=total_liabilities,
        current_liabilities=current_liabilities,
        long_term_liabilities=long_term_liabilities,
        liability_accounts=liability_data,
        total_equity=total_equity,
        equity_accounts=equity_data,
        assets_minus_liabilities=assets_minus_liabilities,
        is_balanced=is_balanced
    )
    
    # Handle export formats
    if format == ReportFormat.PDF:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        report_dict['company_name'] = (await companies_collection.find_one({"_id": current_user["company_id"]}))["name"]
        return ReportExporter.export_to_pdf(report_dict, "balance_sheet")
    elif format == ReportFormat.EXCEL:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_excel(report_dict, "balance_sheet")
    elif format == ReportFormat.CSV:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_csv(report_dict, "balance_sheet")
    
    return report_data

@reports_router.get("/cash-flow", response_model=CashFlowReport)
async def generate_cash_flow_report(
    period: ReportPeriod = ReportPeriod.CURRENT_MONTH,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    format: ReportFormat = ReportFormat.JSON,
    current_user: dict = Depends(get_current_user)
):
    """Generate Cash Flow statement (simplified direct method)"""
    
    # Get period dates
    period_start, period_end = get_period_dates(period, start_date, end_date)
    
    # This is a simplified cash flow calculation
    # In practice, you'd need more sophisticated categorization of cash flows
    
    # Get cash accounts
    cash_accounts = await accounts_collection.find({
        "company_id": current_user["company_id"],
        "account_type": {"$in": [
            AccountType.CASH.value,
            AccountType.CHECKING.value,
            AccountType.SAVINGS.value
        ]},
        "is_active": True
    }).to_list(length=None)
    
    # Calculate beginning cash balance
    beginning_cash = Decimal("0")
    ending_cash = Decimal("0")
    
    for account in cash_accounts:
        # Calculate balance at beginning of period
        # This is simplified - you'd need to calculate historical balances properly
        current_balance = await calculate_account_balance(account["_id"], current_user["company_id"])
        ending_cash += current_balance
    
    # Get net income from P&L for the period
    pl_report = await generate_profit_loss_report(period, start_date, end_date, ReportFormat.JSON, current_user)
    net_income = pl_report.net_income
    
    # Operating activities (simplified)
    operating_activities = [
        {
            "description": "Net Income",
            "amount": net_income
        }
    ]
    
    # TODO: Add adjustments for non-cash items (depreciation, etc.)
    # TODO: Add changes in working capital
    
    operating_cash_flow = net_income
    
    # Investing activities (simplified)
    investing_activities = []
    investing_cash_flow = Decimal("0")
    
    # TODO: Calculate investing activities from fixed asset changes
    
    # Financing activities (simplified)
    financing_activities = []
    financing_cash_flow = Decimal("0")
    
    # TODO: Calculate financing activities from debt and equity changes
    
    # Net change in cash
    net_change_in_cash = operating_cash_flow + investing_cash_flow + financing_cash_flow
    beginning_cash = ending_cash - net_change_in_cash
    
    report_id = str(uuid.uuid4())
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="cash_flow_report_generated",
        details={
            "report_id": report_id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "net_change_in_cash": float(net_change_in_cash),
            "ending_cash": float(ending_cash)
        }
    )
    
    # Get company base currency
    base_currency = await get_company_base_currency(current_user["company_id"])
    
    report_data = CashFlowReport(
        report_id=report_id,
        company_id=current_user["company_id"],
        report_name=f"Cash Flow Statement - {period_start} to {period_end}",
        period_start=period_start.date() if isinstance(period_start, datetime) else period_start,
        period_end=period_end.date() if isinstance(period_end, datetime) else period_end,
        generated_at=datetime.utcnow(),
        currency=base_currency,
        net_income=net_income,
        operating_cash_flow=operating_cash_flow,
        operating_activities=operating_activities,
        investing_cash_flow=investing_cash_flow,
        investing_activities=investing_activities,
        financing_cash_flow=financing_cash_flow,
        financing_activities=financing_activities,
        net_change_in_cash=net_change_in_cash,
        beginning_cash=beginning_cash,
        ending_cash=ending_cash
    )
    
    # Handle export formats
    if format == ReportFormat.PDF:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        report_dict['company_name'] = (await companies_collection.find_one({"_id": current_user["company_id"]}))["name"]
        return ReportExporter.export_to_pdf(report_dict, "cash_flow")
    elif format == ReportFormat.EXCEL:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_excel(report_dict, "cash_flow")
    elif format == ReportFormat.CSV:
        from report_exports import ReportExporter
        report_dict = report_data.dict()
        return ReportExporter.export_to_csv(report_dict, "cash_flow")
    
    return report_data

@reports_router.get("/multi-currency-summary")
async def get_multi_currency_summary(
    period: ReportPeriod = ReportPeriod.CURRENT_MONTH,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: dict = Depends(get_current_user)
):
    """Get multi-currency transaction summary with conversion to base currency"""
    
    # Get period dates
    period_start, period_end = get_period_dates(period, start_date, end_date)
    
    # Get base currency
    base_currency = await get_company_base_currency(current_user["company_id"])
    
    # Get all transactions in the period grouped by currency
    pipeline = [
        {
            "$match": {
                "company_id": current_user["company_id"],
                "transaction_date": {"$gte": period_start, "$lte": period_end},
                "status": {"$ne": "void"}
            }
        },
        {
            "$group": {
                "_id": {
                    "currency": "$currency",
                    "transaction_type": "$transaction_type"
                },
                "total_amount": {"$sum": "$amount"},
                "total_base_amount": {"$sum": "$base_currency_amount"},
                "count": {"$sum": 1}
            }
        },
        {
            "$sort": {"_id.currency": 1, "_id.transaction_type": 1}
        }
    ]
    
    results = await transactions_collection.aggregate(pipeline).to_list(length=None)
    
    # Organize results by currency
    currency_summary = {}
    total_income_base = Decimal("0")
    total_expense_base = Decimal("0")
    
    for result in results:
        currency = result["_id"]["currency"] or base_currency
        txn_type = result["_id"]["transaction_type"]
        
        if currency not in currency_summary:
            currency_summary[currency] = {
                "currency": currency,
                "income": Decimal("0"),
                "expense": Decimal("0"),
                "income_base": Decimal("0"),
                "expense_base": Decimal("0"),
                "transaction_count": 0
            }
        
        amount = Decimal(str(result["total_amount"]))
        base_amount = Decimal(str(result["total_base_amount"]))
        
        if txn_type == "income":
            currency_summary[currency]["income"] += amount
            currency_summary[currency]["income_base"] += base_amount
            total_income_base += base_amount
        elif txn_type == "expense":
            currency_summary[currency]["expense"] += amount
            currency_summary[currency]["expense_base"] += base_amount
            total_expense_base += base_amount
        
        currency_summary[currency]["transaction_count"] += result["count"]
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="multi_currency_report_generated",
        details={
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "currencies": list(currency_summary.keys()),
            "base_currency": base_currency
        }
    )
    
    return {
        "report_name": f"Multi-Currency Summary - {period_start.date()} to {period_end.date()}",
        "period_start": period_start.date() if isinstance(period_start, datetime) else period_start,
        "period_end": period_end.date() if isinstance(period_end, datetime) else period_end,
        "base_currency": base_currency,
        "generated_at": datetime.utcnow(),
        "currency_breakdown": list(currency_summary.values()),
        "totals_in_base_currency": {
            "total_income": total_income_base,
            "total_expense": total_expense_base,
            "net_income": total_income_base - total_expense_base,
            "currency": base_currency
        }
    }

@reports_router.get("/dashboard-summary")
async def get_dashboard_summary(current_user: dict = Depends(get_current_user)):
    """Get summary data for dashboard"""
    
    # Get current month P&L
    current_month_pl = await generate_profit_loss_report(
        ReportPeriod.CURRENT_MONTH, None, None, ReportFormat.JSON, current_user
    )
    
    # Get current balance sheet
    current_bs = await generate_balance_sheet_report(
        None, ReportFormat.JSON, current_user
    )
    
    # Get transaction counts
    total_transactions = await transactions_collection.count_documents({
        "company_id": current_user["company_id"],
        "status": {"$ne": "void"}
    })
    
    pending_transactions = await transactions_collection.count_documents({
        "company_id": current_user["company_id"],
        "status": "pending"
    })
    
    # Get document counts
    from database import documents_collection
    total_documents = await documents_collection.count_documents({
        "company_id": current_user["company_id"]
    })
    
    processing_documents = await documents_collection.count_documents({
        "company_id": current_user["company_id"],
        "processing_status": "processing"
    })
    
    # Multi-currency summary
    base_currency = await get_company_base_currency(current_user["company_id"])
    
    # Get currencies used in transactions
    currencies_used = await transactions_collection.distinct(
        "currency",
        {"company_id": current_user["company_id"], "status": {"$ne": "void"}}
    )
    
    return {
        "summary": {
            "current_month_revenue": current_month_pl.total_revenue,
            "current_month_expenses": current_month_pl.total_expenses,
            "current_month_profit": current_month_pl.net_income,
            "total_assets": current_bs.total_assets,
            "total_liabilities": current_bs.total_liabilities,
            "total_equity": current_bs.total_equity,
            "cash_balance": sum(
                account["balance"] for account in current_bs.asset_accounts
                if "cash" in account["account_name"].lower() or "checking" in account["account_name"].lower()
            ),
            "base_currency": base_currency,
            "currencies_in_use": currencies_used or [base_currency]
        },
        "counts": {
            "total_transactions": total_transactions,
            "pending_transactions": pending_transactions,
            "total_documents": total_documents,
            "processing_documents": processing_documents
        },
        "alerts": [
            # TODO: Add business rule-based alerts
        ]
    }