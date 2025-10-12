"""
Currency service background tasks and utilities
"""
import asyncio
import logging
from datetime import datetime, date
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from currency_service import update_exchange_rates_from_api

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler = None

async def update_daily_rates():
    """Task to update exchange rates daily"""
    try:
        logger.info("🔄 Starting scheduled exchange rate update...")
        
        # Update USD-based rates
        result = await update_exchange_rates_from_api("USD")
        
        if result.get("success"):
            logger.info(f"✅ Exchange rates updated successfully: {result.get('updated_count')} rates")
        else:
            logger.error(f"❌ Failed to update exchange rates: {result.get('message')}")
            
    except Exception as e:
        logger.error(f"❌ Error in scheduled rate update: {str(e)}")

async def initialize_exchange_rates():
    """Initialize exchange rates on first startup"""
    try:
        from database import exchange_rates_collection
        
        # Check if we have any rates
        rate_count = await exchange_rates_collection.count_documents({})
        
        if rate_count == 0:
            logger.info("📊 No exchange rates found. Fetching initial rates...")
            result = await update_exchange_rates_from_api("USD")
            
            if result.get("success"):
                logger.info(f"✅ Initial exchange rates loaded: {result.get('updated_count')} rates")
            else:
                logger.warning("⚠️  Failed to load initial exchange rates")
        else:
            # Check if rates are up to date (today's date)
            today = date.today()
            today_rate_count = await exchange_rates_collection.count_documents({"date": today})
            
            if today_rate_count == 0:
                logger.info("📊 Exchange rates are outdated. Updating...")
                result = await update_exchange_rates_from_api("USD")
                
                if result.get("success"):
                    logger.info(f"✅ Exchange rates updated: {result.get('updated_count')} rates")
            else:
                logger.info(f"✅ Exchange rates are up to date ({today_rate_count} rates for {today})")
                
    except Exception as e:
        logger.error(f"❌ Error initializing exchange rates: {str(e)}")

def start_currency_scheduler():
    """Start the background scheduler for currency updates"""
    global scheduler
    
    try:
        scheduler = AsyncIOScheduler()
        
        # Schedule daily update at 2 AM UTC
        scheduler.add_job(
            update_daily_rates,
            CronTrigger(hour=2, minute=0),
            id="daily_exchange_rate_update",
            name="Update exchange rates daily",
            replace_existing=True
        )
        
        scheduler.start()
        logger.info("✅ Currency rate scheduler started (daily updates at 2 AM UTC)")
        
    except Exception as e:
        logger.error(f"❌ Failed to start currency scheduler: {str(e)}")

def stop_currency_scheduler():
    """Stop the background scheduler"""
    global scheduler
    
    if scheduler:
        scheduler.shutdown()
        logger.info("✅ Currency rate scheduler stopped")
