"""
MerchantMind — Prompt builder utilities.

Each GLM call is composed of four blocks:
  1. Agent identity block    — who the agent is
  2. Merchant context block  — the merchant's full profile
  3. Signal / query block    — what is being processed
  4. Output instruction block — what to return
"""
from typing import Any


def build_merchant_context(merchant) -> str:
    """Build the merchant profile context block from a Merchant ORM object."""
    products_str = ", ".join(
        f"{p.get('name', 'Unknown') if isinstance(p, dict) else getattr(p, 'name', 'Unknown')} (RM {p.get('price', 0) if isinstance(p, dict) else getattr(p, 'price', 0):.2f})"
        for p in (merchant.products or [])
    )
    ingredients_str = ", ".join(
        i.get("name", "Unknown") if isinstance(i, dict) else getattr(i, 'name', 'Unknown') 
        for i in (merchant.ingredients or [])
    )

    return f"""
MERCHANT PROFILE:
Business name: {merchant.name}
Owner: {merchant.owner_name}
Sector: {merchant.sector} > {merchant.sub_category}
Location: {merchant.location_name} (lat: {merchant.latitude}, lng: {merchant.longitude})
Staff: {merchant.staff_count}
Phase: {merchant.phase}
Monthly revenue estimate: RM {getattr(merchant, 'monthly_revenue_estimate', 0) or 0:,.0f}
Products: {products_str or 'Not specified'}
Key ingredients: {ingredients_str or 'Not specified'}
""".strip()


def build_signal_context(signal) -> str:
    """Build the world signal context block from a WorldSignal ORM object."""
    return f"""
WORLD SIGNAL:
Type: {signal.signal_type}
Title: {signal.title}
Summary: {signal.summary}
Origin: {signal.origin_name or 'Unknown'} (lat: {signal.origin_latitude}, lng: {signal.origin_longitude})
Urgency: {signal.urgency}
Raw data: {signal.raw_data}
""".strip()


def build_signal_context_dict(signal: dict) -> str:
    """Build the world signal context block from a plain dict (used during ingestion)."""
    return f"""
WORLD SIGNAL:
Type: {signal.get('signal_type', 'unknown')}
Title: {signal.get('title', '')}
Summary: {signal.get('summary', '')}
Origin: {signal.get('origin_name', 'Unknown')}
Urgency: {signal.get('urgency', 'info')}
Raw data: {signal.get('raw_data', {})}
""".strip()


def build_chat_context(
    merchant,
    recent_recommendations: list[Any],
    recent_signals: list[Any],
    conversation_history: list[dict],
) -> str:
    """Build the full context block for chat/synthesis queries."""
    history_str = "\n".join(
        f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
        for m in conversation_history[-10:]  # Last 10 messages
    )

    recs_str = "\n".join(
        f"  - [{r.agent.upper()}] {r.headline} (urgency: {r.urgency})"
        for r in recent_recommendations[:5]
    )

    signals_str = "\n".join(
        f"  - [{s.signal_type.upper()}] {s.title} — {s.urgency}"
        for s in recent_signals[:3]
    )

    return f"""
CONVERSATION HISTORY:
{history_str or 'No prior conversation'}

RECENT RECOMMENDATIONS FOR THIS MERCHANT:
{recs_str or 'No recent recommendations'}

ACTIVE WORLD SIGNALS:
{signals_str or 'No active signals'}
""".strip()


def build_a2a_message(
    from_agent: str,
    to_agent: str,
    task: str,
    context: dict,
) -> dict:
    """
    Build a standardised A2A (Agent-to-Agent) message envelope.

    This is the protocol object passed between agents in the LangGraph state.
    """
    return {
        "from": from_agent,
        "to": to_agent,
        "task": task,
        "context": context,
        "protocol": "a2a/v1",
    }
