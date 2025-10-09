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