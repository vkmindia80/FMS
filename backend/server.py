from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio
import os
from dotenv import load_dotenv
import logging
from datetime import datetime, timedelta
from typing import Optional, List
import uuid
import json
from database import client, database, users_collection, companies_collection, accounts_collection, transactions_collection, documents_collection, audit_logs_collection

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Advanced Finance Management System",
    description="Enterprise-grade finance management with ML-powered document processing",
    version="1.0.0"
)

# CORS middleware - MUST be added before mounting and including routers
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Static files for uploads - Mount before including routers
upload_dir = os.getenv("UPLOAD_DIR", "/app/uploads")
os.makedirs(upload_dir, exist_ok=True)
try:
    app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")
except Exception as e:
    logger.warning(f"Could not mount static files: {e}")

# Import all route modules
from auth import auth_router
from documents import documents_router
from transactions import transactions_router
from accounts import accounts_router
from reports import reports_router
from admin import admin_router
from currency_service import currency_router
from bank_connections import router as banking_router
from payments import router as payments_router
from receivables import router as receivables_router
from integrations import router as integrations_router
from report_scheduling import router as scheduling_router
from reconciliation import router as reconciliation_router

# Include all routers with API prefix
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])
app.include_router(transactions_router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(accounts_router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(reports_router, prefix="/api/reports", tags=["Reports"])
app.include_router(admin_router, prefix="/api/admin", tags=["Administration"])
app.include_router(currency_router, prefix="/api/currency", tags=["Currency"])
app.include_router(banking_router, prefix="/api/banking", tags=["Banking & Connections"])
app.include_router(payments_router, prefix="/api/payments", tags=["Payment Processing"])
app.include_router(receivables_router, prefix="/api/receivables", tags=["Accounts Receivable"])
app.include_router(integrations_router, prefix="/api/integrations", tags=["Integrations"])
app.include_router(scheduling_router, prefix="/api/report-scheduling", tags=["Report Scheduling"])
app.include_router(reconciliation_router, prefix="/api/reconciliation", tags=["Reconciliation"])

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup with security validation"""
    logger.info("Starting AFMS Backend Server...")
    
    try:
        # CRITICAL: Validate security configuration before starting
        from security_utils import validate_jwt_secret, validate_emergent_llm_key
        
        logger.info("🔒 Validating security configuration...")
        validate_jwt_secret()
        validate_emergent_llm_key()
        
        # Initialize security services
        from token_blacklist import token_blacklist
        from rate_limiter import rate_limiter
        
        # Create database indexes
        logger.info("📊 Creating database indexes...")
        await users_collection.create_index("email", unique=True)
        await users_collection.create_index("company_id")
        await transactions_collection.create_index([("company_id", 1), ("transaction_date", -1)])
        await documents_collection.create_index([("company_id", 1), ("created_at", -1)])
        await audit_logs_collection.create_index([("company_id", 1), ("timestamp", -1)])
        
        # Exchange rates indexes
        from database import exchange_rates_collection
        await exchange_rates_collection.create_index([("base_currency", 1), ("target_currency", 1), ("date", -1)])
        await exchange_rates_collection.create_index([("date", -1)])
        await exchange_rates_collection.create_index([("is_active", 1)])
        
        # Phase 6: Banking & Payment indexes
        from database import (
            bank_connections_collection, 
            bank_transactions_collection, 
            payment_transactions_collection,
            invoices_collection
        )
        await bank_connections_collection.create_index([("company_id", 1), ("status", 1)])
        await bank_connections_collection.create_index("connection_id", unique=True)
        await bank_transactions_collection.create_index([("company_id", 1), ("date", -1)])
        await bank_transactions_collection.create_index([("connection_id", 1), ("imported", 1)])
        await payment_transactions_collection.create_index([("company_id", 1), ("created_at", -1)])
        await payment_transactions_collection.create_index("session_id")
        await invoices_collection.create_index([("company_id", 1), ("invoice_date", -1)])
        await invoices_collection.create_index([("company_id", 1), ("payment_status", 1)])
        
        # Phase 14: Integration & Report Scheduling indexes
        from database import (
            integrations_collection,
            report_schedules_collection,
            scheduled_report_history_collection
        )
        await integrations_collection.create_index("company_id", unique=True)
        await report_schedules_collection.create_index([("company_id", 1), ("enabled", 1)])
        await report_schedules_collection.create_index("schedule_id", unique=True)
        await report_schedules_collection.create_index([("next_run", 1), ("enabled", 1)])
        await scheduled_report_history_collection.create_index([("schedule_id", 1), ("executed_at", -1)])
        
        # Phase 13: Initialize exchange rates and start scheduler
        logger.info("💱 Initializing multi-currency support...")
        from currency_tasks import initialize_exchange_rates, start_currency_scheduler
        await initialize_exchange_rates()
        start_currency_scheduler()
        
        logger.info("✅ AFMS Backend Server started successfully!")
        logger.info(f"   - Token blacklist: {'✅ Active' if token_blacklist.client else '⚠️  Disabled (Redis unavailable)'}")
        logger.info(f"   - Rate limiting: {'✅ Active' if rate_limiter.enabled else '⚠️  Disabled (Redis unavailable)'}")
        logger.info("   - Multi-currency: ✅ Active (daily rate updates at 2 AM UTC)")
        
    except ValueError as e:
        logger.error(f"❌ Security validation failed: {e}")
        logger.error("🚨 Server startup aborted due to security configuration issues")
        raise
    except Exception as e:
        logger.error(f"❌ Startup error: {str(e)}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up on shutdown"""
    logger.info("Shutting down AFMS Backend Server...")
    
    # Stop currency scheduler
    try:
        from currency_tasks import stop_currency_scheduler
        stop_currency_scheduler()
    except Exception as e:
        logger.error(f"Error stopping currency scheduler: {e}")
    
    client.close()

@app.get("/api/health")
async def health_check():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        await database.command("ping")
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "AFMS Backend",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service unavailable"
        )

@app.get("/api/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Advanced Finance Management System API",
        "version": "1.0.0",
        "documentation": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )