"""
MerchantMind — Models for Merchant, Products, and Ingredients
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
