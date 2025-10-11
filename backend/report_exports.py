"""
Report Export Utilities for AFMS
Provides PDF and Excel export functionality for financial reports
"""
import io
import csv
from typing import Dict, Any, List
from datetime import datetime
from decimal import Decimal
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
import pandas as pd
from fastapi.responses import StreamingResponse
import logging

logger = logging.getLogger(__name__)


class ReportExporter:
    """Handle export of financial reports to various formats"""
    
    @staticmethod
    def export_to_pdf(report_data: Dict[str, Any], report_type: str) -> StreamingResponse:
        """Export report data to PDF format"""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.75*inch, bottomMargin=0.75*inch)
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#333333'),
            spaceAfter=12,
            spaceBefore=12
        )
        
        # Title
        story.append(Paragraph(report_data.get('report_name', 'Financial Report'), title_style))
        story.append(Spacer(1, 0.2*inch))
        
        # Report metadata
        metadata_text = f"""
        <b>Company:</b> {report_data.get('company_name', 'N/A')}<br/>
        <b>Generated:</b> {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p')}<br/>
        <b>Period:</b> {report_data.get('period_start', '')} to {report_data.get('period_end', '')}<br/>
        <b>Currency:</b> {report_data.get('currency', 'USD')}
        """
        story.append(Paragraph(metadata_text, styles['Normal']))
        story.append(Spacer(1, 0.3*inch))
        
        if report_type == 'profit_loss':
            story.extend(ReportExporter._build_profit_loss_pdf(report_data, heading_style))
        elif report_type == 'balance_sheet':
            story.extend(ReportExporter._build_balance_sheet_pdf(report_data, heading_style))
        elif report_type == 'cash_flow':
            story.extend(ReportExporter._build_cash_flow_pdf(report_data, heading_style))
        elif report_type == 'trial_balance':
            story.extend(ReportExporter._build_trial_balance_pdf(report_data, heading_style))
        elif report_type == 'general_ledger':
            story.extend(ReportExporter._build_general_ledger_pdf(report_data, heading_style))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        filename = f"{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        
        return StreamingResponse(
            buffer,
            media_type='application/pdf',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
    
    @staticmethod
    def _build_profit_loss_pdf(data: Dict[str, Any], heading_style) -> List:
        """Build Profit & Loss statement PDF content"""
        elements = []
        
        # Revenue section
        elements.append(Paragraph("<b>REVENUE</b>", heading_style))
        
        revenue_data = [['Account', 'Account Number', 'Amount']]
        for account in data.get('revenue_accounts', []):
            revenue_data.append([
                account.get('account_name', ''),
                account.get('account_number', ''),
                f"${float(account.get('amount', 0)):,.2f}"
            ])
        
        revenue_data.append(['', '<b>Total Revenue</b>', f"<b>${float(data.get('total_revenue', 0)):,.2f}</b>"])
        
        revenue_table = Table(revenue_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        revenue_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ]))
        
        elements.append(revenue_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Expenses section
        elements.append(Paragraph("<b>EXPENSES</b>", heading_style))
        
        expense_data = [['Account', 'Account Number', 'Amount']]
        for account in data.get('expense_accounts', []):
            expense_data.append([
                account.get('account_name', ''),
                account.get('account_number', ''),
                f"${float(account.get('amount', 0)):,.2f}"
            ])
        
        expense_data.append(['', '<b>Total Expenses</b>', f"<b>${float(data.get('total_expenses', 0)):,.2f}</b>"])
        
        expense_table = Table(expense_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        expense_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ]))
        
        elements.append(expense_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Net income
        net_income = float(data.get('net_income', 0))
        net_income_color = colors.green if net_income >= 0 else colors.red
        
        summary_data = [
            ['<b>Gross Profit</b>', f"<b>${float(data.get('gross_profit', 0)):,.2f}</b>"],
            ['<b>Net Income</b>', f"<b>${net_income:,.2f}</b>"]
        ]
        
        summary_table = Table(summary_data, colWidths=[4.5*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('LINEABOVE', (0, 0), (-1, 0), 2, colors.black),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
            ('TEXTCOLOR', (1, -1), (1, -1), net_income_color),
        ]))
        
        elements.append(summary_table)
        
        return elements
    
    @staticmethod
    def _build_balance_sheet_pdf(data: Dict[str, Any], heading_style) -> List:
        """Build Balance Sheet PDF content"""
        elements = []
        
        # Assets section
        elements.append(Paragraph("<b>ASSETS</b>", heading_style))
        
        asset_data = [['Account', 'Account Number', 'Balance']]
        
        # Current assets
        asset_data.append(['<b>Current Assets</b>', '', ''])
        for account in data.get('asset_accounts', []):
            if account.get('is_current'):
                asset_data.append([
                    f"  {account.get('account_name', '')}",
                    account.get('account_number', ''),
                    f"${float(account.get('balance', 0)):,.2f}"
                ])
        
        asset_data.append(['', '<i>Total Current Assets</i>', f"<i>${float(data.get('current_assets', 0)):,.2f}</i>"])
        
        # Non-current assets
        asset_data.append(['<b>Non-Current Assets</b>', '', ''])
        for account in data.get('asset_accounts', []):
            if not account.get('is_current'):
                asset_data.append([
                    f"  {account.get('account_name', '')}",
                    account.get('account_number', ''),
                    f"${float(account.get('balance', 0)):,.2f}"
                ])
        
        asset_data.append(['', '<i>Total Non-Current Assets</i>', f"<i>${float(data.get('non_current_assets', 0)):,.2f}</i>"])
        asset_data.append(['', '<b>TOTAL ASSETS</b>', f"<b>${float(data.get('total_assets', 0)):,.2f}</b>"])
        
        asset_table = Table(asset_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        asset_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ]))
        
        elements.append(asset_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Liabilities section
        elements.append(Paragraph("<b>LIABILITIES</b>", heading_style))
        
        liability_data = [['Account', 'Account Number', 'Balance']]
        
        # Current liabilities
        liability_data.append(['<b>Current Liabilities</b>', '', ''])
        for account in data.get('liability_accounts', []):
            if account.get('is_current'):
                liability_data.append([
                    f"  {account.get('account_name', '')}",
                    account.get('account_number', ''),
                    f"${float(account.get('balance', 0)):,.2f}"
                ])
        
        liability_data.append(['', '<i>Total Current Liabilities</i>', f"<i>${float(data.get('current_liabilities', 0)):,.2f}</i>"])
        
        # Long-term liabilities
        liability_data.append(['<b>Long-Term Liabilities</b>', '', ''])
        for account in data.get('liability_accounts', []):
            if not account.get('is_current'):
                liability_data.append([
                    f"  {account.get('account_name', '')}",
                    account.get('account_number', ''),
                    f"${float(account.get('balance', 0)):,.2f}"
                ])
        
        liability_data.append(['', '<i>Total Long-Term Liabilities</i>', f"<i>${float(data.get('long_term_liabilities', 0)):,.2f}</i>"])
        liability_data.append(['', '<b>TOTAL LIABILITIES</b>', f"<b>${float(data.get('total_liabilities', 0)):,.2f}</b>"])
        
        liability_table = Table(liability_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        liability_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ]))
        
        elements.append(liability_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Equity section
        elements.append(Paragraph("<b>EQUITY</b>", heading_style))
        
        equity_data = [['Account', 'Account Number', 'Balance']]
        
        for account in data.get('equity_accounts', []):
            equity_data.append([
                account.get('account_name', ''),
                account.get('account_number', ''),
                f"${float(account.get('balance', 0)):,.2f}"
            ])
        
        equity_data.append(['', '<b>TOTAL EQUITY</b>', f"<b>${float(data.get('total_equity', 0)):,.2f}</b>"])
        
        equity_table = Table(equity_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        equity_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ]))
        
        elements.append(equity_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Balance equation check
        total_liabilities_equity = float(data.get('total_liabilities', 0)) + float(data.get('total_equity', 0))
        balance_check = Table([
            ['', '<b>TOTAL LIABILITIES + EQUITY</b>', f"<b>${total_liabilities_equity:,.2f}</b>"],
        ], colWidths=[3*inch, 1.5*inch, 1.5*inch])
        balance_check.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('LINEABOVE', (0, 0), (-1, 0), 2, colors.black),
        ]))
        elements.append(balance_check)
        
        # Balance validation
        if data.get('is_balanced', False):
            elements.append(Spacer(1, 0.2*inch))
            elements.append(Paragraph("<font color='green'><b>✓ Balance Sheet is Balanced</b></font>", heading_style))
        
        return elements
    
    @staticmethod
    def _build_cash_flow_pdf(data: Dict[str, Any], heading_style) -> List:
        """Build Cash Flow statement PDF content"""
        elements = []
        
        # Operating activities
        elements.append(Paragraph("<b>CASH FLOWS FROM OPERATING ACTIVITIES</b>", heading_style))
        
        operating_data = [['Description', 'Amount']]
        for activity in data.get('operating_activities', []):
            operating_data.append([
                activity.get('description', ''),
                f"${float(activity.get('amount', 0)):,.2f}"
            ])
        
        operating_data.append(['<b>Net Cash from Operating Activities</b>', 
                              f"<b>${float(data.get('operating_cash_flow', 0)):,.2f}</b>"])
        
        operating_table = Table(operating_data, colWidths=[4*inch, 2*inch])
        operating_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ]))
        
        elements.append(operating_table)
        elements.append(Spacer(1, 0.2*inch))
        
        # Similar sections for investing and financing activities
        # ... Implementation continues
        
        return elements
    
    @staticmethod
    def _build_trial_balance_pdf(data: Dict[str, Any], heading_style) -> List:
        """Build Trial Balance PDF content"""
        elements = []
        
        elements.append(Paragraph("<b>TRIAL BALANCE</b>", heading_style))
        
        tb_data = [['Account Number', 'Account Name', 'Debit', 'Credit']]
        
        total_debits = 0
        total_credits = 0
        
        for account in data.get('accounts', []):
            debit = float(account.get('debit_balance', 0))
            credit = float(account.get('credit_balance', 0))
            
            total_debits += debit
            total_credits += credit
            
            tb_data.append([
                account.get('account_number', ''),
                account.get('account_name', ''),
                f"${debit:,.2f}" if debit > 0 else '',
                f"${credit:,.2f}" if credit > 0 else ''
            ])
        
        tb_data.append([
            '', '<b>TOTALS</b>',
            f"<b>${total_debits:,.2f}</b>",
            f"<b>${total_credits:,.2f}</b>"
        ])
        
        tb_table = Table(tb_data, colWidths=[1.2*inch, 2.8*inch, 1.5*inch, 1.5*inch])
        tb_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (3, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ]))
        
        elements.append(tb_table)
        
        # Balance check
        if abs(total_debits - total_credits) < 0.01:
            elements.append(Spacer(1, 0.2*inch))
            elements.append(Paragraph("<font color='green'><b>✓ Trial Balance is Balanced</b></font>", 
                                    heading_style))
        else:
            elements.append(Spacer(1, 0.2*inch))
            elements.append(Paragraph(f"<font color='red'><b>⚠ Trial Balance is Out of Balance by ${abs(total_debits - total_credits):,.2f}</b></font>", 
                                    heading_style))
        
        return elements
    
    @staticmethod
    def _build_general_ledger_pdf(data: Dict[str, Any], heading_style) -> List:
        """Build General Ledger PDF content"""
        elements = []
        
        for account_data in data.get('accounts', []):
            elements.append(Paragraph(
                f"<b>{account_data.get('account_number', '')} - {account_data.get('account_name', '')}</b>",
                heading_style
            ))
            
            gl_data = [['Date', 'Description', 'Reference', 'Debit', 'Credit', 'Balance']]
            
            for txn in account_data.get('transactions', []):
                gl_data.append([
                    txn.get('date', ''),
                    txn.get('description', '')[:40],  # Truncate long descriptions
                    txn.get('reference', ''),
                    f"${float(txn.get('debit', 0)):,.2f}" if txn.get('debit') else '',
                    f"${float(txn.get('credit', 0)):,.2f}" if txn.get('credit') else '',
                    f"${float(txn.get('balance', 0)):,.2f}"
                ])
            
            gl_table = Table(gl_data, colWidths=[0.8*inch, 2.2*inch, 0.8*inch, 1*inch, 1*inch, 1*inch])
            gl_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (2, -1), 'LEFT'),
                ('ALIGN', (3, 0), (5, -1), 'RIGHT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ]))
            
            elements.append(gl_table)
            elements.append(Spacer(1, 0.3*inch))
        
        return elements
    
    @staticmethod
    def export_to_excel(report_data: Dict[str, Any], report_type: str) -> StreamingResponse:
        """Export report data to Excel format"""
        
        output = io.BytesIO()
        
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            if report_type == 'profit_loss':
                ReportExporter._write_profit_loss_excel(report_data, writer)
            elif report_type == 'balance_sheet':
                ReportExporter._write_balance_sheet_excel(report_data, writer)
            elif report_type == 'cash_flow':
                ReportExporter._write_cash_flow_excel(report_data, writer)
            elif report_type == 'trial_balance':
                ReportExporter._write_trial_balance_excel(report_data, writer)
            elif report_type == 'general_ledger':
                ReportExporter._write_general_ledger_excel(report_data, writer)
        
        output.seek(0)
        
        filename = f"{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.xlsx"
        
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
    
    @staticmethod
    def _write_profit_loss_excel(data: Dict[str, Any], writer):
        """Write Profit & Loss to Excel"""
        revenue_df = pd.DataFrame(data.get('revenue_accounts', []))
        expense_df = pd.DataFrame(data.get('expense_accounts', []))
        
        # Write revenue
        revenue_df.to_excel(writer, sheet_name='Profit & Loss', startrow=2, index=False)
        
        # Write expenses
        expense_df.to_excel(writer, sheet_name='Profit & Loss', 
                           startrow=len(revenue_df) + 5, index=False)
        
        # Get worksheet to add headers
        worksheet = writer.sheets['Profit & Loss']
        worksheet.cell(1, 1, data.get('report_name', 'Profit & Loss Statement'))
        worksheet.cell(2, 1, 'REVENUE')
        worksheet.cell(len(revenue_df) + 4, 1, 'EXPENSES')
    
    @staticmethod
    def _write_balance_sheet_excel(data: Dict[str, Any], writer):
        """Write Balance Sheet to Excel"""
        # Create separate DataFrames for assets, liabilities, and equity
        assets_df = pd.DataFrame(data.get('asset_accounts', []))
        liabilities_df = pd.DataFrame(data.get('liability_accounts', []))
        equity_df = pd.DataFrame(data.get('equity_accounts', []))
        
        assets_df.to_excel(writer, sheet_name='Balance Sheet', startrow=2, index=False)
        liabilities_df.to_excel(writer, sheet_name='Balance Sheet', 
                               startrow=len(assets_df) + 5, index=False)
        equity_df.to_excel(writer, sheet_name='Balance Sheet', 
                          startrow=len(assets_df) + len(liabilities_df) + 8, index=False)
    
    @staticmethod
    def _write_cash_flow_excel(data: Dict[str, Any], writer):
        """Write Cash Flow to Excel"""
        operating_df = pd.DataFrame(data.get('operating_activities', []))
        investing_df = pd.DataFrame(data.get('investing_activities', []))
        financing_df = pd.DataFrame(data.get('financing_activities', []))
        
        operating_df.to_excel(writer, sheet_name='Cash Flow', startrow=2, index=False)
        investing_df.to_excel(writer, sheet_name='Cash Flow', 
                             startrow=len(operating_df) + 5, index=False)
        financing_df.to_excel(writer, sheet_name='Cash Flow', 
                             startrow=len(operating_df) + len(investing_df) + 8, index=False)
    
    @staticmethod
    def _write_trial_balance_excel(data: Dict[str, Any], writer):
        """Write Trial Balance to Excel"""
        df = pd.DataFrame(data.get('accounts', []))
        df.to_excel(writer, sheet_name='Trial Balance', index=False)
        
        # Add totals row
        worksheet = writer.sheets['Trial Balance']
        last_row = len(df) + 2
        worksheet.cell(last_row, 1, 'TOTALS')
        worksheet.cell(last_row, 3, f'=SUM(C2:C{last_row-1})')  # Debit total
        worksheet.cell(last_row, 4, f'=SUM(D2:D{last_row-1})')  # Credit total
    
    @staticmethod
    def _write_general_ledger_excel(data: Dict[str, Any], writer):
        """Write General Ledger to Excel"""
        # Create separate sheet for each account
        for i, account_data in enumerate(data.get('accounts', [])):
            sheet_name = f"Account {i+1}"[:31]  # Excel sheet name limit
            df = pd.DataFrame(account_data.get('transactions', []))
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # Add account info
            worksheet = writer.sheets[sheet_name]
            worksheet.insert_rows(0, 2)
            worksheet.cell(1, 1, f"{account_data.get('account_number', '')} - {account_data.get('account_name', '')}")
    
    @staticmethod
    def export_to_csv(report_data: Dict[str, Any], report_type: str) -> StreamingResponse:
        """Export report data to CSV format"""
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write report header
        writer.writerow([report_data.get('report_name', 'Financial Report')])
        writer.writerow([f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"])
        writer.writerow([f"Period: {report_data.get('period_start', '')} to {report_data.get('period_end', '')}"])
        writer.writerow([])
        
        if report_type == 'profit_loss':
            ReportExporter._write_profit_loss_csv(report_data, writer)
        elif report_type == 'balance_sheet':
            ReportExporter._write_balance_sheet_csv(report_data, writer)
        elif report_type == 'trial_balance':
            ReportExporter._write_trial_balance_csv(report_data, writer)
        
        output.seek(0)
        
        filename = f"{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type='text/csv',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'}
        )
    
    @staticmethod
    def _write_profit_loss_csv(data: Dict[str, Any], writer):
        """Write Profit & Loss to CSV"""
        writer.writerow(['REVENUE'])
        writer.writerow(['Account', 'Account Number', 'Amount'])
        
        for account in data.get('revenue_accounts', []):
            writer.writerow([
                account.get('account_name', ''),
                account.get('account_number', ''),
                float(account.get('amount', 0))
            ])
        
        writer.writerow(['Total Revenue', '', float(data.get('total_revenue', 0))])
        writer.writerow([])
        
        writer.writerow(['EXPENSES'])
        writer.writerow(['Account', 'Account Number', 'Amount'])
        
        for account in data.get('expense_accounts', []):
            writer.writerow([
                account.get('account_name', ''),
                account.get('account_number', ''),
                float(account.get('amount', 0))
            ])
        
        writer.writerow(['Total Expenses', '', float(data.get('total_expenses', 0))])
        writer.writerow([])
        writer.writerow(['Net Income', '', float(data.get('net_income', 0))])
    
    @staticmethod
    def _write_balance_sheet_csv(data: Dict[str, Any], writer):
        """Write Balance Sheet to CSV"""
        writer.writerow(['ASSETS'])
        writer.writerow(['Account', 'Account Number', 'Balance'])
        
        for account in data.get('asset_accounts', []):
            writer.writerow([
                account.get('account_name', ''),
                account.get('account_number', ''),
                float(account.get('balance', 0))
            ])
        
        writer.writerow(['Total Assets', '', float(data.get('total_assets', 0))])
        writer.writerow([])
        
        writer.writerow(['LIABILITIES'])
        writer.writerow(['Account', 'Account Number', 'Balance'])
        
        for account in data.get('liability_accounts', []):
            writer.writerow([
                account.get('account_name', ''),
                account.get('account_number', ''),
                float(account.get('balance', 0))
            ])
        
        writer.writerow(['Total Liabilities', '', float(data.get('total_liabilities', 0))])
        writer.writerow([])
        
        writer.writerow(['EQUITY'])
        writer.writerow(['Account', 'Account Number', 'Balance'])
        
        for account in data.get('equity_accounts', []):
            writer.writerow([
                account.get('account_name', ''),
                account.get('account_number', ''),
                float(account.get('balance', 0))
            ])
        
        writer.writerow(['Total Equity', '', float(data.get('total_equity', 0))])
    
    @staticmethod
    def _write_trial_balance_csv(data: Dict[str, Any], writer):
        """Write Trial Balance to CSV"""
        writer.writerow(['Account Number', 'Account Name', 'Debit', 'Credit'])
        
        total_debits = 0
        total_credits = 0
        
        for account in data.get('accounts', []):
            debit = float(account.get('debit_balance', 0))
            credit = float(account.get('credit_balance', 0))
            
            total_debits += debit
            total_credits += credit
            
            writer.writerow([
                account.get('account_number', ''),
                account.get('account_name', ''),
                debit if debit > 0 else '',
                credit if credit > 0 else ''
            ])
        
        writer.writerow(['', 'TOTALS', total_debits, total_credits])
