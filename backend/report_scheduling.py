"""
Report Scheduling API
Handles automated report generation and email delivery
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime, time
from enum import Enum
import logging
import uuid

from database import report_schedules_collection, scheduled_report_history_collection, integrations_collection
from auth import get_current_user, log_audit_event

router = APIRouter()
logger = logging.getLogger(__name__)


# ==================== Enums ====================

class ReportType(str, Enum):
    """Available report types for scheduling"""
    PROFIT_LOSS = "profit_loss"
    BALANCE_SHEET = "balance_sheet"
    CASH_FLOW = "cash_flow"
    TRIAL_BALANCE = "trial_balance"
    GENERAL_LEDGER = "general_ledger"
    DASHBOARD_SUMMARY = "dashboard_summary"


class Frequency(str, Enum):
    """Schedule frequency options"""
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"


class WeekDay(str, Enum):
    """Days of the week"""
    MONDAY = "monday"
    TUESDAY = "tuesday"
    WEDNESDAY = "wednesday"
    THURSDAY = "thursday"
    FRIDAY = "friday"
    SATURDAY = "saturday"
    SUNDAY = "sunday"


class ExportFormat(str, Enum):
    """Export format options"""
    PDF = "pdf"
    EXCEL = "excel"
    CSV = "csv"


# ==================== Models ====================

class ReportScheduleCreate(BaseModel):
    """Create a new report schedule"""
    name: str
    report_type: ReportType
    frequency: Frequency
    export_format: ExportFormat = ExportFormat.PDF
    
    # Schedule timing
    time_of_day: str = "09:00"  # HH:MM format
    day_of_week: Optional[WeekDay] = None  # For weekly schedules
    day_of_month: Optional[int] = None  # For monthly schedules (1-31)
    
    # Recipients
    recipients: List[EmailStr]
    cc_recipients: Optional[List[EmailStr]] = None
    
    # Report parameters
    include_attachments: bool = True
    include_charts: bool = True
    
    # Status
    enabled: bool = True
    
    @field_validator('day_of_month')
    @classmethod
    def validate_day_of_month(cls, v):
        if v is not None and (v < 1 or v > 31):
            raise ValueError('day_of_month must be between 1 and 31')
        return v
    
    @field_validator('time_of_day')
    @classmethod
    def validate_time_of_day(cls, v):
        try:
            hours, minutes = v.split(':')
            hours = int(hours)
            minutes = int(minutes)
            if hours < 0 or hours > 23 or minutes < 0 or minutes > 59:
                raise ValueError
        except:
            raise ValueError('time_of_day must be in HH:MM format (24-hour)')
        return v


class ReportScheduleUpdate(BaseModel):
    """Update an existing report schedule"""
    name: Optional[str] = None
    frequency: Optional[Frequency] = None
    export_format: Optional[ExportFormat] = None
    time_of_day: Optional[str] = None
    day_of_week: Optional[WeekDay] = None
    day_of_month: Optional[int] = None
    recipients: Optional[List[EmailStr]] = None
    cc_recipients: Optional[List[EmailStr]] = None
    include_attachments: Optional[bool] = None
    include_charts: Optional[bool] = None
    enabled: Optional[bool] = None


class ReportScheduleResponse(BaseModel):
    """Report schedule response"""
    schedule_id: str
    company_id: str
    name: str
    report_type: str
    frequency: str
    export_format: str
    time_of_day: str
    day_of_week: Optional[str]
    day_of_month: Optional[int]
    recipients: List[str]
    cc_recipients: Optional[List[str]]
    enabled: bool
    created_at: datetime
    updated_at: datetime
    last_run: Optional[datetime]
    next_run: Optional[datetime]
    total_runs: int


# ==================== Helper Functions ====================

def calculate_next_run(
    frequency: str,
    time_of_day: str,
    day_of_week: Optional[str] = None,
    day_of_month: Optional[int] = None
) -> datetime:
    """
    Calculate the next run time for a schedule
    """
    from datetime import datetime, timedelta
    import calendar
    
    now = datetime.utcnow()
    hours, minutes = map(int, time_of_day.split(':'))
    
    if frequency == "daily":
        # Next occurrence of the specified time
        next_run = now.replace(hour=hours, minute=minutes, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)
        return next_run
    
    elif frequency == "weekly":
        # Next occurrence of the specified day and time
        weekday_map = {
            "monday": 0, "tuesday": 1, "wednesday": 2,
            "thursday": 3, "friday": 4, "saturday": 5, "sunday": 6
        }
        target_weekday = weekday_map.get(day_of_week.lower(), 0)
        days_ahead = target_weekday - now.weekday()
        if days_ahead <= 0:
            days_ahead += 7
        next_run = now + timedelta(days=days_ahead)
        next_run = next_run.replace(hour=hours, minute=minutes, second=0, microsecond=0)
        return next_run
    
    elif frequency == "monthly":
        # Next occurrence of the specified day of month and time
        target_day = day_of_month or 1
        next_run = now.replace(day=target_day, hour=hours, minute=minutes, second=0, microsecond=0)
        if next_run <= now:
            # Move to next month
            if now.month == 12:
                next_run = next_run.replace(year=now.year + 1, month=1)
            else:
                next_run = next_run.replace(month=now.month + 1)
        return next_run
    
    elif frequency == "quarterly":
        # Next quarter (every 3 months)
        target_day = day_of_month or 1
        next_month = ((now.month - 1) // 3 + 1) * 3 + 1
        if next_month > 12:
            next_month = 1
            next_year = now.year + 1
        else:
            next_year = now.year
        next_run = datetime(next_year, next_month, target_day, hours, minutes)
        if next_run <= now:
            next_month += 3
            if next_month > 12:
                next_month -= 12
                next_year += 1
            next_run = datetime(next_year, next_month, target_day, hours, minutes)
        return next_run
    
    return now + timedelta(days=1)


# ==================== API Endpoints ====================

@router.post("/schedules", response_model=Dict[str, Any])
async def create_schedule(
    schedule: ReportScheduleCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new report schedule
    """
    try:
        # Check if email is configured and enabled
        integration_config = await integrations_collection.find_one({
            "company_id": current_user["company_id"]
        })
        
        if not integration_config or not integration_config.get("email", {}).get("enabled"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email integration must be enabled before creating report schedules"
            )
        
        # Validate frequency-specific fields
        if schedule.frequency == Frequency.WEEKLY and not schedule.day_of_week:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="day_of_week is required for weekly schedules"
            )
        
        if schedule.frequency in [Frequency.MONTHLY, Frequency.QUARTERLY] and not schedule.day_of_month:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="day_of_month is required for monthly/quarterly schedules"
            )
        
        # Calculate next run time
        next_run = calculate_next_run(
            frequency=schedule.frequency.value,
            time_of_day=schedule.time_of_day,
            day_of_week=schedule.day_of_week.value if schedule.day_of_week else None,
            day_of_month=schedule.day_of_month
        )
        
        # Create schedule document
        schedule_id = str(uuid.uuid4())
        schedule_doc = {
            "schedule_id": schedule_id,
            "company_id": current_user["company_id"],
            "created_by": current_user["user_id"],
            "name": schedule.name,
            "report_type": schedule.report_type.value,
            "frequency": schedule.frequency.value,
            "export_format": schedule.export_format.value,
            "time_of_day": schedule.time_of_day,
            "day_of_week": schedule.day_of_week.value if schedule.day_of_week else None,
            "day_of_month": schedule.day_of_month,
            "recipients": schedule.recipients,
            "cc_recipients": schedule.cc_recipients or [],
            "include_attachments": schedule.include_attachments,
            "include_charts": schedule.include_charts,
            "enabled": schedule.enabled,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "last_run": None,
            "next_run": next_run,
            "total_runs": 0
        }
        
        await report_schedules_collection.insert_one(schedule_doc)
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
            action="report_schedule_created",
            details={
                "schedule_id": schedule_id,
                "report_type": schedule.report_type.value,
                "frequency": schedule.frequency.value
            }
        )
        
        return {
            "success": True,
            "schedule_id": schedule_id,
            "message": "Report schedule created successfully",
            "next_run": next_run
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create report schedule"
        )


@router.get("/schedules")
async def list_schedules(
    current_user: dict = Depends(get_current_user)
):
    """
    List all report schedules for the company
    """
    try:
        schedules = await report_schedules_collection.find({
            "company_id": current_user["company_id"]
        }).to_list(length=None)
        
        return {
            "schedules": schedules,
            "total": len(schedules)
        }
        
    except Exception as e:
        logger.error(f"Error listing schedules: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list report schedules"
        )


@router.get("/schedules/{schedule_id}")
async def get_schedule(
    schedule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a specific report schedule
    """
    try:
        schedule = await report_schedules_collection.find_one({
            "schedule_id": schedule_id,
            "company_id": current_user["company_id"]
        })
        
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report schedule not found"
            )
        
        return schedule
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch report schedule"
        )


@router.put("/schedules/{schedule_id}")
async def update_schedule(
    schedule_id: str,
    schedule_update: ReportScheduleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a report schedule
    """
    try:
        # Get existing schedule
        existing = await report_schedules_collection.find_one({
            "schedule_id": schedule_id,
            "company_id": current_user["company_id"]
        })
        
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report schedule not found"
            )
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow()}
        
        if schedule_update.name:
            update_data["name"] = schedule_update.name
        if schedule_update.frequency:
            update_data["frequency"] = schedule_update.frequency.value
        if schedule_update.export_format:
            update_data["export_format"] = schedule_update.export_format.value
        if schedule_update.time_of_day:
            update_data["time_of_day"] = schedule_update.time_of_day
        if schedule_update.day_of_week:
            update_data["day_of_week"] = schedule_update.day_of_week.value
        if schedule_update.day_of_month:
            update_data["day_of_month"] = schedule_update.day_of_month
        if schedule_update.recipients:
            update_data["recipients"] = schedule_update.recipients
        if schedule_update.cc_recipients is not None:
            update_data["cc_recipients"] = schedule_update.cc_recipients
        if schedule_update.include_attachments is not None:
            update_data["include_attachments"] = schedule_update.include_attachments
        if schedule_update.include_charts is not None:
            update_data["include_charts"] = schedule_update.include_charts
        if schedule_update.enabled is not None:
            update_data["enabled"] = schedule_update.enabled
        
        # Recalculate next run if timing changed
        if any(k in update_data for k in ["frequency", "time_of_day", "day_of_week", "day_of_month"]):
            next_run = calculate_next_run(
                frequency=update_data.get("frequency", existing["frequency"]),
                time_of_day=update_data.get("time_of_day", existing["time_of_day"]),
                day_of_week=update_data.get("day_of_week", existing.get("day_of_week")),
                day_of_month=update_data.get("day_of_month", existing.get("day_of_month"))
            )
            update_data["next_run"] = next_run
        
        # Update schedule
        await report_schedules_collection.update_one(
            {"schedule_id": schedule_id},
            {"$set": update_data}
        )
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
            action="report_schedule_updated",
            details={"schedule_id": schedule_id}
        )
        
        return {
            "success": True,
            "message": "Report schedule updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update report schedule"
        )


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a report schedule
    """
    try:
        result = await report_schedules_collection.delete_one({
            "schedule_id": schedule_id,
            "company_id": current_user["company_id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report schedule not found"
            )
        
        # Log audit event
        await log_audit_event(
            user_id=current_user["user_id"],
            company_id=current_user["company_id"],
            action="report_schedule_deleted",
            details={"schedule_id": schedule_id}
        )
        
        return {
            "success": True,
            "message": "Report schedule deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete report schedule"
        )


@router.post("/schedules/{schedule_id}/run")
async def run_schedule_now(
    schedule_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Manually trigger a report schedule to run immediately
    """
    try:
        schedule = await report_schedules_collection.find_one({
            "schedule_id": schedule_id,
            "company_id": current_user["company_id"]
        })
        
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report schedule not found"
            )
        
        # TODO: Implement actual report generation and email sending
        # This would be done by a background task/worker
        logger.info(f"Manual run triggered for schedule {schedule_id}")
        
        return {
            "success": True,
            "message": "Report generation started. You will receive an email shortly."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running schedule: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to run report schedule"
        )


@router.get("/schedules/{schedule_id}/history")
async def get_schedule_history(
    schedule_id: str,
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """
    Get execution history for a schedule
    """
    try:
        # Verify schedule belongs to user's company
        schedule = await report_schedules_collection.find_one({
            "schedule_id": schedule_id,
            "company_id": current_user["company_id"]
        })
        
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report schedule not found"
            )
        
        # Get history
        history = await scheduled_report_history_collection.find({
            "schedule_id": schedule_id
        }).sort("executed_at", -1).limit(limit).to_list(length=limit)
        
        return {
            "history": history,
            "total": len(history)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching schedule history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch schedule history"
        )
