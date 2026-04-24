"""
BijakSense — AI client wrapper.

Primary: Google Gemini (gemini-2.5-flash).
Fallback: ilmu-glm-5.1 via Anthropic-compatible API (api.ilmu.ai/anthropic).
"""
import json
import logging
from typing import Any

import anthropic
from google import genai
from google.genai import types as genai_types
from tenacity import retry, stop_after_attempt, wait_exponential

from config import settings

logger = logging.getLogger(__name__)

_anthropic_client: anthropic.AsyncAnthropic | None = None
_gemini_client: genai.Client | None = None


def _get_gemini_client() -> genai.Client:
    """Return the shared Google Gemini client."""
    global _gemini_client
    if _gemini_client is None:
        _gemini_client = genai.Client(api_key=settings.gemini_api_key)
    return _gemini_client


def get_anthropic_client() -> anthropic.AsyncAnthropic:
    """Return the shared Anthropic client pointed at ilmu.ai."""
    global _anthropic_client
    if _anthropic_client is None:
        _anthropic_client = anthropic.AsyncAnthropic(
            api_key=settings.zai_api_key,
            base_url=settings.zai_base_url,
        )
    return _anthropic_client


async def _call_gemini(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.3,
    max_tokens: int = 1500,
) -> str:
    client = _get_gemini_client()
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=user_message,
        config=genai_types.GenerateContentConfig(
            systemInstruction=system_prompt,
            temperature=temperature,
            maxOutputTokens=max_tokens,
        ),
    )
    return response.text or ""


async def _call_anthropic(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.3,
    max_tokens: int = 1500,
    model: str | None = None,
) -> str:
    client = get_anthropic_client()
    response = await client.messages.create(
        model=model or settings.zai_model,
        max_tokens=max_tokens,
        temperature=temperature,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    return response.content[0].text


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=6))
async def call_glm(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.3,
    max_tokens: int = 1500,
    model: str | None = None,
) -> str:
    """
    Call the AI API and return the response text.

    Tries Gemini first, falls back to ilmu-glm (Anthropic-compatible).
    """
    try:
        return await _call_gemini(
            system_prompt=system_prompt,
            user_message=user_message,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    except Exception as e:
        logger.warning("Gemini call failed (%s), falling back to ilmu-glm", e)
        try:
            return await _call_anthropic(
                system_prompt=system_prompt,
                user_message=user_message,
                temperature=temperature,
                max_tokens=max_tokens,
                model=model,
            )
        except Exception as e2:
            logger.error("Both AI providers failed. Gemini: %s, ilmu-glm: %s", e, e2)
            raise


@retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=6))
async def call_glm_json(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.2,
    max_tokens: int = 1500,
    model: str | None = None,
) -> dict[str, Any]:
    """
    Call the AI API and parse the response as JSON.

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

    cleaned = raw.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.startswith("```")]
        cleaned = "\n".join(lines).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("AI returned invalid JSON: %s\nRaw: %s", e, raw[:500])
        raise ValueError(f"AI returned non-JSON response: {raw[:200]}") from e
