# 🔐 Quick Login Guide - Multi-Tenant Demo Data

## ✅ Application Status: RUNNING

- **Backend:** ✅ Running on port 8001
- **Frontend:** ✅ Running on port 3000
- **MongoDB:** ✅ Running
- **Preview URL:** Your preview URL should now work!

---

## 🔑 Login Credentials - Ready to Test

### **Superadmin (System Access)**
```
Email:    superadmin@afms.system
Password: admin123
```
**Can do:** Full system access, view all tenants, create roles, manage permissions

---

### **Company 1: TechVenture SaaS Inc** 🚀
```
Email:    admin@techventure.demo
Password: Demo123!
```
**Industry:** Technology - SaaS Startup  
**Data:**
- 1,020+ transactions (subscription revenue, cloud costs)
- 256 documents
- 39 customer invoices
- 36 vendor bills
- AWS, GitHub, Slack subscriptions

---

### **Company 2: Strategic Advisory Group** 💼
```
Email:    admin@strategicadvisory.demo
Password: Demo123!
```
**Industry:** Professional Services - Management Consulting  
**Data:**
- 793 transactions (project fees, travel expenses)
- 230 documents
- 43 client invoices
- 34 vendor bills
- Consulting projects, executive coaching

---

### **Company 3: Urban Style Boutique** 🛍️
```
Email:    admin@urbanstyle.demo
Password: Demo123!
```
**Industry:** Retail - E-commerce Fashion  
**Data:**
- 1,120 transactions (online sales, inventory)
- 300 documents
- 40 sales invoices
- 35 supplier bills
- Shopify, Amazon marketplace sales

---

### **Individual 1: Alex Thompson** 👨‍💻
```
Email:    alex.thompson@demo.com
Password: Demo123!
```
**Profile:** Software Engineer - Young Professional  
**Data:**
- 193 personal transactions
- 27 documents
- Salary deposits, rent, car payment, gym, 401k

---

### **Individual 2: Jordan Martinez** 🎨
```
Email:    jordan.martinez@demo.com
Password: Demo123!
```
**Profile:** Freelance Graphic Designer  
**Data:**
- 203 personal transactions
- 30 documents
- Client payments, Adobe subscriptions, co-working space

---

## 🎯 What to Test

### Dashboard View
- Login with any credential above
- Check **Dashboard** for financial overview
- View charts and metrics

### Transactions
- Browse **Transactions** page
- Filter by date, type, category
- See income vs expenses

### Documents
- Go to **Documents** section
- View uploaded receipts (PNG images)
- View invoices (PDF files)
- ~850 documents generated across all tenants

### Accounts Receivable (Companies only)
- Check **Invoices** tab
- See customer invoices
- Filter by status (paid, outstanding, partial)

### Accounts Payable (Companies only)
- Check **Bills** tab
- View vendor bills
- Track payment status

### Multi-Currency (Companies)
- Each company has USD, EUR, GBP accounts
- View multi-currency balances

---

## 📊 Total Demo Data Generated

| Metric | Total |
|--------|-------|
| Tenants | 5 (3 companies + 2 individuals) |
| Accounts | 101 |
| Transactions | 3,346 |
| Documents | 852 |
| Physical Files | 1,695 |
| Invoices (AR) | 118 |
| Bills (AP) | 109 |
| Payments | 175 |

---

## 🧪 API Testing (Optional)

```bash
# Login
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@techventure.demo", "password": "Demo123!"}'

# Get accounts (use token from login)
curl -X GET "http://localhost:8001/api/accounts/" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 Regenerate Demo Data (If Needed)

```bash
cd /app
python3 test_multi_tenant_demo.py
```

---

## 🧹 Clean Up Demo Data

```bash
cd /app
python3 cleanup_demo_data.py
```

---

## 💡 Tips

1. **Each tenant is isolated** - Data from one company won't show in another
2. **12 months of data** - Transactions span the last year
3. **Realistic patterns** - Each industry has unique transaction patterns
4. **Documents included** - Receipts, invoices, and statements generated

---

**Status:** ✅ Ready to Test  
**Last Updated:** 2025-10-17  
**Services:** All Running
