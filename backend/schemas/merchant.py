"""
MerchantMind — Schemas for Merchant, Products, and Ingredients
"""
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
import uuid

class ProductBase(BaseModel):
    name: str
    price: float

class ProductResponse(ProductBase):
    id: uuid.UUID
    merchant_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class IngredientBase(BaseModel):
    name: str
    stock_days: int = 7

class IngredientResponse(IngredientBase):
    id: uuid.UUID
    merchant_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class InventoryItemBase(BaseModel):
    item_name: str
    quantity: float = 0.0
    unit: str = "kg"
    reorder_threshold: float = 10.0
    current_price_myr: float = 0.0
    last_restocked: Optional[str] = None
    supplier_name: Optional[str] = None
    lead_time_days: int = 3
    supplier_reliability: float = 1.0
    manufacturing_cost: float = 0.0
    shipping_cost: float = 0.0

class PriceHistoryBase(BaseModel):
    price: float
    timestamp: str

class PriceHistoryResponse(PriceHistoryBase):
    id: uuid.UUID
    inventory_item_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)

class InventoryItemResponse(InventoryItemBase):
    id: uuid.UUID
    merchant_id: uuid.UUID
    price_history: List[PriceHistoryResponse] = []
    model_config = ConfigDict(from_attributes=True)

class MerchantBase(BaseModel):
    owner_name: str
    business_name: str
    sector: Optional[str] = None
    sub_category: Optional[str] = None
    location_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    staff_count: int = 1
    phase: str = "running"
    monthly_revenue_estimate: float = 0.0

class MerchantCreate(MerchantBase):
    products: List[ProductBase] = []
    ingredients: List[IngredientBase] = []
    inventory_items: List[InventoryItemBase] = []

class MerchantResponse(MerchantBase):
    id: uuid.UUID
    name: str # Mapping internal business_name to name
    products: List[ProductResponse] = []
    ingredients: List[IngredientResponse] = []
    inventory_items: List[InventoryItemResponse] = []
    model_config = ConfigDict(from_attributes=True)
