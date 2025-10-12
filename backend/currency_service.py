from fastapi import APIRouter, HTTPException, Depends, status, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from decimal import Decimal
import aiohttp
import asyncio
import logging
from enum import Enum
import uuid

from database import database, users_collection
from auth import get_current_user, log_audit_event

logger = logging.getLogger(__name__)

currency_router = APIRouter()

# Create exchange rates collection
exchange_rates_collection = database.exchange_rates

class CurrencyCode(str, Enum):
    # Major currencies
    USD = "USD"  # US Dollar
    EUR = "EUR"  # Euro
    GBP = "GBP"  # British Pound
    JPY = "JPY"  # Japanese Yen
    CAD = "CAD"  # Canadian Dollar
    AUD = "AUD"  # Australian Dollar
    CHF = "CHF"  # Swiss Franc
    CNY = "CNY"  # Chinese Yuan
    INR = "INR"  # Indian Rupee
    
    # Other popular currencies
    BRL = "BRL"  # Brazilian Real
    MXN = "MXN"  # Mexican Peso
    KRW = "KRW"  # South Korean Won
    SEK = "SEK"  # Swedish Krona
    NOK = "NOK"  # Norwegian Krone
    DKK = "DKK"  # Danish Krone
    PLN = "PLN"  # Polish Zloty
    CZK = "CZK"  # Czech Koruna
    HUF = "HUF"  # Hungarian Forint
    RUB = "RUB"  # Russian Ruble
    
    # Asian currencies
    SGD = "SGD"  # Singapore Dollar
    HKD = "HKD"  # Hong Kong Dollar
    THB = "THB"  # Thai Baht
    MYR = "MYR"  # Malaysian Ringgit
    PHP = "PHP"  # Philippine Peso
    IDR = "IDR"  # Indonesian Rupiah
    VND = "VND"  # Vietnamese Dong
    
    # Middle East & Africa
    AED = "AED"  # UAE Dirham
    SAR = "SAR"  # Saudi Riyal
    EGP = "EGP"  # Egyptian Pound
    ZAR = "ZAR"  # South African Rand
    NGN = "NGN"  # Nigerian Naira
    
    # Others
    NZD = "NZD"  # New Zealand Dollar
    TRY = "TRY"  # Turkish Lira
    ILS = "ILS"  # Israeli Shekel
    CLP = "CLP"  # Chilean Peso
    ARS = "ARS"  # Argentine Peso

class ExchangeRateResponse(BaseModel):
    id: str
    base_currency: CurrencyCode
    target_currency: CurrencyCode
    rate: Decimal
    inverse_rate: Decimal
    date: date
    source: str
    last_updated: datetime
    is_active: bool

class ExchangeRateCreate(BaseModel):
    base_currency: CurrencyCode
    target_currency: CurrencyCode
    rate: Decimal = Field(..., gt=0)
    date: Optional[date] = None
    source: str = "manual"

class CurrencyConversionRequest(BaseModel):
    amount: Decimal
    from_currency: CurrencyCode
    to_currency: CurrencyCode
    rate_date: Optional[date] = None

class CurrencyConversionResponse(BaseModel):
    original_amount: Decimal
    converted_amount: Decimal
    from_currency: CurrencyCode
    to_currency: CurrencyCode
    exchange_rate: Decimal
    rate_date: date
    conversion_timestamp: datetime

# Currency display information
CURRENCY_INFO = {
    "USD": {"name": "US Dollar", "symbol": "$", "decimal_places": 2},
    "EUR": {"name": "Euro", "symbol": "€", "decimal_places": 2},
    "GBP": {"name": "British Pound", "symbol": "£", "decimal_places": 2},
    "JPY": {"name": "Japanese Yen", "symbol": "¥", "decimal_places": 0},
    "CAD": {"name": "Canadian Dollar", "symbol": "C$", "decimal_places": 2},
    "AUD": {"name": "Australian Dollar", "symbol": "A$", "decimal_places": 2},
    "CHF": {"name": "Swiss Franc", "symbol": "CHF", "decimal_places": 2},
    "CNY": {"name": "Chinese Yuan", "symbol": "¥", "decimal_places": 2},
    "INR": {"name": "Indian Rupee", "symbol": "₹", "decimal_places": 2},
    "BRL": {"name": "Brazilian Real", "symbol": "R$", "decimal_places": 2},
    "MXN": {"name": "Mexican Peso", "symbol": "$", "decimal_places": 2},
    "KRW": {"name": "South Korean Won", "symbol": "₩", "decimal_places": 0},
    "SEK": {"name": "Swedish Krona", "symbol": "kr", "decimal_places": 2},
    "NOK": {"name": "Norwegian Krone", "symbol": "kr", "decimal_places": 2},
    "DKK": {"name": "Danish Krone", "symbol": "kr", "decimal_places": 2},
    "PLN": {"name": "Polish Zloty", "symbol": "zł", "decimal_places": 2},
    "CZK": {"name": "Czech Koruna", "symbol": "Kč", "decimal_places": 2},
    "HUF": {"name": "Hungarian Forint", "symbol": "Ft", "decimal_places": 0},
    "RUB": {"name": "Russian Ruble", "symbol": "₽", "decimal_places": 2},
    "SGD": {"name": "Singapore Dollar", "symbol": "S$", "decimal_places": 2},
    "HKD": {"name": "Hong Kong Dollar", "symbol": "HK$", "decimal_places": 2},
    "THB": {"name": "Thai Baht", "symbol": "฿", "decimal_places": 2},
    "MYR": {"name": "Malaysian Ringgit", "symbol": "RM", "decimal_places": 2},
    "PHP": {"name": "Philippine Peso", "symbol": "₱", "decimal_places": 2},
    "IDR": {"name": "Indonesian Rupiah", "symbol": "Rp", "decimal_places": 0},
    "VND": {"name": "Vietnamese Dong", "symbol": "₫", "decimal_places": 0},
    "AED": {"name": "UAE Dirham", "symbol": "د.إ", "decimal_places": 2},
    "SAR": {"name": "Saudi Riyal", "symbol": "﷼", "decimal_places": 2},
    "EGP": {"name": "Egyptian Pound", "symbol": "E£", "decimal_places": 2},
    "ZAR": {"name": "South African Rand", "symbol": "R", "decimal_places": 2},
    "NGN": {"name": "Nigerian Naira", "symbol": "₦", "decimal_places": 2},
    "NZD": {"name": "New Zealand Dollar", "symbol": "NZ$", "decimal_places": 2},
    "TRY": {"name": "Turkish Lira", "symbol": "₺", "decimal_places": 2},
    "ILS": {"name": "Israeli Shekel", "symbol": "₪", "decimal_places": 2},
    "CLP": {"name": "Chilean Peso", "symbol": "CLP$", "decimal_places": 0},
    "ARS": {"name": "Argentine Peso", "symbol": "AR$", "decimal_places": 2},
}

async def fetch_live_exchange_rates(base_currency: str = "USD") -> Dict[str, float]:
    """Fetch live exchange rates from exchangerate-api.com"""
    api_url = f"https://api.exchangerate-api.com/v4/latest/{base_currency}"
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(api_url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("rates", {})
                else:
                    logger.error(f"Failed to fetch exchange rates: HTTP {response.status}")
                    return {}
    except Exception as e:
        logger.error(f"Error fetching exchange rates: {str(e)}")
        return {}

async def update_exchange_rates_from_api(base_currency: str = "USD") -> Dict[str, Any]:
    """Update exchange rates from external API"""
    rates_data = await fetch_live_exchange_rates(base_currency)
    
    if not rates_data:
        return {"success": False, "message": "Failed to fetch rates from API"}
    
    updated_count = 0
    errors = []
    current_date = date.today()
    
    for target_currency, rate_value in rates_data.items():
        try:
            if target_currency == base_currency:
                continue  # Skip same currency
                
            rate_decimal = Decimal(str(rate_value))
            inverse_rate = Decimal("1") / rate_decimal if rate_decimal > 0 else Decimal("0")
            
            # Create exchange rate document
            rate_doc = {
                "_id": f"{base_currency}_{target_currency}_{current_date}",
                "base_currency": base_currency,
                "target_currency": target_currency,
                "rate": float(rate_decimal),
                "inverse_rate": float(inverse_rate),
                "date": datetime.combine(current_date, datetime.min.time()),  # Convert date to datetime
                "source": "exchangerate-api.com",
                "last_updated": datetime.utcnow(),
                "is_active": True
            }
            
            # Update or insert rate
            await exchange_rates_collection.update_one(
                {
                    "base_currency": base_currency,
                    "target_currency": target_currency,
                    "date": current_date
                },
                {"$set": rate_doc},
                upsert=True
            )
            
            updated_count += 1
            
        except Exception as e:
            errors.append(f"{target_currency}: {str(e)}")
            logger.error(f"Error updating rate for {target_currency}: {str(e)}")
    
    return {
        "success": True,
        "updated_count": updated_count,
        "errors": errors,
        "base_currency": base_currency,
        "date": current_date
    }

async def get_exchange_rate(
    from_currency: str, 
    to_currency: str, 
    rate_date: Optional[date] = None
) -> Optional[Decimal]:
    """Get exchange rate between two currencies for a specific date"""
    
    if from_currency == to_currency:
        return Decimal("1")
    
    if rate_date is None:
        rate_date = date.today()
    
    # Convert date to datetime for MongoDB query
    rate_datetime = datetime.combine(rate_date, datetime.min.time()) if isinstance(rate_date, date) else rate_date
    
    # Try to find direct rate
    rate_doc = await exchange_rates_collection.find_one({
        "base_currency": from_currency,
        "target_currency": to_currency,
        "date": rate_datetime,
        "is_active": True
    })
    
    if rate_doc:
        return Decimal(str(rate_doc["rate"]))
    
    # Try inverse rate
    inverse_rate_doc = await exchange_rates_collection.find_one({
        "base_currency": to_currency,
        "target_currency": from_currency,
        "date": rate_datetime,
        "is_active": True
    })
    
    if inverse_rate_doc:
        return Decimal(str(inverse_rate_doc["inverse_rate"]))
    
    # Try via USD (cross-currency calculation)
    if from_currency != "USD" and to_currency != "USD":
        from_to_usd = await get_exchange_rate(from_currency, "USD", rate_date.date() if isinstance(rate_date, datetime) else rate_date)
        usd_to_target = await get_exchange_rate("USD", to_currency, rate_date.date() if isinstance(rate_date, datetime) else rate_date)
        
        if from_to_usd and usd_to_target:
            return from_to_usd * usd_to_target
    
    return None

async def convert_currency(
    amount: Decimal,
    from_currency: str,
    to_currency: str,
    rate_date: Optional[date] = None
) -> Optional[Decimal]:
    """Convert amount from one currency to another"""
    
    exchange_rate = await get_exchange_rate(from_currency, to_currency, rate_date)
    if exchange_rate is None:
        return None
    
    return amount * exchange_rate

@currency_router.get("/currencies", response_model=List[Dict[str, Any]])
async def list_supported_currencies():
    """Get list of all supported currencies with their information"""
    currencies = []
    
    for code, info in CURRENCY_INFO.items():
        currencies.append({
            "code": code,
            "name": info["name"],
            "symbol": info["symbol"],
            "decimal_places": info["decimal_places"]
        })
    
    return sorted(currencies, key=lambda x: x["name"])

@currency_router.get("/rates", response_model=List[ExchangeRateResponse])
async def list_exchange_rates(
    base_currency: Optional[CurrencyCode] = None,
    target_currency: Optional[CurrencyCode] = None,
    rate_date: Optional[date] = None,
    limit: int = 100
):
    """List exchange rates with optional filtering"""
    
    # Build query
    query = {"is_active": True}
    
    if base_currency:
        query["base_currency"] = base_currency
    
    if target_currency:
        query["target_currency"] = target_currency
        
    if rate_date:
        query["date"] = rate_date
    
    # Execute query
    cursor = exchange_rates_collection.find(query).sort("date", -1).limit(limit)
    rates = await cursor.to_list(length=limit)
    
    # Convert to response format
    response_rates = []
    for rate in rates:
        response_rates.append(ExchangeRateResponse(
            id=rate["_id"],
            base_currency=rate["base_currency"],
            target_currency=rate["target_currency"],
            rate=Decimal(str(rate["rate"])),
            inverse_rate=Decimal(str(rate["inverse_rate"])),
            date=rate["date"],
            source=rate["source"],
            last_updated=rate["last_updated"],
            is_active=rate["is_active"]
        ))
    
    return response_rates

@currency_router.post("/rates/update")
async def update_exchange_rates(
    base_currency: CurrencyCode = CurrencyCode.USD,
    current_user: dict = Depends(get_current_user)
):
    """Update exchange rates from external API (Admin only)"""
    
    # Check admin permission
    if current_user.get("role") not in ["admin", "corporate"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update exchange rates"
        )
    
    result = await update_exchange_rates_from_api(base_currency)
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="exchange_rates_updated",
        details={
            "base_currency": base_currency,
            "updated_count": result.get("updated_count", 0),
            "success": result.get("success", False)
        }
    )
    
    return result

@currency_router.post("/rates", response_model=ExchangeRateResponse)
async def create_exchange_rate(
    rate_data: ExchangeRateCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create manual exchange rate entry (Admin only)"""
    
    # Check admin permission
    if current_user.get("role") not in ["admin", "corporate"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create exchange rates"
        )
    
    rate_date = rate_data.date or date.today()
    rate_id = f"{rate_data.base_currency}_{rate_data.target_currency}_{rate_date}"
    
    # Calculate inverse rate
    inverse_rate = Decimal("1") / rate_data.rate if rate_data.rate > 0 else Decimal("0")
    
    # Create rate document
    rate_doc = {
        "_id": rate_id,
        "base_currency": rate_data.base_currency,
        "target_currency": rate_data.target_currency,
        "rate": float(rate_data.rate),
        "inverse_rate": float(inverse_rate),
        "date": rate_date,
        "source": rate_data.source,
        "last_updated": datetime.utcnow(),
        "is_active": True,
        "created_by": current_user["_id"]
    }
    
    # Check if rate already exists
    existing_rate = await exchange_rates_collection.find_one({
        "base_currency": rate_data.base_currency,
        "target_currency": rate_data.target_currency,
        "date": rate_date
    })
    
    if existing_rate:
        # Update existing rate
        await exchange_rates_collection.update_one(
            {"_id": rate_id},
            {"$set": rate_doc}
        )
    else:
        # Insert new rate
        await exchange_rates_collection.insert_one(rate_doc)
    
    # Log audit event
    await log_audit_event(
        user_id=current_user["_id"],
        company_id=current_user["company_id"],
        action="exchange_rate_created",
        details={
            "rate_id": rate_id,
            "base_currency": rate_data.base_currency,
            "target_currency": rate_data.target_currency,
            "rate": float(rate_data.rate)
        }
    )
    
    return ExchangeRateResponse(
        id=rate_id,
        base_currency=rate_data.base_currency,
        target_currency=rate_data.target_currency,
        rate=rate_data.rate,
        inverse_rate=inverse_rate,
        date=rate_date,
        source=rate_data.source,
        last_updated=rate_doc["last_updated"],
        is_active=True
    )

@currency_router.post("/convert", response_model=CurrencyConversionResponse)
async def convert_currency_endpoint(
    conversion_request: CurrencyConversionRequest,
    current_user: dict = Depends(get_current_user)
):
    """Convert amount between currencies"""
    
    rate_date = conversion_request.rate_date or date.today()
    
    # Get exchange rate
    exchange_rate = await get_exchange_rate(
        conversion_request.from_currency,
        conversion_request.to_currency,
        rate_date
    )
    
    if exchange_rate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exchange rate not found for {conversion_request.from_currency} to {conversion_request.to_currency} on {rate_date}"
        )
    
    # Calculate converted amount
    converted_amount = conversion_request.amount * exchange_rate
    
    return CurrencyConversionResponse(
        original_amount=conversion_request.amount,
        converted_amount=converted_amount,
        from_currency=conversion_request.from_currency,
        to_currency=conversion_request.to_currency,
        exchange_rate=exchange_rate,
        rate_date=rate_date,
        conversion_timestamp=datetime.utcnow()
    )

@currency_router.get("/rates/{base_currency}/{target_currency}")
async def get_exchange_rate_endpoint(
    base_currency: CurrencyCode,
    target_currency: CurrencyCode,
    rate_date: Optional[date] = None
):
    """Get exchange rate between two currencies"""
    
    if rate_date is None:
        rate_date = date.today()
    
    exchange_rate = await get_exchange_rate(base_currency, target_currency, rate_date)
    
    if exchange_rate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Exchange rate not found for {base_currency} to {target_currency} on {rate_date}"
        )
    
    return {
        "base_currency": base_currency,
        "target_currency": target_currency,
        "rate": exchange_rate,
        "date": rate_date,
        "timestamp": datetime.utcnow()
    }

# Background task to update rates daily
async def daily_rate_update():
    """Background task to update exchange rates daily"""
    try:
        logger.info("Starting daily exchange rate update...")
        result = await update_exchange_rates_from_api("USD")
        logger.info(f"Daily rate update completed: {result}")
    except Exception as e:
        logger.error(f"Daily rate update failed: {str(e)}")