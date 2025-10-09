from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AFMS Backend Server...")
    
    # Create indexes
    await users_collection.create_index("email", unique=True)
    await users_collection.create_index("company_id")
    await transactions_collection.create_index([("company_id", 1), ("date", -1)])
    await documents_collection.create_index([("company_id", 1), ("created_at", -1)])
    await audit_logs_collection.create_index([("company_id", 1), ("timestamp", -1)])
    
    # Create upload directory
    upload_dir = os.getenv("UPLOAD_DIR", "/app/uploads")
    os.makedirs(upload_dir, exist_ok=True)
    
    logger.info("AFMS Backend Server started successfully!")
    yield
    
    # Shutdown
    logger.info("Shutting down AFMS Backend Server...")
    client.close()

# Initialize FastAPI app
app = FastAPI(
    title="Advanced Finance Management System",
    description="Enterprise-grade finance management with ML-powered document processing",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
upload_dir = os.getenv("UPLOAD_DIR", "/app/uploads")
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

# Import all route modules
from auth import auth_router
from documents import documents_router
from transactions import transactions_router
from accounts import accounts_router
from reports import reports_router
from admin import admin_router

# Include all routers with API prefix
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(documents_router, prefix="/api/documents", tags=["Documents"])
app.include_router(transactions_router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(accounts_router, prefix="/api/accounts", tags=["Accounts"])
app.include_router(reports_router, prefix="/api/reports", tags=["Reports"])
app.include_router(admin_router, prefix="/api/admin", tags=["Administration"])

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