# Milestones 1 & 2 — Audience Management, Campaign Planning & AI Content Engine

AI-Based Multilingual Mass Communication & Public Awareness Management Platform

## Milestone 1 (Weeks 1–2) — Audience Management & Campaign Planning
- User registration, login, and role-based access control (Admin / Campaign Manager / Communication Team)
- Audience database with demographics, geography, language preference, occupation, and organization hierarchy
- Bulk audience import via CSV/XLSX
- Audience segmentation (filter by state, district, language, org, department, occupation, tags)
- Campaign creation workflow (Awareness Drive, Emergency Alert, Educational Notification, Organizational Announcement)
- Campaign status workflow: draft → review → scheduled → sent → completed (with validated transitions)
- Reusable communication templates / content library

## Milestone 2 (Weeks 3–4) — AI Content Generation & Multilingual Communication Engine
- **Content generation**: draft campaign messages from a brief, in any target language, tuned by tone/audience/channel
- **Translation**: natural, tone-preserving translation of existing content into Indian (or any) languages — via Claude, or via **Bhashini** (Govt of India's dedicated Indic-language NMT models) for citizens who read only their regional language
- **Personalization**: fill `{{token}}` placeholders (e.g. `{{full_name}}`, `{{district}}`) per recipient — instant, no AI call needed
- **Sentiment / tone analysis**: flags mismatched tone (e.g. a casual-sounding emergency alert) with improvement suggestions
- **Compliance validation**: rule-based checks (SMS/WhatsApp character limits, unfilled tokens) + AI review for missing CTAs, unclear instructions, etc. — degrades gracefully to rule-based-only if no AI key is configured
- **Activity history**: every generation/translation/analysis/compliance check is logged and viewable

Both milestones share one running app — the frontend has an **AI Content Studio** tab that plugs generated content directly into a new campaign draft.

---

## 1. Run the backend (FastAPI)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000
```

- API docs (Swagger UI): http://localhost:8000/docs
- The app uses SQLite by default (`mass_comm_platform.db`, created automatically).
  To switch to PostgreSQL for production, change `SQLALCHEMY_DATABASE_URL` in
  `app/core/database.py` to something like:
  `postgresql://user:password@localhost:5432/mass_comm_db`
  (and `pip install psycopg2-binary`).

### First user = Admin
The very first account registered via `/auth/register` automatically becomes
`admin`. Every account after that defaults to `communication_team` — promote
users to `campaign_manager` or `admin` via:
`PATCH /auth/users/{user_id}/role?role=campaign_manager` (requires an admin token).

### Roles & permissions
| Action | admin | campaign_manager | communication_team |
|---|---|---|---|
| Manage users/roles | ✅ | ❌ | ❌ |
| Create/edit audience & campaigns | ✅ | ✅ | ❌ (view only) |
| Use AI content generation/translation/compliance | ✅ | ✅ | ❌ |
| View audience/campaigns/templates/AI history | ✅ | ✅ | ✅ |

### Enabling AI features (Milestone 2)
The `/ai/*` endpoints (generate, translate, sentiment, compliance) call the
Anthropic API by default and require an API key:

1. Get a key at https://console.anthropic.com/
2. Set it as an environment variable **before** starting the backend:
   - Windows (PowerShell): `$env:ANTHROPIC_API_KEY="sk-ant-..."`
   - macOS/Linux: `export ANTHROPIC_API_KEY="sk-ant-..."`
3. Then start the server as usual.

Without a key set, content generation/translation/sentiment endpoints return a
clear error explaining what to do — and the compliance-check endpoint still
runs its rule-based checks (character limits, unfilled personalization tokens)
even without a key.

### Optional: Bhashini — dedicated Indic-language translation
Translation supports two engines: **Claude** (default — tone-aware, works for
any language) and **Bhashini** (Government of India's National Language
Translation Mission — purpose-built NMT models for Indian languages, most
useful for citizens who read only their regional language and need accurate
native-script output).

To enable Bhashini:
1. Register (free) at https://bhashini.gov.in/ulca/user/register
2. Verify your email, log in, open **My Profile**, and generate an API key
3. Set both environment variables before starting the backend:
   - Windows (PowerShell): `$env:BHASHINI_USER_ID="..."` and `$env:BHASHINI_API_KEY="..."`
   - macOS/Linux: `export BHASHINI_USER_ID="..."` and `export BHASHINI_API_KEY="..."`
4. In the **AI Content Studio** tab, pick "Bhashini" from the translation
   engine dropdown before clicking Translate.

Supported Bhashini languages: Hindi, English, Marathi, Tamil, Telugu, Kannada,
Malayalam, Bengali, Gujarati, Punjabi, Odia, Urdu, Assamese, Nepali, Sanskrit,
Konkani, Manipuri, Bodo, Santali, Maithili, Dogri, Kashmiri, Sindhi.

---

## 2. Run the frontend

No build step needed — it's static HTML/CSS/JS.

```bash
cd frontend
python3 -m http.server 5500
```

Then open **http://localhost:5500/landing.html** in your browser — this is the
marketing/overview page. Click **"Enter the console"** to go to the login screen
(`index.html`), which is the actual working application.

(Make sure the backend is running on port 8000 at the same time — the app
calls `http://localhost:8000` directly.)

If you deploy the backend elsewhere, change the `API_BASE` constant at the
top of the `<script>` block in `index.html`, or set
`window.API_BASE_OVERRIDE` before the script runs.

---

## 3. Try the full flow

1. Open `http://localhost:5500/landing.html`, review the overview, and click
   **"Enter the console."**
2. Click **Create an account** — the first account becomes admin.
2. Go to **Audience** → add a few recipients manually, or use **Bulk import**
   with a CSV (see `sample_data/sample_audience.csv`).
3. Go to **Segmentation** → filter by state/language/etc. and see the live match count.
4. Go to **Templates** → save a reusable message template.
5. Go to **AI Content Studio** *(requires `ANTHROPIC_API_KEY`, see above)*:
   - Enter a brief (e.g. "Remind citizens to get their annual health checkup"), pick a
     target language and channel, and click **Generate content**.
   - Or paste existing text and **Translate** it into another language.
   - Click **Check tone / sentiment** and **Run compliance check** on the draft.
   - Click **Use in new campaign →** to carry the draft straight into a campaign.
6. Go to **Campaigns** → create a campaign (optionally with an AI-generated
   message and a segment filter), then advance it through its status workflow.
7. Check the **Dashboard** for a live overview of recipients, templates and campaigns.

---

## 4. Project structure

```
backend/
  app/
    core/          # DB session, JWT/password security, RBAC dependency, Anthropic API client
    models/        # SQLAlchemy models: User, Audience, Campaign, Template, ContentGeneration
    schemas/       # Pydantic request/response schemas
    routers/       # auth, audience, campaigns, templates, ai_content endpoints
    utils/         # CSV/XLSX bulk-import parsing
    main.py        # FastAPI app entrypoint
  requirements.txt

frontend/
  landing.html    # Marketing/overview page — the entry point
  index.html      # Full SPA dashboard (no framework/build step) — includes AI Content Studio

sample_data/
  sample_audience.csv   # Example file for testing bulk import
```

## 5. What's next (Milestone 3 preview)

Module 3 (Weeks 5–6) builds on this foundation: multi-channel delivery
(Email/SMS/WhatsApp/Push), scheduling, delivery tracking, engagement analytics
(open/click/response rates), and React.js dashboards for campaign performance
— consuming the campaigns and AI-generated content already in place from
Milestones 1 and 2.
