"""
Chat router — conversational AI endpoint with A2A routing.

Routes questions to the appropriate specialist agent via MCP-style dispatch.
Supports Market Analyst, Inventory Planner, and Ops Advisor.
"""
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from utils.glm_client import call_glm
from agents.market_analyst import MarketAnalystAgent
from agents.inventory_planner import InventoryPlannerAgent
from mock_signals import ALL_SIGNALS

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])

# ── MCP-style agent routing ───────────────────────────────────────

MARKET_KEYWORDS = [
    "price", "pricing", "competitor", "matcha", "trend", "demand",
    "market", "promo", "promotion", "launch", "customer", "foot traffic",
    "best selling", "viral", "tiktok", "loyalty", "brown sugar",
    "opportunity", "expand", "margin", "menu",
]

INVENTORY_KEYWORDS = [
    "inventory", "stock", "supply", "ingredient", "order", "reorder",
    "warehouse", "deliver", "supplier", "shortage", "rice", "tea",
    "restock", "commodity",
]

OPS_KEYWORDS = [
    "staff", "schedule", "shift", "holiday", "weekend", "busy",
    "hours", "operation",
]


def route_to_agent(message: str) -> list[str]:
    """Determine which agent(s) should handle this question (MCP dispatch).
    Returns a list of agent names — can route to multiple agents."""
    lower = message.lower()
    market_score = sum(1 for kw in MARKET_KEYWORDS if kw in lower)
    inventory_score = sum(1 for kw in INVENTORY_KEYWORDS if kw in lower)
    ops_score = sum(1 for kw in OPS_KEYWORDS if kw in lower)

    agents = []
    if market_score >= 1:
        agents.append("market_analyst")
    if inventory_score >= 1:
        agents.append("inventory_planner")
    if ops_score >= 1:
        agents.append("ops_advisor")

    # Default: route to both market analyst and inventory planner
    if not agents:
        agents = ["market_analyst", "inventory_planner"]

    return agents


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
    inventory_items = []

MOCK_MERCHANT = MockMerchant()


# ── Request / Response models ─────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    history: list[dict[str, str]] | None = None


class ChatResponse(BaseModel):
    reply: str
    agent: str
    routed_to: list[str]


# ── Endpoints ──────────────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    """Send a message to the BijakSense co-pilot with A2A routing."""
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    routed_to = route_to_agent(req.message)

    # Build signal context for agents
    signal_summary = "\n".join(
        f"- [{s.get('urgency', 'info').upper()}] {s.get('origin', s.get('name', ''))}: {s.get('summary', s.get('description', ''))}"
        for s in ALL_SIGNALS
    )

    # Multi-agent: collect responses from each routed agent, then synthesize
    if len(routed_to) == 1:
        return await _route_single(req, signal_summary, routed_to[0], routed_to)

    # Multiple agents — get each perspective, then synthesize
    perspectives = []
    for agent_name in routed_to:
        try:
            resp = await _route_single(req, signal_summary, agent_name, routed_to)
            perspectives.append(f"[{resp.agent}]: {resp.reply}")
        except Exception as e:
            logger.error(f"Agent {agent_name} failed: {e}")
            perspectives.append(f"[{agent_name}]: Unable to generate response.")

    # Synthesize multi-agent response
    combined = "\n\n".join(perspectives)
    system_prompt = (
        "You are the BijakSense Orchestrator. You have received perspectives from multiple specialist agents. "
        "Synthesize them into one clear, actionable response for the merchant. "
        "Keep it concise and business-focused. Do NOT mention agent names — just give the merchant practical advice."
    )

    try:
        reply = await call_glm(
            system_prompt=system_prompt,
            user_message=f"Merchant question: {req.message}\n\nAgent perspectives:\n{combined}",
            temperature=0.3,
            max_tokens=800,
        )
        return ChatResponse(reply=reply, agent="Orchestrator", routed_to=routed_to)
    except Exception as e:
        logger.error("Orchestrator synthesis failed: %s", e)
        # Return the first agent's raw response as fallback
        return await _route_single(req, signal_summary, routed_to[0], routed_to)


async def _route_single(
    req: ChatRequest, signal_summary: str, agent_name: str, all_routed: list[str]
) -> ChatResponse:
    """Route to a single specialist agent."""
    if agent_name == "market_analyst":
        return await _route_market_analyst(req, signal_summary, all_routed)
    if agent_name == "inventory_planner":
        return await _route_inventory_planner(req, signal_summary, all_routed)
    # Other agents: general co-pilot
    return await _route_general(req, signal_summary, agent_name, all_routed)


async def _route_market_analyst(req: ChatRequest, signal_summary: str, routed_to: list[str]) -> ChatResponse:
    """Route to the Market Analyst via A2A message."""
    agent = MarketAnalystAgent()
    history = req.history or []
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
        return await _route_general(req, signal_summary, "market_analyst", routed_to)


async def _route_inventory_planner(req: ChatRequest, signal_summary: str, routed_to: list[str]) -> ChatResponse:
    """Route to the Inventory Planner via A2A message."""
    agent = InventoryPlannerAgent()
    history = req.history or []
    context = {"signals": signal_summary}

    try:
        reply = await agent.query(
            question=req.message,
            merchant=MOCK_MERCHANT,
            conversation_history=history,
            context=context,
        )
        return ChatResponse(reply=reply, agent="Inventory Planner", routed_to=routed_to)
    except Exception as e:
        logger.error("Inventory Planner query failed: %s", e)
        return await _route_general(req, signal_summary, "inventory_planner", routed_to)


async def _route_general(req: ChatRequest, signal_summary: str, routed_to_name: str, routed_to: list[str]) -> ChatResponse:
    """Fallback general co-pilot response."""
    system_prompt = (
        "You are BijakSense, an AI co-pilot for SME merchants in Southeast Asia. "
        "The merchant is Siti, running Siti's Bubble Tea in Petaling Jaya, Malaysia. "
        "Respond concisely, professionally. Keep answers business-focused, practical, and data-driven."
    )

    history_block = ""
    if req.history:
        lines = [
            f"{'Merchant' if m.get('role') == 'user' else 'BijakSense'}: {m.get('content', '')}"
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
        agent_label = routed_to_name.replace("_", " ").title()
        return ChatResponse(reply=reply, agent=agent_label, routed_to=routed_to)
    except ValueError as e:
        logger.error("Chat AI error: %s", e)
        raise HTTPException(status_code=502, detail="AI returned an unreadable response") from e
    except Exception as e:
        logger.error("Chat error: %s", e)
        raise HTTPException(status_code=502, detail="AI service unavailable") from e
