"""
BijakSense — Recommendations Router (Member B: Market Analyst)

Provides endpoints to fetch recommendation history and update statuses.
Supports the frontend Recommendations.tsx log page.
"""
import uuid
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from database import get_db
from models.recommendation import Recommendation
from schemas.recommendation import RecommendationResponse, RecommendationUpdate

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])
logger = logging.getLogger(__name__)

@router.get("", response_model=List[RecommendationResponse])
async def get_recommendations(
    merchant_id: uuid.UUID = Query(None, description="ID of the merchant (optional for demo)"),
    status: str = Query("all", description="Filter by status: all, pending, acted_on, dismissed"),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch the log of all past and pending recommendations.
    """
    query = select(Recommendation)
    if merchant_id:
        query = query.where(Recommendation.merchant_id == merchant_id)
        
    if status != "all":
        query = query.where(Recommendation.status == status)
        
    query = query.order_by(Recommendation.created_at.desc())
    
    result = await db.execute(query)
    recs = result.scalars().all()
    
    # Map the backend model to the format Frontend expects
    # The schema handles id, agent, urgency, headline, body, status, created_at.
    # Frontend also expects `detail` (which maps to body/reasoning) and `time` (human readable created_at).
    response_list = []
    for r in recs:
        resp = RecommendationResponse.model_validate(r)
        resp.detail = r.body  # Map body to detail
        # Simple placeholder for time representation
        resp.time = r.created_at.strftime("%b %d, %H:%M") 
        response_list.append(resp)
        
    return response_list

@router.patch("/{recommendation_id}", response_model=RecommendationResponse)
async def update_recommendation_status(
    recommendation_id: uuid.UUID,
    update_data: RecommendationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Update the status of a recommendation (e.g., mark as 'acted_on' or 'dismissed').
    """
    result = await db.execute(select(Recommendation).where(Recommendation.id == recommendation_id))
    rec = result.scalar_one_or_none()
    
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
        
    rec.status = update_data.status
    if update_data.note:
        # If there's structured data, we might append the note there, 
        # but for now we could just save it in the structured data block or a new column if existed.
        if rec.structured_data is None:
            rec.structured_data = {}
        rec.structured_data["note"] = update_data.note
        
    await db.commit()
    await db.refresh(rec)
    
    resp = RecommendationResponse.model_validate(rec)
    resp.detail = rec.body
    resp.time = rec.created_at.strftime("%b %d, %H:%M")
    return resp
