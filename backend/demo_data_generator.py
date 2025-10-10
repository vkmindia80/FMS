"""
Demo Data Generator for AFMS
Generates realistic sample data including actual PDF files, images, and documents
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
