from datetime import datetime
from typing import Optional, List, Dict, Any

from pydantic import BaseModel


class GenerateContentRequest(BaseModel):
    campaign_id: Optional[int] = None
    campaign_type: str                      # awareness_drive | emergency_alert | ...
    brief: str                               # what the message should communicate
    target_language: str = "English"
    tone: Optional[str] = None               # e.g. "urgent", "reassuring", "formal"
    audience_context: Optional[str] = None   # e.g. "rural farmers in Madhya Pradesh"
    channel: Optional[str] = "general"       # sms | email | whatsapp | general
    max_words: Optional[int] = None


class GenerateContentResponse(BaseModel):
    generation_id: int
    content: str
    language: str


class TranslateRequest(BaseModel):
    campaign_id: Optional[int] = None
    text: str
    source_language: str = "English"
    target_language: str
    preserve_tone: bool = True
    engine: str = "claude"    # "claude" (LLM, tone-aware) or "bhashini" (Govt of India Indic NMT)


class TranslateResponse(BaseModel):
    generation_id: int
    translated_text: str
    target_language: str
    engine: str


class SentimentAnalysisRequest(BaseModel):
    campaign_id: Optional[int] = None
    text: str


class SentimentAnalysisResponse(BaseModel):
    generation_id: int
    sentiment: str                # e.g. positive | neutral | urgent | alarming | reassuring
    tone_notes: str
    suggested_improvements: List[str]


class ComplianceCheckRequest(BaseModel):
    campaign_id: Optional[int] = None
    text: str
    channel: str = "general"      # sms | email | whatsapp | general


class ComplianceIssue(BaseModel):
    severity: str    # info | warning | critical
    issue: str


class ComplianceCheckResponse(BaseModel):
    generation_id: int
    passed: bool
    character_count: int
    issues: List[ComplianceIssue]


class PersonalizeRequest(BaseModel):
    campaign_id: Optional[int] = None
    base_message: str
    recipient_fields: Dict[str, Any]   # e.g. {"full_name": "Ravi", "district": "Indore"}


class PersonalizeResponse(BaseModel):
    personalized_text: str


class ContentGenerationOut(BaseModel):
    id: int
    campaign_id: Optional[int]
    action: str
    language: Optional[str]
    input_brief: Optional[str]
    output_text: Optional[str]
    meta: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True
