"""
Price Prediction Service — loads the trained Random Forest model and
generates price forecasts using DOSM historical data + Open-Meteo weather.

The model expects features defined in `robust_model_features.joblib`.
It predicts future prices based on item_code, recent price trends,
and environmental factors (temperature, precipitation).
"""
from __future__ import annotations

import logging
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import joblib
import pandas as pd
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from models.merchant import Price, InventoryItem, Merchant
from utils.weather_client import fetch_current_weather

logger = logging.getLogger(__name__)

# ── Load model artifacts at module level ──────────────────────────
ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / "artifacts"

_model = None
_features = None


def _load_model():
    global _model, _features
    if _model is None:
        model_path = ARTIFACTS_DIR / "price_predictor_robust_rf.joblib"
        features_path = ARTIFACTS_DIR / "robust_model_features.joblib"

        if not model_path.exists():
            raise FileNotFoundError(f"Model not found: {model_path}")

        _model = joblib.load(model_path)
        _features = joblib.load(features_path)
        logger.info("Loaded price prediction model with features: %s", _features)
    return _model, _features


async def get_merchant_location(merchant_id: str, db: AsyncSession) -> tuple[float, float]:
    """Get merchant lat/lon from DB, fallback to Petaling Jaya."""
    try:
        result = await db.execute(
            select(Merchant.latitude, Merchant.longitude)
            .where(Merchant.id == merchant_id)
        )
        row = result.one_or_none()
        if row and row.latitude and row.longitude:
            return row.latitude, row.longitude
    except Exception as e:
        logger.warning("Failed to get merchant location: %s", e)

    # Default: Petaling Jaya, Selangor
    return 3.1073, 101.6067


async def get_recent_price_stats(
    item_code: int,
    db: AsyncSession,
    days: int = 30,
) -> dict:
    """Get recent price statistics for an item from the DOSM price table."""
    cutoff = date.today() - timedelta(days=days)
    
    query = (
        select(
            func.avg(Price.price).label("avg_price"),
            func.min(Price.price).label("min_price"),
            func.max(Price.price).label("max_price"),
            func.stddev(Price.price).label("std_price"),
            func.count(Price.price).label("count"),
        )
        .where(Price.item_code == item_code)
        .where(Price.date >= cutoff)
    )
    result = await db.execute(query)
    row = result.one_or_none()

    if row and row.avg_price:
        return {
            "avg_price": float(row.avg_price),
            "min_price": float(row.min_price),
            "max_price": float(row.max_price),
            "std_price": float(row.std_price) if row.std_price else 0.0,
            "count": int(row.count),
        }
    return {"avg_price": 0, "min_price": 0, "max_price": 0, "std_price": 0, "count": 0}


async def _get_lagged_price(
    item_code: int,
    db: AsyncSession,
    lag_days: int,
) -> float | None:
    """Get the average price from `lag_days` ago (±1 day window for data sparsity)."""
    target_date = date.today() - timedelta(days=lag_days)
    window_start = target_date - timedelta(days=1)
    window_end = target_date + timedelta(days=1)

    query = (
        select(func.avg(Price.price))
        .where(Price.item_code == item_code)
        .where(Price.date >= window_start)
        .where(Price.date <= window_end)
    )
    result = await db.execute(query)
    val = result.scalar_one_or_none()
    return float(val) if val else None

async def predict_price(
    item_code: int,
    db: AsyncSession,
    lat: float = 3.1073,
    lon: float = 101.6067,
) -> dict:
    """
    Run the ML model to predict the next price for a given item_code.

    Returns:
        {
            "predicted_price": float,
            "current_avg_price": float,
            "price_change_pct": float,
            "trend": "rising" | "falling" | "stable",
            "confidence": "high" | "medium" | "low",
            "weather": { "temp_celsius": float, "precip_flux": float },
            "features_used": list[str],
        }
    """
    model, features = _load_model()

    # 1. Fetch weather
    weather = await fetch_current_weather(lat, lon)

    # 2. Fetch recent price stats
    stats = await get_recent_price_stats(item_code, db)

    if stats["count"] == 0:
        return {
            "predicted_price": 0,
            "current_avg_price": 0,
            "price_change_pct": 0,
            "trend": "stable",
            "confidence": "low",
            "weather": weather,
            "features_used": list(features),
            "error": "No historical price data found for this item.",
        }

    # 3. Build feature vector using exact model feature names:
    #    ['price_lag_7d', 'price_lag_14d', 'month', 'day_of_week', 'precip_flux', 'temp_celsius']
    
    # Fetch lagged prices (7d and 14d)
    price_lag_7d = await _get_lagged_price(item_code, db, 7)
    price_lag_14d = await _get_lagged_price(item_code, db, 14)
    
    feature_map = {
        "price_lag_7d": price_lag_7d if price_lag_7d else stats["avg_price"],
        "price_lag_14d": price_lag_14d if price_lag_14d else stats["avg_price"],
        "month": date.today().month,
        "day_of_week": date.today().weekday(),
        "precip_flux": weather["precip_flux"],
        "temp_celsius": weather["temp_celsius"],
    }
    
    feature_values = {f: feature_map.get(f, 0) for f in features}

    # 4. Create DataFrame in correct column order
    df = pd.DataFrame([feature_values], columns=features)

    # 5. Predict
    try:
        predicted = float(model.predict(df)[0])
    except Exception as e:
        logger.error("Model prediction failed: %s", e)
        return {
            "predicted_price": stats["avg_price"],
            "current_avg_price": stats["avg_price"],
            "price_change_pct": 0,
            "trend": "stable",
            "confidence": "low",
            "weather": weather,
            "features_used": list(features),
            "error": str(e),
        }

    # 6. Compute trend
    avg = stats["avg_price"]
    change_pct = ((predicted - avg) / avg * 100) if avg > 0 else 0

    if change_pct > 3:
        trend = "rising"
    elif change_pct < -3:
        trend = "falling"
    else:
        trend = "stable"

    # Confidence based on data volume
    confidence = "high" if stats["count"] > 100 else "medium" if stats["count"] > 20 else "low"

    return {
        "predicted_price": round(predicted, 2),
        "current_avg_price": round(avg, 2),
        "price_change_pct": round(change_pct, 2),
        "trend": trend,
        "confidence": confidence,
        "weather": weather,
        "features_used": list(features),
    }


async def analyze_inventory(
    merchant_id: str,
    db: AsyncSession,
) -> list[dict]:
    """
    Run ML predictions for ALL inventory items belonging to a merchant.
    Returns a list of prediction dicts, one per item.
    """
    lat, lon = await get_merchant_location(merchant_id, db)

    # Fetch merchant inventory items
    result = await db.execute(
        select(InventoryItem)
        .where(InventoryItem.merchant_id == merchant_id)
    )
    items = result.scalars().all()

    predictions = []
    for item in items:
        if not item.item_code:
            predictions.append({
                "item_id": str(item.id),
                "item_name": item.item_name,
                "item_code": None,
                "predicted_price": None,
                "current_avg_price": None,
                "trend": "unknown",
                "confidence": "low",
                "note": "No DOSM reference item linked.",
            })
            continue

        pred = await predict_price(item.item_code, db, lat, lon)
        pred["item_id"] = str(item.id)
        pred["item_name"] = item.item_name
        pred["item_code"] = item.item_code
        pred["current_purchase_price"] = item.current_price_myr
        pred["quantity"] = item.quantity
        pred["unit"] = item.unit
        pred["reorder_threshold"] = item.reorder_threshold
        predictions.append(pred)

    return predictions
