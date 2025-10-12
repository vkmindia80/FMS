# Email Service Setup Guide
## AFMS - Advanced Finance Management System

**Last Updated:** December 2025  
**Purpose:** Configure email service for automated report delivery

---

## Overview

AFMS supports three email providers with automatic detection:
- **SendGrid** - Recommended for production (easiest setup)
- **AWS SES** - Most scalable (pay-per-use)
- **SMTP/Gmail** - For development (free, limited)

The system automatically detects which provider to use based on environment variables in `/app/backend/.env`

---

## Current Status: SMTP/Gmail (Development Mode)

You're currently configured to use **SMTP/Gmail** for development. This is perfect for testing!

### Gmail Setup Steps

#### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/security
2. Under "How you sign in to Google", enable **2-Step Verification**

#### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Enter "AFMS"
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

#### Step 3: Update .env File

Open `/app/backend/.env` and update these lines:

```bash
# Option C: SMTP/Gmail Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com        # ← Your Gmail address
SMTP_PASSWORD=abcdefghijklmnop            # ← Your App Password (remove spaces)
SMTP_USE_TLS=true
SMTP_USE_SSL=false

# Sender Information
FROM_EMAIL=your-email@gmail.com           # ← Your Gmail address
FROM_NAME=AFMS Reports                     # ← Your preferred sender name
```

**Important:** 
- Remove spaces from App Password: `abcd efgh ijkl mnop` → `abcdefghijklmnop`
- Use the SAME email for `SMTP_USERNAME` and `FROM_EMAIL`
- Gmail limits: ~500 emails/day

---

## Production Email Providers

### Option A: SendGrid (Recommended for Production)

**Pros:**
- Easiest setup
- Reliable delivery
- Good deliverability rates
- Detailed analytics

**Pricing:**
- Free: 100 emails/day
- Essentials: $19.95/month for 50,000 emails
- Pro: $89.95/month for 100,000 emails

**Setup Steps:**

1. **Sign Up**
   - Go to https://sendgrid.com
   - Click "Start for Free"
   - Complete registration

2. **Create API Key**
   - Dashboard → Settings → API Keys
   - Click "Create API Key"
   - Name: "AFMS Production"
   - Permissions: **Full Access** (or minimum: Mail Send)
   - Copy the API key (starts with `SG.`)

3. **Verify Sender Identity**
   - Settings → Sender Authentication
   - Choose "Single Sender Verification" (easiest)
   - Or "Domain Authentication" (more professional)
   - Follow verification steps

4. **Update .env File**

```bash
# Option A: SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sender Information
FROM_EMAIL=reports@yourdomain.com     # Must be verified in SendGrid
FROM_NAME=AFMS Reports
```

5. **Restart Backend**
```bash
sudo supervisorctl restart backend
```

---

### Option B: AWS SES (Most Scalable)

**Pros:**
- Very cheap ($0.10 per 1,000 emails)
- Highly scalable
- Integrated with AWS ecosystem

**Cons:**
- More complex setup
- Requires AWS account
- Sandbox mode by default (requires verification request)

**Pricing:**
- $0.10 per 1,000 emails
- No monthly fee
- First 62,000 emails free if sent from EC2

**Setup Steps:**

1. **AWS Account Setup**
   - Sign up at https://aws.amazon.com
   - Navigate to Amazon SES

2. **Create IAM User for SES**
   - Go to IAM → Users → Add User
   - User name: "afms-ses-sender"
   - Access type: **Programmatic access**
   - Attach policy: **AmazonSESFullAccess**
   - Save Access Key ID and Secret Access Key

3. **Verify Email/Domain**
   - SES Console → Verified Identities
   - Click "Create Identity"
   - Choose: Email address or Domain
   - Follow verification steps

4. **Request Production Access**
   - By default, SES is in "Sandbox Mode" (can only send to verified emails)
   - SES Console → Account Dashboard
   - Click "Request Production Access"
   - Fill out form (usually approved in 24 hours)

5. **Update .env File**

```bash
# Option B: AWS SES Configuration
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1                    # Your SES region

# Sender Information
FROM_EMAIL=reports@yourdomain.com       # Must be verified in SES
FROM_NAME=AFMS Reports
```

6. **Restart Backend**
```bash
sudo supervisorctl restart backend
```

---

## Testing Your Email Configuration

### Method 1: API Endpoint (Recommended)

After updating `.env` and restarting backend:

```bash
# Check email status
curl http://localhost:8001/api/email/status

# Send test email (requires authentication)
curl -X POST http://localhost:8001/api/email/test-env \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"test_email": "your-email@example.com"}'
```

### Method 2: Frontend UI (Coming Soon)

Once frontend is built, you'll be able to:
1. Go to Settings → Email Configuration
2. View current provider status
3. Send test email with one click
4. Configure report schedules

### Method 3: Python Script

Create `/app/test_email.py`:

```python
import asyncio
import sys
sys.path.insert(0, '/app/backend')

from email_service import is_email_configured, get_email_provider

async def test():
    print(f"Email configured: {is_email_configured()}")
    print(f"Provider: {get_email_provider()}")
    
    if is_email_configured():
        from email_service import send_email_smtp_sync
        from dotenv import load_dotenv
        import os
        
        load_dotenv('/app/backend/.env')
        
        result = send_email_smtp_sync(
            to_emails=["your-test-email@example.com"],
            subject="AFMS Test Email",
            html_content="<h1>Test Email</h1><p>Email is working!</p>"
        )
        
        print(f"Send result: {result}")

asyncio.run(test())
```

Run it:
```bash
cd /app
python test_email.py
```

---

## Troubleshooting

### Gmail Issues

**Problem:** "Username and Password not accepted"
- **Solution:** Make sure you're using an App Password, not your regular Gmail password
- **Solution:** Check that 2FA is enabled on your Google account

**Problem:** "SMTP connection failed"
- **Solution:** Check that `SMTP_PORT=587` and `SMTP_USE_TLS=true`
- **Solution:** Try port 465 with `SMTP_USE_SSL=true` and `SMTP_USE_TLS=false`

**Problem:** "Daily sending limit exceeded"
- **Solution:** Gmail limits ~500 emails/day. Upgrade to SendGrid or AWS SES for production

### SendGrid Issues

**Problem:** "API key not found"
- **Solution:** Make sure API key starts with `SG.`
- **Solution:** Check that `SENDGRID_API_KEY` is set in `.env`
- **Solution:** Restart backend: `sudo supervisorctl restart backend`

**Problem:** "Sender not verified"
- **Solution:** Go to SendGrid → Settings → Sender Authentication
- **Solution:** Complete Single Sender Verification for the FROM_EMAIL address
- **Solution:** Or set up Domain Authentication for professional sending

### AWS SES Issues

**Problem:** "Email address is not verified"
- **Solution:** In SES Sandbox mode, both sender and recipient must be verified
- **Solution:** Go to SES Console → Verified Identities → Create Identity
- **Solution:** Request Production Access to send to any email

**Problem:** "Invalid AWS credentials"
- **Solution:** Double-check Access Key ID and Secret Access Key
- **Solution:** Ensure IAM user has AmazonSESFullAccess policy
- **Solution:** Check that AWS_REGION matches your SES region

### General Issues

**Problem:** "No email provider configured"
- **Solution:** Check that at least one set of credentials is filled in `.env`
- **Solution:** Restart backend after updating `.env`
- **Solution:** Check backend logs: `tail -f /var/log/supervisor/backend.*.log`

**Problem:** Email sent but not received
- **Solution:** Check spam/junk folder
- **Solution:** Check email logs in provider dashboard (SendGrid/AWS SES)
- **Solution:** Verify sender email is authenticated

---

## Email Provider Comparison

| Feature | Gmail/SMTP | SendGrid | AWS SES |
|---------|-----------|----------|---------|
| **Setup Difficulty** | Easy | Easy | Medium |
| **Cost** | Free | $0-90/month | $0.10/1000 emails |
| **Daily Limit** | ~500 | 100-100k+ | Unlimited* |
| **Deliverability** | Good | Excellent | Excellent |
| **Analytics** | No | Yes | Basic |
| **Support** | Community | Paid plans | AWS support |
| **Best For** | Development | Small-Medium Business | Large Scale |

*AWS SES starts in sandbox mode with limits, request production access

---

## Next Steps

### For Development (Current Setup)
1. ✅ Get Gmail App Password (see steps above)
2. ✅ Update `.env` with credentials
3. ✅ Restart backend
4. ✅ Test email via API endpoint
5. ✅ Start building report scheduling features

### For Production (When Ready)
1. Choose production provider (SendGrid recommended)
2. Sign up and get credentials
3. Update `.env` with new credentials
4. Test thoroughly
5. Update `FROM_EMAIL` to professional domain
6. Configure DNS records (SPF, DKIM) if using custom domain
7. Monitor email delivery metrics

---

## Security Best Practices

### For Gmail
- ✅ Use App Passwords (never regular password)
- ✅ Enable 2FA on Google account
- ✅ Limit to development/testing only
- ✅ Don't commit `.env` to git

### For SendGrid
- ✅ Use Full Access or Mail Send permissions only
- ✅ Rotate API keys periodically
- ✅ Use different keys for dev/staging/production
- ✅ Monitor API key usage in dashboard

### For AWS SES
- ✅ Use IAM user with minimal permissions (only SES)
- ✅ Enable MFA on AWS account
- ✅ Rotate credentials regularly
- ✅ Use AWS Secrets Manager in production

### General
- ✅ Never commit credentials to git
- ✅ Use environment variables
- ✅ Encrypt `.env` file in production
- ✅ Monitor email sending metrics
- ✅ Set up bounce/complaint handling
- ✅ Implement rate limiting

---

## FAQ

**Q: Can I use multiple providers?**  
A: Yes! The system auto-detects based on environment variables. Set credentials for multiple providers and comment/uncomment in `.env` to switch.

**Q: What happens if email is not configured?**  
A: Report scheduling will still work, but email delivery will be skipped. Users will see a warning.

**Q: Can I use my own SMTP server?**  
A: Yes! Set `SMTP_HOST` to your server address and provide credentials.

**Q: How do I track email delivery?**  
A: Check provider dashboards (SendGrid/AWS SES) for delivery stats. We'll add delivery tracking to AFMS in future updates.

**Q: Can I customize email templates?**  
A: Yes! Email templates are in `/app/backend/email_service.py`. Customize the HTML as needed.

---

## Support

- **Documentation:** Check this guide and `/app/ACTION_PLAN_PHASES_13_14_15.md`
- **Backend Logs:** `tail -f /var/log/supervisor/backend.*.log`
- **Test API:** `GET /api/email/status` to check configuration
- **Test Email:** `POST /api/email/test-env` to send test

---

**Ready to Configure?**

1. Choose your provider (Gmail for now!)
2. Get credentials (App Password)
3. Update `/app/backend/.env`
4. Restart backend
5. Test with API endpoint
6. Start using report scheduling!

---

**Next:** Once email is working, proceed with Phase 14 implementation (Celery worker setup for automated report generation)
