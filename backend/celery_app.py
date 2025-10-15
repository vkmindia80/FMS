"""
Celery Application Configuration for AFMS
Handles background task processing for report generation and scheduling
"""
import os
from celery import Celery
from celery.schedules import crontab
import logging

logger = logging.getLogger(__name__)

# Redis configuration
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_DB = int(os.getenv("REDIS_DB", "0"))

# Celery broker and backend URLs
BROKER_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
BACKEND_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"

# Create Celery app
celery_app = Celery(
    "afms_tasks",
    broker=BROKER_URL,
    backend=BACKEND_URL,
    include=["report_tasks"]
)

# Celery configuration
celery_app.conf.update(
    # Task execution settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task result settings
    result_expires=3600,  # Results expire after 1 hour
    result_backend_transport_options={'socket_keepalive': True},
    
    # Worker settings
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
    
    # Retry settings
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    
    # Rate limiting
    task_default_rate_limit="10/m",
    
    # Beat scheduler settings
    beat_schedule={
        "check-scheduled-reports": {
            "task": "report_tasks.check_scheduled_reports",
            "schedule": crontab(minute="*/5"),  # Run every 5 minutes
        },
    },
)

logger.info(f"✅ Celery configured with broker: {BROKER_URL}")
