"""
Email Service
Handles email sending with support for multiple providers
Auto-detects provider based on environment variables:
- SendGrid: SENDGRID_API_KEY
- AWS SES: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY
- SMTP/Gmail: SMTP_HOST + SMTP_USERNAME + SMTP_PASSWORD
"""

import smtplib
import logging
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Optional, List, Dict, Any
import aiohttp
import asyncio

logger = logging.getLogger(__name__)

# ==================== Configuration ====================
# Auto-detect email provider from environment variables

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"

FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@afms.com")
FROM_NAME = os.getenv("FROM_NAME", "AFMS Reports")

# Auto-detect provider
EMAIL_PROVIDER = None
if SENDGRID_API_KEY:
    EMAIL_PROVIDER = "sendgrid"
    logger.info("✅ Email provider: SendGrid")
elif AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
    EMAIL_PROVIDER = "aws_ses"
    logger.info("✅ Email provider: AWS SES")
elif SMTP_HOST and SMTP_USERNAME and SMTP_PASSWORD:
    EMAIL_PROVIDER = "smtp"
    logger.info(f"✅ Email provider: SMTP ({SMTP_HOST})")
else:
    logger.warning("⚠️  No email provider configured")


def is_email_configured() -> bool:
    """Check if email is configured"""
    return EMAIL_PROVIDER is not None


def get_email_provider() -> Optional[str]:
    """Get current email provider"""
    return EMAIL_PROVIDER


async def send_email(
    to_email: str,
    subject: str,
    body: str,
    email_config: Dict[str, Any],
    html_body: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None
) -> bool:
    """
    Send email using configured provider
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        body: Plain text email body
        email_config: Email configuration dictionary
        html_body: Optional HTML body
        attachments: Optional list of attachments [{"filename": "file.pdf", "content": bytes}]
        cc: Optional CC recipients
        bcc: Optional BCC recipients
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        provider = email_config.get("provider", "smtp")
        
        if provider == "smtp" or provider == "gmail":
            return await send_smtp_email(
                to_email=to_email,
                subject=subject,
                body=body,
                html_body=html_body,
                config=email_config.get("smtp_config", {}),
                attachments=attachments,
                cc=cc,
                bcc=bcc
            )
        elif provider == "sendgrid":
            return await send_sendgrid_email(
                to_email=to_email,
                subject=subject,
                body=body,
                html_body=html_body,
                config=email_config.get("sendgrid_config", {}),
                attachments=attachments,
                cc=cc,
                bcc=bcc
            )
        elif provider == "aws_ses":
            return await send_aws_ses_email(
                to_email=to_email,
                subject=subject,
                body=body,
                html_body=html_body,
                config=email_config.get("aws_config", {}),
                attachments=attachments,
                cc=cc,
                bcc=bcc
            )
        else:
            logger.error(f"Unsupported email provider: {provider}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending email: {e}")
        return False


async def send_smtp_email(
    to_email: str,
    subject: str,
    body: str,
    config: Dict[str, Any],
    html_body: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None
) -> bool:
    """
    Send email via SMTP
    """
    try:
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"{config.get('from_name', 'AFMS')} <{config.get('from_email')}>"
        msg['To'] = to_email
        
        if cc:
            msg['Cc'] = ', '.join(cc)
        if bcc:
            msg['Bcc'] = ', '.join(bcc)
        
        # Add body parts
        msg.attach(MIMEText(body, 'plain'))
        if html_body:
            msg.attach(MIMEText(html_body, 'html'))
        
        # Add attachments
        if attachments:
            for attachment in attachments:
                part = MIMEApplication(attachment['content'])
                part.add_header('Content-Disposition', 'attachment', filename=attachment['filename'])
                msg.attach(part)
        
        # Prepare recipients
        recipients = [to_email]
        if cc:
            recipients.extend(cc)
        if bcc:
            recipients.extend(bcc)
        
        # Send email in thread pool to avoid blocking
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(
            None,
            _send_smtp_sync,
            msg,
            recipients,
            config
        )
        
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"SMTP email error: {e}")
        return False


def _send_smtp_sync(msg, recipients, config):
    """Synchronous SMTP send (runs in thread pool)"""
    host = config.get('host', 'smtp.gmail.com')
    port = config.get('port', 587)
    username = config.get('username')
    password = config.get('password')
    use_tls = config.get('use_tls', True)
    use_ssl = config.get('use_ssl', False)
    
    if use_ssl:
        server = smtplib.SMTP_SSL(host, port)
    else:
        server = smtplib.SMTP(host, port)
        if use_tls:
            server.starttls()
    
    if username and password:
        server.login(username, password)
    
    server.sendmail(msg['From'], recipients, msg.as_string())
    server.quit()


async def send_sendgrid_email(
    to_email: str,
    subject: str,
    body: str,
    config: Dict[str, Any],
    html_body: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None
) -> bool:
    """
    Send email via SendGrid API
    """
    try:
        api_key = config.get('api_key')
        if not api_key:
            logger.error("SendGrid API key not configured")
            return False
        
        # Prepare email data
        email_data = {
            "personalizations": [
                {
                    "to": [{"email": to_email}],
                    "subject": subject
                }
            ],
            "from": {
                "email": config.get('from_email'),
                "name": config.get('from_name', 'AFMS')
            },
            "content": [
                {
                    "type": "text/plain",
                    "value": body
                }
            ]
        }
        
        # Add HTML content if provided
        if html_body:
            email_data["content"].append({
                "type": "text/html",
                "value": html_body
            })
        
        # Add CC and BCC
        if cc:
            email_data["personalizations"][0]["cc"] = [{"email": e} for e in cc]
        if bcc:
            email_data["personalizations"][0]["bcc"] = [{"email": e} for e in bcc]
        
        # Add attachments (base64 encoded)
        if attachments:
            import base64
            email_data["attachments"] = []
            for attachment in attachments:
                email_data["attachments"].append({
                    "content": base64.b64encode(attachment['content']).decode(),
                    "filename": attachment['filename'],
                    "type": "application/octet-stream",
                    "disposition": "attachment"
                })
        
        # Send via SendGrid API
        async with aiohttp.ClientSession() as session:
            async with session.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=email_data,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
            ) as response:
                if response.status == 202:
                    logger.info(f"SendGrid email sent successfully to {to_email}")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"SendGrid error: {error_text}")
                    return False
                    
    except Exception as e:
        logger.error(f"SendGrid email error: {e}")
        return False


async def send_aws_ses_email(
    to_email: str,
    subject: str,
    body: str,
    config: Dict[str, Any],
    html_body: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None
) -> bool:
    """
    Send email via AWS SES
    Note: This is a placeholder. Full implementation requires boto3 library.
    """
    try:
        logger.warning("AWS SES email sending not fully implemented. Requires boto3 library.")
        
        # TODO: Implement AWS SES integration using boto3
        # from boto3 import client as boto3_client
        # ses_client = boto3_client(
        #     'ses',
        #     aws_access_key_id=config.get('access_key_id'),
        #     aws_secret_access_key=config.get('secret_access_key'),
        #     region_name=config.get('region', 'us-east-1')
        # )
        # response = ses_client.send_email(...)
        
        return False
        
    except Exception as e:
        logger.error(f"AWS SES email error: {e}")
        return False


def generate_report_email_html(report_type: str, report_data: Dict[str, Any], company_name: str) -> str:
    """
    Generate HTML email template for scheduled reports
    """
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                text-align: center;
            }}
            .content {{
                background: #f9fafb;
                padding: 30px;
                border-radius: 0 0 10px 10px;
            }}
            .report-info {{
                background: white;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #667eea;
            }}
            .footer {{
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }}
            .button {{
                display: inline-block;
                background: #667eea;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>📊 {report_type} Report</h1>
            <p>{company_name}</p>
        </div>
        <div class="content">
            <p>Dear Team,</p>
            <p>Your scheduled <strong>{report_type}</strong> report is ready.</p>
            
            <div class="report-info">
                <h3>Report Details</h3>
                <p><strong>Generated:</strong> {report_data.get('generated_at', 'N/A')}</p>
                <p><strong>Period:</strong> {report_data.get('period', 'N/A')}</p>
                <p>Please find the complete report attached to this email.</p>
            </div>
            
            <p>If you have any questions about this report, please contact your finance team.</p>
        </div>
        <div class="footer">
            <p>This is an automated email from AFMS - Advanced Finance Management System</p>
            <p>© 2025 AFMS. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
    return html
