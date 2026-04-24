"""
BijakSense — Search Utility Client

Wrapper for the Tavily Search API and Google Maps (for Street View photos)
"""
import httpx
import logging
from typing import List, Dict, Any
from config import settings

logger = logging.getLogger(__name__)

async def search_tavily(query: str, search_depth: str = "advanced") -> List[Dict[str, Any]]:
    """
    Search the web using Tavily API to gather live data on trends or competitors.
    """
    if not settings.tavily_api_key:
        logger.warning("No TAVILY_API_KEY found, using mock data for query: %s", query)
        return [
            {
                "title": "Local Boba Pricing 2026",
                "url": "https://example.com/mock",
                "content": "Average price of Matcha in Petaling Jaya is now RM 11.50.",
                "score": 0.99
            }
        ]
        
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.tavily.com/search",
                json={
                    "api_key": settings.tavily_api_key,
                    "query": query,
                    "search_depth": search_depth,
                    "include_answer": True,
                    "max_results": 3
                },
                timeout=10.0
            )
            response.raise_for_status()
            data = response.json()
            return data.get("results", [])
    except Exception as e:
        logger.error("Failed to query Tavily API: %s", e)
        return []

def get_street_view_url(lat: float, lng: float, heading: int = 151, pitch: int = -5) -> str:
    """
    Generate a Google Street View static image URL for a given coordinate.
    This creates the 'lively' street photos on the Intelligence Map.
    """
    if not settings.google_maps_api_key:
        # Fallback to a placeholder image if no key is provided
        return "https://via.placeholder.com/400x300.png?text=Street+View+Placeholder"
        
    base_url = "https://maps.googleapis.com/maps/api/streetview"
    return f"{base_url}?size=600x300&location={lat},{lng}&heading={heading}&pitch={pitch}&key={settings.google_maps_api_key}"
