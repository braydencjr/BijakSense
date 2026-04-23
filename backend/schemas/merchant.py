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

class MerchantResponse(MerchantBase):
    id: uuid.UUID
    name: str # Mapping internal business_name to name
    products: List[ProductResponse] = []
    ingredients: List[IngredientResponse] = []
    model_config = ConfigDict(from_attributes=True)
