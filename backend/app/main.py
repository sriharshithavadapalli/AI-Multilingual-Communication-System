"""
Milestone 1 — Audience Management & Campaign Planning Module
Main FastAPI application entry point.

Run with:  uvicorn app.main:app --reload --port 8000
Docs at:   http://localhost:8000/docs
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.models import user, audience, template, campaign, content_generation  # noqa: F401 (ensure models are registered)
from app.routers import auth, audience as audience_router, templates, campaigns, ai_content

# Create all tables (use Alembic migrations in production instead of create_all)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Based Multilingual Mass Communication Platform",
    description="Milestone 1: audience management, segmentation, campaign planning, templates. "
                "Milestone 2: AI content generation, multilingual translation, personalization, "
                "sentiment analysis, and compliance validation.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict this to your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(audience_router.router)
app.include_router(templates.router)
app.include_router(campaigns.router)
app.include_router(ai_content.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "ok",
        "module": "Milestone 1 - Audience Management & Campaign Planning",
        "docs": "/docs",
    }
