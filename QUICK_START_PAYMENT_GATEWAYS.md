# Quick Start Guide: Payment Gateway Configuration

## 🚀 Getting Started in 5 Minutes

### Access the Feature

1. **Login to your AFMS account**
   - URL: https://datasprucer.preview.emergentagent.com
   - Use your credentials or Demo Login

2. **Navigate to Integration Center**
   - Click on "Integration" in the sidebar
   - Select "Payment Gateway Config" tab

### Add Your First Gateway

#### Option 1: Stripe (Recommended for most businesses)

```
Gateway Name: Production Stripe
Gateway Type: Stripe
Description: Main payment processor

Configuration:
- API Key: sk_live_... (get from Stripe Dashboard)
- Webhook Secret: whsec_... (from Stripe Webhooks)
- Publishable Key: pk_live_... (from Stripe Dashboard)

☑️ Enable this gateway immediately
```

#### Option 2: PayPal

```
Gateway Name: PayPal Business
Gateway Type: PayPal
Description: PayPal payments

Configuration:
- Client ID: (from PayPal Developer Dashboard)
- Client Secret: (from PayPal Developer Dashboard)
- Mode: live (or sandbox for testing)

☑️ Enable this gateway immediately
```

#### Option 3: Custom Gateway

```
Gateway Name: My Payment System
Gateway Type: Custom
Description: Custom integration

Click "+ Add Field" for each configuration:
- api_endpoint: https://api.mypayment.com
- merchant_id: YOUR_MERCHANT_ID
- api_key: YOUR_API_KEY
- (add as many fields as needed)

☑️ Enable this gateway immediately
```

### Test Your Gateway

1. After creating the gateway, click the **"Test"** button
2. System validates your credentials
3. ✅ Success = Gateway is ready to use
4. ❌ Error = Check your credentials and try again

### Enable/Disable Gateway

- Use the **toggle switch** on each gateway card
- Disabled gateways are preserved but not active
- Enable anytime without re-entering credentials

### Edit Gateway

1. Click the **pencil icon** on gateway card
2. Update any field (except Gateway Type)
3. Click "Update Gateway"

### Delete Gateway

1. Click the **trash icon** on gateway card
2. Confirm deletion
3. ⚠️ This permanently removes the configuration

## 📋 Gateway-Specific Setup

### Stripe Setup
1. Go to https://dashboard.stripe.com
2. Get API keys from Developers → API keys
3. Test mode: Use keys starting with `sk_test_` and `pk_test_`
4. Live mode: Use keys starting with `sk_live_` and `pk_live_`
5. Setup webhooks at Developers → Webhooks

### PayPal Setup
1. Go to https://developer.paypal.com
2. Create an app in My Apps & Credentials
3. Get Client ID and Secret
4. Use "sandbox" mode for testing, "live" for production

### Square Setup
1. Go to https://developer.squareup.com
2. Create an application
3. Get Access Token from OAuth section
4. Get Location ID from Locations API

## 🔐 Security Best Practices

1. **Never share credentials**: API keys are masked after saving
2. **Use test mode first**: Always test with sandbox/test credentials
3. **Rotate keys regularly**: Update credentials periodically
4. **Monitor activity**: Check audit logs for any suspicious activity
5. **Disable unused gateways**: Keep only active gateways enabled

## 🎯 Common Use Cases

### Use Case 1: Multiple Payment Options
```
✅ Stripe (enabled) - Primary processor
✅ PayPal (enabled) - Alternative payment
❌ Square (disabled) - Backup option
```

### Use Case 2: Testing & Production
```
✅ Stripe Production (enabled) - Live payments
❌ Stripe Test (disabled) - For development
```

### Use Case 3: Regional Processing
```
✅ Stripe US (enabled) - North America
✅ Stripe EU (enabled) - Europe
✅ Custom Asia Gateway (enabled) - Asia-Pacific
```

## 🛠️ Troubleshooting

### Gateway Test Fails
- **Check credentials**: Ensure API keys are correct
- **Verify mode**: Sandbox/test vs live/production keys
- **Check expiration**: Some keys expire, regenerate if needed
- **Network issues**: Ensure your app can reach payment provider

### Gateway Not Appearing
- **Refresh page**: Hard refresh (Ctrl+F5 / Cmd+Shift+R)
- **Check backend**: Ensure backend service is running
- **Browser console**: Check for JavaScript errors

### Can't Delete Gateway
- **Active transactions**: Ensure no pending payments
- **Permissions**: Verify you have admin access
- **Try disabling first**: Disable then delete

## 📊 API Integration

If you're using the API directly:

```bash
# Get your token after login
TOKEN="your_jwt_token"

# Create gateway
curl -X POST https://datasprucer.preview.emergentagent.com/api/integrations/payment/gateways \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gateway_name": "My Stripe",
    "gateway_type": "stripe",
    "enabled": true,
    "configuration": {
      "api_key": "sk_test_123..."
    }
  }'
```

## 📞 Need Help?

1. **Documentation**: See `/app/PAYMENT_GATEWAY_CONFIGURATION_GUIDE.md`
2. **Backend Logs**: `/var/log/supervisor/backend.err.log`
3. **Test Script**: Run `/tmp/test_gateway_api.sh` for API testing

## ✅ Checklist

Before going live:
- [ ] All credentials are from production/live accounts
- [ ] Test connection shows ✅ success
- [ ] Gateway toggle is ON (enabled)
- [ ] Webhook URLs are configured (if applicable)
- [ ] Test payment processed successfully
- [ ] Backup gateway configured (optional)
- [ ] Team members have access
- [ ] Monitoring/alerts setup (optional)

---

**Ready to accept payments!** 🎉

Your configured gateways will now be available for payment processing throughout the application.
