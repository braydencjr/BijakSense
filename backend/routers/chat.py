"""
Chat router — conversational AI endpoint with A2A routing.

Routes questions to the appropriate specialist agent via MCP-style dispatch.
Currently implements Market Analyst; other agents fall back to general co-pilot.
"""
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.glm_client import call_glm
from agents.market_analyst import MarketAnalystAgent
from mock_signals import ALL_SIGNALS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])

# ── MCP-style agent routing ───────────────────────────────────────

MARKET_KEYWORDS = [
    "price", "pricing", "competitor", "matcha", "trend", "demand",
    "market", "promo", "promotion", "launch", "customer", "foot traffic",
    "best selling", "viral", "tiktok", "loyalty", "brown sugar",
    "restock", "sell", "revenue", "cost", "palm oil", "inflation",
    "opportunity", "expand", "margin", "menu",
]

INVENTORY_KEYWORDS = [
    "inventory", "stock", "supply", "ingredient", "order", "reorder",
    "warehouse", "deliver", "supplier", "shortage", "rice", "tea",
]

OPS_KEYWORDS = [
    "staff", "schedule", "shift", "holiday", "weekend", "busy",
    "hours", "operation",
]


def route_to_agent(message: str) -> str:
    """Determine which agent should handle this question (MCP dispatch)."""
    lower = message.lower()
    market_score = sum(1 for kw in MARKET_KEYWORDS if kw in lower)
    inventory_score = sum(1 for kw in INVENTORY_KEYWORDS if kw in lower)
    ops_score = sum(1 for kw in OPS_KEYWORDS if kw in lower)

    if market_score >= max(inventory_score, ops_score, 1):
        return "market_analyst"
    if inventory_score > ops_score and inventory_score >= 1:
        return "inventory_planner"
    if ops_score >= 1:
        return "ops_advisor"
    # Default: market analyst as the primary agent
    return "market_analyst"


# ── Merchant context (mock for hackathon) ──────────────────────────

class MockMerchant:
    """Lightweight merchant object with attribute access for agent compatibility."""
    name = "Siti's Bubble Tea"
    owner_name = "Siti"
    sector = "F&B"
    sub_category = "Bubble Tea"
    location_name = "Petaling Jaya, Selangor"
    latitude = 3.1073
    longitude = 101.6067
    staff_count = 3
    phase = "growth"
    monthly_revenue_estimate = 20000
    products = [
        {"name": "Classic Milk Tea", "price": 7.00},
        {"name": "Brown Sugar Boba", "price": 9.00},
        {"name": "Matcha Milk Tea", "price": 10.00},
        {"name": "Taro Milk Tea", "price": 8.50},
        {"name": "Mango Fruit Tea", "price": 8.00},
    ]
    ingredients = []

MOCK_MERCHANT = MockMerchant()


# ── Request / Response models ─────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] | None = None


class ChatResponse(BaseModel):
    reply: str
    agent: str
    routed_to: str


# ── Endpoints ──────────────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    """Send a message to the MerchantMind co-pilot with A2A routing."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    routed_to = route_to_agent(req.message)

    # Build signal context for agents
    signal_summary = "\n".join(
        f"- [{s.get('urgency', 'info').upper()}] {s.get('origin', s.get('name', ''))}: {s.get('summary', s.get('description', ''))}"
        for s in ALL_SIGNALS
    )

    # Route to Market Analyst agent (A2A call)
    if routed_to == "market_analyst":
        return await _route_market_analyst(req, signal_summary, routed_to)

    # Other agents: use general co-pilot with agent context
    return await _route_general(req, signal_summary, routed_to)


async def _route_market_analyst(req: ChatRequest, signal_summary: str, routed_to: str) -> ChatResponse:
    """Route to the Market Analyst via A2A message."""
    agent = MarketAnalystAgent()

    # Build conversation history
    history = req.history or []

    # Build context with live signals
    context = {"signals": signal_summary}

    try:
        reply = await agent.query(
            question=req.message,
            merchant=MOCK_MERCHANT,
            conversation_history=history,
            context=context,
        )
        return ChatResponse(reply=reply, agent="Market Analyst", routed_to=routed_to)
    except Exception as e:
        logger.error("Market Analyst query failed: %s", e)
        # Fallback to direct GLM call
        return await _route_general(req, signal_summary, routed_to)


async def _route_general(req: ChatRequest, signal_summary: str, routed_to: str) -> ChatResponse:
    """Fallback general co-pilot response."""
    system_prompt = (
        "You are MerchantMind, an AI co-pilot for SME merchants in Southeast Asia. "
        "The merchant is Siti, running Siti's Bubble Tea in Petaling Jaya, Malaysia. "
        "Respond concisely, professionally. Keep answers business-focused, practical, and data-driven."
    )

    history_block = ""
    if req.history:
        lines = [
            f"{'Merchant' if m.get('role') == 'user' else 'MerchantMind'}: {m.get('content', '')}"
            for m in req.history[-10:]
        ]
        history_block = "Conversation so far:\n" + "\n".join(lines) + "\n\n"

    user_message = f"{history_block}LIVE SIGNALS:\n{signal_summary}\n\nMerchant: {req.message}"

    try:
        reply = await call_glm(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=0.3,
            max_tokens=800,
        )
        agent_name = routed_to.replace("_", " ").title()
        return ChatResponse(reply=reply, agent=agent_name, routed_to=routed_to)
    except ValueError as e:
        logger.error("Chat AI error: %s", e)
        raise HTTPException(status_code=502, detail="AI returned an unreadable response") from e
    except Exception as e:
        logger.error("Chat error: %s", e)
        raise HTTPException(status_code=502, detail="AI service unavailable") from e
