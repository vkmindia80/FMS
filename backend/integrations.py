"""
Integration Management API
Handles Email, Banking, and Payment integration configurations
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import uuid

from database import integrations_collection
from auth import get_current_user, log_audit_event

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== Models ====================

class SMTPConfig(BaseModel):
    """SMTP Email Configuration"""
    host: str
    port: int = 587
    username: str
    password: str
    use_tls: bool = True
    use_ssl: bool = False
    from_email: EmailStr
    from_name: str = "AFMS Notifications"


class SendGridConfig(BaseModel):
    """SendGrid Email Configuration"""
    api_key: str
    from_email: EmailStr
    from_name: str = "AFMS Notifications"


class AWSConfig(BaseModel):
    """AWS SES Email Configuration"""
    access_key_id: str
    secret_access_key: str
    region: str = "us-east-1"
    from_email: EmailStr
    from_name: str = "AFMS Notifications"


class EmailConfiguration(BaseModel):
    """Email Integration Configuration"""
    provider: str  # smtp, sendgrid, aws_ses, gmail
    enabled: bool = False
    smtp_config: Optional[SMTPConfig] = None
    sendgrid_config: Optional[SendGridConfig] = None
    aws_config: Optional[AWSConfig] = None
    
    @field_validator('provider')
    @classmethod
    def validate_provider(cls, v):
        allowed = ['smtp', 'sendgrid', 'aws_ses', 'gmail']
        if v not in allowed:
            raise ValueError(f'Provider must be one of {allowed}')
        return v


class BankingIntegrationStatus(BaseModel):
    """Banking Integration Status"""
    plaid_enabled: bool = False
    plaid_environment: str = "sandbox"  # sandbox, development, production
    connected_accounts: int = 0
    last_sync: Optional[datetime] = None


class PaymentIntegrationStatus(BaseModel):
    """Payment Integration Status"""
    stripe_enabled: bool = False
    stripe_environment: str = "test"  # test, live
    paypal_enabled: bool = False
    square_enabled: bool = False
    total_transactions: int = 0


class IntegrationConfig(BaseModel):
    """Main Integration Configuration"""
    company_id: str
    email: Optional[EmailConfiguration] = None
    banking: Optional[BankingIntegrationStatus] = None
    payment: Optional[PaymentIntegrationStatus] = None
    updated_at: datetime = None
    updated_by: str = None


class IntegrationConfigUpdate(BaseModel):
    """Update Integration Configuration"""
    email: Optional[EmailConfiguration] = None
    banking: Optional[BankingIntegrationStatus] = None
    payment: Optional[PaymentIntegrationStatus] = None


class EmailToggleRequest(BaseModel):
    """Toggle Email Functionality"""
    enabled: bool


class TestEmailRequest(BaseModel):
    """Test Email Configuration"""
    recipient: EmailStr
    subject: str = "Test Email from AFMS"
    body: str = "This is a test email to verify your email configuration."


# ==================== API Endpoints ====================

@router.get("/config")
async def get_integration_config(
    current_user: dict = Depends(get_current_user)
):
    """
    Get integration configuration for the company
    """
    try:
        config = await integrations_collection.find_one({
            "company_id": current_user["company_id"]
        })
        
        if not config:
            # Return default config if none exists
            return {
                "company_id": current_user["company_id"],
                "email": {
                    "provider": "smtp",
                    "enabled": False,
                    "smtp_config": None,
                    "sendgrid_config": None,
                    "aws_config": None
                },
                "banking": {
                    "plaid_enabled": False,
                    "plaid_environment": "sandbox",
                    "connected_accounts": 0,
                    "last_sync": None
                },
                "payment": {
                    "stripe_enabled": False,
                    "stripe_environment": "test",
                    "paypal_enabled": False,
                    "square_enabled": False,
                    "total_transactions": 0
                }
            }
        
        # Remove sensitive password field for security
        if config.get("email") and config["email"].get("smtp_config"):
            config["email"]["smtp_config"]["password"] = "••••••••"
        
        return config
        
    except Exception as e:
        logger.error(f"Error fetching integration config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch integration configuration"
        )


@router.put("/config")
async def update_integration_config(
    config_update: IntegrationConfigUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update integration configuration
    """
    try:
        existing_config = await integrations_collection.find_one({
            "company_id": current_user["company_id"]
        })
        
        update_data = {
            "company_id": current_user["company_id"],
            "updated_at": datetime.utcnow(),
            "updated_by": current_user["_id"]
        }
        
        # Update email config if provided
        if config_update.email:
            update_data["email"] = config_update.email.model_dump()
        elif existing_config and existing_config.get("email"):
            update_data["email"] = existing_config["email"]
        
        # Update banking config if provided
        if config_update.banking:
            update_data["banking"] = config_update.banking.model_dump()
        elif existing_config and existing_config.get("banking"):
            update_data["banking"] = existing_config["banking"]
        
        # Update payment config if provided
        if config_update.payment:
            update_data["payment"] = config_update.payment.model_dump()
        elif existing_config and existing_config.get("payment"):
            update_data["payment"] = existing_config["payment"]
        
        # Upsert configuration
        result = await integrations_collection.update_one(
            {"company_id": current_user["company_id"]},
            {"$set": update_data},
            upsert=True
        )
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="integration_config_updated",
            details={"updated_sections": list(config_update.model_dump(exclude_none=True).keys())}
        )
        
        return {
            "success": True,
            "message": "Integration configuration updated successfully"
        }
        
    except Exception as e:
        logger.error(f"Error updating integration config: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update integration configuration"
        )


@router.post("/email/toggle")
async def toggle_email(
    toggle_request: EmailToggleRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Toggle email functionality on/off
    Creates default integration config if none exists
    """
    try:
        # Check if config exists
        existing_config = await integrations_collection.find_one({
            "company_id": current_user["company_id"]
        })
        
        if existing_config:
            # Update existing config
            result = await integrations_collection.update_one(
                {"company_id": current_user["company_id"]},
                {
                    "$set": {
                        "email.enabled": toggle_request.enabled,
                        "updated_at": datetime.utcnow(),
                        "updated_by": current_user["_id"]
                    }
                }
            )
        else:
            # Create new config with defaults
            default_config = {
                "company_id": current_user["company_id"],
                "email": {
                    "provider": "smtp",
                    "enabled": toggle_request.enabled,
                    "smtp_config": None,
                    "sendgrid_config": None,
                    "aws_config": None
                },
                "banking": {
                    "plaid_enabled": False,
                    "plaid_environment": "sandbox",
                    "connected_accounts": 0,
                    "last_sync": None
                },
                "payment": {
                    "stripe_enabled": False,
                    "stripe_environment": "test",
                    "paypal_enabled": False,
                    "square_enabled": False,
                    "total_transactions": 0
                },
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "updated_by": current_user["_id"]
            }
            
            result = await integrations_collection.insert_one(default_config)
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["_id"],
            company_id=current_user["company_id"],
            action="email_toggled",
            details={"enabled": toggle_request.enabled}
        )
        
        return {
            "success": True,
            "enabled": toggle_request.enabled,
            "message": f"Email functionality {'enabled' if toggle_request.enabled else 'disabled'} successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error toggling email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle email functionality"
        )


@router.post("/email/test")
async def test_email_config(
    test_request: TestEmailRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Test email configuration by sending a test email
    """
    try:
        # Get email configuration
        config = await integrations_collection.find_one({
            "company_id": current_user["company_id"]
        })
        
        if not config or not config.get("email"):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email configuration not found"
            )
        
        email_config = config["email"]
        
        if not email_config.get("enabled"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email functionality is disabled. Please enable it first."
            )
        
        # Import email service
        from email_service import send_email
        
        # Send test email
        success = await send_email(
            to_email=test_request.recipient,
            subject=test_request.subject,
            body=test_request.body,
            email_config=email_config
        )
        
        if success:
            # Log audit event
            await log_audit_event(
                user_id=current_user["_id"],
                company_id=current_user["company_id"],
                action="test_email_sent",
                details={"recipient": test_request.recipient}
            )
            
            return {
                "success": True,
                "message": f"Test email sent successfully to {test_request.recipient}"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send test email. Please check your configuration."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending test email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send test email: {str(e)}"
        )


@router.get("/status")
async def get_integration_status(
    current_user: dict = Depends(get_current_user)
):
    """
    Get quick status of all integrations
    """
    try:
        config = await integrations_collection.find_one({
            "company_id": current_user["company_id"]
        })
        
        if not config:
            return {
                "email_enabled": False,
                "banking_enabled": False,
                "payment_enabled": False
            }
        
        return {
            "email_enabled": config.get("email", {}).get("enabled", False),
            "banking_enabled": config.get("banking", {}).get("plaid_enabled", False),
            "payment_enabled": (
                config.get("payment", {}).get("stripe_enabled", False) or
                config.get("payment", {}).get("paypal_enabled", False) or
                config.get("payment", {}).get("square_enabled", False)
            )
        }
        
    except Exception as e:
        logger.error(f"Error fetching integration status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch integration status"
        )
