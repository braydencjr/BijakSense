"""
Location autocomplete router.

Provides lightweight location suggestions for onboarding.
Uses Google Places Autocomplete when GOOGLE_MAPS_API_KEY is configured,
and falls back to OpenStreetMap Nominatim when it is not.
"""
from __future__ import annotations

import logging
from typing import Any
from urllib.parse import quote_plus

import httpx
from fastapi import APIRouter, Query

from config import settings

router = APIRouter(prefix="/api/locations", tags=["Locations"])
logger = logging.getLogger(__name__)


def _normalize_label(value: str) -> str:
    return " ".join(value.split()).strip()


@router.get("/autocomplete")
async def autocomplete_locations(
    q: str = Query(..., min_length=2, max_length=120, description="Search text"),
    region: str = Query("Malaysia", max_length=80),
) -> list[dict[str, Any]]:
    query = _normalize_label(q)
    if not query:
        return []

    if settings.google_maps_api_key:
        try:
            url = "https://maps.googleapis.com/maps/api/place/autocomplete/json"
            params = {
                "input": f"{query}, {region}" if region else query,
                "key": settings.google_maps_api_key,
                "components": "country:my",
                "types": "(cities)",
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(url, params=params)
                response.raise_for_status()
                payload = response.json()

            predictions = payload.get("predictions", [])
            suggestions: list[dict[str, Any]] = []
            for prediction in predictions[:8]:
                description = prediction.get("description")
                if not description:
                    continue
                suggestions.append({
                    "label": description,
                    "value": description,
                    "source": "google_places",
                    "placeId": prediction.get("place_id"),
                })
            if suggestions:
                return suggestions
        except Exception as exc:
            logger.warning("Google Places autocomplete failed, falling back to Nominatim: %s", exc)

    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": f"{query}, {region}" if region else query,
            "format": "jsonv2",
            "limit": 8,
            "addressdetails": 1,
        }
        headers = {
            "Accept-Language": "en",
            "User-Agent": "BijakSense/1.0 (location-autocomplete)",
        }
        async with httpx.AsyncClient(timeout=8.0, headers=headers) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            results = response.json()

        suggestions = []
        for result in results:
            display_name = result.get("display_name")
            if not display_name:
                continue
            suggestions.append({
                "label": display_name,
                "value": display_name,
                "source": "nominatim",
                "lat": result.get("lat"),
                "lng": result.get("lon"),
            })
        return suggestions
    except Exception as exc:
        logger.error("Location autocomplete failed: %s", exc)
        return []