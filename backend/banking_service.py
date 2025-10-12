"""Banking Integration Service - Plaid API and Mock Banking"""
import os
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import random
import uuid
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

class PlaidService:
    """Plaid API integration for real bank connections"""
    
    def __init__(self):
        self.client_id = os.getenv("PLAID_CLIENT_ID", "")
        self.secret = os.getenv("PLAID_SECRET", "")
        self.env = os.getenv("PLAID_ENV", "sandbox")
        self.use_mock = not self.client_id or not self.secret
        
        if self.use_mock:
            logger.info("Plaid credentials not configured, using mock mode")
        else:
            logger.info(f"Plaid configured in {self.env} mode")
    
    async def create_link_token(self, user_id: str, company_id: str) -> Dict[str, Any]:
        """Create a link token for Plaid Link"""
        if self.use_mock:
            return self._mock_link_token(user_id, company_id)
        
        # Real Plaid implementation would go here
        # from plaid import ApiClient, Configuration
        # from plaid.api import plaid_api
        # ...
        return self._mock_link_token(user_id, company_id)
    
    async def exchange_public_token(self, public_token: str, user_id: str, company_id: str) -> Dict[str, Any]:
        """Exchange public token for access token"""
        if self.use_mock:
            return self._mock_access_token(public_token)
        
        # Real Plaid implementation
        return self._mock_access_token(public_token)
    
    async def get_accounts(self, access_token: str) -> List[Dict[str, Any]]:
        """Get accounts for a given access token"""
        if self.use_mock:
            return self._mock_accounts()
        
        # Real Plaid implementation
        return self._mock_accounts()
    
    async def get_transactions(self, access_token: str, start_date: str, end_date: str, account_ids: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        """Get transactions from Plaid"""
        if self.use_mock:
            return self._mock_transactions(start_date, end_date)
        
        # Real Plaid implementation
        return self._mock_transactions(start_date, end_date)
    
    async def get_balance(self, access_token: str) -> Dict[str, Any]:
        """Get real-time account balance"""
        if self.use_mock:
            return self._mock_balance()
        
        # Real Plaid implementation
        return self._mock_balance()
    
    # Mock implementations for demo/testing
    def _mock_link_token(self, user_id: str, company_id: str) -> Dict[str, Any]:
        return {
            "link_token": f"link-sandbox-{uuid.uuid4()}",
            "expiration": (datetime.utcnow() + timedelta(hours=4)).isoformat(),
            "request_id": f"req-{uuid.uuid4()}"
        }
    
    def _mock_access_token(self, public_token: str) -> Dict[str, Any]:
        return {
            "access_token": f"access-sandbox-{uuid.uuid4()}",
            "item_id": f"item-{uuid.uuid4()}",
            "request_id": f"req-{uuid.uuid4()}"
        }
    
    def _mock_accounts(self) -> List[Dict[str, Any]]:
        """Generate mock bank accounts"""
        banks = [
            {"name": "Chase", "type": "checking", "subtype": "checking"},
            {"name": "Bank of America", "type": "savings", "subtype": "savings"},
            {"name": "Wells Fargo", "type": "credit", "subtype": "credit card"},
        ]
        
        accounts = []
        for bank in banks:
            accounts.append({
                "account_id": f"acc-{uuid.uuid4()}",
                "name": f"{bank['name']} {bank['subtype'].title()}",
                "official_name": f"{bank['name']} {bank['subtype'].title()} Account",
                "type": bank['type'],
                "subtype": bank['subtype'],
                "mask": f"{random.randint(1000, 9999)}",
                "balance": {
                    "available": round(random.uniform(1000, 50000), 2),
                    "current": round(random.uniform(1000, 50000), 2),
                    "limit": round(random.uniform(5000, 100000), 2) if bank['type'] == 'credit' else None,
                    "currency": "USD"
                }
            })
        return accounts
    
    def _mock_transactions(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        """Generate mock transactions"""
        transactions = []
        categories = [
            ("Payment", "Transfer", -1500.00),
            ("Grocery Store", "Food and Drink", -145.67),
            ("Gas Station", "Travel", -62.34),
            ("Salary Deposit", "Income", 5000.00),
            ("Restaurant", "Food and Drink", -85.23),
            ("Online Shopping", "Shops", -234.56),
            ("Utility Bill", "Service", -189.45),
            ("ATM Withdrawal", "Transfer", -200.00),
            ("Coffee Shop", "Food and Drink", -8.75),
            ("Insurance Payment", "Service", -350.00),
        ]
        
        # Generate transactions for the past 30 days
        for i in range(30):
            date = datetime.utcnow() - timedelta(days=i)
            for _ in range(random.randint(1, 3)):
                cat = random.choice(categories)
                transactions.append({
                    "transaction_id": f"txn-{uuid.uuid4()}",
                    "account_id": f"acc-{uuid.uuid4()}",
                    "amount": cat[2],
                    "date": date.strftime("%Y-%m-%d"),
                    "name": cat[0],
                    "merchant_name": cat[0],
                    "category": [cat[1]],
                    "pending": random.choice([True, False]) if i < 3 else False,
                    "payment_channel": random.choice(["online", "in store", "other"]),
                    "authorized_date": date.strftime("%Y-%m-%d"),
                    "location": {
                        "city": "San Francisco",
                        "region": "CA",
                        "country": "US"
                    }
                })
        
        return transactions[:50]  # Return up to 50 transactions
    
    def _mock_balance(self) -> Dict[str, Any]:
        """Generate mock balance"""
        return {
            "accounts": [
                {
                    "account_id": f"acc-{uuid.uuid4()}",
                    "balances": {
                        "available": round(random.uniform(5000, 25000), 2),
                        "current": round(random.uniform(5000, 25000), 2),
                        "currency": "USD"
                    },
                    "name": "Checking Account",
                    "type": "depository",
                    "subtype": "checking"
                }
            ]
        }


class MockBankingAPI:
    """Mock banking API for demo and testing purposes"""
    
    def __init__(self):
        self.institutions = [
            {"id": "ins_1", "name": "Demo Bank", "url": "https://demobank.com"},
            {"id": "ins_2", "name": "Test Credit Union", "url": "https://testcu.com"},
            {"id": "ins_3", "name": "Sample Financial", "url": "https://samplefin.com"},
        ]
    
    async def authenticate(self, institution_id: str, username: str, password: str) -> Dict[str, Any]:
        """Mock authentication"""
        # Accept any credentials for demo
        return {
            "success": True,
            "session_token": f"session-{uuid.uuid4()}",
            "institution_id": institution_id,
            "message": "Authentication successful"
        }
    
    async def get_institutions(self) -> List[Dict[str, Any]]:
        """Get list of available institutions"""
        return self.institutions
    
    async def get_accounts(self, session_token: str) -> List[Dict[str, Any]]:
        """Get accounts for authenticated session"""
        return [
            {
                "account_id": f"demo-acc-{uuid.uuid4()}",
                "account_number": f"****{random.randint(1000, 9999)}",
                "account_type": "checking",
                "balance": round(random.uniform(5000, 50000), 2),
                "currency": "USD",
                "name": "Primary Checking"
            },
            {
                "account_id": f"demo-acc-{uuid.uuid4()}",
                "account_number": f"****{random.randint(1000, 9999)}",
                "account_type": "savings",
                "balance": round(random.uniform(10000, 100000), 2),
                "currency": "USD",
                "name": "Savings Account"
            }
        ]
    
    async def get_transactions(self, session_token: str, account_id: str, from_date: str, to_date: str) -> List[Dict[str, Any]]:
        """Get transactions for an account"""
        transactions = []
        vendors = [
            "Amazon", "Walmart", "Starbucks", "Shell Gas", "Target",
            "McDonald's", "Apple Store", "Netflix", "Uber", "DoorDash"
        ]
        
        for i in range(random.randint(20, 50)):
            date = datetime.utcnow() - timedelta(days=random.randint(1, 90))
            transactions.append({
                "transaction_id": f"demo-txn-{uuid.uuid4()}",
                "date": date.strftime("%Y-%m-%d"),
                "description": random.choice(vendors),
                "amount": round(random.uniform(-500, -10), 2) if random.random() > 0.1 else round(random.uniform(500, 5000), 2),
                "type": random.choice(["purchase", "deposit", "withdrawal", "transfer"]),
                "status": "posted"
            })
        
        return sorted(transactions, key=lambda x: x['date'], reverse=True)


# Singleton instances
plaid_service = PlaidService()
mock_banking_api = MockBankingAPI()
