"""
Thin wrapper around the Anthropic Python SDK.

Requires the ANTHROPIC_API_KEY environment variable to be set.
Get a key at: https://console.anthropic.com/

Set it before starting the server, e.g.:
  Windows (PowerShell):  $env:ANTHROPIC_API_KEY="sk-ant-..."
  macOS/Linux:           export ANTHROPIC_API_KEY="sk-ant-..."
"""
import os
import json

from fastapi import HTTPException

try:
    import anthropic
except ImportError:  # library not installed yet
    anthropic = None

MODEL = "claude-sonnet-5"


def _get_client() -> "anthropic.Anthropic":
    if anthropic is None:
        raise HTTPException(
            status_code=500,
            detail="The 'anthropic' package is not installed. Run: pip install anthropic",
        )
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="ANTHROPIC_API_KEY is not set. Set this environment variable with "
                   "your Anthropic API key before using AI content features.",
        )
    return anthropic.Anthropic(api_key=api_key)


def call_claude(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str:
    """Single-turn text completion. Returns the raw text response."""
    client = _get_client()
    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except Exception as e:  # noqa: BLE001 - surface API errors clearly to the caller
        raise HTTPException(status_code=502, detail=f"AI provider error: {str(e)}")

    text_blocks = [block.text for block in response.content if block.type == "text"]
    return "\n".join(text_blocks).strip()


def call_claude_json(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> dict:
    """Same as call_claude, but instructs the model to return strict JSON and parses it."""
    strict_system = (
        system_prompt
        + "\n\nRespond with ONLY a valid JSON object. No markdown fences, no preamble, no commentary."
    )
    raw = call_claude(strict_system, user_prompt, max_tokens=max_tokens)

    # Defensive cleanup in case the model wraps the JSON in a code fence anyway
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
    cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail=f"AI provider returned a non-JSON response: {raw[:300]}",
        )
