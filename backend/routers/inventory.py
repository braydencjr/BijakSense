"""
MerchantMind — Inventory Router
Handles inventory items and price history.
"""
import logging
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from database import get_db
from models.merchant import InventoryItem, Merchant, LookupItem, Price
from schemas.merchant import InventoryItemResponse, InventoryItemBase

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("/categories", response_model=List[str])
async def get_item_categories(db: AsyncSession = Depends(get_db)):
    """Fetch unique item categories from the lookup table."""
    result = await db.execute(select(LookupItem.item_category).distinct())
    categories = result.scalars().all()
    return sorted([c for c in categories if c])

@router.get("/items-by-category/{category}", response_model=List[dict])
async def get_items_by_category(category: str, db: AsyncSession = Depends(get_db)):
    """Fetch items belonging to a specific category."""
    result = await db.execute(
        select(LookupItem.item_code, LookupItem.item, LookupItem.unit)
        .where(LookupItem.item_category == category)
    )
    items = result.all()
    return [{"item_code": row.item_code, "item": row.item, "unit": row.unit} for row in items]

@router.post("/{merchant_id}", response_model=InventoryItemResponse)
async def add_inventory_item(
    merchant_id: uuid.UUID, 
    item: InventoryItemBase, 
    db: AsyncSession = Depends(get_db)
):
    """Add a new inventory item."""
    new_item = InventoryItem(
        **item.model_dump(),
        merchant_id=merchant_id
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    return new_item

@router.put("/{item_id}", response_model=InventoryItemResponse)
async def update_inventory_item(
    item_id: uuid.UUID,
    item_update: InventoryItemBase,
    db: AsyncSession = Depends(get_db)
):
    """Update an existing inventory item."""
    result = await db.execute(
        select(InventoryItem)
        .where(InventoryItem.id == item_id)
        .options(selectinload(InventoryItem.price_history))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item_update.model_dump().items():
        setattr(item, key, value)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete an inventory item."""
    result = await db.execute(select(InventoryItem).where(InventoryItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
        
    await db.delete(item)
    await db.commit()
    return {"message": "Item deleted successfully"}

@router.get("/{merchant_id}", response_model=List[InventoryItemResponse])
async def get_inventory(merchant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Fetch all inventory items for a merchant, including price history.
    """
    result = await db.execute(
        select(InventoryItem)
        .where(InventoryItem.merchant_id == merchant_id)
        .options(selectinload(InventoryItem.price_history))
    )
    items = result.scalars().all()
    return items

@router.get("/item/{item_id}", response_model=InventoryItemResponse)
async def get_inventory_item(item_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Fetch a single inventory item by ID.
    """
    result = await db.execute(
        select(InventoryItem)
        .where(InventoryItem.id == item_id)
        .options(selectinload(InventoryItem.price_history))
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item
@router.get("/history/{item_code}")
async def get_item_price_history(
    item_code: int, 
    days: int = 30,
    db: AsyncSession = Depends(get_db)
):
    """Fetch historical average prices for a specific item code, filtered by days."""
    from sqlalchemy import func
    
    query = (
        select(Price.date, func.avg(Price.price).label("avg_price"))
        .where(Price.item_code == item_code)
        .group_by(Price.date)
        .order_by(Price.date.desc())
        .limit(days)
    )
    
    result = await db.execute(query)
    history = result.all()
    
    # Return sorted by date ascending for the chart
    return sorted(
        [{"date": row.date, "price": float(row.avg_price)} for row in history],
        key=lambda x: x["date"]
    )
