"""
Inventory Planner Agent — MEMBER A
===================================
Domain: commodity prices, weather events, supply chain disruptions
Output: restock recommendations with quantity, timing, and cost estimates

JSON output schema:
{
  "headline":            str,   # one-line summary for dashboard card
  "urgency":             str,   # "urgent" | "watch" | "opportunity" | "info"
  "affected_ingredient": str,
  "recommended_action":  str,
  "order_quantity":      int,
  "order_unit":          str,   # "kg" | "litres" | "units" | "boxes"
  "order_within_days":   int,
  "cost_now":            float, # MYR
  "cost_later_low":      float,
  "cost_later_high":     float,
  "reasoning":           str,   # 2-3 sentences
  "triggered_by":        str,
}
"""
from __future__ import annotations

import logging
from typing import Any

from agents.base import A2AAgent
from utils.glm_client import call_glm_json, call_glm
from utils.prompt_builder import build_merchant_context, build_signal_context
from utils.commodity_client import fetch_latest_commodity_price, fetch_commodity_fluctuation, get_symbol_for_item

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_ANALYZE = """
You are the Inventory Planner agent for BijakSense, an AI co-pilot for SME merchants in Southeast Asia.

Assess world supply chain signals, merchant inventory, and REAL-TIME MARKET DATA to produce specific, actionable restocking recommendations.
Inspired by supply chain analytics best practices, you must:
1. **Analyze Market Context**: Compare the merchant's current purchase price with the REAL-TIME MARKET DATA provided. If the market price is lower, highlight a "buying opportunity".
2. **Evaluate Price Trends**: Use 30-day fluctuation data (rising/falling/stable) to advise on whether to buy now or wait. If prices are "rising", create urgency.
3. **Optimize Order Quantity**: Balance manufacturing/shipping costs with market stability. Suggest larger buffer stocks if the market is volatile or signals indicate disruptions.
4. **Identify Stability Risks**: Cross-reference market trends with supply chain signals (like weather or logistics delays).

Always respond with valid JSON matching the output schema in the docstring. Be concrete — use the actual MYR market prices and percentage changes provided in your context.
""".strip()

SYSTEM_PROMPT_QUERY = """
You are the Inventory Planner agent for BijakSense. Answer questions about supply chain,
restocking, and procurement using current market context.

When REAL-TIME MARKET DATA is provided in your context, always cite the specific market prices and 30-day trends to back up your advice. Be specific, data-driven, and write in the second person. Keep responses under 200 words.
""".strip()


class InventoryPlannerAgent(A2AAgent):
    name = "inventory_planner"

    async def analyze(self, signal: Any, merchant: Any) -> dict:
        """Analyze a supply/commodity/weather signal → restocking recommendation."""
        # Fetch real market context for matched items
        market_data = {}
        inventory_items = getattr(merchant, 'inventory_items', [])
        for item in inventory_items:
            symbol = getattr(item, 'commodity_symbol', None) or get_symbol_for_item(item.item_name)
            if symbol:
                price_data = await fetch_latest_commodity_price(symbol)
                fluctuation = await fetch_commodity_fluctuation(symbol)
                if price_data:
                    market_data[item.item_name] = {
                        "market_price": price_data.get(symbol),
                        "30d_change_pct": fluctuation.get("change_pct", 0),
                        "trend": "rising" if (fluctuation.get("change_pct", 0) or 0) > 2 else "falling" if (fluctuation.get("change_pct", 0) or 0) < -2 else "stable"
                    }

        merchant_ctx = build_merchant_context(merchant)
        signal_ctx = build_signal_context(signal)
        market_ctx = f"\nREAL-TIME MARKET DATA:\n{market_data}" if market_data else ""

        user_message = f"""
{merchant_ctx}
{market_ctx}

{signal_ctx}

Produce a restocking recommendation. Return JSON only.
""".strip()

        try:
            result = await call_glm_json(
                system_prompt=SYSTEM_PROMPT_ANALYZE,
                user_message=user_message,
                temperature=0.2,
            )
            result.setdefault("agent", self.name)
            return result
        except Exception as e:
            logger.error("InventoryPlanner analyze error: %s", e)
            return {
                "headline": "Unable to generate restocking recommendation",
                "urgency": "info",
                "agent": self.name,
                "error": str(e),
            }

    async def query(
        self,
        question: str,
        merchant: Any,
        conversation_history: list[dict],
        context: dict | None = None,
    ) -> str:
        """Answer an inventory / restocking question."""
        # Check for market data if question is about prices
        market_ctx = ""
        if "price" in question.lower() or "market" in question.lower() or "trend" in question.lower():
            market_data = {}
            inventory_items = getattr(merchant, 'inventory_items', [])
            for item in inventory_items:
                symbol = get_symbol_for_item(item.item_name)
                if symbol:
                    price_data = await fetch_latest_commodity_price(symbol)
                    if price_data:
                        market_data[item.item_name] = price_data.get(symbol)
            if market_data:
                market_ctx = f"\nCURRENT MARKET PRICES (MYR):\n{market_data}\n"

        merchant_ctx = build_merchant_context(merchant)
        history_str = "\n".join(
            f"{m.get('role','user').upper()}: {m.get('content','')}"
            for m in conversation_history[-6:]
        )
        extra = f"\nCONTEXT:\n{context}" if context else ""

        user_message = f"""
{merchant_ctx}
{market_ctx}

HISTORY:
{history_str}
{extra}

QUESTION: {question}
""".strip()

        return await call_glm(
            system_prompt=SYSTEM_PROMPT_QUERY,
            user_message=user_message,
            temperature=0.3,
        )

    async def _consult(self, context: dict) -> dict:
        """Provide inventory perspective during orchestrator A2A broadcast."""
        signal = context.get("signal", {})
        merchant = context.get("merchant", {})
        
        inventory_items = getattr(merchant, 'inventory_items', [])
        if inventory_items:
            items_str = ", ".join([f"{i.item_name} ({i.quantity}{i.unit})" for i in inventory_items[:3]])
        else:
            ingredients = [i.get("name", "") if isinstance(i, dict) else getattr(i, 'name', '') for i in (getattr(merchant, 'ingredients', []) or [])]
            items_str = ", ".join(ingredients[:3]) or "your ingredients"
            
        summary = signal.get("summary", "") if isinstance(signal, dict) else getattr(signal, "summary", "unknown signal")
        
        # Supply chain stability logic
        stability_warning = ""
        if inventory_items:
            # Check for long lead times (>5 days) or low reliability (<0.8)
            long_lead = [i.item_name for i in inventory_items if (getattr(i, 'lead_time_days', 0) or 0) > 5]
            unreliable = [i.item_name for i in inventory_items if (getattr(i, 'supplier_reliability', 1.0) or 1.0) < 0.8]
            if long_lead or unreliable:
                stability_warning = f" Stability alerts for {', '.join(set(long_lead + unreliable))}."

        return {
            "agent": self.name,
            "perspective": (
                f"Supply impact: '{summary}' may affect {items_str}. "
                f"Evaluating price trends and order quantity.{stability_warning} "
                "Check stock levels and consider buffer purchasing."
            ),
        }
