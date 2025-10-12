"""Bank Connections API - Manage bank account links and sync"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
import uuid
import logging

from auth import get_current_user, log_audit_event
from database import bank_connections_collection, bank_transactions_collection, transactions_collection, accounts_collection
from banking_service import plaid_service, mock_banking_api

logger = logging.getLogger(__name__)
router = APIRouter()

# Pydantic Models
class BankConnectionCreate(BaseModel):
    provider: str = Field(..., description="Banking provider: 'plaid' or 'mock'")
    institution_id: Optional[str] = Field(None, description="Institution ID for mock banking")
    username: Optional[str] = Field(None, description="Username for mock banking")
    password: Optional[str] = Field(None, description="Password for mock banking")
    public_token: Optional[str] = Field(None, description="Public token from Plaid Link")

class BankConnectionResponse(BaseModel):
    connection_id: str
    provider: str
    institution_name: str
    connected_at: str
    status: str
    accounts: List[Dict[str, Any]]

class TransactionSyncRequest(BaseModel):
    connection_id: str
    start_date: Optional[str] = Field(None, description="Start date (YYYY-MM-DD)")
    end_date: Optional[str] = Field(None, description="End date (YYYY-MM-DD)")

class TransactionImportRequest(BaseModel):
    bank_transaction_ids: List[str]
    target_account_id: str = Field(..., description="Target account in chart of accounts")


@router.post("/connect", response_model=Dict[str, Any])
async def connect_bank_account(
    connection_data: BankConnectionCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Connect a bank account using Plaid or Mock banking
    """
    try:
        user_id = current_user["_id"]
        company_id = current_user["company_id"]
        
        if connection_data.provider == "plaid":
            # Plaid connection
            if not connection_data.public_token:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Public token required for Plaid connection"
                )
            
            # Exchange public token for access token
            token_response = await plaid_service.exchange_public_token(
                connection_data.public_token,
                user_id,
                company_id
            )
            
            access_token = token_response["access_token"]
            item_id = token_response["item_id"]
            
            # Get accounts
            accounts = await plaid_service.get_accounts(access_token)
            
            # Store connection
            connection_doc = {
                "connection_id": str(uuid.uuid4()),
                "user_id": user_id,
                "company_id": company_id,
                "provider": "plaid",
                "access_token": access_token,
                "item_id": item_id,
                "institution_name": "Connected Bank",
                "accounts": accounts,
                "status": "active",
                "connected_at": datetime.utcnow(),
                "last_synced": None,
                "created_at": datetime.utcnow()
            }
            
        elif connection_data.provider == "mock":
            # Mock banking connection
            if not connection_data.institution_id or not connection_data.username:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Institution ID and username required for mock banking"
                )
            
            # Authenticate with mock API
            auth_response = await mock_banking_api.authenticate(
                connection_data.institution_id,
                connection_data.username,
                connection_data.password or "demo123"
            )
            
            if not auth_response["success"]:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Mock bank authentication failed"
                )
            
            session_token = auth_response["session_token"]
            
            # Get accounts
            accounts = await mock_banking_api.get_accounts(session_token)
            
            # Get institution info
            institutions = await mock_banking_api.get_institutions()
            institution = next((i for i in institutions if i["id"] == connection_data.institution_id), None)
            
            connection_doc = {
                "connection_id": str(uuid.uuid4()),
                "user_id": user_id,
                "company_id": company_id,
                "provider": "mock",
                "session_token": session_token,
                "institution_id": connection_data.institution_id,
                "institution_name": institution["name"] if institution else "Demo Bank",
                "accounts": accounts,
                "status": "active",
                "connected_at": datetime.utcnow(),
                "last_synced": None,
                "created_at": datetime.utcnow()
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid provider. Use 'plaid' or 'mock'"
            )
        
        # Insert into database
        await bank_connections_collection.insert_one(connection_doc)
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="bank_connection_created",
            details={
                "connection_id": connection_doc["connection_id"],
                "provider": connection_doc["provider"],
                "institution": connection_doc["institution_name"]
            }
        )
        
        logger.info(f"Bank connection created: {connection_doc['connection_id']} for company {company_id}")
        
        return {
            "success": True,
            "connection_id": connection_doc["connection_id"],
            "institution_name": connection_doc["institution_name"],
            "accounts_count": len(accounts),
            "message": "Bank account connected successfully"
        }
        
    except Exception as e:
        logger.error(f"Error connecting bank account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to connect bank account: {str(e)}"
        )


@router.get("/connections", response_model=List[Dict[str, Any]])
async def list_bank_connections(current_user: dict = Depends(get_current_user)):
    """
    List all bank connections for the company
    """
    try:
        company_id = current_user["company_id"]
        
        connections = await bank_connections_collection.find(
            {"company_id": company_id, "status": {"$ne": "deleted"}}
        ).to_list(length=100)
        
        # Remove sensitive data
        for conn in connections:
            conn["_id"] = str(conn["_id"])
            conn.pop("access_token", None)
            conn.pop("session_token", None)
        
        return connections
        
    except Exception as e:
        logger.error(f"Error listing bank connections: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bank connections"
        )


@router.post("/sync", response_model=Dict[str, Any])
async def sync_bank_transactions(
    sync_request: TransactionSyncRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Sync transactions from connected bank account
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["_id"]
        
        # Get connection
        connection = await bank_connections_collection.find_one({
            "connection_id": sync_request.connection_id,
            "company_id": company_id
        })
        
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank connection not found"
            )
        
        # Date range
        end_date = sync_request.end_date or datetime.utcnow().strftime("%Y-%m-%d")
        start_date = sync_request.start_date or (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")
        
        # Get transactions based on provider
        if connection["provider"] == "plaid":
            transactions = await plaid_service.get_transactions(
                connection["access_token"],
                start_date,
                end_date
            )
        elif connection["provider"] == "mock":
            # Get transactions from all accounts
            transactions = []
            for account in connection["accounts"]:
                account_txns = await mock_banking_api.get_transactions(
                    connection["session_token"],
                    account["account_id"],
                    start_date,
                    end_date
                )
                transactions.extend(account_txns)
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unknown provider"
            )
        
        # Store transactions in bank_transactions collection
        new_transactions = 0
        for txn in transactions:
            # Check if transaction already exists
            existing = await bank_transactions_collection.find_one({
                "bank_transaction_id": txn.get("transaction_id"),
                "company_id": company_id
            })
            
            if not existing:
                bank_txn_doc = {
                    "bank_transaction_id": txn.get("transaction_id"),
                    "connection_id": sync_request.connection_id,
                    "company_id": company_id,
                    "account_id": txn.get("account_id"),
                    "date": txn.get("date"),
                    "description": txn.get("name") or txn.get("description"),
                    "amount": txn.get("amount"),
                    "merchant_name": txn.get("merchant_name"),
                    "category": txn.get("category"),
                    "pending": txn.get("pending", False),
                    "payment_channel": txn.get("payment_channel"),
                    "location": txn.get("location"),
                    "imported": False,
                    "imported_transaction_id": None,
                    "synced_at": datetime.utcnow(),
                    "created_at": datetime.utcnow()
                }
                await bank_transactions_collection.insert_one(bank_txn_doc)
                new_transactions += 1
        
        # Update last synced time
        await bank_connections_collection.update_one(
            {"connection_id": sync_request.connection_id},
            {"$set": {"last_synced": datetime.utcnow()}}
        )
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="bank_transactions_synced",
            details={
                "connection_id": sync_request.connection_id,
                "transactions_synced": new_transactions,
                "start_date": start_date,
                "end_date": end_date
            }
        )
        
        logger.info(f"Synced {new_transactions} new transactions for connection {sync_request.connection_id}")
        
        return {
            "success": True,
            "transactions_synced": new_transactions,
            "total_transactions": len(transactions),
            "start_date": start_date,
            "end_date": end_date
        }
        
    except Exception as e:
        logger.error(f"Error syncing transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to sync transactions: {str(e)}"
        )


@router.get("/transactions", response_model=List[Dict[str, Any]])
async def get_bank_transactions(
    connection_id: Optional[str] = None,
    imported: Optional[bool] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get synced bank transactions
    """
    try:
        company_id = current_user["company_id"]
        
        query = {"company_id": company_id}
        if connection_id:
            query["connection_id"] = connection_id
        if imported is not None:
            query["imported"] = imported
        
        transactions = await bank_transactions_collection.find(query).sort("date", -1).to_list(length=500)
        
        for txn in transactions:
            txn["_id"] = str(txn["_id"])
        
        return transactions
        
    except Exception as e:
        logger.error(f"Error retrieving bank transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bank transactions"
        )


@router.post("/import", response_model=Dict[str, Any])
async def import_bank_transactions(
    import_request: TransactionImportRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Import bank transactions into accounting system
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["_id"]
        
        # Verify target account exists
        target_account = await accounts_collection.find_one({
            "account_id": import_request.target_account_id,
            "company_id": company_id
        })
        
        if not target_account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target account not found"
            )
        
        imported_count = 0
        
        for bank_txn_id in import_request.bank_transaction_ids:
            # Get bank transaction
            bank_txn = await bank_transactions_collection.find_one({
                "bank_transaction_id": bank_txn_id,
                "company_id": company_id
            })
            
            if not bank_txn or bank_txn.get("imported"):
                continue
            
            # Create transaction in accounting system
            transaction_doc = {
                "transaction_id": str(uuid.uuid4()),
                "company_id": company_id,
                "user_id": user_id,
                "transaction_date": bank_txn["date"],
                "description": bank_txn["description"],
                "amount": abs(bank_txn["amount"]),
                "transaction_type": "expense" if bank_txn["amount"] < 0 else "income",
                "category": bank_txn.get("category", ["Uncategorized"])[0] if bank_txn.get("category") else "Uncategorized",
                "status": "cleared",
                "is_reconciled": False,
                "memo": f"Imported from bank: {bank_txn.get('merchant_name', '')}",
                "tags": ["bank_import"],
                "journal_entries": [
                    {
                        "account_id": import_request.target_account_id,
                        "account_name": target_account["account_name"],
                        "debit": abs(bank_txn["amount"]) if bank_txn["amount"] > 0 else 0,
                        "credit": abs(bank_txn["amount"]) if bank_txn["amount"] < 0 else 0
                    }
                ],
                "source": "bank_import",
                "bank_transaction_id": bank_txn_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            await transactions_collection.insert_one(transaction_doc)
            
            # Mark as imported
            await bank_transactions_collection.update_one(
                {"bank_transaction_id": bank_txn_id},
                {
                    "$set": {
                        "imported": True,
                        "imported_transaction_id": transaction_doc["transaction_id"],
                        "imported_at": datetime.utcnow()
                    }
                }
            )
            
            imported_count += 1
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="bank_transactions_imported",
            details={
                "imported_count": imported_count,
                "target_account_id": import_request.target_account_id
            }
        )
        
        logger.info(f"Imported {imported_count} bank transactions for company {company_id}")
        
        return {
            "success": True,
            "imported_count": imported_count,
            "message": f"Successfully imported {imported_count} transactions"
        }
        
    except Exception as e:
        logger.error(f"Error importing transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import transactions: {str(e)}"
        )


@router.delete("/connections/{connection_id}")
async def disconnect_bank(
    connection_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Disconnect a bank account
    """
    try:
        company_id = current_user["company_id"]
        user_id = current_user["_id"]
        
        result = await bank_connections_collection.update_one(
            {"connection_id": connection_id, "company_id": company_id},
            {"$set": {"status": "disconnected", "disconnected_at": datetime.utcnow()}}
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Bank connection not found"
            )
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action="bank_connection_disconnected",
            details={"connection_id": connection_id}
        )
        
        return {"success": True, "message": "Bank account disconnected"}
        
    except Exception as e:
        logger.error(f"Error disconnecting bank: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disconnect bank account"
        )


@router.get("/institutions")
async def get_banking_institutions(current_user: dict = Depends(get_current_user)):
    """
    Get list of available banking institutions (for mock banking)
    """
    try:
        institutions = await mock_banking_api.get_institutions()
        return {"institutions": institutions}
    except Exception as e:
        logger.error(f"Error getting institutions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve institutions"
        )
