"""
Multi-Tenant Demo Data Generator
Generates comprehensive demo data for multiple companies and individuals
with industry-specific profiles and realistic patterns.
"""
import uuid
import random
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging
from demo_data_generator import (
    generate_enhanced_demo_data,
    CURRENCIES,
    generate_sample_receipt_image,
    generate_sample_invoice_pdf,
    generate_sample_bank_statement_pdf,
    generate_purchase_order_pdf,
    generate_bank_statement_csv,
    generate_csv_expense_report,
    UPLOAD_DIR
)
from faker import Faker

logger = logging.getLogger(__name__)
fake = Faker()

# Industry-specific business scenarios
INDUSTRY_PROFILES = {
    'tech_startup': {
        'name': 'TechVenture SaaS Inc',
        'industry': 'Technology - SaaS',
        'base_currency': 'USD',
        'description': 'Cloud-based software company',
        'revenue_sources': [
            ('Enterprise Subscription - Fortune 500', 'subscription_revenue', 25000.00),
            ('Pro Plan - Monthly Recurring', 'subscription_revenue', 5000.00),
            ('Annual License - Corporate', 'licensing_revenue', 50000.00),
            ('Professional Services', 'service_income', 15000.00),
            ('API Usage Fees', 'other_income', 3000.00),
        ],
        'expenses': {
            'software_subscriptions': [
                ('AWS Cloud Infrastructure', 'utilities', 8500.00),
                ('GitHub Enterprise', 'software', 420.00),
                ('Slack Business+', 'software', 250.00),
                ('DataDog Monitoring', 'software', 1200.00),
                ('SendGrid Email Service', 'software', 450.00),
            ],
            'office_expenses': [
                ('WeWork Office Space', 'rent', 4500.00),
                ('Google Workspace', 'software', 300.00),
                ('Office Supplies', 'office_supplies', 200.00),
            ],
            'marketing': [
                ('Google Ads - SaaS Campaign', 'marketing', 8000.00),
                ('LinkedIn Lead Gen', 'marketing', 5000.00),
                ('Content Marketing Agency', 'marketing', 3500.00),
                ('HubSpot Marketing Pro', 'software', 800.00),
            ],
            'payroll': [
                ('Engineering Team Salaries', 'payroll', 45000.00),
                ('Sales Team Commissions', 'payroll', 12000.00),
            ],
        },
        'transaction_multiplier': 1.2,  # More transactions for tech companies
    },
    
    'consulting_firm': {
        'name': 'Strategic Advisory Group',
        'industry': 'Professional Services - Consulting',
        'base_currency': 'USD',
        'description': 'Management consulting firm',
        'revenue_sources': [
            ('Strategy Consulting - Project Alpha', 'consulting_revenue', 35000.00),
            ('Change Management Services', 'consulting_revenue', 28000.00),
            ('Executive Coaching - C-Suite', 'service_income', 15000.00),
            ('Workshop Facilitation', 'training_revenue', 8500.00),
            ('Retainer - Monthly Advisory', 'service_income', 20000.00),
        ],
        'expenses': {
            'professional_services': [
                ('Legal Services - Contract Review', 'legal_fees', 3500.00),
                ('Professional Liability Insurance', 'insurance', 2200.00),
                ('CPA Accounting Services', 'professional_fees', 1800.00),
                ('Professional Development', 'training', 2500.00),
            ],
            'office_expenses': [
                ('Executive Office Suite', 'rent', 5500.00),
                ('Conference Room Rental', 'rent', 800.00),
                ('Office Equipment', 'equipment', 1500.00),
            ],
            'travel_expenses': [
                ('Client Site Travel - Flights', 'travel', 2500.00),
                ('Hotel Accommodations', 'lodging', 1800.00),
                ('Ground Transportation', 'transportation', 350.00),
                ('Client Meals & Entertainment', 'meals', 650.00),
            ],
            'marketing': [
                ('Industry Conference Sponsorship', 'marketing', 5000.00),
                ('LinkedIn Premium Accounts', 'marketing', 400.00),
                ('Thought Leadership Content', 'marketing', 2000.00),
            ],
        },
        'transaction_multiplier': 0.9,  # Fewer but larger transactions
    },
    
    'retail_ecommerce': {
        'name': 'Urban Style Boutique',
        'industry': 'Retail - E-commerce',
        'base_currency': 'USD',
        'description': 'Online fashion and lifestyle retail',
        'revenue_sources': [
            ('Online Sales - Clothing', 'product_sales', 15000.00),
            ('Online Sales - Accessories', 'product_sales', 8500.00),
            ('Marketplace Sales - Amazon', 'product_sales', 12000.00),
            ('Wholesale Orders', 'wholesale_revenue', 18000.00),
            ('Shipping & Handling Fees', 'other_income', 2500.00),
        ],
        'expenses': {
            'inventory': [
                ('Apparel Supplier - Wholesale', 'cost_of_goods', 22000.00),
                ('Accessories Supplier', 'cost_of_goods', 8500.00),
                ('Shipping Supplies & Packaging', 'shipping', 1200.00),
            ],
            'shipping': [
                ('USPS Shipping - Monthly', 'shipping', 3500.00),
                ('FedEx Express Shipping', 'shipping', 1800.00),
                ('UPS Ground Service', 'shipping', 2200.00),
            ],
            'ecommerce': [
                ('Shopify E-commerce Platform', 'software', 299.00),
                ('Amazon Seller Fees', 'professional_fees', 1500.00),
                ('Payment Processing Fees', 'professional_fees', 850.00),
                ('Inventory Management Software', 'software', 149.00),
            ],
            'marketing': [
                ('Facebook & Instagram Ads', 'marketing', 4500.00),
                ('Google Shopping Ads', 'marketing', 3500.00),
                ('Influencer Marketing', 'marketing', 2000.00),
                ('Email Marketing - Klaviyo', 'software', 250.00),
            ],
            'office_expenses': [
                ('Warehouse Rent', 'rent', 2800.00),
                ('Utilities', 'utilities', 350.00),
            ],
        },
        'transaction_multiplier': 1.3,  # High transaction volume for retail
    },
}

# Individual/Personal finance scenarios
INDIVIDUAL_PROFILES = {
    'young_professional': {
        'name': 'Alex Thompson',
        'type': 'Individual',
        'base_currency': 'USD',
        'description': 'Software Engineer - Young Professional',
        'income_sources': [
            ('Salary - Tech Company', 'salary', 7500.00),
            ('Freelance Side Project', 'freelance_income', 1500.00),
            ('Stock Dividend', 'investment_income', 250.00),
        ],
        'expenses': {
            'housing': [
                ('Rent - Downtown Apartment', 'rent', 2200.00),
                ('Utilities - Electric & Gas', 'utilities', 150.00),
                ('Internet & Cable', 'utilities', 120.00),
                ('Renters Insurance', 'insurance', 35.00),
            ],
            'transportation': [
                ('Car Payment', 'auto_loan', 450.00),
                ('Car Insurance', 'insurance', 180.00),
                ('Gas & Fuel', 'transportation', 200.00),
                ('Uber/Lyft', 'transportation', 80.00),
            ],
            'food': [
                ('Groceries', 'groceries', 450.00),
                ('Restaurants & Dining', 'dining', 350.00),
                ('Coffee Shops', 'dining', 120.00),
            ],
            'personal': [
                ('Gym Membership', 'fitness', 75.00),
                ('Netflix & Spotify', 'entertainment', 35.00),
                ('Phone Bill', 'utilities', 85.00),
                ('Clothing & Personal Care', 'shopping', 200.00),
            ],
            'savings': [
                ('401k Contribution', 'retirement', 800.00),
                ('Emergency Savings', 'savings', 500.00),
            ],
        },
        'transaction_multiplier': 0.2,  # ~200 transactions for individuals
    },
    
    'freelancer': {
        'name': 'Jordan Martinez',
        'type': 'Individual',
        'base_currency': 'USD',
        'description': 'Freelance Graphic Designer',
        'income_sources': [
            ('Client Project - Design Work', 'freelance_income', 4500.00),
            ('Retainer Client - Monthly', 'freelance_income', 2500.00),
            ('Online Course Sales', 'passive_income', 800.00),
            ('Stock Photography', 'passive_income', 200.00),
        ],
        'expenses': {
            'business': [
                ('Adobe Creative Cloud', 'software', 59.99),
                ('Canva Pro', 'software', 12.99),
                ('Web Hosting', 'software', 25.00),
                ('Business Insurance', 'insurance', 120.00),
                ('Co-working Space', 'rent', 350.00),
            ],
            'housing': [
                ('Rent - 1BR Apartment', 'rent', 1600.00),
                ('Utilities', 'utilities', 130.00),
                ('Internet', 'utilities', 80.00),
            ],
            'transportation': [
                ('Car Insurance', 'insurance', 150.00),
                ('Gas', 'transportation', 180.00),
                ('Public Transit Pass', 'transportation', 95.00),
            ],
            'food': [
                ('Groceries', 'groceries', 380.00),
                ('Dining Out', 'dining', 250.00),
                ('Coffee & Snacks', 'dining', 90.00),
            ],
            'personal': [
                ('Health Insurance', 'insurance', 450.00),
                ('Phone Bill', 'utilities', 75.00),
                ('Gym & Yoga', 'fitness', 90.00),
                ('Entertainment', 'entertainment', 150.00),
            ],
            'professional_development': [
                ('Online Courses', 'training', 150.00),
                ('Professional Memberships', 'professional_fees', 50.00),
            ],
        },
        'transaction_multiplier': 0.2,  # ~200 transactions for individuals
    },
}


async def create_company_with_demo_data(
    db,
    company_profile: Dict,
    admin_email: str,
    admin_password: str
) -> Dict:
    """
    Create a company with full demo data based on industry profile
    """
    from database import companies_collection, users_collection
    from auth import get_password_hash
    
    company_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create company
    company = {
        '_id': company_id,
        'id': company_id,
        'name': company_profile['name'],
        'type': 'corporate',
        'industry': company_profile['industry'],
        'description': company_profile['description'],
        'settings': {
            'base_currency': company_profile['base_currency'],
            'fiscal_year_start': '01-01',
            'date_format': 'MM/DD/YYYY',
            'number_format': 'en-US',
            'timezone': 'America/New_York'
        },
        'is_active': True,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    await companies_collection.insert_one(company)
    logger.info(f"Created company: {company_profile['name']}")
    
    # Create admin user
    user = {
        '_id': user_id,
        'id': user_id,
        'email': admin_email,
        'hashed_password': get_password_hash(admin_password),
        'full_name': f"Admin - {company_profile['name']}",
        'company_id': company_id,
        'role': 'admin',
        'is_active': True,
        'is_system_user': False,
        'company_ids': [company_id],
        'created_at': datetime.utcnow(),
        'last_login': None
    }
    
    await users_collection.insert_one(user)
    logger.info(f"Created admin user: {admin_email}")
    
    # Generate industry-specific demo data
    logger.info(f"Generating demo data for {company_profile['name']}...")
    demo_result = await generate_industry_specific_demo_data(
        db, company_id, user_id, company_profile
    )
    
    return {
        'company_id': company_id,
        'company_name': company_profile['name'],
        'industry': company_profile['industry'],
        'user_id': user_id,
        'email': admin_email,
        'password': admin_password,
        'demo_data': demo_result
    }


async def create_individual_with_demo_data(
    db,
    individual_profile: Dict,
    email: str,
    password: str
) -> Dict:
    """
    Create an individual user with personal finance demo data
    """
    from database import companies_collection, users_collection
    from auth import get_password_hash
    
    company_id = str(uuid.uuid4())
    user_id = str(uuid.uuid4())
    
    # Create personal "company" (for data isolation)
    company = {
        '_id': company_id,
        'id': company_id,
        'name': f"{individual_profile['name']} - Personal",
        'type': 'individual',
        'industry': 'Personal Finance',
        'description': individual_profile['description'],
        'settings': {
            'base_currency': individual_profile['base_currency'],
            'fiscal_year_start': '01-01',
            'date_format': 'MM/DD/YYYY',
            'number_format': 'en-US',
            'timezone': 'America/New_York'
        },
        'is_active': True,
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }
    
    await companies_collection.insert_one(company)
    logger.info(f"Created individual account: {individual_profile['name']}")
    
    # Create user
    user = {
        '_id': user_id,
        'id': user_id,
        'email': email,
        'password_hash': get_password_hash(password),
        'full_name': individual_profile['name'],
        'company_id': company_id,
        'role': 'individual',
        'is_active': True,
        'is_system_user': False,
        'company_ids': [company_id],
        'created_at': datetime.utcnow(),
        'last_login': None
    }
    
    await users_collection.insert_one(user)
    logger.info(f"Created individual user: {email}")
    
    # Generate personal finance demo data
    logger.info(f"Generating personal finance data for {individual_profile['name']}...")
    demo_result = await generate_individual_demo_data(
        db, company_id, user_id, individual_profile
    )
    
    return {
        'company_id': company_id,
        'user_type': 'Individual',
        'name': individual_profile['name'],
        'user_id': user_id,
        'email': email,
        'password': password,
        'demo_data': demo_result
    }


async def generate_industry_specific_demo_data(
    db,
    company_id: str,
    user_id: str,
    profile: Dict
) -> Dict:
    """
    Generate industry-specific demo data for a company
    """
    from database import (
        accounts_collection, transactions_collection, documents_collection,
        invoices_collection, bills_collection, payment_transactions_collection,
        bank_connections_collection, reconciliation_sessions_collection,
        reconciliation_matches_collection
    )
    import os
    
    logger.info(f"Generating industry-specific data for {profile['name']}")
    
    # Calculate transaction count based on multiplier
    base_transaction_count = 1000
    target_transactions = int(base_transaction_count * profile['transaction_multiplier'])
    
    # Create accounts
    created_accounts = []
    account_definitions = []
    
    # Bank accounts
    account_definitions.extend([
        {'name': 'Business Checking', 'type': 'checking', 'currency': profile['base_currency'], 'balance': 150000.00},
        {'name': 'Savings Account', 'type': 'savings', 'currency': profile['base_currency'], 'balance': 85000.00},
        {'name': 'Petty Cash', 'type': 'cash', 'currency': profile['base_currency'], 'balance': 3000.00},
        {'name': 'Business Credit Card', 'type': 'credit_card', 'currency': profile['base_currency'], 'balance': -9500.00},
    ])
    
    # Revenue accounts (based on industry)
    for revenue_source, category, _ in profile['revenue_sources']:
        account_definitions.append({
            'name': category.replace('_', ' ').title(),
            'type': category,
            'currency': profile['base_currency'],
            'balance': 0.00
        })
    
    # Expense accounts (based on industry)
    expense_categories = set()
    for expense_category in profile['expenses'].values():
        for _, category, _ in expense_category:
            expense_categories.add(category)
    
    for category in expense_categories:
        account_definitions.append({
            'name': category.replace('_', ' ').title(),
            'type': category,
            'currency': profile['base_currency'],
            'balance': 0.00
        })
    
    # Asset accounts
    account_definitions.extend([
        {'name': 'Accounts Receivable', 'type': 'accounts_receivable', 'currency': profile['base_currency'], 'balance': 55000.00},
        {'name': 'Equipment', 'type': 'equipment', 'currency': profile['base_currency'], 'balance': 30000.00},
    ])
    
    # Liability accounts
    account_definitions.extend([
        {'name': 'Accounts Payable', 'type': 'accounts_payable', 'currency': profile['base_currency'], 'balance': -15000.00},
        {'name': 'Business Loan', 'type': 'long_term_liability', 'currency': profile['base_currency'], 'balance': -60000.00},
    ])
    
    # Create accounts
    for acc_def in account_definitions:
        account_id = str(uuid.uuid4())
        account = {
            '_id': account_id,
            'id': account_id,
            'company_id': company_id,
            'name': acc_def['name'],
            'account_type': acc_def['type'],
            'currency_code': acc_def['currency'],
            'current_balance': acc_def['balance'],
            'description': f"{acc_def['name']} - {profile['name']}",
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        await accounts_collection.insert_one(account)
        created_accounts.append(account)
    
    logger.info(f"Created {len(created_accounts)} accounts")
    
    # Generate transactions
    checking_accounts = [a for a in created_accounts if a['account_type'] in ['checking', 'savings']]
    expense_accounts = [a for a in created_accounts if a['account_type'] in expense_categories]
    revenue_accounts = [a for a in created_accounts if a['account_type'] in [cat for _, cat, _ in profile['revenue_sources']]]
    
    created_transactions = []
    created_documents = []
    
    start_date = datetime.now() - timedelta(days=365)
    end_date = datetime.now()
    
    transaction_count = 0
    document_count = 0
    
    # Generate revenue transactions (monthly)
    current_date = start_date
    while current_date < end_date:
        for revenue_source, category, base_amount in profile['revenue_sources']:
            amount = base_amount * random.uniform(0.85, 1.15)
            
            if random.random() > 0.05:  # 95% success rate
                checking_acc = random.choice(checking_accounts)
                revenue_acc = next((a for a in revenue_accounts if category in a['account_type']), random.choice(revenue_accounts))
                
                trans_id = str(uuid.uuid4())
                transaction = {
                    '_id': trans_id,
                    'id': trans_id,
                    'company_id': company_id,
                    'transaction_date': current_date,
                    'description': revenue_source,
                    'transaction_type': 'income',
                    'amount': amount,
                    'currency_code': checking_acc['currency_code'],
                    'category': category,
                    'status': 'cleared',
                    'is_reconciled': random.choice([True, False]),
                    'created_by': user_id,
                    'created_at': current_date,
                    'from_account_id': checking_acc['id'],
                    'journal_entries': [
                        {'account_id': checking_acc['id'], 'debit': amount, 'credit': 0},
                        {'account_id': revenue_acc['id'], 'debit': 0, 'credit': amount}
                    ]
                }
                
                await transactions_collection.insert_one(transaction)
                created_transactions.append(transaction)
                transaction_count += 1
        
        current_date += timedelta(days=30)
    
    # Generate expense transactions (distributed throughout the year)
    current_date = start_date
    expenses_per_week = max(3, int(target_transactions * 0.9 / 52))  # 90% of transactions are expenses
    
    while current_date < end_date:
        for week in range(4):
            num_expenses = random.randint(max(1, expenses_per_week - 2), expenses_per_week + 2)
            
            for _ in range(num_expenses):
                # Select random expense category from industry profile
                expense_category_name = random.choice(list(profile['expenses'].keys()))
                expense_items = profile['expenses'][expense_category_name]
                vendor, category, base_amount = random.choice(expense_items)
                
                amount = base_amount * random.uniform(0.7, 1.3)
                
                checking_acc = random.choice(checking_accounts)
                expense_acc = next((a for a in expense_accounts if category in a['account_type']), random.choice(expense_accounts))
                
                trans_date = current_date + timedelta(days=week*7 + random.randint(0, 6))
                if trans_date > end_date:
                    break
                
                trans_id = str(uuid.uuid4())
                transaction = {
                    '_id': trans_id,
                    'id': trans_id,
                    'company_id': company_id,
                    'transaction_date': trans_date,
                    'description': vendor,
                    'transaction_type': 'expense',
                    'amount': amount,
                    'currency_code': checking_acc['currency_code'],
                    'category': category,
                    'status': random.choice(['cleared', 'pending', 'cleared']),
                    'is_reconciled': random.choice([True, False, False]),
                    'created_by': user_id,
                    'created_at': trans_date,
                    'from_account_id': checking_acc['id'],
                    'journal_entries': [
                        {'account_id': expense_acc['id'], 'debit': amount, 'credit': 0},
                        {'account_id': checking_acc['id'], 'debit': 0, 'credit': amount}
                    ]
                }
                
                await transactions_collection.insert_one(transaction)
                created_transactions.append(transaction)
                transaction_count += 1
                
                # Generate document (30% chance)
                if random.random() < 0.3 and document_count < 300:
                    doc_type = random.choice(['receipt', 'invoice', 'other'])
                    
                    try:
                        if doc_type == 'receipt':
                            filename = f"receipt_{trans_date.strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.png"
                            file_path = generate_sample_receipt_image(filename, amount, vendor, trans_date)
                        elif doc_type == 'invoice':
                            filename = f"invoice_{trans_date.strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.pdf"
                            file_path = generate_sample_invoice_pdf(filename, amount, vendor, trans_date)
                        else:
                            filename = f"po_{trans_date.strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.pdf"
                            file_path = generate_purchase_order_pdf(filename, amount, vendor, trans_date)
                        
                        doc_id = str(uuid.uuid4())
                        document = {
                            '_id': doc_id,
                            'id': doc_id,
                            'company_id': company_id,
                            'filename': filename,
                            'original_filename': filename,
                            'file_path': file_path,
                            'file_type': doc_type,
                            'document_type': doc_type,
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
                            'created_at': trans_date,
                            'tags': []
                        }
                        
                        await documents_collection.insert_one(document)
                        created_documents.append(document)
                        document_count += 1
                        
                    except Exception as e:
                        logger.warning(f"Failed to generate document: {e}")
        
        current_date += timedelta(days=30)
    
    # Generate invoices (AR) - 35-45 invoices
    invoice_count = 0
    for i in range(random.randint(35, 45)):
        invoice_date_obj = fake.date_between(start_date=start_date, end_date=end_date)
        invoice_date = datetime.combine(invoice_date_obj, datetime.min.time())
        due_date = invoice_date + timedelta(days=30)
        amount = random.uniform(2000, 30000)
        
        is_paid = random.random() < 0.6
        paid_amount = amount if is_paid else (amount * random.uniform(0, 0.5) if random.random() < 0.3 else 0)
        
        invoice_id = str(uuid.uuid4())
        invoice = {
            '_id': invoice_id,
            'id': invoice_id,
            'invoice_number': f"INV-{invoice_date.strftime('%Y%m')}-{random.randint(1000, 9999)}",
            'company_id': company_id,
            'customer_name': fake.company(),
            'customer_email': fake.email(),
            'issue_date': invoice_date,
            'due_date': due_date,
            'currency': profile['base_currency'],
            'line_items': [{
                'description': random.choice([desc for desc, _, _ in profile['revenue_sources']]),
                'quantity': random.randint(1, 100),
                'unit_price': round(amount / random.randint(1, 10), 2),
                'amount': round(amount, 2)
            }],
            'subtotal': round(amount, 2),
            'tax_rate': 0.0,
            'tax_amount': 0.0,
            'total_amount': round(amount, 2),
            'amount_paid': round(paid_amount, 2),
            'amount_due': round(amount - paid_amount, 2),
            'status': 'paid' if is_paid else ('partial' if paid_amount > 0 else 'outstanding'),
            'notes': fake.sentence(),
            'created_by': user_id,
            'created_at': invoice_date,
            'updated_at': invoice_date
        }
        
        await invoices_collection.insert_one(invoice)
        invoice_count += 1
    
    # Generate bills (AP) - 30-40 bills
    bills_count = 0
    for i in range(random.randint(30, 40)):
        bill_date_obj = fake.date_between(start_date=start_date, end_date=end_date)
        bill_date = datetime.combine(bill_date_obj, datetime.min.time())
        due_date = bill_date + timedelta(days=random.choice([15, 30, 45]))
        
        # Select vendor from industry expenses
        expense_category_name = random.choice(list(profile['expenses'].keys()))
        vendor, category, base_amount = random.choice(profile['expenses'][expense_category_name])
        amount = base_amount * random.uniform(0.8, 1.2)
        
        is_paid = random.random() < 0.55
        paid_amount = amount if is_paid else (amount * random.uniform(0, 0.5) if random.random() < 0.25 else 0)
        
        bill_id = str(uuid.uuid4())
        bill = {
            '_id': bill_id,
            'id': bill_id,
            'bill_number': f"BILL-{bill_date.strftime('%Y%m')}-{random.randint(1000, 9999)}",
            'company_id': company_id,
            'vendor_name': vendor,
            'vendor_email': fake.email(),
            'bill_date': bill_date,
            'due_date': due_date,
            'currency': profile['base_currency'],
            'category': category,
            'line_items': [{
                'description': vendor,
                'quantity': random.randint(1, 20),
                'unit_price': round(amount / random.randint(1, 5), 2),
                'amount': round(amount, 2)
            }],
            'subtotal': round(amount, 2),
            'tax_rate': 0.0,
            'tax_amount': 0.0,
            'total_amount': round(amount, 2),
            'amount_paid': round(paid_amount, 2),
            'amount_due': round(amount - paid_amount, 2),
            'status': 'paid' if is_paid else ('partial' if paid_amount > 0 else 'outstanding'),
            'notes': fake.sentence(),
            'created_by': user_id,
            'created_at': bill_date,
            'updated_at': bill_date
        }
        
        await bills_collection.insert_one(bill)
        bills_count += 1
    
    # Generate payment transactions - 50-70
    payment_count = 0
    for i in range(random.randint(50, 70)):
        payment_date_obj = fake.date_between(start_date=start_date, end_date=end_date)
        payment_date = datetime.combine(payment_date_obj, datetime.min.time())
        amount = random.uniform(500, 15000)
        
        payment_status = random.choices(
            ['completed', 'pending', 'failed', 'refunded'],
            weights=[0.75, 0.15, 0.05, 0.05]
        )[0]
        
        payment_id = str(uuid.uuid4())
        payment = {
            '_id': payment_id,
            'id': payment_id,
            'company_id': company_id,
            'transaction_id': f"txn_{uuid.uuid4().hex[:16]}",
            'amount': round(amount, 2),
            'currency': profile['base_currency'],
            'status': payment_status,
            'payment_method': random.choice(['credit_card', 'debit_card', 'bank_transfer', 'wire_transfer']),
            'gateway': random.choice(['stripe', 'paypal', 'square']),
            'customer_name': fake.name(),
            'customer_email': fake.email(),
            'description': random.choice([desc for desc, _, _ in profile['revenue_sources']]),
            'metadata': {
                'invoice_id': f"INV-{random.randint(1000, 9999)}",
                'customer_id': f"cust_{uuid.uuid4().hex[:8]}"
            },
            'created_at': payment_date,
            'updated_at': payment_date
        }
        
        await payment_transactions_collection.insert_one(payment)
        payment_count += 1
    
    # Generate bank connections - 2-3
    bank_connection_count = 0
    for i in range(random.randint(2, 3)):
        connection_date_obj = fake.date_between(start_date=start_date, end_date=end_date)
        connection_date = datetime.combine(connection_date_obj, datetime.min.time())
        
        bank_conn_id = str(uuid.uuid4())
        bank_connection = {
            '_id': bank_conn_id,
            'id': bank_conn_id,
            'connection_id': f"conn_{uuid.uuid4().hex[:16]}",
            'company_id': company_id,
            'user_id': user_id,
            'institution_name': random.choice(['Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank']),
            'institution_id': f"ins_{uuid.uuid4().hex[:12]}",
            'account_name': random.choice(['Business Checking', 'Business Savings', 'Money Market']),
            'account_mask': str(random.randint(1000, 9999)),
            'account_type': random.choice(['checking', 'savings']),
            'status': 'active',
            'last_synced': connection_date + timedelta(days=random.randint(0, 30)),
            'created_at': connection_date,
            'updated_at': connection_date
        }
        
        await bank_connections_collection.insert_one(bank_connection)
        bank_connection_count += 1
    
    logger.info(f"✅ Generated demo data for {profile['name']}")
    
    return {
        'accounts_created': len(created_accounts),
        'transactions_created': transaction_count,
        'documents_created': document_count,
        'invoices_created': invoice_count,
        'bills_created': bills_count,
        'payment_transactions_created': payment_count,
        'bank_connections_created': bank_connection_count
    }


async def generate_individual_demo_data(
    db,
    company_id: str,
    user_id: str,
    profile: Dict
) -> Dict:
    """
    Generate personal finance demo data for an individual
    """
    from database import (
        accounts_collection, transactions_collection, documents_collection
    )
    import os
    
    logger.info(f"Generating personal finance data for {profile['name']}")
    
    # Calculate transaction count (20% of company volume ~200 transactions)
    target_transactions = int(1000 * profile['transaction_multiplier'])
    
    # Create personal accounts
    created_accounts = []
    account_definitions = [
        {'name': 'Personal Checking', 'type': 'checking', 'currency': profile['base_currency'], 'balance': 12500.00},
        {'name': 'Savings Account', 'type': 'savings', 'currency': profile['base_currency'], 'balance': 25000.00},
        {'name': 'Credit Card', 'type': 'credit_card', 'currency': profile['base_currency'], 'balance': -2500.00},
        {'name': 'Cash', 'type': 'cash', 'currency': profile['base_currency'], 'balance': 500.00},
    ]
    
    # Income accounts
    for income_source, category, _ in profile['income_sources']:
        account_definitions.append({
            'name': category.replace('_', ' ').title(),
            'type': category,
            'currency': profile['base_currency'],
            'balance': 0.00
        })
    
    # Expense accounts
    expense_categories = set()
    for expense_category in profile['expenses'].values():
        for _, category, _ in expense_category:
            expense_categories.add(category)
    
    for category in expense_categories:
        account_definitions.append({
            'name': category.replace('_', ' ').title(),
            'type': category,
            'currency': profile['base_currency'],
            'balance': 0.00
        })
    
    # Create accounts
    for acc_def in account_definitions:
        account_id = str(uuid.uuid4())
        account = {
            '_id': account_id,
            'id': account_id,
            'company_id': company_id,
            'name': acc_def['name'],
            'account_type': acc_def['type'],
            'currency_code': acc_def['currency'],
            'current_balance': acc_def['balance'],
            'description': f"{acc_def['name']} - {profile['name']}",
            'is_active': True,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        await accounts_collection.insert_one(account)
        created_accounts.append(account)
    
    logger.info(f"Created {len(created_accounts)} personal accounts")
    
    # Generate transactions
    checking_accounts = [a for a in created_accounts if a['account_type'] in ['checking', 'savings']]
    expense_accounts = [a for a in created_accounts if a['account_type'] in expense_categories]
    income_accounts = [a for a in created_accounts if a['account_type'] in [cat for _, cat, _ in profile['income_sources']]]
    
    created_transactions = []
    created_documents = []
    
    start_date = datetime.now() - timedelta(days=365)
    end_date = datetime.now()
    
    transaction_count = 0
    document_count = 0
    
    # Generate income transactions (monthly)
    current_date = start_date
    while current_date < end_date:
        for income_source, category, base_amount in profile['income_sources']:
            amount = base_amount * random.uniform(0.95, 1.05)
            
            checking_acc = random.choice(checking_accounts)
            income_acc = next((a for a in income_accounts if category in a['account_type']), random.choice(income_accounts))
            
            trans_id = str(uuid.uuid4())
            transaction = {
                '_id': trans_id,
                'id': trans_id,
                'company_id': company_id,
                'transaction_date': current_date,
                'description': income_source,
                'transaction_type': 'income',
                'amount': amount,
                'currency_code': checking_acc['currency_code'],
                'category': category,
                'status': 'cleared',
                'is_reconciled': random.choice([True, False]),
                'created_by': user_id,
                'created_at': current_date,
                'from_account_id': checking_acc['id'],
                'journal_entries': [
                    {'account_id': checking_acc['id'], 'debit': amount, 'credit': 0},
                    {'account_id': income_acc['id'], 'debit': 0, 'credit': amount}
                ]
            }
            
            await transactions_collection.insert_one(transaction)
            created_transactions.append(transaction)
            transaction_count += 1
        
        current_date += timedelta(days=30)
    
    # Generate expense transactions (weekly patterns)
    current_date = start_date
    expenses_per_week = max(2, int(target_transactions * 0.85 / 52))
    
    while current_date < end_date:
        for week in range(4):
            num_expenses = random.randint(max(1, expenses_per_week - 1), expenses_per_week + 1)
            
            for _ in range(num_expenses):
                # Select random expense category
                expense_category_name = random.choice(list(profile['expenses'].keys()))
                expense_items = profile['expenses'][expense_category_name]
                vendor, category, base_amount = random.choice(expense_items)
                
                amount = base_amount * random.uniform(0.8, 1.2)
                
                checking_acc = random.choice(checking_accounts)
                expense_acc = next((a for a in expense_accounts if category in a['account_type']), random.choice(expense_accounts))
                
                trans_date = current_date + timedelta(days=week*7 + random.randint(0, 6))
                if trans_date > end_date:
                    break
                
                trans_id = str(uuid.uuid4())
                transaction = {
                    '_id': trans_id,
                    'id': trans_id,
                    'company_id': company_id,
                    'transaction_date': trans_date,
                    'description': vendor,
                    'transaction_type': 'expense',
                    'amount': amount,
                    'currency_code': checking_acc['currency_code'],
                    'category': category,
                    'status': 'cleared',
                    'is_reconciled': random.choice([True, False]),
                    'created_by': user_id,
                    'created_at': trans_date,
                    'from_account_id': checking_acc['id'],
                    'journal_entries': [
                        {'account_id': expense_acc['id'], 'debit': amount, 'credit': 0},
                        {'account_id': checking_acc['id'], 'debit': 0, 'credit': amount}
                    ]
                }
                
                await transactions_collection.insert_one(transaction)
                created_transactions.append(transaction)
                transaction_count += 1
                
                # Generate document (20% chance for individuals)
                if random.random() < 0.2 and document_count < 60:
                    doc_type = random.choice(['receipt', 'other'])
                    
                    try:
                        if doc_type == 'receipt':
                            filename = f"receipt_{trans_date.strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.png"
                            file_path = generate_sample_receipt_image(filename, amount, vendor, trans_date)
                        else:
                            filename = f"doc_{trans_date.strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}.pdf"
                            file_path = generate_sample_invoice_pdf(filename, amount, vendor, trans_date)
                        
                        doc_id = str(uuid.uuid4())
                        document = {
                            '_id': doc_id,
                            'id': doc_id,
                            'company_id': company_id,
                            'filename': filename,
                            'original_filename': filename,
                            'file_path': file_path,
                            'file_type': doc_type,
                            'document_type': doc_type,
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
                            'created_at': trans_date,
                            'tags': []
                        }
                        
                        await documents_collection.insert_one(document)
                        created_documents.append(document)
                        document_count += 1
                        
                    except Exception as e:
                        logger.warning(f"Failed to generate document: {e}")
        
        current_date += timedelta(days=30)
    
    logger.info(f"✅ Generated personal finance data for {profile['name']}")
    
    return {
        'accounts_created': len(created_accounts),
        'transactions_created': transaction_count,
        'documents_created': document_count,
    }


async def generate_all_multi_tenant_demo_data(db) -> Dict:
    """
    Generate demo data for 3 companies and 2 individuals
    """
    logger.info("="*80)
    logger.info("Starting Multi-Tenant Demo Data Generation")
    logger.info("Target: 3 Companies + 2 Individuals")
    logger.info("="*80)
    
    results = {
        'companies': [],
        'individuals': [],
        'summary': {},
        'credentials': []
    }
    
    # Generate 3 companies with different industry profiles
    company_configs = [
        {
            'profile': INDUSTRY_PROFILES['tech_startup'],
            'email': 'admin@techventure.demo',
            'password': 'Demo123!'
        },
        {
            'profile': INDUSTRY_PROFILES['consulting_firm'],
            'email': 'admin@strategicadvisory.demo',
            'password': 'Demo123!'
        },
        {
            'profile': INDUSTRY_PROFILES['retail_ecommerce'],
            'email': 'admin@urbanstyle.demo',
            'password': 'Demo123!'
        }
    ]
    
    for config in company_configs:
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"Creating company: {config['profile']['name']}")
            logger.info(f"{'='*60}")
            
            company_result = await create_company_with_demo_data(
                db,
                config['profile'],
                config['email'],
                config['password']
            )
            
            results['companies'].append(company_result)
            results['credentials'].append({
                'type': 'Company',
                'name': company_result['company_name'],
                'industry': company_result['industry'],
                'email': company_result['email'],
                'password': company_result['password']
            })
            
            logger.info(f"✅ Company created: {config['profile']['name']}")
            logger.info(f"   Login: {config['email']} / {config['password']}")
            
        except Exception as e:
            logger.error(f"❌ Failed to create company {config['profile']['name']}: {e}")
            import traceback
            traceback.print_exc()
    
    # Generate 2 individuals with personal finance data
    individual_configs = [
        {
            'profile': INDIVIDUAL_PROFILES['young_professional'],
            'email': 'alex.thompson@demo.com',
            'password': 'Demo123!'
        },
        {
            'profile': INDIVIDUAL_PROFILES['freelancer'],
            'email': 'jordan.martinez@demo.com',
            'password': 'Demo123!'
        }
    ]
    
    for config in individual_configs:
        try:
            logger.info(f"\n{'='*60}")
            logger.info(f"Creating individual: {config['profile']['name']}")
            logger.info(f"{'='*60}")
            
            individual_result = await create_individual_with_demo_data(
                db,
                config['profile'],
                config['email'],
                config['password']
            )
            
            results['individuals'].append(individual_result)
            results['credentials'].append({
                'type': 'Individual',
                'name': individual_result['name'],
                'email': individual_result['email'],
                'password': individual_result['password']
            })
            
            logger.info(f"✅ Individual created: {config['profile']['name']}")
            logger.info(f"   Login: {config['email']} / {config['password']}")
            
        except Exception as e:
            logger.error(f"❌ Failed to create individual {config['profile']['name']}: {e}")
            import traceback
            traceback.print_exc()
    
    # Calculate summary
    total_accounts = sum(c['demo_data']['accounts_created'] for c in results['companies'])
    total_accounts += sum(i['demo_data']['accounts_created'] for i in results['individuals'])
    
    total_transactions = sum(c['demo_data']['transactions_created'] for c in results['companies'])
    total_transactions += sum(i['demo_data']['transactions_created'] for i in results['individuals'])
    
    total_documents = sum(c['demo_data']['documents_created'] for c in results['companies'])
    total_documents += sum(i['demo_data']['documents_created'] for i in results['individuals'])
    
    total_invoices = sum(c['demo_data'].get('invoices_created', 0) for c in results['companies'])
    total_bills = sum(c['demo_data'].get('bills_created', 0) for c in results['companies'])
    total_payments = sum(c['demo_data'].get('payment_transactions_created', 0) for c in results['companies'])
    total_bank_conns = sum(c['demo_data'].get('bank_connections_created', 0) for c in results['companies'])
    
    results['summary'] = {
        'companies_created': len(results['companies']),
        'individuals_created': len(results['individuals']),
        'total_tenants': len(results['companies']) + len(results['individuals']),
        'total_accounts': total_accounts,
        'total_transactions': total_transactions,
        'total_documents': total_documents,
        'total_invoices': total_invoices,
        'total_bills': total_bills,
        'total_payment_transactions': total_payments,
        'total_bank_connections': total_bank_conns
    }
    
    logger.info("\n" + "="*80)
    logger.info("✅ MULTI-TENANT DEMO DATA GENERATION COMPLETE!")
    logger.info("="*80)
    logger.info(f"📊 Summary:")
    logger.info(f"   - Companies: {results['summary']['companies_created']}")
    logger.info(f"   - Individuals: {results['summary']['individuals_created']}")
    logger.info(f"   - Total Accounts: {results['summary']['total_accounts']}")
    logger.info(f"   - Total Transactions: {results['summary']['total_transactions']}")
    logger.info(f"   - Total Documents: {results['summary']['total_documents']}")
    logger.info(f"   - Total Invoices (AR): {results['summary']['total_invoices']}")
    logger.info(f"   - Total Bills (AP): {results['summary']['total_bills']}")
    logger.info(f"   - Total Payments: {results['summary']['total_payment_transactions']}")
    logger.info(f"   - Total Bank Connections: {results['summary']['total_bank_connections']}")
    logger.info("\n🔑 Login Credentials:")
    for cred in results['credentials']:
        logger.info(f"   [{cred['type']}] {cred['name']}")
        logger.info(f"      Email: {cred['email']}")
        logger.info(f"      Password: {cred['password']}")
    logger.info("="*80)
    
    return results
