"""
Insights router — generates grounded personal insights for the Command Center
using the same seeded signal set shown on the Intelligence Map.
"""
import logging
import time
from typing import Any, Dict, List

from fastapi import APIRouter
from pydantic import BaseModel, Field

from mock_signals import REGIONAL_SIGNALS, ALL_LOCAL_SIGNALS

router = APIRouter(prefix="/api/insights", tags=["Insights"])
logger = logging.getLogger(__name__)

MAX_INSIGHTS = 7

SYSTEM_PROMPT = (
    "You are the Market Analyst for BijakSense, an AI co-pilot for SME merchants in SEA. "
    "The merchant is Siti, running Siti's Bubble Tea in Petaling Jaya, Malaysia. "
    "You must generate insights ONLY from the provided seeded signals. "
    "Do not invent products, promotions, disruptions, locations, competitors, timings, or numbers that are not present in the signal list. "
    "Every insight must reference one or more provided signal IDs. "
    "If a point cannot be tied directly to the provided signals, omit it. "
    "Keep each insight concise, concrete, and operational."
)


class Insight(BaseModel):
    id: str
    urgency: str  # red | amber | teal
    headline: str
    action: str
    reasoning: str
    signal_ids: List[str] = Field(default_factory=list)


class InsightsResponse(BaseModel):
    insights: List[Insight]


def _format_signal(signal: Dict[str, Any], scope: str) -> Dict[str, Any]:
    return {
        "id": signal["id"],
        "scope": scope,
        "urgency": signal["urgency"],
        "title": signal.get("name") or signal.get("origin"),
        "type": signal["type"],
        "category": signal["category"],
        "distance_km": signal.get("distance"),
        "summary": signal.get("summary") or signal.get("description"),
        "impact": signal.get("impact"),
    }


def _build_signal_catalog() -> List[Dict[str, Any]]:
    regional = [_format_signal(signal, "regional") for signal in REGIONAL_SIGNALS]
    local = [_format_signal(signal, "local") for signal in ALL_LOCAL_SIGNALS]
    return regional + local


def _signal_lookup() -> Dict[str, Dict[str, Any]]:
    return {signal["id"]: signal for signal in _build_signal_catalog()}


def _signal_sort_key(signal: Dict[str, Any]) -> tuple[int, int]:
    urgency_order = {"red": 0, "amber": 1, "teal": 2}
    scope_order = {"local": 0, "regional": 1}
    return (
        urgency_order.get(signal["urgency"], 3),
        scope_order.get(signal["scope"], 2),
    )


def _default_action(signal: Dict[str, Any]) -> str:
    signal_id = signal["id"]

    action_map = {
        "sig_thai_flood": "Place a safety-stock order for exposed ingredients before supplier lead times stretch.",
        "sig_sg_inflation": "Review supplier quotes this week and prepare a small price or bundle adjustment on affected drinks.",
        "sig_id_matcha": "Put one matcha hero drink in the front promo slot while the trend is still climbing.",
        "sig_my_palmoil": "Check creamer and syrup margin impact and adjust pricing before the next reorder cycle.",
        "sig_thai_tourism": "Study the strongest Thai chain promo format and adapt one lightweight version for your weekend menu.",
        "comp_teahouse": "Counter with a targeted bundle on your strongest boba item instead of matching a full discount.",
        "comp_matchadreams": "Launch a fast matcha offer or content push this week to stay visible in the same trend wave.",
        "comp_pearlgarden": "Add a simple repeat-visit reward to protect your returning customer base.",
        "comp_brewstation": "Prepare a sampler or cross-category offer before their boba launch reaches nearby walk-ins.",
        "comp_bubblebox": "Tighten one delivery-platform offer to stay competitive with app-first buyers.",
        "opp_mrt": "Prepare signage and walk-in offers ahead of the MRT exit opening.",
        "opp_holiday": "Staff up and prepare a holiday-special drink before the long weekend starts.",
        "opp_mall": "Evaluate the pop-up application and a small test budget for a weekend activation.",
    }

    return action_map.get(signal_id, "Review this signal and turn it into a same-week operating response.")


def _default_reasoning(signal: Dict[str, Any]) -> str:
    if signal["scope"] == "regional":
        return f"Source signal: {signal['title']} — {signal['summary']}"

    distance = signal.get("distance_km")
    distance_text = f" within {distance}km" if distance is not None else ""
    return f"Source signal: {signal['title']}{distance_text} — {signal['summary']}"


def _fallback_insights() -> List[Insight]:
    lookup = _signal_lookup()
    sorted_signals = sorted(lookup.values(), key=_signal_sort_key)
    if sorted_signals:
        # Rotate the fallback window every 30 seconds so the card set visibly changes.
        rotation_window = int(time.time() // 30)
        offset = rotation_window % len(sorted_signals)
        sorted_signals = sorted_signals[offset:] + sorted_signals[:offset]

    sorted_signals = sorted_signals[:MAX_INSIGHTS]

    insights: List[Insight] = []
    for index, signal in enumerate(sorted_signals, start=1):
        title = signal["title"]
        scope_label = "Local" if signal["scope"] == "local" else "Regional"
        headline = f"{scope_label} signal: {title}"

        insights.append(
            Insight(
                id=f"fallback_{signal['id']}",
                urgency=signal["urgency"],
                headline=headline[:120],
                action=_default_action(signal),
                reasoning=_default_reasoning(signal)[:300],
                signal_ids=[signal["id"]],
            )
        )

    return insights


def _normalize_urgency(value: Any) -> str:
    urgency = str(value or "").strip().lower()
    if urgency in {"red", "amber", "teal"}:
        return urgency
    if urgency == "green":
        return "teal"
    return "amber"


def _sanitize_ai_insights(payload: Dict[str, Any]) -> List[Insight]:
    lookup = _signal_lookup()
    raw_items = payload.get("insights")
    if not isinstance(raw_items, list):
        return []

    sanitized: List[Insight] = []
    seen_pairs: set[tuple[str, ...]] = set()

    for index, item in enumerate(raw_items, start=1):
        if not isinstance(item, dict):
            continue

        raw_signal_ids = item.get("signal_ids")
        if not isinstance(raw_signal_ids, list):
            continue

        signal_ids = [signal_id for signal_id in raw_signal_ids if signal_id in lookup]
        if not signal_ids:
            continue

        deduped_signal_ids = list(dict.fromkeys(signal_ids))
        signal_key = tuple(sorted(deduped_signal_ids))
        if signal_key in seen_pairs:
            continue

        headline = str(item.get("headline") or "").strip()
        action = str(item.get("action") or "").strip()
        reasoning = str(item.get("reasoning") or "").strip()
        if not headline or not action or not reasoning:
            continue

        sanitized.append(
            Insight(
                id=f"ai_{index}",
                urgency=_normalize_urgency(item.get("urgency")),
                headline=headline[:120],
                action=action[:200],
                reasoning=reasoning[:300],
                signal_ids=deduped_signal_ids,
            )
        )
        seen_pairs.add(signal_key)

        if len(sanitized) >= MAX_INSIGHTS:
            break

    return sanitized


def _ensure_minimum_insights(insights: List[Insight]) -> List[Insight]:
    if len(insights) >= MAX_INSIGHTS:
        return insights[:MAX_INSIGHTS]

    fallback = _fallback_insights()
    existing_ids = {tuple(sorted(insight.signal_ids)) for insight in insights}

    for item in fallback:
        if len(insights) >= MAX_INSIGHTS:
            break

        signal_key = tuple(sorted(item.signal_ids))
        if signal_key in existing_ids:
            continue

        insights.append(item)
        existing_ids.add(signal_key)

    return insights[:MAX_INSIGHTS]


@router.get("", response_model=InsightsResponse)
async def get_insights():
    """Return fast rotating insights from the seeded signal set.

    External AI generation is intentionally bypassed here because this endpoint is
    used for the live news rail and needs to respond instantly even when provider
    quotas or upstream APIs are unhealthy.
    """
    return InsightsResponse(insights=_fallback_insights())
