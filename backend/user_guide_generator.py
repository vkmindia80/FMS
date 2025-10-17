"""
User Guide PDF Generator
Generates a comprehensive PDF user manual for the Advanced Finance Management System
"""

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, 
    Table, TableStyle, Image, ListFlowable, ListItem
)
from reportlab.pdfgen import canvas
from datetime import datetime
import io
import os

class NumberedCanvas(canvas.Canvas):
    """Custom canvas to add page numbers and headers"""
    
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        self.setFont("Helvetica", 9)
        self.setFillColorRGB(0.5, 0.5, 0.5)
        page_num = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(7.5*inch, 0.5*inch, page_num)
        self.drawString(1*inch, 0.5*inch, "AFMS User Guide")


def generate_user_guide_pdf():
    """Generate a comprehensive PDF user guide"""
    
    buffer = io.BytesIO()
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72,
    )
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#2563eb'),
        spaceAfter=10,
        spaceBefore=10,
        fontName='Helvetica-Bold'
    )
    
    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#3b82f6'),
        spaceAfter=8,
        spaceBefore=8,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['BodyText'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        spaceAfter=12,
        leading=14
    )
    
    note_style = ParagraphStyle(
        'NoteStyle',
        parent=styles['BodyText'],
        fontSize=10,
        textColor=colors.HexColor('#92400e'),
        leftIndent=20,
        rightIndent=20,
        spaceAfter=12,
        spaceBefore=6,
        borderColor=colors.HexColor('#fbbf24'),
        borderWidth=1,
        borderPadding=10,
        backColor=colors.HexColor('#fef3c7')
    )
    
    # Title Page
    elements.append(Spacer(1, 2*inch))
    elements.append(Paragraph("Advanced Finance Management System", title_style))
    elements.append(Spacer(1, 0.3*inch))
    elements.append(Paragraph("Complete User Guide", styles['Heading2']))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph(f"Version 1.0.0", styles['Normal']))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
    elements.append(Spacer(1, 0.5*inch))
    elements.append(Paragraph("© 2025 Advanced Finance Management System", styles['Normal']))
    elements.append(PageBreak())
    
    # Table of Contents
    elements.append(Paragraph("Table of Contents", heading1_style))
    elements.append(Spacer(1, 0.2*inch))
    
    toc_data = [
        ["1.", "Introduction", "3"],
        ["2.", "Getting Started", "4"],
        ["3.", "Dashboard Overview", "6"],
        ["4.", "Transactions Management", "8"],
        ["5.", "Chart of Accounts", "11"],
        ["6.", "Documents & Processing", "13"],
        ["7.", "Financial Reports", "15"],
        ["8.", "User Management", "18"],
        ["9.", "Settings & Configuration", "20"],
        ["10.", "Security Features", "22"],
        ["11.", "Multi-Currency Support", "24"],
        ["12.", "Troubleshooting", "26"],
    ]
    
    toc_table = Table(toc_data, colWidths=[0.5*inch, 5*inch, 1*inch])
    toc_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
        ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(toc_table)
    elements.append(PageBreak())
    
    # Chapter 1: Introduction
    elements.append(Paragraph("1. Introduction", heading1_style))
    elements.append(Paragraph(
        "Welcome to the Advanced Finance Management System (AFMS). This comprehensive platform "
        "provides enterprise-grade financial management capabilities designed for businesses of all sizes. "
        "From transaction recording to multi-currency support, AFMS streamlines your financial operations "
        "and provides real-time insights into your business performance.",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    
    elements.append(Paragraph("1.1 Key Features", heading2_style))
    features = [
        "Real-time financial dashboard with key metrics",
        "Comprehensive transaction management",
        "Multi-currency support with automatic conversion",
        "Advanced reporting (P&L, Balance Sheet, Cash Flow, Trial Balance)",
        "Role-based access control (RBAC)",
        "Document processing with AI-powered extraction",
        "Bank reconciliation",
        "Payment processing integration",
        "Scheduled reports and automated workflows",
        "Audit logging and security features"
    ]
    
    for feature in features:
        elements.append(Paragraph(f"• {feature}", body_style))
    
    elements.append(PageBreak())
    
    # Chapter 2: Getting Started
    elements.append(Paragraph("2. Getting Started", heading1_style))
    
    elements.append(Paragraph("2.1 System Requirements", heading2_style))
    elements.append(Paragraph(
        "AFMS is a web-based application accessible through any modern web browser. "
        "Recommended browsers include Chrome, Firefox, Safari, or Edge (latest versions).",
        body_style
    ))
    
    elements.append(Paragraph("2.2 Login Credentials", heading2_style))
    elements.append(Paragraph(
        "Your administrator will provide you with login credentials. Default system accounts include:",
        body_style
    ))
    
    login_data = [
        ['Account Type', 'Email', 'Default Password', 'Access Level'],
        ['Superadmin', 'superadmin@afms.system', 'admin123', 'Full system access'],
        ['Admin', 'admin@testcompany.com', 'admin123', 'Company admin access'],
    ]
    
    login_table = Table(login_data, colWidths=[1.5*inch, 2.2*inch, 1.5*inch, 1.8*inch])
    login_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    elements.append(login_table)
    elements.append(Spacer(1, 0.1*inch))
    
    elements.append(Paragraph(
        "⚠️ IMPORTANT: Change the default password immediately after first login for security.",
        note_style
    ))
    
    elements.append(Paragraph("2.3 First Login Steps", heading2_style))
    login_steps = [
        "Navigate to the AFMS login page",
        "Enter your email address and password",
        "Click 'Sign In' button",
        "You will be redirected to the dashboard",
        "Navigate to Settings to change your password",
    ]
    
    for i, step in enumerate(login_steps, 1):
        elements.append(Paragraph(f"{i}. {step}", body_style))
    
    elements.append(PageBreak())
    
    # Chapter 3: Dashboard Overview
    elements.append(Paragraph("3. Dashboard Overview", heading1_style))
    elements.append(Paragraph(
        "The dashboard is your command center, providing a comprehensive view of your financial health "
        "at a glance. It displays key metrics, recent activities, and quick access to important features.",
        body_style
    ))
    
    elements.append(Paragraph("3.1 Key Metrics", heading2_style))
    metrics_data = [
        ['Metric', 'Description'],
        ['Cash Balance', 'Current liquid assets (cash, checking, savings accounts)'],
        ['Monthly Revenue', 'Total income for the current month'],
        ['Monthly Expenses', 'Total expenditures for the current month'],
        ['Monthly Profit', 'Net income (Revenue - Expenses)'],
        ['Total Assets', 'Sum of all asset accounts'],
        ['Total Liabilities', 'Sum of all liability accounts'],
        ['Total Equity', 'Owner\'s equity and retained earnings'],
    ]
    
    metrics_table = Table(metrics_data, colWidths=[2*inch, 4.5*inch])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(metrics_table)
    
    elements.append(Paragraph("3.2 Navigation Menu", heading2_style))
    elements.append(Paragraph(
        "The sidebar menu provides quick access to all system features:",
        body_style
    ))
    
    nav_items = [
        "Dashboard - Financial overview and metrics",
        "Transactions - Record and manage transactions",
        "Chart of Accounts - Account structure management",
        "Documents - Upload and process financial documents",
        "Reports - Generate financial reports",
        "Invoices - Manage invoices and billing",
        "Payments - Payment processing",
        "Banking - Bank connections and reconciliation",
        "Reconciliation - Match transactions",
        "Settings - System configuration",
        "Administration - User and company management (Admin only)",
    ]
    
    for item in nav_items:
        elements.append(Paragraph(f"• {item}", body_style))
    
    elements.append(PageBreak())
    
    # Chapter 4: Transactions Management
    elements.append(Paragraph("4. Transactions Management", heading1_style))
    elements.append(Paragraph(
        "Transactions are the foundation of your financial records. AFMS provides comprehensive "
        "tools for creating, editing, and managing all types of financial transactions.",
        body_style
    ))
    
    elements.append(Paragraph("4.1 Transaction Types", heading2_style))
    trans_types = [
        ["Type", "Description", "Examples"],
        ["Income", "Money received by the business", "Sales revenue, service fees, interest income"],
        ["Expense", "Money spent by the business", "Rent, utilities, salaries, supplies"],
        ["Transfer", "Money moved between accounts", "Bank transfers, internal allocations"],
    ]
    
    trans_table = Table(trans_types, colWidths=[1.2*inch, 2.3*inch, 3*inch])
    trans_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(trans_table)
    
    elements.append(Paragraph("4.2 Creating a Transaction", heading2_style))
    create_steps = [
        "Navigate to the 'Transactions' section from the sidebar",
        "Click the 'Add Transaction' button (blue button in top right)",
        "Fill in the required information:",
        "  • Transaction Type: Select Income, Expense, or Transfer",
        "  • Date: Select the transaction date",
        "  • Amount: Enter the transaction amount",
        "  • Account: Choose the account affected",
        "  • Category: Select appropriate category",
        "  • Description: Add details about the transaction",
        "  • Currency: Select currency (if multi-currency enabled)",
        "  • Attachments: Optionally attach receipts or documents",
        "Click 'Save' to record the transaction",
        "The transaction will appear in the transactions list",
    ]
    
    for step in create_steps:
        elements.append(Paragraph(step, body_style))
    
    elements.append(Paragraph("4.3 Editing Transactions", heading2_style))
    elements.append(Paragraph(
        "To modify an existing transaction, click the edit icon (pencil) next to the transaction "
        "in the list. Make your changes and click 'Save' to update.",
        body_style
    ))
    
    elements.append(Paragraph("4.4 Deleting Transactions", heading2_style))
    elements.append(Paragraph(
        "Click the delete icon (trash) next to the transaction. Confirm the deletion when prompted. "
        "Note that deleted transactions cannot be recovered.",
        body_style
    ))
    
    elements.append(Paragraph(
        "⚠️ WARNING: Be careful when deleting transactions as this action is permanent and "
        "will affect your financial reports.",
        note_style
    ))
    
    elements.append(Paragraph("4.5 Importing Transactions", heading2_style))
    import_steps = [
        "Click the 'Import' button in the transactions page",
        "Download the CSV template file",
        "Open the template in Excel or similar spreadsheet software",
        "Fill in your transaction data following the column headers",
        "Save the file as CSV format",
        "Upload the completed CSV file",
        "Review the preview of transactions to be imported",
        "Click 'Confirm Import' to add all transactions",
    ]
    
    for i, step in enumerate(import_steps, 1):
        elements.append(Paragraph(f"{i}. {step}", body_style))
    
    elements.append(PageBreak())
    
    # Chapter 5: Chart of Accounts
    elements.append(Paragraph("5. Chart of Accounts", heading1_style))
    elements.append(Paragraph(
        "The Chart of Accounts is the foundation of your accounting system. It's a list of all "
        "accounts used to categorize transactions and generate financial reports.",
        body_style
    ))
    
    elements.append(Paragraph("5.1 Account Categories", heading2_style))
    account_cats = [
        ["Category", "Description", "Normal Balance"],
        ["Assets", "Resources owned by the business", "Debit"],
        ["Liabilities", "Obligations owed by the business", "Credit"],
        ["Equity", "Owner's stake in the business", "Credit"],
        ["Income", "Revenue earned by the business", "Credit"],
        ["Expenses", "Costs incurred by the business", "Debit"],
    ]
    
    cat_table = Table(account_cats, colWidths=[1.5*inch, 3.5*inch, 1.5*inch])
    cat_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    elements.append(cat_table)
    
    elements.append(Paragraph("5.2 Creating New Accounts", heading2_style))
    account_steps = [
        "Navigate to 'Chart of Accounts'",
        "Click 'Add Account' button",
        "Enter account details:",
        "  • Account Name",
        "  • Account Type (cash, checking, savings, etc.)",
        "  • Account Number (optional)",
        "  • Description",
        "  • Currency",
        "  • Opening Balance",
        "Click 'Save' to create the account",
    ]
    
    for step in account_steps:
        elements.append(Paragraph(step, body_style))
    
    elements.append(PageBreak())
    
    # Chapter 6: Financial Reports
    elements.append(Paragraph("6. Financial Reports", heading1_style))
    elements.append(Paragraph(
        "AFMS provides comprehensive financial reporting capabilities to help you understand "
        "your business performance and make informed decisions.",
        body_style
    ))
    
    elements.append(Paragraph("6.1 Available Reports", heading2_style))
    reports = [
        ["Report", "Description", "Key Information"],
        ["Profit & Loss", "Income statement showing revenue and expenses", "Revenue, expenses, net income"],
        ["Balance Sheet", "Snapshot of financial position at a point in time", "Assets, liabilities, equity"],
        ["Cash Flow", "Movement of cash in operating, investing, financing activities", "Cash inflows and outflows"],
        ["Trial Balance", "List of all accounts with debit and credit balances", "Account verification"],
    ]
    
    reports_table = Table(reports, colWidths=[1.5*inch, 2.5*inch, 2.5*inch])
    reports_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    elements.append(reports_table)
    
    elements.append(Paragraph("6.2 Generating Reports", heading2_style))
    report_steps = [
        "Navigate to 'Reports' section",
        "Select the report type you want to generate",
        "Choose the date range or period:",
        "  • Current Month",
        "  • Last Month",
        "  • Current Quarter",
        "  • Current Year",
        "  • Custom Date Range",
        "Select the output format (PDF, Excel, CSV, or view online)",
        "Click 'Generate Report'",
        "Download or view the generated report",
    ]
    
    for step in report_steps:
        elements.append(Paragraph(step, body_style))
    
    elements.append(Paragraph("6.3 Scheduled Reports", heading2_style))
    elements.append(Paragraph(
        "Automate report generation and delivery with scheduled reports:",
        body_style
    ))
    
    sched_features = [
        "Set up recurring reports (daily, weekly, monthly)",
        "Configure email recipients",
        "Choose report parameters and format",
        "Reports are automatically generated and emailed on schedule",
        "Manage schedules from the Report Scheduling page",
    ]
    
    for feature in sched_features:
        elements.append(Paragraph(f"• {feature}", body_style))
    
    elements.append(PageBreak())
    
    # Chapter 7: Security & Best Practices
    elements.append(Paragraph("7. Security & Best Practices", heading1_style))
    
    elements.append(Paragraph("7.1 Password Security", heading2_style))
    pwd_tips = [
        "Use strong passwords with at least 8 characters",
        "Include uppercase, lowercase, numbers, and special characters",
        "Change passwords regularly (every 90 days recommended)",
        "Never share your password with anyone",
        "Use unique passwords for different accounts",
        "Enable two-factor authentication if available",
    ]
    
    for tip in pwd_tips:
        elements.append(Paragraph(f"• {tip}", body_style))
    
    elements.append(Paragraph("7.2 Data Security", heading2_style))
    security_tips = [
        "Log out when leaving your workstation",
        "Do not access the system from public computers",
        "Keep your browser updated",
        "Review audit logs regularly",
        "Report suspicious activity immediately",
        "Back up important data regularly",
    ]
    
    for tip in security_tips:
        elements.append(Paragraph(f"• {tip}", body_style))
    
    elements.append(PageBreak())
    
    # Chapter 8: Support & Contact
    elements.append(Paragraph("8. Support & Contact Information", heading1_style))
    elements.append(Paragraph(
        "If you need assistance or have questions about using AFMS, please contact our support team:",
        body_style
    ))
    elements.append(Spacer(1, 0.2*inch))
    
    support_data = [
        ['Contact Method', 'Details'],
        ['Email', 'support@afms.system'],
        ['Phone', '+1 (555) 123-4567'],
        ['Hours', 'Monday - Friday, 9 AM - 5 PM EST'],
        ['Help Center', 'Access in-app help documentation'],
    ]
    
    support_table = Table(support_data, colWidths=[2*inch, 4.5*inch])
    support_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('TOPPADDING', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 8),
    ]))
    elements.append(support_table)
    
    # Build PDF
    doc.build(elements, canvasmaker=NumberedCanvas)
    
    # Get the PDF data
    pdf_data = buffer.getvalue()
    buffer.close()
    
    return pdf_data


if __name__ == "__main__":
    # Test generation
    pdf_data = generate_user_guide_pdf()
    with open("/tmp/test_user_guide.pdf", "wb") as f:
        f.write(pdf_data)
    print("✅ User guide PDF generated successfully!")
    print(f"   Size: {len(pdf_data)} bytes")
