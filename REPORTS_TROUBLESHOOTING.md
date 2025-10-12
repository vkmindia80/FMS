# Reports Troubleshooting Guide

## Issue: "Unable to generate report: Error - Failed to generate report"

### Verified Working
✅ All backend APIs are working correctly
✅ Demo account exists and can login
✅ All 5 reports generate successfully via API

### Root Causes & Solutions

#### 1. No Report Selected
**Symptom:** Error message when clicking "View Report" or export buttons

**Cause:** You haven't selected a report type first

**Solution:**
1. Click on one of the 5 report cards (Profit & Loss, Balance Sheet, etc.)
2. The selected card will have a blue ring around it
3. Then click the generate/export buttons

---

#### 2. No Demo Data Available
**Symptom:** Empty reports or "no data" messages

**Cause:** User account has no transactions/accounts

**Solution:**
Generate demo data first:

**Option A: Via UI (if available)**
- Look for "Generate Demo Data" button in settings or demo section

**Option B: Via API**
```bash
curl -X POST "https://email-toggle-fix.preview.emergentagent.com/api/auth/generate-demo-data" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Option C: Use Demo Account**
1. Logout if logged in
2. Go to login page
3. Click "Demo Login" button
4. This account already has demo data

---

#### 3. Custom Date Range Missing
**Symptom:** Error when "Custom Range" is selected

**Cause:** Start date or end date not filled in

**Solution:**
1. When selecting "Custom Range" period
2. Fill in BOTH start date and end date
3. Then click generate

---

#### 4. Authentication Token Expired
**Symptom:** Report generation fails after being logged in for a while

**Cause:** JWT token expired (30 minutes default)

**Solution:**
1. Logout
2. Login again
3. Try generating report

---

#### 5. Browser Cache Issues
**Symptom:** Still seeing old "coming soon" message or errors

**Cause:** Browser cached old JavaScript

**Solution:**
Hard refresh the browser:
- **Windows/Linux:** `Ctrl + Shift + R`
- **Mac:** `Cmd + Shift + R`
- **Alternative:** Clear browser cache completely

---

## Step-by-Step Testing Guide

### Test 1: Verify Page Loaded Correctly

1. **Navigate to Reports page**
   - URL: `https://email-toggle-fix.preview.emergentagent.com/reports`

2. **You should see:**
   - Title: "Financial Reports"
   - Subtitle: "Generate and export comprehensive financial statements"
   - 5 colorful report cards in a row
   - NO "coming soon" message

3. **If you see "coming soon":**
   - Hard refresh (Ctrl+Shift+R)
   - Clear browser cache
   - Check browser console for errors (F12)

---

### Test 2: Generate a Simple Report

1. **Click on "Profit & Loss" card**
   - Card should get a blue ring around it
   - Report generator section appears below

2. **Select period: "Current Month"**
   - Use dropdown if not already selected

3. **Click "View Report" button**
   - Button shows "Generating..." briefly
   - JSON data should appear below after 1-2 seconds

4. **If error occurs:**
   - Open browser console (F12)
   - Look for error messages
   - Check what the actual error says

---

### Test 3: Export Reports

1. **With a report selected (e.g., Profit & Loss)**

2. **Click "Export PDF"**
   - Should download a PDF file
   - Filename: `profit-loss_YYYY-MM-DD.pdf`

3. **Click "Export Excel"**
   - Should download an Excel file
   - Filename: `profit-loss_YYYY-MM-DD.xlsx`

4. **Click "Export CSV"**
   - Should download a CSV file
   - Filename: `profit-loss_YYYY-MM-DD.csv`

---

## Common Error Messages & Solutions

### "Please select a report type first"
**Solution:** Click on one of the 5 report cards before generating

### "Please select both start and end dates for custom range"
**Solution:** When using "Custom Range", fill in both date fields

### "Failed to generate report: 401"
**Solution:** Authentication failed - logout and login again

### "Failed to generate report: 404"
**Solution:** API endpoint not found - check backend is running

### "Failed to generate report: 500"
**Solution:** Server error - check backend logs:
```bash
tail -100 /var/log/supervisor/backend.err.log
```

### Network error / Connection refused
**Solution:** Backend is not running or URL is incorrect

---

## Debug Checklist

Use this checklist to diagnose issues:

### Frontend Checks
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Cleared browser cache
- [ ] Checked browser console for errors (F12)
- [ ] Verified on Reports page (not "coming soon")
- [ ] Logged in with valid account
- [ ] Selected a report card (has blue ring)
- [ ] Network tab shows requests to `/api/reports/...`

### Backend Checks
- [ ] Backend service is running: `sudo supervisorctl status backend`
- [ ] No errors in logs: `tail -100 /var/log/supervisor/backend.err.log`
- [ ] Demo account exists and can login
- [ ] Demo data has been generated
- [ ] Direct API test works (see test_report_api.py)

### Data Checks
- [ ] Account has transactions (at least a few)
- [ ] Account has accounts in chart of accounts (at least 20)
- [ ] Selected period has data (try "Current Year" if empty)

---

## Manual API Testing

If the frontend isn't working, test the API directly:

### 1. Get Authentication Token
```bash
curl -X POST "https://email-toggle-fix.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@testcompany.com",
    "password": "testpassword123"
  }'
```

Copy the `access_token` from response.

### 2. Test Report Generation
```bash
curl -X GET "https://email-toggle-fix.preview.emergentagent.com/api/reports/profit-loss?period=current_month&format=json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Replace `YOUR_TOKEN_HERE` with the token from step 1.

### 3. Test Export
```bash
curl -X GET "https://email-toggle-fix.preview.emergentagent.com/api/reports/profit-loss?period=current_month&format=pdf" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  --output test_report.pdf
```

This should download a PDF file.

---

## Expected Behavior

### When Working Correctly:

1. **Report Selection:**
   - Click card → Blue ring appears
   - Report generator section appears below

2. **JSON View:**
   - Click "View Report" → Loading indicator
   - JSON data appears in ~1-2 seconds
   - Export buttons appear in preview

3. **PDF Export:**
   - Click "Export PDF" → Loading indicator
   - Browser downloads PDF file
   - File size: ~2-4 KB
   - Opens in PDF viewer

4. **Excel Export:**
   - Click "Export Excel" → Loading indicator
   - Browser downloads .xlsx file
   - File size: ~4-7 KB
   - Opens in Excel/Spreadsheet app

5. **CSV Export:**
   - Click "Export CSV" → Loading indicator
   - Browser downloads .csv file
   - File size: ~100-600 bytes
   - Opens in any text/spreadsheet app

---

## Get More Help

If issues persist:

1. **Check browser console:**
   - Press F12
   - Go to Console tab
   - Copy any error messages

2. **Check network requests:**
   - Press F12
   - Go to Network tab
   - Filter by "reports"
   - Check request/response details

3. **Run backend test:**
   ```bash
   cd /app
   python test_report_api.py
   ```

4. **Check service status:**
   ```bash
   sudo supervisorctl status
   ```

5. **Provide details:**
   - What error message you see
   - Browser console errors
   - Network request details
   - Account type (demo or custom)

---

**Last Updated:** January 2025
**Status:** All APIs Verified Working ✅
