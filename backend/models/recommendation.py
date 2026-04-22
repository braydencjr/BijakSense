"""
MerchantMind — Models for Recommendations
"""
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from database import Base

class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    merchant_id = Column(UUID(as_uuid=True), nullable=False)
    agent = Column(String(50), nullable=False)
    urgency = Column(String(20), nullable=False)  # urgent, watch, opportunity, info
    headline = Column(String(200), nullable=False)
    body = Column(String, nullable=False)
    structured_data = Column(JSON, nullable=True) # Full JSON output from the agent
    status = Column(String(20), default="pending")  # pending, acted_on, dismissed
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.now(datetime.timezone.utc))
