"""
Commodity Price API Client — Utility to fetch real-time and historical commodity data.
"""
import httpx
import logging
from datetime import datetime, timedelta
from config import settings

logger = logging.getLogger(__name__)

BASE_URL = "https://api.commoditypriceapi.com/v2"

# Common ingredient → symbol mapping (can be expanded)
COMMODITY_MAPPING = {
    "jasmine rice": "RR-FUT",
    "rice": "RR-FUT",
    "brown sugar": "LS",
    "sugar": "LS",
    "coffee arabica": "CA",
    "coffee robusta": "CR",
    "coffee": "CA",
    "matcha powder": "TEA",
    "tea": "TEA",
    "palm oil": "PO",
    "cocoa": "CC",
    "milk": "MILK",
    "fresh milk": "MILK",
    "beef": "BEEF",
    "chicken": "CHKN",
    "potato": "POTATO",
    "wheat": "ZW-SPOT",
    "corn": "CORN"
}

async def fetch_symbols() -> dict:
    """Fetch the list of supported commodity symbols."""
    if not settings.commodity_price_api_key:
        return {}

    url = f"{BASE_URL}/symbols"
    params = {"apiKey": settings.commodity_price_api_key}
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            if data.get("success"):
                return data.get("data", {})
            return {}
    except Exception as e:
        logger.error(f"Error fetching symbols: {e}")
        return {}

async def fetch_latest_commodity_price(symbol: str, quote: str = "MYR") -> dict:
    """Fetch the latest price for a commodity symbol."""
    if not settings.commodity_price_api_key:
        logger.warning("COMMODITY_PRICE_API_KEY not set")
        return {}

    url = f"{BASE_URL}/rates/latest"
    params = {
        "apiKey": settings.commodity_price_api_key,
        "symbols": symbol,
        "base": quote # Base currency for the rate
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            # API returns { "data": { "rates": { "SYMBOL": price }, ... } }
            if data.get("success"):
                rates = data.get("data", {}).get("rates", {})
                return rates
            return {}
    except Exception as e:
        logger.error(f"Error fetching commodity price: {e}")
        return {}

async def fetch_commodity_fluctuation(symbol: str, days: int = 30, quote: str = "MYR") -> dict:
    """Fetch price fluctuation over a period to determine trend."""
    if not settings.commodity_price_api_key:
        return {}

    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")
    
    url = f"{BASE_URL}/fluctuation"
    params = {
        "apiKey": settings.commodity_price_api_key,
        "symbols": symbol,
        "base": quote,
        "start_date": start_date,
        "end_date": end_date
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            # API returns fluctuation data
            if data.get("success"):
                return data.get("data", {}).get("fluctuation", {}).get(symbol, {})
            return {}
    except Exception as e:
        logger.error(f"Error fetching commodity fluctuation: {e}")
        return {}

def get_symbol_for_item(item_name: str) -> str:
    """Map user inventory item name to commodity symbol."""
    item_lower = item_name.lower()
    for key, symbol in COMMODITY_MAPPING.items():
        if key in item_lower:
            return symbol
    return ""
