from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum
import uuid
from database import database, transactions_collection, accounts_collection, companies_collection
from auth import get_current_user, log_audit_event
import logging

logger = logging.getLogger(__name__)

transactions_router = APIRouter()

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"
    TRANSFER = "transfer"
    ADJUSTMENT = "adjustment"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    CLEARED = "cleared"
    RECONCILED = "reconciled"
    VOID = "void"

class TransactionCategory(str, Enum):
    # Income categories
    SALARY = "salary"
    BUSINESS_INCOME = "business_income"
    INVESTMENT_INCOME = "investment_income"
    OTHER_INCOME = "other_income"
    SALES_REVENUE = "sales_revenue"
    SERVICE_INCOME = "service_income"
    
    # Expense categories
    OFFICE_SUPPLIES = "office_supplies"
    TRAVEL = "travel"
    MEALS = "meals"
    UTILITIES = "utilities"
    RENT = "rent"
    INSURANCE = "insurance"
    PROFESSIONAL_SERVICES = "professional_services"
    PROFESSIONAL_FEES = "professional_fees"
    LEGAL_FEES = "legal_fees"
    CONSULTING = "consulting"
    MARKETING = "marketing"
    EQUIPMENT = "equipment"
    SOFTWARE = "software"
    TAXES = "taxes"
    INTEREST = "interest"
    LODGING = "lodging"
    TRAINING = "training"
    TRANSPORTATION = "transportation"
    OTHER_EXPENSE = "other_expense"

class JournalEntry(BaseModel):
    account_id: str
    debit_amount: Optional[Decimal] = None
    credit_amount: Optional[Decimal] = None
    description: Optional[str] = None
    # Multi-currency support
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    base_currency_debit: Optional[Decimal] = None
    base_currency_credit: Optional[Decimal] = None
    exchange_rate: Optional[Decimal] = None

class TransactionCreate(BaseModel):
    description: str
    amount: Decimal = Field(..., gt=0)
    transaction_type: TransactionType
    category: Optional[TransactionCategory] = None
    transaction_date: date
    reference_number: Optional[str] = None
    payee: Optional[str] = None
    memo: Optional[str] = None
    tags: Optional[List[str]] = []
    # Multi-currency support
    currency: str = Field(default="USD", min_length=3, max_length=3)
    base_currency_amount: Optional[Decimal] = None
    exchange_rate: Optional[Decimal] = None
    # For double-entry accounting
    journal_entries: Optional[List[JournalEntry]] = []
    # For automatic account mapping
    from_account_id: Optional[str] = None
    to_account_id: Optional[str] = None

class TransactionUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[Decimal] = None
    transaction_type: Optional[TransactionType] = None
    category: Optional[TransactionCategory] = None
    transaction_date: Optional[date] = None
    reference_number: Optional[str] = None
    payee: Optional[str] = None
    memo: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[TransactionStatus] = None
    # Multi-currency support
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    base_currency_amount: Optional[Decimal] = None
    exchange_rate: Optional[Decimal] = None

class TransactionResponse(BaseModel):
    id: str
    description: str
    amount: Decimal
    transaction_type: TransactionType
    category: Optional[TransactionCategory]
    transaction_date: date
    status: TransactionStatus
    reference_number: Optional[str]
    payee: Optional[str]
    memo: Optional[str]
    tags: List[str]
    created_at: datetime
    created_by: str
    journal_entries: List[Dict[str, Any]]
    confidence_score: Optional[float]
    is_reconciled: bool
    document_id: Optional[str]
    # Multi-currency support
    currency: str
    base_currency_amount: Optional[Decimal]
    exchange_rate: Optional[Decimal]

def validate_journal_entries(entries: List[JournalEntry]) -> tuple[bool, str]:
    """Validate that journal entries balance (debits = credits)"""
    if not entries or len(entries) < 2:
        return False, "At least two journal entries required for double-entry accounting"
    
    total_debits = sum(entry.debit_amount or 0 for entry in entries)
    total_credits = sum(entry.credit_amount or 0 for entry in entries)
    
    if abs(total_debits - total_credits) > 0.01:  # Allow for small rounding differences
        return False, f"Journal entries must balance: Debits ({total_debits}) != Credits ({total_credits})"
    
    return True, "Valid"

async def get_company_base_currency(company_id: str) -> str:
    """Get company's base currency"""
    company = await companies_collection.find_one({"_id": company_id})
    if company and company.get("settings", {}).get("base_currency"):
        return company["settings"]["base_currency"]
    return "USD"  # Default to USD

async def convert_to_base_currency(
    amount: Decimal, 
    from_currency: str, 
    company_id: str,
    transaction_date: date
) -> tuple[Decimal, Decimal]:
    """Convert amount to company's base currency"""
    base_currency = await get_company_base_currency(company_id)
    
    if from_currency == base_currency:
        return amount, Decimal("1")
    
    # Import currency conversion function
    from currency_service import get_exchange_rate
    
    exchange_rate = await get_exchange_rate(from_currency, base_currency, transaction_date)
    if exchange_rate is None:
        # If no rate found, use 1:1 (should be handled with proper error in production)
        logger.warning(f"No exchange rate found for {from_currency} to {base_currency}, using 1:1")
        return amount, Decimal("1")
    
    base_amount = amount * exchange_rate
    return base_amount, exchange_rate

async def create_auto_journal_entries(
    transaction: TransactionCreate,
    company_id: str
) -> List[Dict[str, Any]]:
    """Create automatic journal entries for simple transactions"""
    
    # Get default accounts for the company
    # This is a simplified version - in practice, you'd have more sophisticated account mapping
    
    if transaction.transaction_type == TransactionType.INCOME:
        # Debit: Cash/Bank Account, Credit: Revenue Account
        entries = [
            {
                "account_id": transaction.from_account_id or "default_cash",
                "debit_amount": float(transaction.amount),
                "credit_amount": 0,
                "description": f"Cash received - {transaction.description}"
            },
            {
                "account_id": "default_revenue",
                "debit_amount": 0,
                "credit_amount": float(transaction.amount),
                "description": f"Revenue - {transaction.description}"
            }
        ]
    elif transaction.transaction_type == TransactionType.EXPENSE:
        # Debit: Expense Account, Credit: Cash/Bank Account
        entries = [
            {
                "account_id": "default_expense",
                "debit_amount": float(transaction.amount),
                "credit_amount": 0,
                "description": f"Expense - {transaction.description}"
            },
            {
                "account_id": transaction.from_account_id or "default_cash",
                "debit_amount": 0,
                "credit_amount": float(transaction.amount),
                "description": f"Cash paid - {transaction.description}"
            }
        ]
    elif transaction.transaction_type == TransactionType.TRANSFER:
        # Debit: To Account, Credit: From Account
        if not transaction.from_account_id or not transaction.to_account_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="From and To accounts required for transfer transactions"
            )
        
        entries = [
            {
                "account_id": transaction.to_account_id,
                "debit_amount": float(transaction.amount),
                "credit_amount": 0,
                "description": f"Transfer received - {transaction.description}"
            },
            {
                "account_id": transaction.from_account_id,
                "debit_amount": 0,
                "credit_amount": float(transaction.amount),
                "description": f"Transfer sent - {transaction.description}"
            }
        ]
    else:  # ADJUSTMENT
        # For adjustments, require manual journal entries
        if not transaction.journal_entries:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Manual journal entries required for adjustment transactions"
            )
        entries = [
            {
                "account_id": entry.account_id,
                "debit_amount": float(entry.debit_amount) if entry.debit_amount else 0,
                "credit_amount": float(entry.credit_amount) if entry.credit_amount else 0,
                "description": entry.description or transaction.description
            }
            for entry in transaction.journal_entries
        ]
    
    return entries

@transactions_router.post("/", response_model=TransactionResponse)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new transaction with double-entry accounting"""
    
    # Generate transaction ID
    transaction_id = str(uuid.uuid4())
    
    # Convert to base currency if needed
    base_currency_amount = transaction_data.base_currency_amount
    exchange_rate = transaction_data.exchange_rate
    
    if base_currency_amount is None or exchange_rate is None:
        base_currency_amount, exchange_rate = await convert_to_base_currency(
            transaction_data.amount,
            transaction_data.currency,
            current_user["company_id"],
            transaction_data.transaction_date
        )
    
    # Handle journal entries
    if transaction_data.journal_entries:
        # Validate provided journal entries
        is_valid, message = validate_journal_entries(transaction_data.journal_entries)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        journal_entries = [
            {
                "account_id": entry.account_id,
                "debit_amount": float(entry.debit_amount) if entry.debit_amount else 0,
                "credit_amount": float(entry.credit_amount) if entry.credit_amount else 0,
                "description": entry.description or transaction_data.description
            }
            for entry in transaction_data.journal_entries
        ]
    else:
        # Create automatic journal entries
        journal_entries = await create_auto_journal_entries(transaction_data, current_user["company_id"])
    
    # Create transaction document
    transaction_doc = {
        "_id": transaction_id,
        "company_id": current_user["company_id"],
        "created_by": current_user["_id"],
        "description": transaction_data.description,
        "amount": float(transaction_data.amount),
        "transaction_type": transaction_data.transaction_type,
        "category": transaction_data.category,
        "transaction_date": datetime.combine(transaction_data.transaction_date, datetime.min.time()) if isinstance(transaction_data.transaction_date, date) else transaction_data.transaction_date,
        "status": TransactionStatus.PENDING,
        "reference_number": transaction_data.reference_number,
        "payee": transaction_data.payee,
        "memo": transaction_data.memo,
        "tags": transaction_data.tags or [],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "journal_entries": journal_entries,
        "confidence_score": None,
        "is_reconciled": False,
        # Multi-currency fields
        "currency": transaction_data.currency,
        "base_currency_amount": float(base_currency_amount),
        "exchange_rate": float(exchange_rate),
        "document_id": None,
        "metadata": {
            "source": "manual_entry",
            "ip_address": None,  # TODO: Extract from request
            "user_agent": None   # TODO: Extract from request
        }
    }
    
    # Insert transaction
    await transactions_collection.insert_one(transaction_doc)
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="transaction_created",
        details={
            "transaction_id": transaction_id,
            "amount": float(transaction_data.amount),
            "transaction_type": transaction_data.transaction_type,
            "description": transaction_data.description
        }
    )
    
    return TransactionResponse(
        id=transaction_id,
        description=transaction_doc["description"],
        amount=Decimal(str(transaction_doc["amount"])),
        transaction_type=transaction_doc["transaction_type"],
        category=transaction_doc["category"],
        transaction_date=transaction_doc["transaction_date"].date() if isinstance(transaction_doc["transaction_date"], datetime) else transaction_doc["transaction_date"],
        status=transaction_doc["status"],
        reference_number=transaction_doc["reference_number"],
        payee=transaction_doc["payee"],
        memo=transaction_doc["memo"],
        tags=transaction_doc["tags"],
        created_at=transaction_doc["created_at"],
        created_by=transaction_doc["created_by"],
        journal_entries=transaction_doc["journal_entries"],
        confidence_score=transaction_doc["confidence_score"],
        is_reconciled=transaction_doc["is_reconciled"],
        document_id=transaction_doc["document_id"],
        # Multi-currency fields
        currency=transaction_doc["currency"],
        base_currency_amount=Decimal(str(transaction_doc["base_currency_amount"])) if transaction_doc.get("base_currency_amount") else None,
        exchange_rate=Decimal(str(transaction_doc["exchange_rate"])) if transaction_doc.get("exchange_rate") else None
    )

@transactions_router.get("/", response_model=List[TransactionResponse])
async def list_transactions(
    transaction_type: Optional[TransactionType] = None,
    category: Optional[TransactionCategory] = None,
    status: Optional[TransactionStatus] = None,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(50, le=1000),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """List transactions with filtering options"""
    
    # Build query
    query = {"company_id": current_user["company_id"]}
    
    if transaction_type:
        query["transaction_type"] = transaction_type
    
    if category:
        query["category"] = category
    
    if status:
        query["status"] = status
    
    if start_date or end_date:
        date_query = {}
        if start_date:
            date_query["$gte"] = start_date
        if end_date:
            date_query["$lte"] = end_date
        query["transaction_date"] = date_query
    
    # Execute query
    cursor = transactions_collection.find(query).sort("transaction_date", -1).skip(offset).limit(limit)
    transactions = await cursor.to_list(length=limit)
    
    # Convert to response format
    response_transactions = []
    for txn in transactions:
        response_transactions.append(TransactionResponse(
            id=txn["_id"],
            description=txn["description"],
            amount=Decimal(str(txn["amount"])),
            transaction_type=txn["transaction_type"],
            category=txn.get("category"),
            transaction_date=txn["transaction_date"].date() if isinstance(txn["transaction_date"], datetime) else txn["transaction_date"],
            status=txn["status"],
            reference_number=txn.get("reference_number"),
            payee=txn.get("payee"),
            memo=txn.get("memo"),
            tags=txn.get("tags", []),
            created_at=txn["created_at"],
            created_by=txn["created_by"],
            journal_entries=txn.get("journal_entries", []),
            confidence_score=txn.get("confidence_score"),
            is_reconciled=txn.get("is_reconciled", False),
            document_id=txn.get("document_id"),
            # Multi-currency fields
            currency=txn.get("currency", "USD"),
            base_currency_amount=Decimal(str(txn["base_currency_amount"])) if txn.get("base_currency_amount") else None,
            exchange_rate=Decimal(str(txn["exchange_rate"])) if txn.get("exchange_rate") else None
        ))
    
    return response_transactions

@transactions_router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get specific transaction details"""
    
    transaction = await transactions_collection.find_one({
        "_id": transaction_id,
        "company_id": current_user["company_id"]
    })
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return TransactionResponse(
        id=transaction["_id"],
        description=transaction["description"],
        amount=Decimal(str(transaction["amount"])),
        transaction_type=transaction["transaction_type"],
        category=transaction.get("category"),
        transaction_date=transaction["transaction_date"].date() if isinstance(transaction["transaction_date"], datetime) else transaction["transaction_date"],
        status=transaction["status"],
        reference_number=transaction.get("reference_number"),
        payee=transaction.get("payee"),
        memo=transaction.get("memo"),
        tags=transaction.get("tags", []),
        created_at=transaction["created_at"],
        created_by=transaction["created_by"],
        journal_entries=transaction.get("journal_entries", []),
        confidence_score=transaction.get("confidence_score"),
        is_reconciled=transaction.get("is_reconciled", False),
        document_id=transaction.get("document_id"),
        # Multi-currency fields
        currency=transaction.get("currency", "USD"),
        base_currency_amount=Decimal(str(transaction["base_currency_amount"])) if transaction.get("base_currency_amount") else None,
        exchange_rate=Decimal(str(transaction["exchange_rate"])) if transaction.get("exchange_rate") else None
    )

@transactions_router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    update_data: TransactionUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update transaction details"""
    
    # Check if transaction exists and belongs to user's company
    transaction = await transactions_collection.find_one({
        "_id": transaction_id,
        "company_id": current_user["company_id"]
    })
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check if transaction can be modified
    if transaction["is_reconciled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify reconciled transaction"
        )
    
    # Prepare update data
    update_fields = {"updated_at": datetime.utcnow()}
    
    if update_data.description is not None:
        update_fields["description"] = update_data.description
    if update_data.amount is not None:
        update_fields["amount"] = float(update_data.amount)
    if update_data.transaction_type is not None:
        update_fields["transaction_type"] = update_data.transaction_type
    if update_data.category is not None:
        update_fields["category"] = update_data.category
    if update_data.transaction_date is not None:
        update_fields["transaction_date"] = datetime.combine(update_data.transaction_date, datetime.min.time()) if isinstance(update_data.transaction_date, date) else update_data.transaction_date
    if update_data.reference_number is not None:
        update_fields["reference_number"] = update_data.reference_number
    if update_data.payee is not None:
        update_fields["payee"] = update_data.payee
    if update_data.memo is not None:
        update_fields["memo"] = update_data.memo
    if update_data.tags is not None:
        update_fields["tags"] = update_data.tags
    if update_data.status is not None:
        update_fields["status"] = update_data.status
    
    # Handle currency updates
    if update_data.currency is not None:
        update_fields["currency"] = update_data.currency
        
        # If currency changed, recalculate base currency amount
        if update_data.currency != transaction.get("currency", "USD"):
            transaction_date = update_data.transaction_date or transaction["transaction_date"]
            if isinstance(transaction_date, datetime):
                transaction_date = transaction_date.date()
            
            amount = update_data.amount or Decimal(str(transaction["amount"]))
            base_currency_amount, exchange_rate = await convert_to_base_currency(
                amount,
                update_data.currency,
                current_user["company_id"],
                transaction_date
            )
            
            update_fields["base_currency_amount"] = float(base_currency_amount)
            update_fields["exchange_rate"] = float(exchange_rate)
    
    if update_data.base_currency_amount is not None:
        update_fields["base_currency_amount"] = float(update_data.base_currency_amount)
    if update_data.exchange_rate is not None:
        update_fields["exchange_rate"] = float(update_data.exchange_rate)
    
    # Update transaction
    await transactions_collection.update_one(
        {"_id": transaction_id},
        {"$set": update_fields}
    )
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="transaction_updated",
        details={
            "transaction_id": transaction_id,
            "updated_fields": [k for k in update_fields.keys() if k != "updated_at"]
        }
    )
    
    # Return updated transaction
    return await get_transaction(transaction_id, current_user)

@transactions_router.delete("/{transaction_id}")
async def delete_transaction(
    transaction_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a transaction (void it)"""
    
    # Check if transaction exists and belongs to user's company
    transaction = await transactions_collection.find_one({
        "_id": transaction_id,
        "company_id": current_user["company_id"]
    })
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Check if transaction can be deleted
    if transaction["is_reconciled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete reconciled transaction"
        )
    
    # Instead of deleting, mark as void (for audit trail)
    await transactions_collection.update_one(
        {"_id": transaction_id},
        {"$set": {
            "status": TransactionStatus.VOID,
            "updated_at": datetime.utcnow(),
            "voided_by": current_user["_id"],
            "voided_at": datetime.utcnow()
        }}
    )
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="transaction_voided",
        details={
            "transaction_id": transaction_id,
            "amount": transaction["amount"],
            "description": transaction["description"]
        }
    )
    
    return {"message": "Transaction voided successfully"}

@transactions_router.post("/bulk-import")
async def bulk_import_transactions(
    transactions_data: List[TransactionCreate],
    current_user: dict = Depends(get_current_user)
):
    """Import multiple transactions in bulk"""
    
    if len(transactions_data) > 1000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 1000 transactions per bulk import"
        )
    
    created_transactions = []
    errors = []
    
    for i, txn_data in enumerate(transactions_data):
        try:
            # Create each transaction
            transaction = await create_transaction(txn_data, current_user)
            created_transactions.append(transaction.id)
        except Exception as e:
            errors.append({
                "index": i,
                "error": str(e),
                "transaction": txn_data.dict()
            })
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="bulk_import_transactions",
        details={
            "total_attempted": len(transactions_data),
            "successful": len(created_transactions),
            "errors": len(errors)
        }
    )
    
    return {
        "message": f"Bulk import completed: {len(created_transactions)} successful, {len(errors)} errors",
        "created_transactions": created_transactions,
        "errors": errors
    }