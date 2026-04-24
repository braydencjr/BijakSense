"""
MerchantMind — Orchestrator Agent
The central hub for A2A communication and user interaction.
"""
import logging
from typing import Any, List, Dict

from .base import A2AAgent, A2AMessage, make_a2a_message
from utils.glm_client import call_glm, call_glm_json

logger = logging.getLogger(__name__)

class OrchestratorAgent(A2AAgent):
    name: str = "orchestrator"

    async def analyze(self, signal: Any, merchant: Any) -> dict:
        """Orchestrator doesn't usually analyze signals directly; it routes them."""
        return {"info": "Orchestrator received signal. Routing to specialists."}

    async def query(
        self,
        question: str,
        merchant: Any,
        conversation_history: list[dict],
        context: dict | None = None,
    ) -> str:
        """
        The main entry point for user chat. 
        Decides which specialists to consult and synthesizes a final response.
        """
        logger.info(f"Orchestrator processing query: {question}")
        
        # Placeholder synthesis logic
        system_prompt = (
            "You are the MerchantMind Orchestrator. Your job is to coordinate specialist agents "
            "to help SME merchants in Southeast Asia. Provide a helpful, concise response."
        )
        
        response = await call_glm(
            system_prompt=system_prompt,
            user_message=f"Merchant Question: {question}\nMerchant Context: {str(merchant)}",
            temperature=0.7
        )
        return response

    async def _consult(self, context: dict) -> dict:
        return {"info": "Orchestrator provides overall business strategy."}
