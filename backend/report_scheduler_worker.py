"""
Report Scheduler Worker
Handles automated report generation and email delivery using APScheduler
"""

import logging
import asyncio
from datetime import datetime, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from typing import Dict, Any, List
import io

from database import (
    report_schedules_collection,
    scheduled_report_history_collection,
    companies_collection,
    users_collection,
    integrations_collection
)
from reports import (
    generate_profit_loss,
    generate_balance_sheet,
    generate_cash_flow_statement,
    generate_trial_balance,
    generate_general_ledger
)
from report_exports import ReportExporter
from email_service import send_email, generate_report_email_html, is_email_configured

logger = logging.getLogger(__name__)

# Global scheduler instance
report_scheduler = None


def initialize_report_scheduler():
    """Initialize the report scheduler"""
    global report_scheduler
    
    if report_scheduler is None:
        report_scheduler = AsyncIOScheduler()
        report_scheduler.start()
        logger.info("✅ Report scheduler initialized")
        
        # Schedule the check for due reports (runs every minute)
        report_scheduler.add_job(
            check_and_run_due_schedules,
            CronTrigger(minute='*'),  # Every minute
            id='check_due_reports',
            replace_existing=True
        )
        logger.info("✅ Report checker scheduled (runs every minute)")
    
    return report_scheduler


def shutdown_report_scheduler():
    """Shutdown the report scheduler"""
    global report_scheduler
    
    if report_scheduler:
        report_scheduler.shutdown()
        report_scheduler = None
        logger.info("✅ Report scheduler stopped")


async def check_and_run_due_schedules():
    """Check for schedules that are due to run and execute them"""
    try:
        now = datetime.utcnow()
        
        # Find all enabled schedules that are due to run
        due_schedules = await report_schedules_collection.find({
            "enabled": True,
            "next_run": {"$lte": now}
        }).to_list(length=None)
        
        if due_schedules:
            logger.info(f"Found {len(due_schedules)} due schedule(s) to run")
        
        for schedule in due_schedules:
            try:
                # Run the schedule
                await execute_scheduled_report(schedule)
                
                # Calculate next run time
                next_run = calculate_next_run_time(schedule)
                
                # Update schedule
                await report_schedules_collection.update_one(
                    {"_id": schedule["_id"]},
                    {
                        "$set": {
                            "last_run": now,
                            "next_run": next_run
                        }
                    }
                )
                
                logger.info(f"Schedule {schedule['schedule_id']} completed. Next run: {next_run}")
                
            except Exception as e:
                logger.error(f"Error executing schedule {schedule.get('schedule_id')}: {e}")
                # Record failure in history
                await record_execution_history(
                    schedule_id=schedule.get("schedule_id"),
                    status="failed",
                    error_message=str(e)
                )
                
    except Exception as e:
        logger.error(f"Error checking due schedules: {e}")


async def execute_scheduled_report(schedule: Dict[str, Any]):
    """Execute a scheduled report: generate and email"""
    schedule_id = schedule.get("schedule_id")
    company_id = schedule.get("company_id")
    report_type = schedule.get("report_type")
    export_format = schedule.get("export_format", "pdf")
    
    logger.info(f"Executing schedule {schedule_id}: {report_type} ({export_format})")
    
    try:
        # Get company information
        company = await companies_collection.find_one({"_id": company_id})
        if not company:
            raise Exception(f"Company {company_id} not found")
        
        # Get email configuration
        email_config_doc = await integrations_collection.find_one({
            "company_id": company_id,
            "integration_type": "email"
        })
        
        if not email_config_doc or not email_config_doc.get("enabled", False):
            raise Exception("Email integration not configured or disabled")
        
        email_config = email_config_doc.get("config", {})
        
        # Generate the report
        report_data = await generate_report_data(
            company_id=company_id,
            report_type=report_type
        )
        
        if not report_data:
            raise Exception("Failed to generate report data")
        
        # Export report to requested format
        report_bytes = await export_report(
            report_data=report_data,
            report_type=report_type,
            export_format=export_format
        )
        
        if not report_bytes:
            raise Exception("Failed to export report")
        
        # Prepare email
        subject = f"{schedule.get('name', 'Scheduled Report')} - {datetime.utcnow().strftime('%B %d, %Y')}"
        
        # Plain text body
        body = f"""
Dear Team,

Your scheduled {report_type.replace('_', ' ').title()} report is ready.

Report Details:
- Report: {schedule.get('name', 'Scheduled Report')}
- Company: {company.get('name', 'N/A')}
- Generated: {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC')}
- Format: {export_format.upper()}

Please find the complete report attached to this email.

Best regards,
AFMS - Advanced Finance Management System
"""
        
        # HTML body
        html_body = generate_report_email_html(
            report_type=report_type.replace('_', ' ').title(),
            report_data={
                'generated_at': datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC'),
                'period': report_data.get('period_start', 'N/A') + ' to ' + report_data.get('period_end', 'N/A')
            },
            company_name=company.get('name', 'N/A')
        )
        
        # Prepare attachment
        filename = f"{report_type}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.{export_format}"
        attachments = [
            {
                "filename": filename,
                "content": report_bytes
            }
        ] if schedule.get("include_attachments", True) else None
        
        # Send emails to all recipients
        recipients = schedule.get("recipients", [])
        cc_recipients = schedule.get("cc_recipients", [])
        
        success_count = 0
        failed_recipients = []
        
        for recipient in recipients:
            try:
                success = await send_email(
                    to_email=recipient,
                    subject=subject,
                    body=body,
                    html_body=html_body,
                    email_config=email_config,
                    attachments=attachments,
                    cc=cc_recipients if cc_recipients else None
                )
                
                if success:
                    success_count += 1
                else:
                    failed_recipients.append(recipient)
                    
            except Exception as e:
                logger.error(f"Failed to send email to {recipient}: {e}")
                failed_recipients.append(recipient)
        
        # Record execution in history
        await record_execution_history(
            schedule_id=schedule_id,
            status="completed" if success_count > 0 else "failed",
            recipients_sent=success_count,
            recipients_failed=len(failed_recipients),
            failed_recipients=failed_recipients,
            report_type=report_type,
            export_format=export_format
        )
        
        if success_count > 0:
            logger.info(f"Schedule {schedule_id} completed successfully. Sent to {success_count} recipient(s)")
        else:
            raise Exception(f"Failed to send email to any recipients")
            
    except Exception as e:
        logger.error(f"Error executing scheduled report: {e}")
        raise


async def generate_report_data(company_id: str, report_type: str) -> Dict[str, Any]:
    """Generate report data based on report type"""
    
    # Default date range: last month
    end_date = datetime.utcnow()
    start_date = end_date.replace(day=1) - timedelta(days=1)
    start_date = start_date.replace(day=1)
    
    try:
        if report_type == "profit_loss":
            return await generate_profit_loss(
                company_id=company_id,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat()
            )
        elif report_type == "balance_sheet":
            return await generate_balance_sheet(
                company_id=company_id,
                as_of_date=end_date.isoformat()
            )
        elif report_type == "cash_flow":
            return await generate_cash_flow_statement(
                company_id=company_id,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat()
            )
        elif report_type == "trial_balance":
            return await generate_trial_balance(
                company_id=company_id,
                as_of_date=end_date.isoformat()
            )
        elif report_type == "general_ledger":
            return await generate_general_ledger(
                company_id=company_id,
                start_date=start_date.isoformat(),
                end_date=end_date.isoformat()
            )
        else:
            raise ValueError(f"Unknown report type: {report_type}")
            
    except Exception as e:
        logger.error(f"Error generating report data: {e}")
        return None


async def export_report(report_data: Dict[str, Any], report_type: str, export_format: str) -> bytes:
    """Export report to requested format"""
    try:
        if export_format == "pdf":
            response = ReportExporter.export_to_pdf(report_data, report_type)
            # Read the response body
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            return body
            
        elif export_format == "excel":
            response = ReportExporter.export_to_excel(report_data, report_type)
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            return body
            
        elif export_format == "csv":
            response = ReportExporter.export_to_csv(report_data, report_type)
            body = b""
            async for chunk in response.body_iterator:
                body += chunk if isinstance(chunk, bytes) else chunk.encode()
            return body
        else:
            raise ValueError(f"Unknown export format: {export_format}")
            
    except Exception as e:
        logger.error(f"Error exporting report: {e}")
        return None


async def record_execution_history(
    schedule_id: str,
    status: str,
    recipients_sent: int = 0,
    recipients_failed: int = 0,
    failed_recipients: List[str] = None,
    report_type: str = None,
    export_format: str = None,
    error_message: str = None
):
    """Record execution history for a schedule"""
    try:
        history_record = {
            "schedule_id": schedule_id,
            "executed_at": datetime.utcnow(),
            "status": status,  # completed, failed, partial
            "recipients_sent": recipients_sent,
            "recipients_failed": recipients_failed,
            "failed_recipients": failed_recipients or [],
            "report_type": report_type,
            "export_format": export_format,
            "error_message": error_message
        }
        
        await scheduled_report_history_collection.insert_one(history_record)
        
    except Exception as e:
        logger.error(f"Error recording execution history: {e}")


def calculate_next_run_time(schedule: Dict[str, Any]) -> datetime:
    """Calculate the next run time for a schedule"""
    frequency = schedule.get("frequency")
    time_of_day = schedule.get("time_of_day", "09:00")  # HH:MM
    
    # Parse time
    hours, minutes = map(int, time_of_day.split(':'))
    
    now = datetime.utcnow()
    
    if frequency == "daily":
        # Next occurrence of the specified time
        next_run = now.replace(hour=hours, minute=minutes, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        return next_run
        
    elif frequency == "weekly":
        # Next occurrence of the specified day and time
        day_of_week = schedule.get("day_of_week", "monday")
        weekday_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
            "friday": 4, "saturday": 5, "sunday": 6
        }
        target_weekday = weekday_map.get(day_of_week, 0)
        
        # Calculate days until target weekday
        days_ahead = target_weekday - now.weekday()
        if days_ahead <= 0:  # Target day already happened this week
            days_ahead += 7
        
        next_run = now + timedelta(days=days_ahead)
        next_run = next_run.replace(hour=hours, minute=minutes, second=0, microsecond=0)
        
        # If the time has already passed today and it's the target day, add a week
        if days_ahead == 0 and next_run <= now:
            next_run += timedelta(days=7)
        
        return next_run
        
    elif frequency == "monthly":
        # Next occurrence of the specified day of month and time
        day_of_month = schedule.get("day_of_month", 1)
        
        # Try current month
        try:
            next_run = now.replace(day=day_of_month, hour=hours, minute=minutes, second=0, microsecond=0)
        except ValueError:
            # Day doesn't exist in current month (e.g., Feb 30), use last day
            import calendar
            last_day = calendar.monthrange(now.year, now.month)[1]
            next_run = now.replace(day=last_day, hour=hours, minute=minutes, second=0, microsecond=0)
        
        # If this time has passed, go to next month
        if next_run <= now:
            if now.month == 12:
                next_year = now.year + 1
                next_month = 1
            else:
                next_year = now.year
                next_month = now.month + 1
            
            try:
                next_run = now.replace(year=next_year, month=next_month, day=day_of_month,
                                      hour=hours, minute=minutes, second=0, microsecond=0)
            except ValueError:
                # Day doesn't exist in next month
                import calendar
                last_day = calendar.monthrange(next_year, next_month)[1]
                next_run = now.replace(year=next_year, month=next_month, day=last_day,
                                      hour=hours, minute=minutes, second=0, microsecond=0)
        
        return next_run
        
    elif frequency == "quarterly":
        # Next occurrence of first day of quarter
        current_quarter = (now.month - 1) // 3
        next_quarter_month = (current_quarter + 1) * 3 + 1
        
        if next_quarter_month > 12:
            next_year = now.year + 1
            next_quarter_month = 1
        else:
            next_year = now.year
        
        next_run = now.replace(year=next_year, month=next_quarter_month, day=1,
                               hour=hours, minute=minutes, second=0, microsecond=0)
        
        return next_run
    
    else:
        # Default: tomorrow at the specified time
        next_run = now.replace(hour=hours, minute=minutes, second=0, microsecond=0) + timedelta(days=1)
        return next_run


async def trigger_manual_run(schedule_id: str, company_id: str):
    """Manually trigger a schedule to run immediately"""
    try:
        schedule = await report_schedules_collection.find_one({
            "schedule_id": schedule_id,
            "company_id": company_id
        })
        
        if not schedule:
            raise Exception("Schedule not found")
        
        # Execute the schedule
        await execute_scheduled_report(schedule)
        
        logger.info(f"Manual run completed for schedule {schedule_id}")
        return True
        
    except Exception as e:
        logger.error(f"Error in manual run: {e}")
        return False
