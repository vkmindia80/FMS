# Payment Gateway Configuration System

## Overview

A comprehensive payment gateway management system that allows users to dynamically configure multiple payment gateways with custom API settings through both backend API and frontend UI.

## Features

### ✅ Backend Features
- **Dynamic Gateway Management**: Add, edit, delete payment gateways
- **Multiple Gateway Types**: Support for Stripe, PayPal, Square, and Custom gateways
- **Flexible Configuration**: Each gateway can have custom API configuration fields
- **Toggle Control**: Enable/disable gateways without deleting configuration
- **Security**: Sensitive fields (API keys, secrets) are automatically masked in responses
- **Connection Testing**: Validate gateway credentials before activation
- **Audit Logging**: All gateway operations are logged for compliance

### ✅ Frontend Features
- **Visual Gateway Cards**: Clean card-based interface for all configured gateways
- **Add/Edit Modals**: Intuitive forms for gateway configuration
- **Toggle Switches**: One-click enable/disable for each gateway
- **Dynamic Forms**: Forms adapt based on selected gateway type
- **Custom Gateway Support**: Add unlimited custom fields for proprietary gateways
- **Password Visibility Toggle**: Show/hide sensitive fields
- **Test Connection**: Validate credentials directly from UI
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Backend
**File**: `/app/backend/payment_gateway_config.py`

**Database Collection**: `payment_gateway_configs`

**Document Schema**:
```json
{
  "gateway_id": "uuid",
  "company_id": "uuid",
  "gateway_name": "string",
  "gateway_type": "stripe|paypal|square|custom",
  "enabled": "boolean",
  "configuration": {
    // Flexible key-value pairs
    "api_key": "string",
    "webhook_secret": "string",
    // ... any custom fields
  },
  "description": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "created_by": "user_id"
}
```

### Frontend
**Files**:
- `/app/frontend/src/pages/integration/PaymentGatewayManagement.js` - Main component
- `/app/frontend/src/pages/integration/IntegrationPage.js` - Container page

## API Endpoints

### 1. Get All Gateways
```bash
GET /api/integrations/payment/gateways
Authorization: Bearer {token}
```

**Response**:
```json
{
  "gateways": [
    {
      "gateway_id": "uuid",
      "gateway_name": "Production Stripe",
      "gateway_type": "stripe",
      "enabled": true,
      "configuration": {
        "api_key": "sk_l********************************",
        "webhook_secret": "whse**********************"
      },
      "description": "Main payment processor"
    }
  ],
  "count": 1
}
```

### 2. Create Gateway
```bash
POST /api/integrations/payment/gateways
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "gateway_name": "My Stripe Account",
  "gateway_type": "stripe",
  "enabled": true,
  "description": "Production Stripe gateway",
  "configuration": {
    "api_key": "sk_live_...",
    "webhook_secret": "whsec_...",
    "publishable_key": "pk_live_..."
  }
}
```

### 3. Update Gateway
```bash
PUT /api/integrations/payment/gateways/{gateway_id}
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "gateway_name": "Updated Name",
  "description": "Updated description",
  "configuration": {
    "api_key": "new_key_here"
  }
}
```

### 4. Delete Gateway
```bash
DELETE /api/integrations/payment/gateways/{gateway_id}
Authorization: Bearer {token}
```

### 5. Toggle Gateway
```bash
POST /api/integrations/payment/gateways/{gateway_id}/toggle
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body**:
```json
{
  "enabled": true
}
```

### 6. Test Connection
```bash
POST /api/integrations/payment/gateways/{gateway_id}/test
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "message": "Stripe configuration validated"
}
```

## Gateway Types & Configuration Fields

### Stripe
```json
{
  "api_key": "sk_test_... or sk_live_...",
  "webhook_secret": "whsec_...",
  "publishable_key": "pk_test_... or pk_live_..."
}
```

### PayPal
```json
{
  "client_id": "Your PayPal Client ID",
  "client_secret": "Your PayPal Secret",
  "mode": "sandbox or live"
}
```

### Square
```json
{
  "access_token": "Your Square Access Token",
  "location_id": "Square Location ID",
  "environment": "sandbox or production"
}
```

### Custom Gateway
```json
{
  "field_name_1": "value1",
  "field_name_2": "value2",
  // Any number of custom fields
}
```

## Usage Guide

### Frontend Usage

1. **Navigate to Integration Center**
   - Go to Integration menu
   - Click on "Payment Gateway Config" tab

2. **Add New Gateway**
   - Click "Add Gateway" button
   - Fill in gateway details:
     - Gateway Name (e.g., "Production Stripe")
     - Gateway Type (Stripe, PayPal, Square, or Custom)
     - Description (optional)
     - API Configuration fields
   - Toggle "Enable this gateway immediately" if needed
   - Click "Create Gateway"

3. **Edit Existing Gateway**
   - Click edit icon on gateway card
   - Update fields as needed
   - Click "Update Gateway"

4. **Toggle Gateway On/Off**
   - Use the toggle switch on each gateway card
   - Gateway configuration is preserved when disabled

5. **Test Connection**
   - Click "Test" button on enabled gateway
   - System validates credentials
   - Shows success or error message

6. **Delete Gateway**
   - Click delete icon
   - Confirm deletion
   - Configuration is permanently removed

### Backend Usage (API)

Example using curl:

```bash
# Set your token
TOKEN="your_jwt_token_here"

# Create a Stripe gateway
curl -X POST http://localhost:8001/api/integrations/payment/gateways \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "gateway_name": "My Stripe",
    "gateway_type": "stripe",
    "enabled": true,
    "configuration": {
      "api_key": "sk_test_123",
      "webhook_secret": "whsec_123"
    }
  }'

# List all gateways
curl -X GET http://localhost:8001/api/integrations/payment/gateways \
  -H "Authorization: Bearer $TOKEN"

# Toggle gateway
curl -X POST http://localhost:8001/api/integrations/payment/gateways/{id}/toggle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

## Security Features

1. **Automatic Field Masking**: Sensitive fields containing keywords (key, secret, password, token, credential) are automatically masked in API responses
2. **Company Isolation**: Each company can only access their own gateway configurations
3. **Audit Logging**: All create, update, delete, and toggle operations are logged
4. **JWT Authentication**: All endpoints require valid authentication token
5. **Input Validation**: Pydantic models validate all input data

## Testing

Run the comprehensive test script:

```bash
bash /tmp/test_gateway_api.sh
```

This will:
1. Create a test user
2. Create Stripe, PayPal, and Custom gateways
3. List all gateways
4. Toggle gateway status
5. Test connection
6. Update gateway
7. Display final configuration

## Database Indexes

Recommended indexes for optimal performance:

```javascript
db.payment_gateway_configs.createIndex({ "company_id": 1 })
db.payment_gateway_configs.createIndex({ "gateway_id": 1 }, { unique: true })
db.payment_gateway_configs.createIndex({ "company_id": 1, "gateway_name": 1 }, { unique: true })
```

## Error Handling

The system handles:
- Duplicate gateway names within a company
- Invalid gateway types
- Missing required configuration fields
- Non-existent gateway IDs
- Unauthorized access attempts
- Database connection errors

All errors return appropriate HTTP status codes and descriptive messages.

## Future Enhancements

Potential improvements:
- [ ] Actual payment processing integration with configured gateways
- [ ] Gateway usage statistics and analytics
- [ ] Automatic credential rotation
- [ ] Multi-factor authentication for gateway changes
- [ ] Gateway health monitoring
- [ ] Webhook management interface
- [ ] Payment reconciliation with gateway data
- [ ] Support for additional gateway types (Razorpay, Braintree, etc.)

## Support

For issues or questions:
1. Check backend logs: `/var/log/supervisor/backend.err.log`
2. Check frontend console for errors
3. Verify MongoDB connection
4. Ensure all required fields are provided

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Support for Stripe, PayPal, Square, and Custom gateways
- Full CRUD operations
- Toggle functionality
- Connection testing
- Security with field masking
- Audit logging
