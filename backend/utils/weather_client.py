"""
Weather data client — fetches from Open-Meteo (free, no API key).

Returns precipitation flux (mm/day) and temperature (°C) for a given
latitude/longitude. These are required features for the price prediction model.
"""
from __future__ import annotations

import logging
from datetime import date, timedelta

import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


async def fetch_current_weather(lat: float, lon: float) -> dict:
    """
    Fetch today's weather from Open-Meteo.

    Returns:
        {
            "temp_celsius": float,
            "precip_flux": float,   # mm total for today
            "date": str,            # ISO date
        }
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_mean,precipitation_sum",
        "timezone": "Asia/Kuala_Lumpur",
        "forecast_days": 1,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(OPEN_METEO_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        daily = data.get("daily", {})
        temps = daily.get("temperature_2m_mean", [None])
        precips = daily.get("precipitation_sum", [None])
        dates = daily.get("time", [str(date.today())])

        return {
            "temp_celsius": temps[0] if temps[0] is not None else 28.0,
            "precip_flux": precips[0] if precips[0] is not None else 0.0,
            "date": dates[0] if dates else str(date.today()),
        }
    except Exception as e:
        logger.warning("Open-Meteo call failed (%s), using defaults", e)
        return {
            "temp_celsius": 28.0,
            "precip_flux": 0.0,
            "date": str(date.today()),
        }


async def fetch_weather_range(lat: float, lon: float, days: int = 7) -> list[dict]:
    """
    Fetch historical + forecast weather for the past N days.

    Returns list of {"date": str, "temp_celsius": float, "precip_flux": float}
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days)

    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_mean,precipitation_sum",
        "timezone": "Asia/Kuala_Lumpur",
        "start_date": str(start_date),
        "end_date": str(end_date),
    }

    try:
        # Use archive endpoint for past dates
        archive_url = "https://archive-api.open-meteo.com/v1/archive"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(archive_url, params=params)
            resp.raise_for_status()
            data = resp.json()

        daily = data.get("daily", {})
        dates = daily.get("time", [])
        temps = daily.get("temperature_2m_mean", [])
        precips = daily.get("precipitation_sum", [])

        results = []
        for i, d in enumerate(dates):
            results.append({
                "date": d,
                "temp_celsius": temps[i] if i < len(temps) and temps[i] is not None else 28.0,
                "precip_flux": precips[i] if i < len(precips) and precips[i] is not None else 0.0,
            })
        return results
    except Exception as e:
        logger.warning("Open-Meteo archive call failed (%s), using defaults", e)
        return [{
            "date": str(end_date),
            "temp_celsius": 28.0,
            "precip_flux": 0.0,
        }]
