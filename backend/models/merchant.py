"""
BijakSense — Models for Merchant, Products, and Ingredients
"""
from sqlalchemy import Column, String, Float, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from database import Base

class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_name = Column(String(100), nullable=False)
    name = Column(String(100), nullable=False) # business_name
    sector = Column(String(50), nullable=True)
    sub_category = Column(String(50), nullable=True)
    location_name = Column(String(200), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    staff_count = Column(Integer, default=1)
    phase = Column(String(20), default="running")
    monthly_revenue_estimate = Column(Float, default=0.0)

    products = relationship("Product", back_populates="merchant", cascade="all, delete-orphan", lazy="selectin")
    ingredients = relationship("Ingredient", back_populates="merchant", cascade="all, delete-orphan", lazy="selectin")
    inventory_items = relationship("InventoryItem", back_populates="merchant", cascade="all, delete-orphan", lazy="selectin")

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(100), nullable=False)
    price = Column(Float, nullable=False)

    merchant = relationship("Merchant", back_populates="products")

class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    name = Column(String(100), nullable=False)
    stock_days = Column(Integer, default=7)

    merchant = relationship("Merchant", back_populates="ingredients")

class InventoryItem(Base):
    __tablename__ = "inventory_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), ForeignKey("merchants.id"), nullable=False)
    item_name = Column(String(100), nullable=False)
    quantity = Column(Float, default=0.0)
    unit = Column(String(20), default="kg")
    reorder_threshold = Column(Float, default=10.0)
    current_price_myr = Column(Float, default=0.0)
    last_restocked = Column(String(50), nullable=True)
    
    # Supply Chain Analysis fields
    supplier_name = Column(String(100), nullable=True)
    lead_time_days = Column(Integer, default=3)
    supplier_reliability = Column(Float, default=1.0) # 0.0 to 1.0
    manufacturing_cost = Column(Float, default=0.0)
    shipping_cost = Column(Float, default=0.0)

    merchant = relationship("Merchant", back_populates="inventory_items")
    price_history = relationship("PriceHistory", back_populates="inventory_item", cascade="all, delete-orphan", lazy="selectin")

class PriceHistory(Base):
    __tablename__ = "price_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    inventory_item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.id"), nullable=False)
    price = Column(Float, nullable=False)
    timestamp = Column(String(50), nullable=False) # ISO date string

    inventory_item = relationship("InventoryItem", back_populates="price_history")
