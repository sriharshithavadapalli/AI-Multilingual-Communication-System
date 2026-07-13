"""
Milestone 2 — AI Content Generation & Multilingual Communication Engine.

Endpoints:
  POST /ai/generate            - draft campaign content from a brief
  POST /ai/translate           - translate existing content into a target language
  POST /ai/personalize         - fill personalization tokens for a specific recipient
  POST /ai/analyze-sentiment   - tone/sentiment analysis + improvement suggestions
  POST /ai/compliance-check    - rule-based + AI-assisted content compliance validation
  GET  /ai/history             - list past AI actions (optionally filtered by campaign)

All generation/translation/analysis actions are logged to ContentGeneration for
auditability and reuse.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.core.ai_client import call_claude, call_claude_json
from app.core.bhashini_client import translate_via_bhashini
from app.models.content_generation import ContentGeneration
from app.models.user import User
from app.schemas.ai_content import (
    GenerateContentRequest, GenerateContentResponse,
    TranslateRequest, TranslateResponse,
    SentimentAnalysisRequest, SentimentAnalysisResponse,
    ComplianceCheckRequest, ComplianceCheckResponse, ComplianceIssue,
    PersonalizeRequest, PersonalizeResponse,
    ContentGenerationOut,
)

router = APIRouter(prefix="/ai", tags=["AI Content Generation (Milestone 2)"])

MANAGE_ROLES = ["admin", "campaign_manager"]

CHANNEL_LIMITS = {
    "sms": 160,
    "whatsapp": 1024,
    "email": None,       # no hard limit
    "general": None,
}


def _log(db: Session, action: str, campaign_id, language, brief, output, meta, user_id) -> ContentGeneration:
    record = ContentGeneration(
        campaign_id=campaign_id, action=action, language=language,
        input_brief=brief, output_text=output, meta=meta, created_by_id=user_id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.post("/generate", response_model=GenerateContentResponse)
def generate_content(
    payload: GenerateContentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    """
    Drafts campaign content in the target language directly from a brief.
    Context-aware: takes campaign type, audience context, tone, and channel
    into account so the output fits the communication scenario.
    """
    system_prompt = (
        "You are a professional public-communications copywriter for government "
        "departments, NGOs, and institutions in India. You write clear, culturally "
        "appropriate, actionable messages for mass communication campaigns "
        "(awareness drives, emergency alerts, educational notices, and official "
        "announcements). You write directly in the requested language and never "
        "add meta-commentary, explanations, or markdown formatting — output only "
        "the final message text."
    )

    constraints = []
    if payload.tone:
        constraints.append(f"Tone: {payload.tone}.")
    if payload.audience_context:
        constraints.append(f"Audience: {payload.audience_context}.")
    if payload.max_words:
        constraints.append(f"Keep it under {payload.max_words} words.")
    if payload.channel and payload.channel != "general":
        constraints.append(f"This will be sent via {payload.channel}; format accordingly.")

    user_prompt = (
        f"Campaign type: {payload.campaign_type}\n"
        f"Target language: {payload.target_language}\n"
        f"Brief: {payload.brief}\n"
        + (" ".join(constraints) if constraints else "")
        + "\n\nWrite the final campaign message now, in the target language only."
    )

    content = call_claude(system_prompt, user_prompt, max_tokens=800)

    record = _log(
        db, "generate", payload.campaign_id, payload.target_language,
        payload.brief, content,
        {"campaign_type": payload.campaign_type, "tone": payload.tone, "channel": payload.channel},
        current_user.id,
    )

    return GenerateContentResponse(generation_id=record.id, content=content, language=payload.target_language)


@router.post("/translate", response_model=TranslateResponse)
def translate_content(
    payload: TranslateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    """
    Translates existing campaign content into a target language.

    engine="claude" (default): LLM-based, tone-preserving, idiomatic translation —
      good for nuanced or persuasive campaign copy.
    engine="bhashini": Government of India's dedicated Indic NMT models — purpose-built
      for Indian languages, useful when the audience's script/dialect accuracy matters
      most and for citizens who read only their regional language.
    """
    if payload.engine == "bhashini":
        translated = translate_via_bhashini(payload.text, payload.source_language, payload.target_language)
    else:
        system_prompt = (
            "You are an expert translator specializing in official and public-service "
            "communication in Indian languages. Translate naturally and idiomatically — "
            "not literally — preserving the tone, urgency, and register of the source text. "
            "Output only the translated text, nothing else."
        )
        tone_note = "Preserve the original tone and urgency exactly." if payload.preserve_tone else ""
        user_prompt = (
            f"Translate the following text into {payload.target_language}.\n{tone_note}\n\n"
            f"Text:\n{payload.text}"
        )
        translated = call_claude(system_prompt, user_prompt, max_tokens=800)

    record = _log(
        db, "translate", payload.campaign_id, payload.target_language,
        payload.text, translated,
        {"preserve_tone": payload.preserve_tone, "engine": payload.engine, "source_language": payload.source_language},
        current_user.id,
    )

    return TranslateResponse(
        generation_id=record.id, translated_text=translated,
        target_language=payload.target_language, engine=payload.engine,
    )


@router.post("/personalize", response_model=PersonalizeResponse)
def personalize_content(
    payload: PersonalizeRequest,
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    """
    Lightweight, non-AI personalization: fills {{token}} placeholders in a base
    message using the given recipient field values. Fast, deterministic, free —
    no LLM call needed for straightforward substitution.
    """
    text = payload.base_message
    for key, value in payload.recipient_fields.items():
        text = text.replace(f"{{{{{key}}}}}", str(value) if value is not None else "")
    return PersonalizeResponse(personalized_text=text)


@router.post("/analyze-sentiment", response_model=SentimentAnalysisResponse)
def analyze_sentiment(
    payload: SentimentAnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    """
    Sentiment/tone analysis for a draft message, with suggested improvements —
    e.g. flags an emergency alert that reads as too casual, or an awareness
    message that reads as alarming when it shouldn't.
    """
    system_prompt = (
        "You analyze the tone and sentiment of public-communication messages. "
        "Return a JSON object with exactly these keys: "
        '"sentiment" (one short label such as urgent, reassuring, neutral, alarming, '
        'formal, celebratory), "tone_notes" (1-2 sentence explanation), and '
        '"suggested_improvements" (a list of 0-3 short, concrete suggestions).'
    )
    user_prompt = f"Analyze this message:\n\n{payload.text}"

    result = call_claude_json(system_prompt, user_prompt, max_tokens=500)

    record = _log(
        db, "analyze", payload.campaign_id, None, payload.text, None, result, current_user.id,
    )

    return SentimentAnalysisResponse(
        generation_id=record.id,
        sentiment=result.get("sentiment", "unknown"),
        tone_notes=result.get("tone_notes", ""),
        suggested_improvements=result.get("suggested_improvements", []),
    )


@router.post("/compliance-check", response_model=ComplianceCheckResponse)
def compliance_check(
    payload: ComplianceCheckRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(MANAGE_ROLES)),
):
    """
    Content quality/compliance validation before deployment. Combines fast
    rule-based checks (character limits per channel) with an AI review for
    softer issues (missing call-to-action, unclear instructions, tone mismatches,
    placeholder tokens left unfilled, etc).
    """
    issues: List[ComplianceIssue] = []
    char_count = len(payload.text)

    limit = CHANNEL_LIMITS.get(payload.channel, None)
    if limit and char_count > limit:
        issues.append(ComplianceIssue(
            severity="critical",
            issue=f"Message is {char_count} characters, exceeding the {limit}-character {payload.channel.upper()} limit.",
        ))

    if "{{" in payload.text and "}}" in payload.text:
        issues.append(ComplianceIssue(
            severity="critical",
            issue="Message contains unfilled personalization tokens (e.g. {{name}}).",
        ))

    system_prompt = (
        "You review public-communication messages for quality and compliance before "
        "they are sent to a mass audience. Check for: missing or unclear call-to-action, "
        "confusing instructions, tone mismatched to urgency (e.g. an emergency alert that "
        "sounds casual), missing critical information (dates, locations, contact info) "
        "if the message implies it should be there, and any factual red flags. "
        "Return a JSON object with exactly one key, \"issues\": a list of objects each "
        'with "severity" (one of "info", "warning", "critical") and "issue" (short description). '
        "Return an empty list if the message is fine. Do not repeat character-count or "
        "placeholder-token issues — those are already checked separately."
    )
    user_prompt = f"Channel: {payload.channel}\n\nMessage:\n{payload.text}"

    try:
        ai_result = call_claude_json(system_prompt, user_prompt, max_tokens=500)
        for item in ai_result.get("issues", []):
            issues.append(ComplianceIssue(severity=item.get("severity", "info"), issue=item.get("issue", "")))
    except HTTPException as e:
        # AI review unavailable (e.g. no API key configured) — the rule-based
        # checks above still ran, so degrade gracefully instead of failing outright.
        issues.append(ComplianceIssue(
            severity="info",
            issue=f"AI-based review unavailable ({e.detail}). Only rule-based checks were applied.",
        ))

    passed = not any(i.severity == "critical" for i in issues)

    record = _log(
        db, "compliance", payload.campaign_id, None, payload.text, None,
        {"issues": [i.model_dump() for i in issues], "passed": passed, "character_count": char_count},
        current_user.id,
    )

    return ComplianceCheckResponse(generation_id=record.id, passed=passed, character_count=char_count, issues=issues)


@router.get("/history", response_model=List[ContentGenerationOut])
def get_history(
    campaign_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["admin", "campaign_manager", "communication_team"])),
):
    q = db.query(ContentGeneration).order_by(ContentGeneration.created_at.desc())
    if campaign_id:
        q = q.filter(ContentGeneration.campaign_id == campaign_id)
    return q.limit(100).all()
