"""
MerchantMind — Z.AI GLM API client wrapper.

Uses the OpenAI Python SDK pointed at Z.AI's OpenAI-compatible base URL.
All agent calls go through call_glm() or call_glm_json().
"""
import json
import logging
from typing import Any

from openai import AsyncOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    """Return the shared AsyncOpenAI client pointed at Z.AI."""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.zai_api_key,
            base_url=settings.zai_base_url,
        )
    return _client


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def call_glm(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.3,
    max_tokens: int = 1500,
    model: str | None = None,
) -> str:
    """
    Call the Z.AI GLM API and return the response text.

    Args:
        system_prompt: Agent identity + instruction block
        user_message: Signal context + query block
        temperature: Sampling temperature (0.0–1.0)
        max_tokens: Max tokens in the response
        model: Override the default model from settings

    Returns:
        Plain text response string
    """
    client = get_client()
    response = await client.chat.completions.create(
        model=model or settings.zai_model,
        temperature=temperature,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )
    return response.choices[0].message.content or ""


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
async def call_glm_json(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.2,
    max_tokens: int = 1500,
    model: str | None = None,
) -> dict[str, Any]:
    """
    Call the Z.AI GLM API and parse the response as JSON.

    Appends a JSON-only instruction to the system prompt.
    Returns parsed dict; raises ValueError if JSON is invalid.
    """
    json_instruction = (
        "\n\nCRITICAL: You must respond with valid JSON only. "
        "No preamble, no explanation, no markdown code fences. Raw JSON only."
    )
    full_system = system_prompt + json_instruction

    raw = await call_glm(
        system_prompt=full_system,
        user_message=user_message,
        temperature=temperature,
        max_tokens=max_tokens,
        model=model,
    )

    # Strip markdown fences if the model adds them despite instructions
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        cleaned = "\n".join(lines).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("GLM returned invalid JSON: %s\nRaw: %s", e, raw[:500])
        raise ValueError(f"GLM returned non-JSON response: {raw[:200]}") from e
