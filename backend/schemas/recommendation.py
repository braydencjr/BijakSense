"""
BijakSense — Schemas for Recommendations
"""
from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import uuid

class RecommendationBase(BaseModel):
    agent: str
    urgency: str
    headline: str
    body: str
    structured_data: Optional[dict[str, Any]] = None
    status: str = "pending"

class RecommendationResponse(RecommendationBase):
    id: uuid.UUID
    merchant_id: uuid.UUID
    created_at: datetime
    # The frontend expects certain fields, make sure to map them appropriately
    detail: Optional[str] = None
    time: Optional[str] = None

    class Config:
        from_attributes = True

class RecommendationUpdate(BaseModel):
    status: str # acted_on, dismissed
    note: Optional[str] = None
