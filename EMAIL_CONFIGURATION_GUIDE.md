# Email Configuration Guide for Report Scheduling

**Last Updated:** October 12, 2025  
**Status:** Production Ready  
**Version:** 1.0

## Overview

The AFMS (Advanced Finance Management System) now supports automated email delivery for scheduled reports. This guide provides complete instructions for configuring email services to enable report scheduling functionality.

## Table of Contents

1. [Supported Email Providers](#supported-email-providers)
2. [Configuration Options](#configuration-options)
3. [Gmail Setup (Recommended for Testing)](#gmail-setup)
4. [Generic SMTP Setup](#generic-smtp-setup)
5. [SendGrid Setup (Recommended for Production)](#sendgrid-setup)
6. [AWS SES Setup](#aws-ses-setup)
7. [API Reference](#api-reference)
8. [Testing Configuration](#testing-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## Supported Email Providers

| Provider | Best For | Pricing | Complexity | Reliability |
|----------|----------|---------|------------|-------------|
| **Gmail** | Testing, Personal Use | Free (limited) | Low | High |
| **SMTP Generic** | Any Provider | Varies | Medium | Varies |
| **SendGrid** | Production, Business | $15/mo + | Low | Very High |
| **AWS SES** | High Volume | $0.10/1000 | Medium | Very High |

---

## Configuration Options

### Quick Start Comparison

**For Testing/Development:**
- ✅ **Gmail** - Quick setup with app password
- ⏱️ Setup time: 5 minutes

**For Production:**
- ✅ **SendGrid** - Best deliverability and features
- ✅ **AWS SES** - Best for high volume
- ⏱️ Setup time: 15-30 minutes

---

## Gmail Setup

### Recommended for: Testing and Personal Use

#### Prerequisites
- Gmail account
- 2-Factor Authentication enabled

#### Setup Steps

1. **Enable 2-Factor Authentication**
   ```
   1. Visit: https://myaccount.google.com/security
   2. Click "2-Step Verification"
   3. Follow the setup wizard
   ```

2. **Generate App Password**
   ```
   1. Visit: https://myaccount.google.com/apppasswords
   2. Select "Mail" as the app
   3. Select "Other" as the device
   4. Enter "AFMS Reports"
   5. Click "Generate"
   6. Copy the 16-character password (shown without spaces)
   ```

3. **Configure in AFMS**

   **Using API:**
   ```bash
   curl -X POST "http://localhost:8001/api/email/configure" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "gmail",
       "config": {
         "email": "your-email@gmail.com",
         "app_password": "abcd efgh ijkl mnop",
         "from_name": "AFMS Reports"
       },
       "is_active": true,
       "test_email": "test@example.com"
     }'
   ```

   **Using Frontend UI:**
   ```
   1. Navigate to Settings > Email Configuration
   2. Select "Gmail" as provider
   3. Enter your Gmail address
   4. Paste the 16-character app password
   5. Enter sender name (e.g., "AFMS Reports")
   6. Click "Test Configuration"
   7. Check your inbox for test email
   8. Click "Save Configuration"
   ```

#### Configuration Example
```json
{
  "provider": "gmail",
  "config": {
    "email": "reports@yourdomain.com",
    "app_password": "abcdefghijklmnop",
    "from_name": "AFMS Financial Reports"
  }
}
```

#### Limitations
- ⚠️ Daily sending limit: ~500 emails
- ⚠️ May be flagged as spam for bulk sending
- ⚠️ Not recommended for production use

---

## Generic SMTP Setup

### Recommended for: Any Email Provider with SMTP Access

#### Common SMTP Providers

**Gmail**
```json
{
  "provider": "smtp",
  "config": {
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "your-email@gmail.com",
    "password": "your-app-password",
    "from_email": "your-email@gmail.com",
    "from_name": "AFMS Reports",
    "use_tls": true,
    "use_ssl": false
  }
}
```

**Outlook/Office365**
```json
{
  "provider": "smtp",
  "config": {
    "host": "smtp.office365.com",
    "port": 587,
    "username": "your-email@outlook.com",
    "password": "your-password",
    "from_email": "your-email@outlook.com",
    "from_name": "AFMS Reports",
    "use_tls": true,
    "use_ssl": false
  }
}
```

**Yahoo Mail**
```json
{
  "provider": "smtp",
  "config": {
    "host": "smtp.mail.yahoo.com",
    "port": 587,
    "username": "your-email@yahoo.com",
    "password": "your-app-password",
    "from_email": "your-email@yahoo.com",
    "from_name": "AFMS Reports",
    "use_tls": true,
    "use_ssl": false
  }
}
```

#### SMTP Ports Guide
- **Port 587**: TLS encryption (Recommended)
- **Port 465**: SSL encryption
- **Port 25**: Unencrypted (Not recommended)

#### API Configuration
```bash
curl -X POST "http://localhost:8001/api/email/configure" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "smtp",
    "config": {
      "host": "smtp.example.com",
      "port": 587,
      "username": "your-email@example.com",
      "password": "your-password",
      "from_email": "reports@example.com",
      "from_name": "AFMS Reports",
      "use_tls": true,
      "use_ssl": false,
      "timeout": 30
    },
    "is_active": true,
    "test_email": "admin@example.com"
  }'
```

---

## SendGrid Setup

### Recommended for: Production Use, Business

#### Why SendGrid?
- ✅ High deliverability rate (>99%)
- ✅ Easy setup with API key
- ✅ Detailed analytics and tracking
- ✅ Scalable (up to millions of emails)
- ✅ Template management
- ✅ Dedicated IP options

#### Pricing
- **Free Tier**: 100 emails/day forever
- **Essentials**: $15/mo - 50,000 emails/mo
- **Pro**: $90/mo - 1.5M emails/mo

#### Setup Steps

1. **Sign Up**
   ```
   Visit: https://signup.sendgrid.com/
   ```

2. **Verify Sender Email**
   ```
   1. Go to Settings > Sender Authentication
   2. Click "Verify a Single Sender"
   3. Enter your email address
   4. Check your email and click verification link
   ```

3. **Create API Key**
   ```
   1. Go to Settings > API Keys
   2. Click "Create API Key"
   3. Name: "AFMS Production"
   4. Permissions: "Mail Send" (Full Access)
   5. Click "Create & View"
   6. Copy the API key (starts with "SG.")
   ⚠️ Save this key securely - you won't see it again!
   ```

4. **Configure in AFMS**
   ```bash
   curl -X POST "http://localhost:8001/api/email/configure" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "sendgrid",
       "config": {
         "api_key": "SG.xxxxxxxxxxxxxxxxxxxxxxxxx",
         "from_email": "reports@yourdomain.com",
         "from_name": "AFMS Reports",
         "reply_to": "support@yourdomain.com"
       },
       "is_active": true,
       "test_email": "admin@yourdomain.com"
     }'
   ```

#### Configuration Example
```json
{
  "provider": "sendgrid",
  "config": {
    "api_key": "SG.xxxxx-xxxxxxxxxxx-xxxxxxxxxxxxxxx",
    "from_email": "reports@yourdomain.com",
    "from_name": "AFMS Financial Reports",
    "reply_to": "support@yourdomain.com"
  }
}
```

#### Best Practices
- ✅ Use verified domain for sender email
- ✅ Set up DKIM and SPF records
- ✅ Monitor email analytics
- ✅ Implement unsubscribe handling

---

## AWS SES Setup

### Recommended for: High Volume, Enterprise

#### Why AWS SES?
- ✅ Extremely low cost ($0.10 per 1,000 emails)
- ✅ High volume capability
- ✅ Excellent for transactional emails
- ✅ Integration with other AWS services
- ✅ Detailed delivery metrics

#### Pricing
- **First 62,000 emails/month**: FREE (with EC2)
- **Additional emails**: $0.10 per 1,000
- **Example**: 500,000 emails/mo = ~$50

#### Setup Steps

1. **AWS Account Setup**
   ```
   Visit: https://aws.amazon.com/ses/
   ```

2. **Verify Domain or Email**
   ```
   1. Go to SES Console > Verified Identities
   2. Click "Create Identity"
   3. Select "Domain" (recommended) or "Email"
   4. Follow DNS verification steps
   5. Wait for verification (can take 72 hours)
   ```

3. **Create IAM User**
   ```
   1. Go to IAM Console > Users
   2. Click "Add User"
   3. Username: "afms-email-sender"
   4. Access type: Programmatic access
   5. Permissions: Attach "AmazonSESFullAccess" policy
   6. Create user and save credentials
   ```

4. **Generate SMTP Credentials**
   ```
   1. Go to SES Console > SMTP Settings
   2. Click "Create SMTP Credentials"
   3. IAM User Name: "afms-ses-smtp"
   4. Click "Create"
   5. Download credentials
   ```

5. **Request Production Access**
   ```
   1. Go to SES Console > Account Dashboard
   2. Click "Request Production Access"
   3. Fill out use case details
   4. Submit request (usually approved in 24 hours)
   ```

6. **Configure in AFMS**
   ```bash
   curl -X POST "http://localhost:8001/api/email/configure" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "aws_ses",
       "config": {
         "access_key_id": "AKIA...",
         "secret_access_key": "your-secret-key",
         "region": "us-east-1",
         "from_email": "reports@yourdomain.com",
         "from_name": "AFMS Reports"
       },
       "is_active": true,
       "test_email": "admin@yourdomain.com"
     }'
   ```

#### Configuration Example
```json
{
  "provider": "aws_ses",
  "config": {
    "access_key_id": "AKIAIOSFODNN7EXAMPLE",
    "secret_access_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1",
    "from_email": "reports@yourdomain.com",
    "from_name": "AFMS Financial Reports"
  }
}
```

#### SES Sandbox Limitations
While in sandbox mode:
- ⚠️ Can only send to verified email addresses
- ⚠️ Maximum 200 emails per 24 hours
- ⚠️ Maximum 1 email per second

**Solution:** Request production access (see step 5)

---

## API Reference

### Base URL
```
http://localhost:8001/api/email
```

### Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Endpoints

#### 1. Get Sample Configurations
**Get pre-configured email samples and setup instructions**

```http
GET /api/email/sample-configs
```

**Response:**
```json
{
  "samples": {
    "gmail": {
      "description": "Gmail with App Password",
      "instructions": [...],
      "config_template": {...}
    },
    "smtp_generic": {...},
    "sendgrid": {...},
    "aws_ses": {...}
  },
  "recommendation": "Gmail for testing, SendGrid or AWS SES for production"
}
```

#### 2. Configure Email
**Create or update email configuration**

```http
POST /api/email/configure
Content-Type: application/json
```

**Request Body:**
```json
{
  "provider": "gmail|smtp|sendgrid|aws_ses",
  "config": {
    // Provider-specific configuration
  },
  "is_active": true,
  "test_email": "test@example.com"  // Optional: sends test email
}
```

**Response:**
```json
{
  "id": "email_config_company123",
  "provider": "gmail",
  "from_email": "reports@example.com",
  "from_name": "AFMS Reports",
  "is_active": true,
  "is_verified": true,
  "last_test_date": "2025-10-12T10:30:00Z",
  "last_test_status": "success",
  "created_at": "2025-10-12T10:00:00Z",
  "updated_at": "2025-10-12T10:30:00Z"
}
```

#### 3. Get Current Configuration
**Retrieve existing email configuration**

```http
GET /api/email/configuration
```

**Response:** Same as configure endpoint (sensitive data masked)

#### 4. Test Configuration
**Send a test email to verify configuration**

```http
POST /api/email/test
Content-Type: application/json
```

**Request Body:**
```json
{
  "test_email": "admin@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully to admin@example.com",
  "timestamp": "2025-10-12T10:45:00Z"
}
```

#### 5. Delete Configuration
**Remove email configuration**

```http
DELETE /api/email/configuration
```

**Response:**
```json
{
  "success": true,
  "message": "Email configuration deleted successfully"
}
```

---

## Testing Configuration

### Step-by-Step Testing

1. **Configure Email Provider**
   ```bash
   # Example: Gmail
   curl -X POST "http://localhost:8001/api/email/configure" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "gmail",
       "config": {
         "email": "your-email@gmail.com",
         "app_password": "your-16-char-password",
         "from_name": "AFMS Test"
       },
       "is_active": true,
       "test_email": "your-email@gmail.com"
     }'
   ```

2. **Verify Test Email Received**
   - Check your inbox
   - Look for "AFMS Email Configuration Test"
   - Verify sender name and email

3. **Test Again (Optional)**
   ```bash
   curl -X POST "http://localhost:8001/api/email/test" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"test_email": "another@example.com"}'
   ```

4. **Schedule a Test Report**
   ```bash
   curl -X POST "http://localhost:8001/api/report-scheduling/schedules" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "report_type": "dashboard_summary",
       "frequency": "daily",
       "delivery_time": "09:00",
       "recipients": ["admin@example.com"],
       "is_active": true
     }'
   ```

---

## Troubleshooting

### Common Issues

#### Issue: "Authentication failed"
**Provider: Gmail**
- ✅ Verify 2FA is enabled
- ✅ Use App Password, not regular password
- ✅ Remove spaces from app password
- ✅ Try regenerating app password

**Provider: SMTP**
- ✅ Verify username and password
- ✅ Check if "Less secure app access" is enabled
- ✅ Verify correct SMTP host and port

#### Issue: "Connection timeout"
- ✅ Check firewall rules
- ✅ Verify SMTP port (587/465/25)
- ✅ Ensure TLS/SSL settings match provider
- ✅ Check if port is blocked by ISP

#### Issue: "Emails going to spam"
- ✅ Set up SPF record for your domain
- ✅ Set up DKIM authentication
- ✅ Use verified sender domain
- ✅ Include unsubscribe link
- ✅ Warm up IP gradually (for high volume)

#### Issue: "Test email sent but not received"
- ✅ Check spam/junk folder
- ✅ Verify recipient email is correct
- ✅ Check email provider's send logs
- ✅ Verify sender domain is not blacklisted

#### Issue: "Invalid API key" (SendGrid/AWS)
- ✅ Regenerate API key
- ✅ Verify key has correct permissions
- ✅ Check for typos or extra spaces
- ✅ Ensure key hasn't expired

### Debug Mode

Enable debug logging in backend:
```python
# In server.py
logging.basicConfig(level=logging.DEBUG)
```

Check logs:
```bash
tail -f /var/log/supervisor/backend.err.log
```

---

## Security Best Practices

### Credential Management

1. **Never Commit Credentials**
   ```bash
   # Add to .gitignore
   .env
   **/config.json
   **/credentials.json
   ```

2. **Use Environment Variables**
   ```bash
   # .env file
   SMTP_PASSWORD=your-password
   SENDGRID_API_KEY=SG.xxx
   AWS_SECRET_KEY=xxx
   ```

3. **Rotate Credentials Regularly**
   - Recommended: Every 90 days
   - After team member departure
   - If breach suspected

### Email Security

1. **Implement SPF Record**
   ```
   v=spf1 include:_spf.google.com ~all
   ```

2. **Set Up DKIM**
   - Increases deliverability
   - Prevents email spoofing

3. **Enable TLS/SSL**
   - Always use encrypted connections
   - Prefer TLS (port 587)

4. **Monitor Sending**
   - Track bounce rates
   - Monitor spam complaints
   - Review delivery statistics

### Data Protection

1. **Encrypt Sensitive Data**
   - Email passwords
   - API keys
   - Configuration data

2. **Implement Access Control**
   - Limit who can configure email
   - Audit configuration changes
   - Use role-based permissions

3. **Backup Configuration**
   - Export configurations regularly
   - Store securely encrypted
   - Test restoration procedure

---

## Integration with Report Scheduling

### Workflow

1. **Configure Email** (This guide)
2. **Create Report Schedule**
3. **System generates report**
4. **Email sent automatically**
5. **Monitor delivery status**

### Example: Monthly P&L Email

```bash
# 1. Configure email
curl -X POST "/api/email/configure" ...

# 2. Create schedule
curl -X POST "/api/report-scheduling/schedules" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "report_type": "profit_loss",
    "frequency": "monthly",
    "day_of_month": 1,
    "delivery_time": "08:00",
    "recipients": ["cfo@company.com", "accounting@company.com"],
    "format": "pdf",
    "is_active": true
  }'
```

### Email Template

Reports are sent with:
- Professional HTML formatting
- Report summary in email body
- PDF attachment (if configured)
- Key metrics highlighted
- Link to dashboard
- Unsubscribe option

---

## Support

### Getting Help

1. **Check Logs**
   ```bash
   tail -f /var/log/supervisor/backend.err.log
   ```

2. **Test API Endpoint**
   ```bash
   curl http://localhost:8001/api/health
   ```

3. **Review Documentation**
   - This guide
   - Provider-specific docs
   - AFMS API docs at `/docs`

### Provider Support

- **Gmail**: https://support.google.com/mail
- **SendGrid**: https://support.sendgrid.com
- **AWS SES**: https://aws.amazon.com/ses/support

---

## Conclusion

Email configuration is now ready for report scheduling! Follow the provider-specific guide for your chosen email service, test the configuration, and start scheduling automated financial reports.

**Quick Start Recommendations:**
- 🧪 **Testing**: Use Gmail (5-minute setup)
- 🚀 **Production**: Use SendGrid or AWS SES
- 📊 **High Volume**: Use AWS SES
- 💼 **Business**: Use SendGrid

---

**Version:** 1.0  
**Last Updated:** October 12, 2025  
**Maintained by:** AFMS Development Team
