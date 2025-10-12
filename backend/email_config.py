"""
Email Configuration Management
Provides email configuration templates and validation for report scheduling
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
import os
from dotenv import load_dotenv

from database import database, integrations_collection
from auth import get_current_user, log_audit_event

load_dotenv()
logger = logging.getLogger(__name__)
router = APIRouter()

# ==================== Models ====================

class EmailProvider(str):
    """Supported email providers"""
    SMTP = "smtp"
    GMAIL = "gmail"
    SENDGRID = "sendgrid"
    AWS_SES = "aws_ses"
    MAILGUN = "mailgun"

class SMTPConfig(BaseModel):
    """SMTP Email Configuration"""
    host: str = Field(..., description="SMTP server host")
    port: int = Field(587, description="SMTP server port")
    username: str = Field(..., description="SMTP username/email")
    password: str = Field(..., description="SMTP password or app password")
    from_email: EmailStr = Field(..., description="From email address")
    from_name: str = Field("AFMS Reports", description="From name")
    use_tls: bool = Field(True, description="Use TLS encryption")
    use_ssl: bool = Field(False, description="Use SSL encryption")
    timeout: int = Field(30, description="Connection timeout in seconds")

class GmailConfig(BaseModel):
    """Gmail-specific Configuration (using App Passwords)"""
    email: EmailStr = Field(..., description="Gmail address")
    app_password: str = Field(..., description="Gmail App Password (16 characters)")
    from_name: str = Field("AFMS Reports", description="From name")
    
    @field_validator('app_password')
    def validate_app_password(cls, v):
        # Remove spaces if user copied with spaces
        cleaned = v.replace(' ', '')
        if len(cleaned) != 16:
            raise ValueError('Gmail App Password must be 16 characters')
        return cleaned

class SendGridConfig(BaseModel):
    """SendGrid API Configuration"""
    api_key: str = Field(..., description="SendGrid API key")
    from_email: EmailStr = Field(..., description="Verified sender email")
    from_name: str = Field("AFMS Reports", description="From name")
    reply_to: Optional[EmailStr] = Field(None, description="Reply-to email")

class AWSConfig(BaseModel):
    """AWS SES Configuration"""
    access_key_id: str = Field(..., description="AWS Access Key ID")
    secret_access_key: str = Field(..., description="AWS Secret Access Key")
    region: str = Field("us-east-1", description="AWS Region")
    from_email: EmailStr = Field(..., description="Verified sender email")
    from_name: str = Field("AFMS Reports", description="From name")

class EmailConfigCreate(BaseModel):
    """Create/Update Email Configuration"""
    provider: str = Field(..., description="Email provider (smtp, gmail, sendgrid, aws_ses)")
    config: Dict[str, Any] = Field(..., description="Provider-specific configuration")
    is_active: bool = Field(True, description="Enable this configuration")
    test_email: Optional[EmailStr] = Field(None, description="Send test email to this address")

class EmailConfigResponse(BaseModel):
    """Email Configuration Response (sensitive data masked)"""
    id: str
    provider: str
    from_email: str
    from_name: str
    is_active: bool
    is_verified: bool
    last_test_date: Optional[datetime]
    last_test_status: Optional[str]
    created_at: datetime
    updated_at: datetime

# ==================== Sample Configurations ====================

SAMPLE_CONFIGS = {
    "gmail": {
        "description": "Gmail with App Password (Recommended for personal use)",
        "instructions": [
            "1. Enable 2-Factor Authentication in your Google Account",
            "2. Go to https://myaccount.google.com/apppasswords",
            "3. Create a new App Password for 'Mail'",
            "4. Copy the 16-character password (without spaces)",
            "5. Use this password in the configuration below"
        ],
        "config_template": {
            "provider": "gmail",
            "config": {
                "email": "your-email@gmail.com",
                "app_password": "xxxx-xxxx-xxxx-xxxx",
                "from_name": "AFMS Reports"
            }
        },
        "test_command": "Use the 'Test Configuration' button after setup"
    },
    
    "smtp_generic": {
        "description": "Generic SMTP (Works with most email providers)",
        "instructions": [
            "1. Get SMTP credentials from your email provider",
            "2. Common SMTP ports: 587 (TLS), 465 (SSL), 25 (unencrypted)",
            "3. Enable 'Less secure app access' or use app-specific password",
            "4. Configure firewall to allow SMTP connections"
        ],
        "config_template": {
            "provider": "smtp",
            "config": {
                "host": "smtp.example.com",
                "port": 587,
                "username": "your-email@example.com",
                "password": "your-password",
                "from_email": "reports@example.com",
                "from_name": "AFMS Reports",
                "use_tls": True,
                "use_ssl": False
            }
        },
        "popular_providers": {
            "Gmail": {"host": "smtp.gmail.com", "port": 587, "tls": True},
            "Outlook/Office365": {"host": "smtp.office365.com", "port": 587, "tls": True},
            "Yahoo": {"host": "smtp.mail.yahoo.com", "port": 587, "tls": True},
            "AWS SES": {"host": "email-smtp.us-east-1.amazonaws.com", "port": 587, "tls": True},
            "SendGrid": {"host": "smtp.sendgrid.net", "port": 587, "tls": True},
            "Mailgun": {"host": "smtp.mailgun.org", "port": 587, "tls": True}
        }
    },
    
    "sendgrid": {
        "description": "SendGrid API (Recommended for production)",
        "instructions": [
            "1. Sign up at https://sendgrid.com",
            "2. Go to Settings > API Keys",
            "3. Create a new API Key with 'Mail Send' permissions",
            "4. Verify your sender email address",
            "5. Copy the API key (starts with 'SG.')"
        ],
        "config_template": {
            "provider": "sendgrid",
            "config": {
                "api_key": "SG.xxxxxxxxxxxx",
                "from_email": "reports@yourdomain.com",
                "from_name": "AFMS Reports",
                "reply_to": "support@yourdomain.com"
            }
        },
        "pricing": "Free tier: 100 emails/day, Paid plans from $15/month"
    },
    
    "aws_ses": {
        "description": "AWS Simple Email Service (Best for high volume)",
        "instructions": [
            "1. Sign up for AWS account at https://aws.amazon.com",
            "2. Go to Amazon SES console",
            "3. Verify your domain or email addresses",
            "4. Create IAM user with SES send permissions",
            "5. Generate access keys for the IAM user",
            "6. Move out of SES Sandbox for production use"
        ],
        "config_template": {
            "provider": "aws_ses",
            "config": {
                "access_key_id": "AKIA...",
                "secret_access_key": "your-secret-key",
                "region": "us-east-1",
                "from_email": "reports@yourdomain.com",
                "from_name": "AFMS Reports"
            }
        },
        "pricing": "$0.10 per 1,000 emails, Free tier: 62,000 emails/month"
    }
}

# ==================== API Endpoints ====================

@router.get("/sample-configs")
async def get_sample_configs(current_user: dict = Depends(get_current_user)):
    """Get sample email configurations and setup instructions"""
    return {
        "samples": SAMPLE_CONFIGS,
        "recommendation": "Gmail for testing, SendGrid or AWS SES for production"
    }

@router.post("/configure", response_model=EmailConfigResponse)
async def configure_email(
    config_data: EmailConfigCreate,
    current_user: dict = Depends(get_current_user)
):
    """Configure email settings for report scheduling"""
    
    try:
        company_id = current_user['company_id']
        user_id = current_user['_id']
        
        # Validate provider
        valid_providers = ['smtp', 'gmail', 'sendgrid', 'aws_ses', 'mailgun']
        if config_data.provider not in valid_providers:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid provider. Must be one of: {', '.join(valid_providers)}"
            )
        
        # Validate required fields based on provider
        required_fields = {
            'smtp': ['host', 'port', 'username', 'password', 'from_email'],
            'gmail': ['email', 'app_password'],
            'sendgrid': ['api_key', 'from_email'],
            'aws_ses': ['access_key_id', 'secret_access_key', 'region', 'from_email']
        }
        
        provider_fields = required_fields.get(config_data.provider, [])
        missing_fields = [field for field in provider_fields if field not in config_data.config]
        
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required fields for {config_data.provider}: {', '.join(missing_fields)}"
            )
        
        # Convert Gmail config to SMTP format internally
        if config_data.provider == 'gmail':
            config_data.config = {
                'host': 'smtp.gmail.com',
                'port': 587,
                'username': config_data.config['email'],
                'password': config_data.config['app_password'],
                'from_email': config_data.config['email'],
                'from_name': config_data.config.get('from_name', 'AFMS Reports'),
                'use_tls': True,
                'use_ssl': False
            }
        
        # Extract from_email for response
        from_email = config_data.config.get('from_email') or config_data.config.get('email', 'unknown')
        from_name = config_data.config.get('from_name', 'AFMS Reports')
        
        # Create configuration document
        config_id = f"email_config_{company_id}"
        
        # Check if configuration already exists
        existing = await integrations_collection.find_one({
            '_id': config_id,
            'company_id': company_id
        })
        
        config_doc = {
            '_id': config_id,
            'company_id': company_id,
            'integration_type': 'email',
            'provider': config_data.provider,
            'config': config_data.config,  # Sensitive data - should be encrypted in production
            'from_email': from_email,
            'from_name': from_name,
            'is_active': config_data.is_active,
            'is_verified': False,
            'last_test_date': None,
            'last_test_status': None,
            'created_at': existing['created_at'] if existing else datetime.utcnow(),
            'updated_at': datetime.utcnow(),
            'created_by': existing.get('created_by', user_id) if existing else user_id
        }
        
        # Upsert configuration
        await integrations_collection.replace_one(
            {'_id': config_id},
            config_doc,
            upsert=True
        )
        
        # Send test email if requested
        test_status = None
        if config_data.test_email:
            from email_service import send_email
            
            test_result = await send_email(
                to_email=config_data.test_email,
                subject="AFMS Email Configuration Test",
                body="This is a test email from your AFMS system. Email configuration is working correctly!",
                email_config={
                    'provider': config_data.provider,
                    'smtp_config' if config_data.provider in ['smtp', 'gmail'] else f'{config_data.provider}_config': config_data.config
                },
                html_body=f"""
                <html>
                    <body style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2 style="color: #2563eb;">✅ Email Configuration Test</h2>
                        <p>Congratulations! Your AFMS email configuration is working correctly.</p>
                        <p><strong>Provider:</strong> {config_data.provider.upper()}</p>
                        <p><strong>From:</strong> {from_name} &lt;{from_email}&gt;</p>
                        <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">
                            This email was sent as a test from your Advanced Finance Management System.
                        </p>
                    </body>
                </html>
                """
            )
            
            test_status = "success" if test_result else "failed"
            
            # Update test status
            await integrations_collection.update_one(
                {'_id': config_id},
                {
                    '$set': {
                        'is_verified': test_result,
                        'last_test_date': datetime.utcnow(),
                        'last_test_status': test_status
                    }
                }
            )
            
            if not test_result:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Email configuration saved but test email failed. Please check your settings."
                )
        
        # Audit log
        await log_audit_event(
            user_id=user_id,
            company_id=company_id,
            action='email_config_updated',
            details={
                'provider': config_data.provider,
                'from_email': from_email,
                'test_status': test_status
            }
        )
        
        logger.info(f"Email configuration updated for company {company_id}: {config_data.provider}")
        
        return EmailConfigResponse(
            id=config_id,
            provider=config_data.provider,
            from_email=from_email,
            from_name=from_name,
            is_active=config_data.is_active,
            is_verified=test_status == "success" if test_status else False,
            last_test_date=datetime.utcnow() if test_status else None,
            last_test_status=test_status,
            created_at=config_doc['created_at'],
            updated_at=config_doc['updated_at']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error configuring email: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to configure email: {str(e)}"
        )

@router.get("/configuration", response_model=Optional[EmailConfigResponse])
async def get_email_configuration(current_user: dict = Depends(get_current_user)):
    """Get current email configuration (sensitive data masked)"""
    
    company_id = current_user['company_id']
    config_id = f"email_config_{company_id}"
    
    config = await integrations_collection.find_one({
        '_id': config_id,
        'company_id': company_id
    })
    
    if not config:
        return None
    
    return EmailConfigResponse(
        id=config['_id'],
        provider=config['provider'],
        from_email=config['from_email'],
        from_name=config['from_name'],
        is_active=config['is_active'],
        is_verified=config.get('is_verified', False),
        last_test_date=config.get('last_test_date'),
        last_test_status=config.get('last_test_status'),
        created_at=config['created_at'],
        updated_at=config['updated_at']
    )

@router.post("/test")
async def test_email_configuration(
    test_email: EmailStr,
    current_user: dict = Depends(get_current_user)
):
    """Test current email configuration by sending a test email"""
    
    company_id = current_user['company_id']
    config_id = f"email_config_{company_id}"
    
    # Get configuration
    config = await integrations_collection.find_one({
        '_id': config_id,
        'company_id': company_id
    })
    
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email configuration not found. Please configure email settings first."
        )
    
    if not config.get('is_active'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email configuration is disabled. Please enable it first."
        )
    
    # Send test email
    from email_service import send_email
    
    test_result = await send_email(
        to_email=test_email,
        subject="AFMS Email Configuration Test",
        body="This is a test email from your AFMS system. Email configuration is working correctly!",
        email_config={
            'provider': config['provider'],
            'smtp_config' if config['provider'] in ['smtp', 'gmail'] else f"{config['provider']}_config": config['config']
        },
        html_body=f"""
        <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2 style="color: #2563eb;">✅ Email Configuration Test</h2>
                <p>Your AFMS email configuration is working correctly.</p>
                <p><strong>Provider:</strong> {config['provider'].upper()}</p>
                <p><strong>From:</strong> {config['from_name']} &lt;{config['from_email']}&gt;</p>
                <p><strong>Time:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    This is a test email from your Advanced Finance Management System.
                </p>
            </body>
        </html>
        """
    )
    
    # Update test status
    await integrations_collection.update_one(
        {'_id': config_id},
        {
            '$set': {
                'is_verified': test_result,
                'last_test_date': datetime.utcnow(),
                'last_test_status': 'success' if test_result else 'failed'
            }
        }
    )
    
    # Audit log
    await log_audit_event(
        user_id=current_user['_id'],
        company_id=company_id,
        action='email_test_sent',
        details={
            'test_email': test_email,
            'status': 'success' if test_result else 'failed'
        }
    )
    
    if test_result:
        return {
            'success': True,
            'message': f'Test email sent successfully to {test_email}',
            'timestamp': datetime.utcnow().isoformat()
        }
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail='Failed to send test email. Please check your email configuration.'
        )

@router.delete("/configuration")
async def delete_email_configuration(current_user: dict = Depends(get_current_user)):
    """Delete email configuration"""
    
    company_id = current_user['company_id']
    config_id = f"email_config_{company_id}"
    
    result = await integrations_collection.delete_one({
        '_id': config_id,
        'company_id': company_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Email configuration not found"
        )
    
    # Audit log
    await log_audit_event(
        user_id=current_user['_id'],
        company_id=company_id,
        action='email_config_deleted',
        details={}
    )
    
    return {
        'success': True,
        'message': 'Email configuration deleted successfully'
    }

# ==================== Helper Functions ====================

async def get_company_email_config(company_id: str) -> Optional[Dict[str, Any]]:
    """Get active email configuration for a company"""
    
    config_id = f"email_config_{company_id}"
    
    config = await integrations_collection.find_one({
        '_id': config_id,
        'company_id': company_id,
        'is_active': True
    })
    
    if not config:
        return None
    
    return {
        'provider': config['provider'],
        'smtp_config' if config['provider'] in ['smtp', 'gmail'] else f"{config['provider']}_config": config['config']
    }
