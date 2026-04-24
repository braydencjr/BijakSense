"""
Base class for all BijakSense A2A specialist agents.

Every agent:
  - Inherits A2AAgent
  - Implements analyze(signal, merchant) → dict
  - Implements query(question, merchant, history, context) → str
  - Implements _consult(context) → dict  (called by orchestrator broadcast)
  - Exposes handle_a2a(message) for inter-agent messaging
"""
from abc import ABC, abstractmethod
from typing import Any, TypedDict
import uuid


# ── A2A Message envelope ──────────────────────────────────────

class A2AMessage(TypedDict):
    id: str
    from_agent: str
    to_agent: str
    task: str          # "analyze_signal" | "answer_query" | "consult"
    context: dict
    status: str        # "pending" | "done" | "error"
    result: dict | None


def make_a2a_message(
    from_agent: str,
    to_agent: str,
    task: str,
    context: dict,
) -> A2AMessage:
    return A2AMessage(
        id=str(uuid.uuid4()),
        from_agent=from_agent,
        to_agent=to_agent,
        task=task,
        context=context,
        status="pending",
        result=None,
    )


# ── Base agent ────────────────────────────────────────────────

class A2AAgent(ABC):
    name: str = "base"

    @abstractmethod
    async def analyze(self, signal: Any, merchant: Any) -> dict:
        """Analyze a world signal and return a structured JSON recommendation."""
        ...

    @abstractmethod
    async def query(
        self,
        question: str,
        merchant: Any,
        conversation_history: list[dict],
        context: dict | None = None,
    ) -> str:
        """Answer a merchant question in plain language."""
        ...

    @abstractmethod
    async def _consult(self, context: dict) -> dict:
        """Return a short domain-specific perspective for orchestrator synthesis."""
        ...

    async def handle_a2a(self, message: A2AMessage) -> A2AMessage:
        """Route an incoming A2A message to the correct handler."""
        task = message["task"]
        ctx = message["context"]

        try:
            if task == "analyze_signal":
                result = await self.analyze(ctx.get("signal", {}), ctx.get("merchant", {}))
            elif task == "answer_query":
                result = {
                    "response": await self.query(
                        ctx.get("question", ""),
                        ctx.get("merchant", {}),
                        ctx.get("history", []),
                        ctx.get("extra_context"),
                    )
                }
            elif task == "consult":
                result = await self._consult(ctx)
            else:
                result = {"error": f"Unknown task: {task}"}

            message["status"] = "done"
            message["result"] = result
        except Exception as e:
            message["status"] = "error"
            message["result"] = {"error": str(e)}

        return message
