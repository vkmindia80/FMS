"""
Demo Data Generator for AFMS
Generates realistic sample data including actual PDF files, images, and documents
Enhanced with multi-currency support and comprehensive business scenarios
"""
import os
import uuid
import random
from datetime import datetime, timedelta
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.units import inch
from faker import Faker
import logging

logger = logging.getLogger(__name__)
fake = Faker()

# Upload directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/app/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Multi-currency support
CURRENCIES = {
    'USD': {'symbol': '$', 'name': 'US Dollar'},
    'EUR': {'symbol': '€', 'name': 'Euro'},
    'GBP': {'symbol': '£', 'name': 'British Pound'},
    'JPY': {'symbol': '¥', 'name': 'Japanese Yen'},
    'CAD': {'symbol': 'C$', 'name': 'Canadian Dollar'},
    'AUD': {'symbol': 'A$', 'name': 'Australian Dollar'},
    'CHF': {'symbol': 'Fr', 'name': 'Swiss Franc'}
}

# Business scenarios for realistic demo data
BUSINESS_SCENARIOS = {
    'software_subscriptions': [
        ('Microsoft 365', 'software', 299.99),
        ('Adobe Creative Cloud', 'software', 599.88),
        ('Salesforce CRM', 'software', 1500.00),
        ('AWS Cloud Services', 'utilities', 2500.00),
        ('GitHub Enterprise', 'software', 420.00),
    ],
    'office_expenses': [
        ('Staples Office Supplies', 'office_supplies', 345.67),
        ('WeWork Office Space', 'rent', 3500.00),
        ('Comcast Business Internet', 'utilities', 199.99),
        ('Office Depot Furniture', 'equipment', 1250.00),
    ],
    'marketing': [
        ('Google Ads Campaign', 'marketing', 5000.00),
        ('LinkedIn Advertising', 'marketing', 2500.00),
        ('Mailchimp Email Marketing', 'marketing', 299.00),
        ('Canva Pro Design', 'software', 119.99),
    ],
    'professional_services': [
        ('Legal Consulting - Smith & Associates', 'legal_fees', 5000.00),
        ('Accounting Services - CPA Firm', 'professional_fees', 2500.00),
        ('Business Insurance Premium', 'insurance', 1800.00),
        ('IT Consulting Services', 'consulting', 3500.00),
    ],
    'travel_expenses': [
        ('American Airlines Flight', 'travel', 450.00),
        ('Hilton Hotel Stay', 'lodging', 350.00),
        ('Uber Business Travel', 'transportation', 85.00),
        ('Conference Registration Fee', 'training', 899.00),
    ],
    'revenue_sources': [
        ('Client Payment - Acme Corp', 'sales_revenue', 15000.00),
        ('Consulting Services - TechStart Inc', 'service_income', 8500.00),
        ('Software License - GlobalTech', 'licensing_revenue', 12000.00),
        ('Project Milestone Payment', 'project_revenue', 25000.00),
    ]
}


def generate_sample_receipt_image(filename: str, amount: float, vendor: str, date: datetime) -> str:
    """Generate a sample receipt image"""
    
    # Create image
    width, height = 800, 1000
    img = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a font, fallback to default
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 40)
        body_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        small_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
        small_font = ImageFont.load_default()
    
    # Draw receipt content
    y_position = 50
    
    # Vendor name (title)
    draw.text((width // 2, y_position), vendor, fill='black', font=title_font, anchor="mt")
    y_position += 80
    
    # Address
    draw.text((width // 2, y_position), fake.address().replace('\n', ', '), fill='black', font=small_font, anchor="mt")
    y_position += 40
    
    # Phone
    draw.text((width // 2, y_position), fake.phone_number(), fill='black', font=small_font, anchor="mt")
    y_position += 60
    
    # Horizontal line
    draw.line([(50, y_position), (width - 50, y_position)], fill='black', width=2)
    y_position += 40
    
    # Date and time
    draw.text((50, y_position), f"Date: {date.strftime('%m/%d/%Y %I:%M %p')}", fill='black', font=body_font)
    y_position += 40
    
    # Transaction ID
    draw.text((50, y_position), f"Transaction #: {random.randint(10000, 99999)}", fill='black', font=body_font)
    y_position += 60
    
    # Horizontal line
    draw.line([(50, y_position), (width - 50, y_position)], fill='black', width=2)
    y_position += 40
    
    # Items
    items = [
        ("Office Supplies", random.uniform(20, 200)),
        ("Equipment", random.uniform(50, 500)),
        ("Services", random.uniform(30, 300)),
    ]
    
    random.shuffle(items)
    items = items[:random.randint(1, 3)]
    
    subtotal = 0
    for item_name, item_price in items:
        draw.text((50, y_position), item_name, fill='black', font=body_font)
        draw.text((width - 50, y_position), f"${item_price:.2f}", fill='black', font=body_font, anchor="rt")
        y_position += 35
        subtotal += item_price
    
    y_position += 20
    
    # Horizontal line
    draw.line([(50, y_position), (width - 50, y_position)], fill='black', width=2)
    y_position += 40
    
    # Subtotal
    draw.text((50, y_position), "Subtotal:", fill='black', font=body_font)
    draw.text((width - 50, y_position), f"${subtotal:.2f}", fill='black', font=body_font, anchor="rt")
    y_position += 40
    
    # Tax
    tax = subtotal * 0.08
    draw.text((50, y_position), "Tax (8%):", fill='black', font=body_font)
    draw.text((width - 50, y_position), f"${tax:.2f}", fill='black', font=body_font, anchor="rt")
    y_position += 40
    
    # Horizontal line
    draw.line([(50, y_position), (width - 50, y_position)], fill='black', width=3)
    y_position += 40
    
    # Total (bold)
    total = subtotal + tax
    draw.text((50, y_position), "TOTAL:", fill='black', font=title_font)
    draw.text((width - 50, y_position), f"${total:.2f}", fill='black', font=title_font, anchor="rt")
    y_position += 80
    
    # Payment method
    draw.text((width // 2, y_position), "Payment: VISA ****1234", fill='black', font=body_font, anchor="mt")
    y_position += 60
    
    # Thank you message
    draw.text((width // 2, y_position), "Thank you for your business!", fill='black', font=body_font, anchor="mt")
    
    # Save image
    file_path = os.path.join(UPLOAD_DIR, filename)
    img.save(file_path, 'PNG')
    
    return file_path


def generate_sample_invoice_pdf(filename: str, amount: float, vendor: str, date: datetime) -> str:
    """Generate a sample invoice PDF"""
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Create PDF
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph(f"<b><font size=24>INVOICE</font></b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 0.3 * inch))
    
    # Vendor info
    vendor_info = f"""
    <b>{vendor}</b><br/>
    {fake.address().replace(chr(10), '<br/>')}<br/>
    Phone: {fake.phone_number()}<br/>
    Email: {fake.email()}
    """
    story.append(Paragraph(vendor_info, styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))
    
    # Invoice details
    invoice_no = f"INV-{random.randint(1000, 9999)}"
    invoice_date = date.strftime('%m/%d/%Y')
    due_date = (date + timedelta(days=30)).strftime('%m/%d/%Y')
    
    details_data = [
        ['Invoice Number:', invoice_no, 'Date:', invoice_date],
        ['Customer:', fake.company(), 'Due Date:', due_date],
    ]
    
    details_table = Table(details_data, colWidths=[1.5*inch, 2*inch, 1*inch, 1.5*inch])
    details_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ]))
    
    story.append(details_table)
    story.append(Spacer(1, 0.5 * inch))
    
    # Items table
    items_data = [
        ['Description', 'Quantity', 'Unit Price', 'Amount'],
    ]
    
    num_items = random.randint(2, 5)
    subtotal = 0
    
    for _ in range(num_items):
        desc = fake.catch_phrase()
        qty = random.randint(1, 10)
        unit_price = random.uniform(50, 500)
        item_amount = qty * unit_price
        subtotal += item_amount
        
        items_data.append([
            desc,
            str(qty),
            f"${unit_price:.2f}",
            f"${item_amount:.2f}"
        ])
    
    # Add totals
    tax = subtotal * 0.08
    total = subtotal + tax
    
    items_data.append(['', '', 'Subtotal:', f"${subtotal:.2f}"])
    items_data.append(['', '', 'Tax (8%):', f"${tax:.2f}"])
    items_data.append(['', '', 'TOTAL:', f"${total:.2f}"])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1.5*inch, 1.5*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -3), colors.beige),
        ('GRID', (0, 0), (-1, -3), 1, colors.black),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, -1), (-1, -1), 12),
    ]))
    
    story.append(items_table)
    story.append(Spacer(1, 0.5 * inch))
    
    # Payment terms
    terms = Paragraph("<b>Payment Terms:</b> Net 30 days", styles['Normal'])
    story.append(terms)
    story.append(Spacer(1, 0.2 * inch))
    
    notes = Paragraph("<b>Notes:</b> Thank you for your business!", styles['Normal'])
    story.append(notes)
    
    # Build PDF
    doc.build(story)
    
    return file_path


def generate_sample_bank_statement_pdf(filename: str, company_name: str, date: datetime) -> str:
    """Generate a sample bank statement PDF"""
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    # Create PDF
    doc = SimpleDocTemplate(file_path, pagesize=letter)
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    title = Paragraph(f"<b><font size=20>BANK STATEMENT</font></b>", styles['Title'])
    story.append(title)
    story.append(Spacer(1, 0.2 * inch))
    
    # Bank info
    bank_info = f"""
    <b>First National Bank</b><br/>
    Statement Period: {date.strftime('%m/01/%Y')} - {date.strftime('%m/30/%Y')}<br/>
    Account Number: ****5678<br/>
    Account Holder: {company_name}
    """
    story.append(Paragraph(bank_info, styles['Normal']))
    story.append(Spacer(1, 0.3 * inch))
    
    # Account summary
    beginning_balance = random.uniform(50000, 150000)
    deposits = random.uniform(20000, 80000)
    withdrawals = random.uniform(15000, 60000)
    ending_balance = beginning_balance + deposits - withdrawals
    
    summary_data = [
        ['Beginning Balance:', f"${beginning_balance:,.2f}"],
        ['Deposits and Credits:', f"${deposits:,.2f}"],
        ['Withdrawals and Debits:', f"${withdrawals:,.2f}"],
        ['Ending Balance:', f"${ending_balance:,.2f}"],
    ]
    
    summary_table = Table(summary_data, colWidths=[3*inch, 2*inch])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('LINEBELOW', (0, -1), (-1, -1), 2, colors.black),
    ]))
    
    story.append(summary_table)
    story.append(Spacer(1, 0.4 * inch))
    
    # Transactions
    trans_title = Paragraph("<b>Transaction Details</b>", styles['Heading2'])
    story.append(trans_title)
    story.append(Spacer(1, 0.2 * inch))
    
    trans_data = [
        ['Date', 'Description', 'Withdrawals', 'Deposits', 'Balance'],
    ]
    
    current_balance = beginning_balance
    
    for i in range(random.randint(8, 15)):
        trans_date = date + timedelta(days=random.randint(1, 28))
        
        if random.random() > 0.4:  # 60% withdrawals
            withdrawal = random.uniform(100, 5000)
            current_balance -= withdrawal
            trans_data.append([
                trans_date.strftime('%m/%d/%Y'),
                fake.company(),
                f"${withdrawal:,.2f}",
                '',
                f"${current_balance:,.2f}"
            ])
        else:  # 40% deposits
            deposit = random.uniform(500, 8000)
            current_balance += deposit
            trans_data.append([
                trans_date.strftime('%m/%d/%Y'),
                fake.company() + " - Payment",
                '',
                f"${deposit:,.2f}",
                f"${current_balance:,.2f}"
            ])
    
    trans_table = Table(trans_data, colWidths=[1*inch, 2.5*inch, 1.2*inch, 1.2*inch, 1.2*inch])
    trans_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ]))
    
    story.append(trans_table)
    
    # Build PDF
    doc.build(story)
    
    return file_path


def generate_csv_expense_report(filename: str) -> str:
    """Generate a sample CSV expense report"""
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    with open(file_path, 'w') as f:
        # Header
        f.write("Date,Category,Description,Amount,Payment Method,Status\n")
        
        # Generate 20-30 expense entries
        for _ in range(random.randint(20, 30)):
            date = fake.date_between(start_date='-2y', end_date='today')
            categories = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Marketing', 'Professional Services']
            category = random.choice(categories)
            description = fake.catch_phrase()
            amount = random.uniform(10, 1000)
            payment_methods = ['Credit Card', 'Cash', 'Bank Transfer', 'Check']
            payment_method = random.choice(payment_methods)
            statuses = ['Approved', 'Pending', 'Reimbursed']
            status = random.choice(statuses)
            
            f.write(f"{date},{category},{description},{amount:.2f},{payment_method},{status}\n")
    
    return file_path



async def generate_enhanced_demo_data(db, company_id: str, user_id: str):
    """
    Generate comprehensive demo data with multi-currency support
    Creates 300+ transactions, 100+ documents, and realistic business scenarios
    """
    from database import accounts_collection, transactions_collection, documents_collection
    
    logger.info(f"Starting enhanced demo data generation for company {company_id}")
    
    # Currency exchange rates (approximate)
    exchange_rates = {
        'USD': 1.0,
        'EUR': 0.85,
        'GBP': 0.73,
        'JPY': 110.0,
        'CAD': 1.25,
        'AUD': 1.35,
        'CHF': 0.92
    }
    
    # Step 1: Create multi-currency accounts
    logger.info("Creating multi-currency accounts...")
    created_accounts = []
    
    account_definitions = [
        # USD Accounts (Primary)
        {'name': 'Business Checking (USD)', 'type': 'checking', 'currency': 'USD', 'balance': 125000.00},
        {'name': 'Savings Account (USD)', 'type': 'savings', 'currency': 'USD', 'balance': 75000.00},
        {'name': 'Petty Cash (USD)', 'type': 'cash', 'currency': 'USD', 'balance': 2500.00},
        {'name': 'Business Credit Card', 'type': 'credit_card', 'currency': 'USD', 'balance': -8500.00},
        
        # EUR Accounts (European operations)
        {'name': 'EUR Business Account', 'type': 'checking', 'currency': 'EUR', 'balance': 45000.00},
        {'name': 'EUR Operating Account', 'type': 'current_asset', 'currency': 'EUR', 'balance': 25000.00},
        
        # GBP Accounts (UK operations)
        {'name': 'GBP Trading Account', 'type': 'checking', 'currency': 'GBP', 'balance': 35000.00},
        
        # Revenue Accounts
        {'name': 'Sales Revenue', 'type': 'revenue', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Service Income', 'type': 'service_income', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Consulting Revenue', 'type': 'other_income', 'currency': 'USD', 'balance': 0.00},
        
        # Expense Accounts
        {'name': 'Software & Subscriptions', 'type': 'software', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Office Rent', 'type': 'rent', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Marketing Expenses', 'type': 'marketing', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Professional Fees', 'type': 'professional_fees', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Travel & Entertainment', 'type': 'travel', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Office Supplies', 'type': 'office_supplies', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Utilities', 'type': 'utilities', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Insurance', 'type': 'insurance', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Legal Fees', 'type': 'legal_fees', 'currency': 'USD', 'balance': 0.00},
        {'name': 'Payroll Expenses', 'type': 'payroll', 'currency': 'USD', 'balance': 0.00},
        
        # Asset Accounts
        {'name': 'Accounts Receivable', 'type': 'accounts_receivable', 'currency': 'USD', 'balance': 45000.00},
        {'name': 'Equipment', 'type': 'equipment', 'currency': 'USD', 'balance': 25000.00},
        {'name': 'Inventory', 'type': 'inventory', 'currency': 'USD', 'balance': 15000.00},
        
        # Liability Accounts
        {'name': 'Accounts Payable', 'type': 'accounts_payable', 'currency': 'USD', 'balance': -12000.00},
        {'name': 'Business Loan', 'type': 'long_term_liability', 'currency': 'USD', 'balance': -50000.00},
    ]
    
    for acc_def in account_definitions:
        account = {
            'id': str(uuid.uuid4()),
            'company_id': company_id,
            'name': acc_def['name'],
            'account_type': acc_def['type'],
            'currency_code': acc_def['currency'],
            'current_balance': acc_def['balance'],
            'description': f"{acc_def['name']} - Demo Account",
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        await accounts_collection.insert_one(account)
        created_accounts.append(account)
        logger.info(f"Created account: {acc_def['name']} ({acc_def['currency']})")
    
    # Get account IDs by type for transactions
    checking_accounts = [a for a in created_accounts if a['account_type'] in ['checking', 'savings']]
    expense_accounts = [a for a in created_accounts if a['account_type'] in [
        'software', 'rent', 'marketing', 'professional_fees', 'travel', 
        'office_supplies', 'utilities', 'insurance', 'legal_fees', 'payroll'
    ]]
    revenue_accounts = [a for a in created_accounts if a['account_type'] in [
        'revenue', 'service_income', 'other_income'
    ]]
    
    # Step 2: Generate transactions over 3 years
    logger.info("Generating 300+ transactions over 3 years...")
    created_transactions = []
    created_documents = []
    
    start_date = datetime.now() - timedelta(days=365*3)  # 3 years ago
    end_date = datetime.now()
    
    transaction_count = 0
    document_count = 0
    
    # Generate revenue transactions (monthly recurring + one-time)
    current_date = start_date
    while current_date < end_date:
        # Monthly recurring revenue (consistent)
        for scenario_item in BUSINESS_SCENARIOS['revenue_sources'][:2]:
            vendor, category, base_amount = scenario_item
            amount = base_amount * random.uniform(0.9, 1.1)  # ±10% variation
            
            if random.random() > 0.1:  # 90% success rate
                checking_acc = random.choice(checking_accounts)
                revenue_acc = random.choice(revenue_accounts)
                
                transaction = {
                    'id': str(uuid.uuid4()),
                    'company_id': company_id,
                    'transaction_date': current_date,
                    'description': f"{vendor} - Monthly Payment",
                    'transaction_type': 'income',
                    'amount': amount,
                    'currency_code': checking_acc['currency_code'],
                    'category': category,
                    'status': 'cleared',
                    'is_reconciled': random.choice([True, False]),
                    'created_by': user_id,
                    'created_at': current_date,
                    'journal_entries': [
                        {'account_id': checking_acc['id'], 'debit': amount, 'credit': 0},
                        {'account_id': revenue_acc['id'], 'debit': 0, 'credit': amount}
                    ]
                }
                
                await transactions_collection.insert_one(transaction)
                created_transactions.append(transaction)
                transaction_count += 1
        
        current_date += timedelta(days=30)  # Next month
    
    # Generate expense transactions (more frequent)
    current_date = start_date
    while current_date < end_date:
        # Weekly expenses
        for week in range(4):
            num_expenses = random.randint(3, 8)  # 3-8 expenses per week
            
            for _ in range(num_expenses):
                # Select random business scenario
                scenario_type = random.choice(list(BUSINESS_SCENARIOS.keys()))
                if scenario_type == 'revenue_sources':
                    continue  # Skip revenue in expense generation
                
                scenario_items = BUSINESS_SCENARIOS[scenario_type]
                vendor, category, base_amount = random.choice(scenario_items)
                
                amount = base_amount * random.uniform(0.7, 1.3)  # ±30% variation
                
                # Select accounts
                checking_acc = random.choice(checking_accounts)
                expense_acc = next((a for a in expense_accounts if category in a['account_type']), 
                                 random.choice(expense_accounts))
                
                trans_date = current_date + timedelta(days=week*7 + random.randint(0, 6))
                if trans_date > end_date:
                    break
                
                transaction = {
                    'id': str(uuid.uuid4()),
                    'company_id': company_id,
                    'transaction_date': trans_date,
                    'description': vendor,
                    'transaction_type': 'expense',
                    'amount': amount,
                    'currency_code': checking_acc['currency_code'],
                    'category': category,
                    'status': random.choice(['cleared', 'pending', 'cleared']),  # Mostly cleared
                    'is_reconciled': random.choice([True, False, False]),  # Some reconciled
                    'created_by': user_id,
                    'created_at': trans_date,
                    'journal_entries': [
                        {'account_id': expense_acc['id'], 'debit': amount, 'credit': 0},
                        {'account_id': checking_acc['id'], 'debit': 0, 'credit': amount}
                    ]
                }
                
                await transactions_collection.insert_one(transaction)
                created_transactions.append(transaction)
                transaction_count += 1
                
                # Generate document for some transactions (40% chance)
                if random.random() < 0.4 and document_count < 100:
                    doc_type = random.choice(['receipt', 'invoice', 'statement'])
                    
                    try:
                        if doc_type == 'receipt':
                            filename = f"receipt_{trans_date.strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.png"
                            file_path = generate_sample_receipt_image(
                                filename, amount, vendor, trans_date
                            )
                        elif doc_type == 'invoice':
                            filename = f"invoice_{trans_date.strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.pdf"
                            file_path = generate_sample_invoice_pdf(
                                filename, amount, vendor, trans_date
                            )
                        else:  # statement
                            filename = f"statement_{trans_date.strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.csv"
                            file_path = generate_csv_expense_report(filename)
                        
                        document = {
                            'id': str(uuid.uuid4()),
                            'company_id': company_id,
                            'filename': filename,
                            'file_path': file_path,
                            'file_type': doc_type,
                            'file_size': os.path.getsize(file_path),
                            'upload_date': trans_date,
                            'processing_status': 'completed',
                            'confidence_score': random.uniform(0.85, 0.99),
                            'extracted_data': {
                                'amount': amount,
                                'vendor': vendor,
                                'date': trans_date.isoformat(),
                                'category': category
                            },
                            'uploaded_by': user_id,
                            'created_at': trans_date
                        }
                        
                        await documents_collection.insert_one(document)
                        created_documents.append(document)
                        document_count += 1
                        
                    except Exception as e:
                        logger.warning(f"Failed to generate document: {e}")
        
        current_date += timedelta(days=30)  # Next month
    
    # Generate additional bank statements for different periods
    logger.info("Generating monthly bank statements...")
    statement_date = start_date
    while statement_date < end_date and document_count < 100:
        try:
            filename = f"bank_statement_{statement_date.strftime('%Y_%m')}.pdf"
            file_path = generate_sample_bank_statement_pdf(
                filename, "Demo Company Inc", statement_date
            )
            
            document = {
                'id': str(uuid.uuid4()),
                'company_id': company_id,
                'filename': filename,
                'file_path': file_path,
                'file_type': 'bank_statement',
                'file_size': os.path.getsize(file_path),
                'upload_date': statement_date,
                'processing_status': 'completed',
                'confidence_score': 0.95,
                'extracted_data': {
                    'statement_period': statement_date.strftime('%Y-%m'),
                    'account_type': 'checking'
                },
                'uploaded_by': user_id,
                'created_at': statement_date
            }
            
            await documents_collection.insert_one(document)
            created_documents.append(document)
            document_count += 1
            
        except Exception as e:
            logger.warning(f"Failed to generate bank statement: {e}")
        
        statement_date += timedelta(days=30)  # Monthly statements
    
    logger.info(f"Enhanced demo data generation complete!")
    logger.info(f"Created {len(created_accounts)} accounts")
    logger.info(f"Created {transaction_count} transactions")
    logger.info(f"Created {document_count} documents")
    
    return {
        'accounts_created': len(created_accounts),
        'transactions_created': transaction_count,
        'documents_created': document_count,
        'currencies_used': list(set(a['currency_code'] for a in created_accounts)),
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat()
        }
    }
