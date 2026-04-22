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
import logging
from typing import Any

from agents.base import A2AAgent
from utils.glm_client import call_glm_json, call_glm
from utils.prompt_builder import build_merchant_context, build_signal_context

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_ANALYZE = """
You are the Inventory Planner agent for MerchantMind, an AI co-pilot for SME merchants in Southeast Asia.

Assess world supply chain signals and produce specific, actionable restocking recommendations.
Always respond with valid JSON matching the output schema in the docstring. Be concrete — exact
quantities, MYR costs, day counts. Never vague advice.
""".strip()

SYSTEM_PROMPT_QUERY = """
You are the Inventory Planner agent for MerchantMind. Answer questions about supply chain,
restocking, and procurement. Be specific and data-driven. Write in second person. Under 200 words.
""".strip()


class InventoryPlannerAgent(A2AAgent):
    name = "inventory_planner"

    async def analyze(self, signal: Any, merchant: Any) -> dict:
        """Analyze a supply/commodity/weather signal → restocking recommendation."""
        # TODO (Member A): refine prompt and validate output shape
        merchant_ctx = build_merchant_context(merchant)
        signal_ctx = build_signal_context(signal)

        user_message = f"""
{merchant_ctx}

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
        # TODO (Member A): flesh out conversation history handling
        merchant_ctx = build_merchant_context(merchant)
        history_str = "\n".join(
            f"{m.get('role','user').upper()}: {m.get('content','')}"
            for m in conversation_history[-6:]
        )
        extra = f"\nCONTEXT:\n{context}" if context else ""

        user_message = f"""
{merchant_ctx}

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
        # TODO (Member A): enrich with real ingredient-level analysis
        signal = context.get("signal", {})
        merchant = context.get("merchant", {})
        ingredients = [i.get("name", "") for i in (merchant.get("ingredients") or [])]
        summary = signal.get("summary", signal.get("title", "unknown signal"))

        return {
            "agent": self.name,
            "perspective": (
                f"Supply impact: '{summary}' may affect "
                f"{', '.join(ingredients[:3]) or 'your ingredients'}. "
                "Check stock levels and consider buffer purchasing."
            ),
        }
