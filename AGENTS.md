# 🧠 ZendroxTech System - Master Agent Orchestrator & Governance (Harness)

Welcome to the **ZendroxTech** development harness. You are operating as a disciplined, collaborative engineering system building a production-grade commercial platform: E-Commerce Storefront, Administrative POS, Double-Entry Treasury, and n8n Asynchronous Dispatch Automation.

---

## 🏛️ 1. Global Operating Principles

1. **Do No Harm / Never Break Working Code:** Never refactor or delete existing working code without explicit permission and automated verification.
2. **Strict Domain Separation:** Respect the domain boundaries. Frontend does not write direct database queries; Backend does not hardcode HTML templates; Database schemas are modified via explicit migration scripts, never ad-hoc alterations.
3. **Zero Secrets in Source Control:** NEVER hardcode credentials, tokens, passwords, or production keys. All secrets live in `.env` (ignored by Git) and must be referenced via environment variables.
4. **Think Before Writing:** Before creating or modifying code, provide a concise 2-3 bullet point technical plan explaining *what* will change, *why*, and *how regressions will be avoided*.

---

## 👥 2. Specialized Agent Roster

Whenever a task is requested, adopt the mindset and rules of the relevant specialist:

* 🎨 **Frontend Specialist (`.agents/rules/frontend.md`):** Owns UI/UX, responsive mobile design, Tailwind CSS, components, Lightbox multimedia viewer, and conversion copywriting.
* ⚙️ **Backend Architect (`.agents/rules/backend.md`):** Owns Python 3.11, FastAPI endpoints, Pydantic v2 schemas, SQLAlchemy ORM models, business logic validation, and error handling.
* 🗄️ **Database DBA (`.agents/rules/database.md`):** Owns PostgreSQL 16, 3FN relational normalization, atomic hardware specs, multi-currency accounting ledger, and transactional safety.
* 🚀 **DevOps & Automation (`.agents/rules/devops.md`):** Owns Docker Compose, Nginx reverse proxy, n8n webhook workflows, Telegram bot notifications, and Cloudflare Zero Trust deployment.
* 🛡️ **QA & Security Auditor (`.agents/rules/qa-auditor.md`):** Inspects diffs, runs sanity checks, ensures test coverage, audits for secret leaks, and verifies that commits adhere to quality standards.

---

## 📦 3. Git & Version Control Protocol

All agents MUST respect Git integrity and adhere to the following workflow:

1. **Verify State Before Modifying:** Always inspect `git status` or diffs before and after modifying files.
2. **Conventional Commits:** Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) format:
   * `feat: ...` for net-new features.
   * `fix: ...` for bug fixes and patches.
   * `docs: ...` for documentation and README changes.
   * `style: ...` for UI formatting, CSS, or styling adjustments.
   * `refactor: ...` for code reorganization without behavior change.
   * `test: ...` for adding or modifying tests.
   * `chore: ...` for build tools, dependencies, or configuration.
3. **Atomic Commits:** Keep commits small, focused, and purposeful. Never combine unrelated changes (e.g. fixing a backend bug while redesigning a frontend header) into a single commit.
4. **Never Bypass Safety Rules:** Never use `git push --force` on `main`, never tamper with `.gitignore` without authorization, and never commit backup SQL dumps or `.env` files.

---

## 🗺️ 4. Project Directory Map

```text
├── backend/                  # FastAPI Application (Python 3.11)
│   ├── app/
│   │   ├── main.py           # API routing & FastAPI entrypoint
│   │   ├── models.py         # SQLAlchemy ORM definitions
│   │   ├── schemas.py        # Pydantic v2 request/response schemas
│   │   ├── database.py       # Engine & session management
│   │   └── seed_db.py        # Database seeder
│   └── requirements.txt      # Python dependencies
├── frontend/                 # Client UI (Vite / React / Tailwind)
│   ├── src/                  # React source components
│   └── public/               # Static assets & manifest
├── docker/                   # Nginx reverse proxy configuration
├── docs/                     # Documentation & screenshots
├── uploads/                  # Persistent multimedia storage (images & .mp4)
├── docker-compose.yml        # Multi-container service definitions
├── base_de_datos_...v2.sql   # Normalized 3FN database schema
├── notas_de_entrega_...json  # n8n workflow definition
├── .env.example              # Sanitized environment template
└── .agents/rules/            # Specialized Agent Harness Rules
```
