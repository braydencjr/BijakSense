"""
MerchantMind — Chat Router
Handles A2A conversational interface between the user and the AI Orchestrator.
"""
import logging
import uuid
from typing import List, Dict, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db

router = APIRouter(prefix="/api/chat", tags=["Chat"])
logger = logging.getLogger(__name__)

class ChatMessage(BaseModel):
    role: str # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    merchant_id: uuid.UUID
    message: str
    history: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    agent_involved: str = "orchestrator"
    actions_taken: List[str] = []

@router.post("", response_model=ChatResponse)
async def chat_with_orchestrator(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Send a message to the AI Orchestrator and get a response.
    """
    logger.info(f"Chat request from merchant {request.merchant_id}: {request.message}")
    
    # Placeholder for actual LLM/Agent logic
    # In a real implementation, this would call the OrchestratorAgent
    
    reply = f"I've received your message: '{request.message}'. I'm analyzing your business data to provide the best advice."
    
    return ChatResponse(
        reply=reply,
        agent_involved="orchestrator",
        actions_taken=["message_received", "context_retrieval_simulated"]
    )

@router.get("/history/{merchant_id}", response_model=List[ChatMessage])
async def get_chat_history(merchant_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    """
    Fetch chat history for a merchant.
    """
    # Placeholder return
    return [
        ChatMessage(role="assistant", content="Hello! I am your MerchantMind co-pilot. How can I help you today?")
    ]
