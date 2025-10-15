"""
Celery Tasks for Report Generation and Email Delivery
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import io

from celery import Task
from celery_app import celery_app

# Import async database and services
from motor.motor_asyncio import AsyncIOMotorClient
import os

logger = logging.getLogger(__name__)

# MongoDB connection for tasks
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
mongo_client = None
db = None


def get_db():
    """Get database connection for tasks"""
    global mongo_client, db
    if mongo_client is None:
        mongo_client = AsyncIOMotorClient(MONGO_URL)
        db = mongo_client["afms"]
    return db


class AsyncTask(Task):
    """Custom task class that supports async functions"""
    
    def __call__(self, *args, **kwargs):
        """Execute async task"""
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self.run_async(*args, **kwargs))
        finally:
            loop.close()
    
    async def run_async(self, *args, **kwargs):
        """Override this method in async tasks"""
        raise NotImplementedError


@celery_app.task(bind=True, base=AsyncTask, max_retries=3)
async def generate_and_send_report(
    self,
    schedule_id: str,
    company_id: str,
    report_type: str,
    export_format: str,
    recipients: list,
    cc_recipients: list = None,
    report_params: dict = None
):
    """
    Generate a report and send it via email
    
    Args:
        schedule_id: Report schedule ID
        company_id: Company ID
        report_type: Type of report (profit_loss, balance_sheet, etc.)
        export_format: Format (pdf, excel, csv)
        recipients: List of email recipients
        cc_recipients: Optional CC recipients
        report_params: Optional report parameters
    """
    try:
        db = get_db()
        
        logger.info(f"Generating {report_type} report for company {company_id}")
        
        # Get company details
        company = await db.companies.find_one({"company_id": company_id})
        if not company:
            raise Exception(f"Company {company_id} not found")
        
        company_name = company.get("company_name", "Unknown Company")
        
        # Get email configuration
        integration_config = await db.integrations.find_one({"company_id": company_id})
        if not integration_config or not integration_config.get("email", {}).get("enabled"):
            logger.warning(f"Email not configured for company {company_id}, using mock email")
            email_config = {"provider": "mock"}
        else:
            email_config = integration_config.get("email", {})
        
        # Generate report data based on type
        report_data = await _generate_report_data(db, company_id, report_type, report_params)
        
        # Export report to requested format
        report_file = await _export_report(report_data, report_type, export_format, company_name)
        
        # Send email with report attachment
        success = await _send_report_email(
            email_config=email_config,
            recipients=recipients,
            cc_recipients=cc_recipients,
            report_type=report_type,
            report_file=report_file,
            company_name=company_name,
            export_format=export_format
        )
        
        # Record execution in history
        await _record_execution_history(
            db=db,
            schedule_id=schedule_id,
            company_id=company_id,
            success=success,
            report_type=report_type,
            export_format=export_format,
            recipients=recipients
        )
        
        # Update schedule last_run and total_runs
        await db.report_schedules.update_one(
            {"schedule_id": schedule_id},
            {
                "$set": {"last_run": datetime.utcnow()},
                "$inc": {"total_runs": 1}
            }
        )
        
        logger.info(f"Report {report_type} generated and sent successfully")
        return {"success": True, "message": "Report sent successfully"}
        
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        
        # Record failure in history
        db = get_db()
        await _record_execution_history(
            db=db,
            schedule_id=schedule_id,
            company_id=company_id,
            success=False,
            report_type=report_type,
            export_format=export_format,
            recipients=recipients,
            error_message=str(e)
        )
        
        # Retry with exponential backoff
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


@celery_app.task(bind=True, base=AsyncTask)
async def check_scheduled_reports(self):
    """
    Periodic task to check and trigger scheduled reports
    Runs every 5 minutes via Celery Beat
    """
    try:
        db = get_db()
        now = datetime.utcnow()
        
        # Find all enabled schedules where next_run is due
        schedules = await db.report_schedules.find({
            "enabled": True,
            "next_run": {"$lte": now}
        }).to_list(length=None)
        
        logger.info(f"Found {len(schedules)} scheduled reports to run")
        
        for schedule in schedules:
            try:
                # Trigger report generation task
                generate_and_send_report.delay(
                    schedule_id=schedule["schedule_id"],
                    company_id=schedule["company_id"],
                    report_type=schedule["report_type"],
                    export_format=schedule["export_format"],
                    recipients=schedule["recipients"],
                    cc_recipients=schedule.get("cc_recipients", []),
                    report_params={}
                )
                
                # Calculate next run time
                next_run = _calculate_next_run(schedule)
                
                # Update schedule
                await db.report_schedules.update_one(
                    {"schedule_id": schedule["schedule_id"]},
                    {"$set": {"next_run": next_run}}
                )
                
                logger.info(f"Triggered report for schedule {schedule['schedule_id']}, next run: {next_run}")
                
            except Exception as e:
                logger.error(f"Error processing schedule {schedule['schedule_id']}: {e}")
        
        return {"success": True, "schedules_processed": len(schedules)}
        
    except Exception as e:
        logger.error(f"Error in check_scheduled_reports: {e}")
        raise


# ==================== Helper Functions ====================

async def _generate_report_data(db, company_id: str, report_type: str, params: dict) -> Dict[str, Any]:
    """Generate report data from database"""
    from datetime import datetime, timedelta
    from reports import (
        generate_profit_loss_report,
        generate_balance_sheet_report,
        generate_cash_flow_report,
        generate_trial_balance_report,
        generate_general_ledger_report
    )
    
    # Default to last month if no params provided
    if not params:
        now = datetime.utcnow()
        start_date = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
        end_date = now.replace(day=1) - timedelta(days=1)
        params = {
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d")
        }
    
    # Generate report based on type
    if report_type == "profit_loss":
        return await generate_profit_loss_report(
            db, company_id,
            params.get("start_date"),
            params.get("end_date")
        )
    elif report_type == "balance_sheet":
        return await generate_balance_sheet_report(
            db, company_id,
            params.get("as_of_date", datetime.utcnow().strftime("%Y-%m-%d"))
        )
    elif report_type == "cash_flow":
        return await generate_cash_flow_report(
            db, company_id,
            params.get("start_date"),
            params.get("end_date")
        )
    elif report_type == "trial_balance":
        return await generate_trial_balance_report(
            db, company_id,
            params.get("as_of_date", datetime.utcnow().strftime("%Y-%m-%d"))
        )
    elif report_type == "general_ledger":
        return await generate_general_ledger_report(
            db, company_id,
            params.get("account_id"),
            params.get("start_date"),
            params.get("end_date")
        )
    else:
        raise ValueError(f"Unknown report type: {report_type}")


async def _export_report(report_data: Dict[str, Any], report_type: str, export_format: str, company_name: str) -> Dict[str, Any]:
    """Export report to requested format"""
    from report_exports import ReportExporter
    
    # Add company name to report data
    report_data["company_name"] = company_name
    report_data["generated_at"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Export based on format
    if export_format == "pdf":
        response = ReportExporter.export_to_pdf(report_data, report_type)
    elif export_format == "excel":
        response = ReportExporter.export_to_excel(report_data, report_type)
    elif export_format == "csv":
        response = ReportExporter.export_to_csv(report_data, report_type)
    else:
        raise ValueError(f"Unknown export format: {export_format}")
    
    # Read file content
    file_content = b""
    async for chunk in response.body_iterator:
        file_content += chunk
    
    # Get filename from headers
    content_disposition = response.headers.get("content-disposition", "")
    filename = content_disposition.split("filename=")[-1].strip('"')
    
    return {
        "filename": filename,
        "content": file_content,
        "content_type": response.media_type
    }


async def _send_report_email(
    email_config: Dict[str, Any],
    recipients: list,
    cc_recipients: list,
    report_type: str,
    report_file: Dict[str, Any],
    company_name: str,
    export_format: str
) -> bool:
    """Send report via email"""
    from email_service import send_email, generate_report_email_html
    
    # If mock email, just log
    if email_config.get("provider") == "mock":
        logger.info(f"📧 MOCK EMAIL: Report {report_type}.{export_format} sent to {', '.join(recipients)}")
        logger.info(f"   Company: {company_name}")
        logger.info(f"   File: {report_file['filename']}")
        logger.info(f"   Size: {len(report_file['content'])} bytes")
        return True
    
    # Generate email content
    subject = f"{report_type.replace('_', ' ').title()} Report - {company_name}"
    body = f"""
Dear Team,

Your scheduled {report_type.replace('_', ' ').title()} report is ready.

Report Details:
- Company: {company_name}
- Generated: {datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC')}
- Format: {export_format.upper()}

Please find the report attached to this email.

Best regards,
AFMS - Advanced Finance Management System
    """.strip()
    
    html_body = generate_report_email_html(
        report_type=report_type.replace('_', ' ').title(),
        report_data={
            "generated_at": datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC'),
            "period": "Last Month"
        },
        company_name=company_name
    )
    
    # Prepare attachments
    attachments = [{
        "filename": report_file["filename"],
        "content": report_file["content"]
    }]
    
    # Send email to each recipient
    success = True
    for recipient in recipients:
        result = await send_email(
            to_email=recipient,
            subject=subject,
            body=body,
            email_config=email_config,
            html_body=html_body,
            attachments=attachments,
            cc=cc_recipients
        )
        if not result:
            success = False
            logger.error(f"Failed to send email to {recipient}")
    
    return success


async def _record_execution_history(
    db,
    schedule_id: str,
    company_id: str,
    success: bool,
    report_type: str,
    export_format: str,
    recipients: list,
    error_message: str = None
):
    """Record report execution in history"""
    import uuid
    
    history_doc = {
        "history_id": str(uuid.uuid4()),
        "schedule_id": schedule_id,
        "company_id": company_id,
        "executed_at": datetime.utcnow(),
        "success": success,
        "report_type": report_type,
        "export_format": export_format,
        "recipients": recipients,
        "error_message": error_message,
        "status": "success" if success else "failed"
    }
    
    await db.scheduled_report_history.insert_one(history_doc)


def _calculate_next_run(schedule: Dict[str, Any]) -> datetime:
    """Calculate next run time for a schedule"""
    from report_scheduling import calculate_next_run
    
    return calculate_next_run(
        frequency=schedule["frequency"],
        time_of_day=schedule["time_of_day"],
        day_of_week=schedule.get("day_of_week"),
        day_of_month=schedule.get("day_of_month")
    )
