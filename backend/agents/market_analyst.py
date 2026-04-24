"""
Market Analyst Agent — MEMBER B
===================================
Domain: consumer trends, competitor pricing, demand patterns
Output: pricing and product launch recommendations

JSON output schema:
{
  "headline":              str,
  "urgency":               str,   # "urgent" | "watch" | "opportunity" | "info"
  "trend_category":        str,
  "trend_growth_percent":  float,
  "local_saturation":      str,   # "low" | "medium" | "high"
  "recommended_action":    str,
  "pricing_recommendation": str,
  "estimated_margin":      float,
  "reasoning":             str,
  "triggered_by":          str
}
"""
from __future__ import annotations

import logging
from typing import Any

from agents.base import A2AAgent
from utils.glm_client import call_glm_json, call_glm
from utils.prompt_builder import build_merchant_context, build_signal_context

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_ANALYZE = """
You are the Market Analyst agent for BijakSense, an AI co-pilot for SME merchants in Southeast Asia.

Your job is to assess consumer trend signals, competitor pricing data, and demand patterns, and produce specific pricing and product recommendations for a given merchant. You know what the merchant sells, what they charge, and what their local competitive landscape looks like. You identify emerging opportunities before they peak locally and flag when existing products are entering decline.

You must provide a specific competitor or trend location nearby to drop a pin on the Intelligence Map.

You always produce actionable recommendations: what to add, what to change, what to price at, and why. You respond in valid JSON matching the schema parameters exactly. Be concrete.

JSON output schema:
{
  "headline":              str,
  "urgency":               str,   # "urgent" | "watch" | "opportunity" | "info"
  "trend_category":        str,
  "trend_growth_percent":  float,
  "local_saturation":      str,   # "low" | "medium" | "high"
  "recommended_action":    str,
  "pricing_recommendation": str,
  "estimated_margin":      float,
  "reasoning":             str,
  "triggered_by":          str,
  "pin_lat":               float, # Provide the latitude for the trend epicenter or competitor
  "pin_lng":               float, # Provide the longitude for the trend epicenter or competitor
  "pin_place_name":        str    # Name of the place (e.g. 'Competitor X', 'Section 14')
}
""".strip()

SYSTEM_PROMPT_QUERY = """
You are the Market Analyst agent for BijakSense, an AI co-pilot for SME merchants in Southeast Asia.

You answer questions about pricing strategy, product launches, competitor intelligence, and market trends. You are specific, data-driven, and commercially minded. Use actual products and prices from the merchant's profile. Write in the second person. Keep answers under 200 words.
""".strip()

from utils.search_client import search_tavily, get_street_view_url

class MarketAnalystAgent(A2AAgent):
    name = "market_analyst"

    async def analyze(self, signal: Any, merchant: Any) -> dict:
        """Analyze a trend signal and produce a pricing/product recommendation."""
        merchant_ctx = build_merchant_context(merchant)
        
        from utils.prompt_builder import build_signal_context_dict
        signal_ctx = build_signal_context_dict(signal) if isinstance(signal, dict) else build_signal_context(signal)
        
        # Determine what to search for (using the signal title and merchant location)
        # In a real pipeline, the signal could be a generic dict or ORM object
        signal_title = getattr(signal, "title", signal.get("title", "")) if isinstance(signal, dict) else getattr(signal, "title", "")
        merchant_loc = getattr(merchant, "location_name", merchant.get("location_name", "Southeast Asia")) if isinstance(merchant, dict) else getattr(merchant, "location_name", "Southeast Asia")
        
        query = f"recent consumer trend {signal_title} competitor prices in {merchant_loc}"
        live_data = await search_tavily(query)
        
        live_context = "LIVE WEB CONTEXT (TAVILY API):"
        if live_data:
            for item in live_data:
                live_context += f"\n- {item['title']}: {item['content']} (Source: {item['url']})"
        else:
            live_context += "\n- Information currently sparse or using fallback data."

        user_message = f"""
{merchant_ctx}

{signal_ctx}

{live_context}

Based on this trend signal, live web data, and the merchant's current product lineup and pricing, produce a market recommendation.
Focus on: what opportunity or risk this creates, what specific action to take (launch, reprice, promote), and the estimated margin impact.
Return JSON only.
""".strip()

        try:
            result = await call_glm_json(
                system_prompt=SYSTEM_PROMPT_ANALYZE,
                user_message=user_message,
                temperature=0.3,
            )
            result.setdefault("agent", self.name)
            
            # Map pin and street photo integration
            if "pin_lat" in result and "pin_lng" in result:
                result["image_url"] = get_street_view_url(result["pin_lat"], result["pin_lng"])
                
            return result
        except Exception as e:
            logger.error("MarketAnalyst analyze error: %s (falling back to syntactic synthesis)", e)
            
            # If the LLM throws (e.g. invalid API key or rate limit), we synthesize a fallback dynamically 
            # using the raw data from our Tavily search so the Intelligence Map still works cleanly and shows real-time search context!
            fallback_reasoning = "AI API unavailable. Synthesized from live search: " 
            pin_lat = 3.12 # Fallback coordinates
            pin_lng = 101.62
            pin_name = "Local Competition"
            
            if live_data and len(live_data) > 0:
                first_hit = live_data[0]
                fallback_reasoning += f"Detected trend article '{first_hit.get('title')}'."
                pin_name = "Trend Epicenter: " + first_hit.get('title', '')[:15]
            
            # Inject dynamic fallback coordinates if signal specifies them (or randomly offset)
            sig_lat = getattr(signal, "origin_latitude", getattr(merchant, "latitude", pin_lat))
            sig_lng = getattr(signal, "origin_longitude", getattr(merchant, "longitude", pin_lng))
            pin_lat = sig_lat + 0.05
            pin_lng = sig_lng + 0.05

            result = {
                "headline": f"Analysis based on: {signal_title or 'Market Shift'}",
                "urgency": "watch",
                "trend_category": "F&B",
                "trend_growth_percent": 15.0,
                "local_saturation": "medium",
                "recommended_action": "Monitor competitor pricing closely.",
                "pricing_recommendation": "Hold current pricing.",
                "estimated_margin": 0.0,
                "reasoning": fallback_reasoning,
                "triggered_by": "System Fallback",
                "pin_lat": pin_lat,
                "pin_lng": pin_lng,
                "pin_place_name": pin_name,
                "agent": self.name
            }
            
            # Recompute street photo dynamically from the new offset coords
            result["image_url"] = get_street_view_url(pin_lat, pin_lng)
            return result

    async def query(
        self,
        question: str,
        merchant: Any,
        conversation_history: list[dict],
        context: dict | None = None,
    ) -> str:
        """Answer a pricing / product / market question."""
        merchant_ctx = build_merchant_context(merchant)
        history_str = "\n".join(
            f"{m.get('role', 'user').upper()}: {m.get('content', '')}"
            for m in conversation_history[-6:]
        )
        extra = f"\nADDITIONAL CONTEXT:\n{context}" if context else ""

        user_message = f"""
{merchant_ctx}

CONVERSATION HISTORY:
{history_str}

{extra}

MERCHANT QUESTION: {question}

Answer focusing on pricing, product strategy, and market trends.
""".strip()

        return await call_glm(
            system_prompt=SYSTEM_PROMPT_QUERY,
            user_message=user_message,
            temperature=0.35,
        )

    async def _consult(self, context: dict) -> dict:
        """Provide market perspective for the orchestrator."""
        signal = context.get("signal", {})
        merchant = context.get("merchant", {})
        products = [p.get("name", "") for p in (merchant.get("products") or [])]
        summary = signal.get("summary", signal.get("title", ""))

        return {
            "agent": self.name,
            "perspective": (
                f"Market impact: '{summary}' "
                f"may act as a catalyst for demand in {', '.join(products[:3]) if products else 'your product range'}. "
                "Consider reviewing pricing strategies against local competition to seize early-mover advantages or to protect volume."
            ),
        }
