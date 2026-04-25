"""
BijakSense — AI Analysis Router
Combines ML price predictions with GLM-powered natural language insights.
"""
import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from utils.price_predictor import analyze_inventory, predict_price, get_merchant_location
from utils.weather_client import fetch_current_weather
from utils.glm_client import call_glm_json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["AI Analysis"])

MERCHANT_ID = "8899d441-6234-4ed7-85ee-64ffdef25478"

INSIGHT_SYSTEM_PROMPT = """
You are the AI Inventory Analyst for MerchantMind, a supply chain intelligence platform for Malaysian SME merchants.

Given ML price predictions, weather data, and current inventory levels, generate actionable supply chain insights.

For EACH item, provide:
1. A clear risk assessment (is the price going up or down? Should they buy now or wait?)
2. Weather impact analysis (does rain/temperature affect this commodity?)
3. A specific recommended action with quantity and timing

Respond with valid JSON matching this schema:
{
  "insights": [
    {
      "item_name": str,
      "item_code": int,
      "risk_level": "high" | "medium" | "low",
      "headline": str,                    // One-line summary, max 80 chars
      "predicted_price": float,
      "current_price": float,
      "price_direction": "rising" | "falling" | "stable",
      "weather_impact": str,              // How weather affects this item
      "recommended_action": str,          // What to do
      "order_quantity": float | null,
      "order_unit": str,
      "urgency": "urgent" | "watch" | "opportunity",
      "reasoning": str,                   // 2-3 sentences
      "cost_now": float,
      "cost_if_delayed": float
    }
  ],
  "summary": str,   // Overall market conditions summary, 2-3 sentences
  "weather_context": str  // Weather impact summary for the region
}
""".strip()


@router.get("/predict/{item_code}")
async def predict_single_item(
    item_code: int,
    db: AsyncSession = Depends(get_db),
):
    """Get ML price prediction for a single item."""
    lat, lon = await get_merchant_location(MERCHANT_ID, db)
    result = await predict_price(item_code, db, lat, lon)
    return result


@router.get("/weather")
async def get_weather(
    db: AsyncSession = Depends(get_db),
):
    """Get current weather for the merchant's location."""
    lat, lon = await get_merchant_location(MERCHANT_ID, db)
    weather = await fetch_current_weather(lat, lon)
    return {
        "location": {"lat": lat, "lon": lon},
        **weather,
    }


@router.get("/inventory")
async def analyze_full_inventory(
    db: AsyncSession = Depends(get_db),
):
    """
    Run ML predictions on all inventory items and generate
    GLM-powered natural language insights.
    """
    # 1. Get ML predictions for all items
    predictions = await analyze_inventory(MERCHANT_ID, db)

    if not predictions:
        return {
            "predictions": [],
            "insights": [],
            "summary": "No inventory items to analyze.",
            "weather_context": "",
        }

    # 2. Get weather context
    lat, lon = await get_merchant_location(MERCHANT_ID, db)
    weather = await fetch_current_weather(lat, lon)

    # 3. Build context for GLM
    items_with_predictions = [p for p in predictions if p.get("predicted_price")]

    if not items_with_predictions:
        return {
            "predictions": predictions,
            "insights": [],
            "summary": "No items have sufficient data for AI analysis. Link items to DOSM reference codes to enable predictions.",
            "weather_context": f"Current conditions: {weather['temp_celsius']}°C, {weather['precip_flux']}mm precipitation.",
        }

    prediction_ctx = "\n".join([
        f"- {p['item_name']} (code {p['item_code']}): "
        f"current avg RM{p['current_avg_price']:.2f}, "
        f"predicted RM{p['predicted_price']:.2f} ({p['price_change_pct']:+.1f}%), "
        f"trend: {p['trend']}, confidence: {p['confidence']}, "
        f"stock: {p.get('quantity', 0)}{p.get('unit', '')}, "
        f"reorder at: {p.get('reorder_threshold', 0)}{p.get('unit', '')}, "
        f"merchant pays: RM{p.get('current_purchase_price', 0):.2f}"
        for p in items_with_predictions
    ])

    weather_ctx = (
        f"Location: Petaling Jaya, Selangor (lat {lat}, lon {lon})\n"
        f"Today's weather: {weather['temp_celsius']}°C, "
        f"precipitation: {weather['precip_flux']}mm\n"
        f"Date: {weather['date']}"
    )

    user_message = f"""
INVENTORY ML PREDICTIONS:
{prediction_ctx}

WEATHER DATA:
{weather_ctx}

Analyze these predictions and generate actionable insights for the merchant.
Consider how weather patterns affect commodity prices in Malaysia.
Return JSON only.
""".strip()

    # 4. Call GLM for natural language insights
    try:
        glm_result = await call_glm_json(
            system_prompt=INSIGHT_SYSTEM_PROMPT,
            user_message=user_message,
            temperature=0.2,
            max_tokens=2000,
        )
    except Exception as e:
        logger.warning("GLM analysis failed (%s), generating ML-only insights", e)
        # Generate structured insights from ML predictions alone
        ml_insights = []
        for p in items_with_predictions:
            change = p.get("price_change_pct", 0)
            trend = p.get("trend", "stable")
            risk = "high" if abs(change) > 5 else "medium" if abs(change) > 2 else "low"
            urgency = "urgent" if change > 5 else "watch" if change > 2 else "opportunity"
            direction = "rising" if change > 0 else "falling" if change < 0 else "stable"
            
            current_cost = p.get("current_purchase_price", 0) * max(p.get("quantity", 1), 1)
            delayed_cost = (p.get("predicted_price", 0)) * max(p.get("quantity", 1), 1)

            ml_insights.append({
                "item_name": p["item_name"],
                "item_code": p["item_code"],
                "risk_level": risk,
                "headline": f"{p['item_name']}: price {'trending up' if change > 0 else 'trending down' if change < 0 else 'stable'} ({change:+.1f}%)",
                "predicted_price": p.get("predicted_price", 0),
                "current_price": p.get("current_avg_price", 0),
                "price_direction": direction,
                "weather_impact": f"Current conditions ({weather['temp_celsius']}°C, {weather['precip_flux']}mm rain) factored into prediction model.",
                "recommended_action": f"{'Stock up now — prices are rising' if change > 3 else 'Hold current orders — prices stable' if abs(change) <= 3 else 'Wait for further dip — prices falling'}.",
                "urgency": urgency,
                "reasoning": f"ML model predicts {direction} trend with {p.get('confidence', 'medium')} confidence. Current avg market price RM{p.get('current_avg_price', 0):.2f} vs predicted RM{p.get('predicted_price', 0):.2f}.",
                "cost_now": round(current_cost, 2),
                "cost_if_delayed": round(delayed_cost, 2),
            })

        return {
            "predictions": predictions,
            "insights": ml_insights,
            "summary": f"ML analysis complete for {len(items_with_predictions)} items. AI narrative temporarily unavailable.",
            "weather_context": f"{weather['temp_celsius']}°C, {weather['precip_flux']}mm precipitation in Petaling Jaya.",
            "weather": weather,
        }

    return {
        "predictions": predictions,
        "insights": glm_result.get("insights", []),
        "summary": glm_result.get("summary", ""),
        "weather_context": glm_result.get("weather_context", ""),
        "weather": weather,
    }
