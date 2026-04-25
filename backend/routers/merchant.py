"""
BijakSense — Merchant Router
Handles merchant onboarding, profile, products, and ingredients.
"""
import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.merchant import Merchant, Product, Ingredient, InventoryItem
from schemas.merchant import MerchantCreate, MerchantResponse

router = APIRouter(prefix="/api/merchant", tags=["Merchant"])
logger = logging.getLogger(__name__)

@router.post("", response_model=MerchantResponse)
async def create_merchant(data: MerchantCreate, db: AsyncSession = Depends(get_db)):
    """
    Onboard a new merchant with products and ingredients.
    """
    merchant = Merchant(
        owner_name=data.owner_name,
        business_name=data.business_name,
        sector=data.sector,
        sub_category=data.sub_category,
        location_name=data.location_name,
        latitude=data.latitude,
        longitude=data.longitude,
        staff_count=data.staff_count,
        phase=data.phase,
        monthly_revenue_estimate=data.monthly_revenue_estimate
    )
    db.add(merchant)
    await db.flush()

    for p in data.products:
        product = Product(name=p.name, price=p.price, merchant_id=merchant.id)
        db.add(product)

    for i in data.ingredients:
        ingredient = Ingredient(name=i.name, stock_days=i.stock_days, merchant_id=merchant.id)
        db.add(ingredient)

    for item in data.inventory_items:
        inv_item = InventoryItem(
            item_name=item.item_name,
            quantity=item.quantity,
            unit=item.unit,
            reorder_threshold=item.reorder_threshold,
            current_price_myr=item.current_price_myr,
            last_restocked=item.last_restocked,
            supplier_name=item.supplier_name,
            lead_time_days=item.lead_time_days,
            supplier_reliability=item.supplier_reliability,
            manufacturing_cost=item.manufacturing_cost,
            shipping_cost=item.shipping_cost,
            merchant_id=merchant.id
        )
        db.add(inv_item)

    await db.commit()
    await db.refresh(merchant)

    # Map business_name to name for frontend compatibility if needed
    merchant.name = merchant.business_name
    return merchant

@router.get("/{merchant_id}", response_model=MerchantResponse)
async def get_merchant(merchant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Fetch merchant profile.
    """
    result = await db.execute(
        select(Merchant).where(Merchant.id == merchant_id)
    )
    merchant = result.scalar_one_or_none()
    if not merchant:
        raise HTTPException(status_code=404, detail="Merchant not found")

    merchant.name = merchant.business_name
    return merchant
