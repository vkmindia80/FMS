import motor.motor_asyncio
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/afms_db")
client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
database = client.afms_db

# Collections
users_collection = database.users
companies_collection = database.companies
accounts_collection = database.accounts
transactions_collection = database.transactions
documents_collection = database.documents
audit_logs_collection = database.audit_logs
exchange_rates_collection = database.exchange_rates

# Phase 6: Banking & Payment Integration Collections
bank_connections_collection = database.bank_connections
bank_transactions_collection = database.bank_transactions
payment_transactions_collection = database.payment_transactions
invoices_collection = database.invoices
bills_collection = database.bills
payment_schedules_collection = database.payment_schedules

# Phase 14: Report Scheduling & Integration Collections
integrations_collection = database.integrations
report_schedules_collection = database.report_schedules
scheduled_report_history_collection = database.scheduled_report_history

# Phase 15: Reconciliation Collections
reconciliation_sessions_collection = database.reconciliation_sessions
reconciliation_matches_collection = database.reconciliation_matches

# RBAC Collections
permissions_collection = database.permissions
roles_collection = database.roles
user_roles_collection = database.user_roles
menus_collection = database.menus
