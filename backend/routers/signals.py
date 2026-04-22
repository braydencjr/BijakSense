"""
MerchantMind — Signals Router

Ingests world signals and actively routes them to the Market Analyst for live processing.
"""
import uuid
import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_db
from models.merchant import Merchant
from models.recommendation import Recommendation
from agents.market_analyst import MarketAnalystAgent

router = APIRouter(prefix="/api/signals", tags=["Signals"])
logger = logging.getLogger(__name__)

async def process_signal_task(signal_payload: Dict[str, Any], merchant_id: str):
    """Background task to run the AI and save the recommendation."""
    async for db in get_db():
        result = await db.execute(select(Merchant).where(Merchant.id == uuid.UUID(merchant_id)))
        merchant = result.scalar_one_or_none()
        if not merchant:
            logger.error("Merchant not found for signal processing.")
            return

        analyst = MarketAnalystAgent()
        
        # This calls Tavily API and GLM API dynamically!
        ai_response = await analyst.analyze(signal=signal_payload, merchant=merchant)
        
        # Save the structured response as a recommendation
        rec = Recommendation(
            merchant_id=merchant.id,
            agent="Market Analyst",
            urgency=ai_response.get("urgency", "info"),
            headline=ai_response.get("headline", "New Market Insight"),
            body=ai_response.get("reasoning", "Analysis complete."),
            structured_data=ai_response,
            status="pending"
        )
        db.add(rec)
        await db.commit()
        logger.info("Successfully generated live recommendation!")

from pydantic import BaseModel

class SignalPayload(BaseModel):
    signal: Dict[str, Any]
    merchant_id: str

@router.post("/ingest")
async def ingest_signal(payload: SignalPayload, background_tasks: BackgroundTasks):
    """
    Ingest a live signal (like a news event) and trigger the Market Analyst.
    """
    background_tasks.add_task(process_signal_task, payload.signal, payload.merchant_id)
    return {"status": "processing", "message": "Signal sent to Market Analyst for live evaluation."}
