#!/usr/bin/env python3
"""
Cleanup script for multi-tenant demo data
Removes all demo companies and users
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/afms_db")
client = AsyncIOMotorClient(MONGO_URL)
database = client.afms_db

async def cleanup_demo_data():
    """Remove all demo tenants"""
    
    # Demo email patterns
    demo_emails = [
        "admin@techventure.demo",
        "admin@strategicadvisory.demo",
        "admin@urbanstyle.demo",
        "alex.thompson@demo.com",
        "jordan.martinez@demo.com"
    ]
    
    # Demo company names
    demo_company_names = [
        "TechVenture SaaS Inc",
        "Strategic Advisory Group",
        "Urban Style Boutique",
        "Alex Thompson - Personal",
        "Jordan Martinez - Personal"
    ]
    
    print("🧹 Cleaning up demo data...")
    
    # Get demo companies
    demo_companies = []
    async for company in database.companies.find({"name": {"$in": demo_company_names}}):
        demo_companies.append(company['_id'])
        print(f"   Found demo company: {company['name']}")
    
    if not demo_companies:
        print("   No demo companies found")
        return
    
    # Delete users
    user_result = await database.users.delete_many({"email": {"$in": demo_emails}})
    print(f"   ✅ Deleted {user_result.deleted_count} demo users")
    
    # Delete companies
    company_result = await database.companies.delete_many({"_id": {"$in": demo_companies}})
    print(f"   ✅ Deleted {company_result.deleted_count} demo companies")
    
    # Delete accounts
    accounts_result = await database.accounts.delete_many({"company_id": {"$in": demo_companies}})
    print(f"   ✅ Deleted {accounts_result.deleted_count} accounts")
    
    # Delete transactions
    trans_result = await database.transactions.delete_many({"company_id": {"$in": demo_companies}})
    print(f"   ✅ Deleted {trans_result.deleted_count} transactions")
    
    # Delete documents
    docs_result = await database.documents.delete_many({"company_id": {"$in": demo_companies}})
    print(f"   ✅ Deleted {docs_result.deleted_count} documents")
    
    # Delete invoices
    invoices_result = await database.invoices.delete_many({"company_id": {"$in": demo_companies}})
    print(f"   ✅ Deleted {invoices_result.deleted_count} invoices")
    
    # Delete bills
    bills_result = await database.bills.delete_many({"company_id": {"$in": demo_companies}})
    print(f"   ✅ Deleted {bills_result.deleted_count} bills")
    
    # Delete payment transactions
    payments_result = await database.payment_transactions.delete_many({"company_id": {"$in": demo_companies}})
    print(f"   ✅ Deleted {payments_result.deleted_count} payment transactions")
    
    # Delete bank connections
    bank_result = await database.bank_connections.delete_many({"company_id": {"$in": demo_companies}})
    print(f"   ✅ Deleted {bank_result.deleted_count} bank connections")
    
    print("\n✅ Cleanup complete!")

if __name__ == "__main__":
    asyncio.run(cleanup_demo_data())
