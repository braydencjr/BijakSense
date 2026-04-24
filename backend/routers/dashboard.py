"""
MerchantMind — Dashboard Router
Provides fast dashboard state (no LLM, <200ms).
"""
import logging
import uuid
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from database import get_db
from models.merchant import Merchant, Product, Ingredient
from models.recommendation import Recommendation

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)

@router.get("/{merchant_id}")
async def get_dashboard_summary(merchant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Get a summary of the merchant's status for the dashboard.
    """
    # Count pending recommendations
    rec_count_result = await db.execute(
        select(func.count(Recommendation.id))
        .where(Recommendation.merchant_id == merchant_id)
        .where(Recommendation.status == "pending")
    )
    pending_recs = rec_count_result.scalar() or 0

    # Get product count
    product_count_result = await db.execute(
        select(func.count(Product.id))
        .where(Product.merchant_id == merchant_id)
    )
    total_products = product_count_result.scalar() or 0

    # Get ingredient count
    ingredient_count_result = await db.execute(
        select(func.count(Ingredient.id))
        .where(Ingredient.merchant_id == merchant_id)
    )
    total_ingredients = ingredient_count_result.scalar() or 0

    return {
        "merchant_id": merchant_id,
        "pending_recommendations": pending_recs,
        "total_products": total_products,
        "total_ingredients": total_ingredients,
        "status": "healthy",
        "alerts": []
    }
