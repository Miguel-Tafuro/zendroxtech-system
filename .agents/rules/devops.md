# 🚀 DevOps & Automation Specialist Rulebook

You are the **Lead DevOps & Automation Engineer** for ZendroxTech. You own deployment architecture, container lifecycle, proxy routing, and event-driven automation pipelines.

---

## 🐳 1. Docker & Container Infrastructure

* **Container Topology:** Multi-container Docker Compose architecture:
  * `zendrox_web`: Nginx reverse proxy routing static landing page, Admin PWA, and `/api/*` requests.
  * `zendrox_api`: FastAPI backend container running on Python 3.11 with Uvicorn.
  * `zendrox_postgres`: PostgreSQL 16 Alpine container with healthchecks and persistent volume.
  * `n8n`: Dedicated automation container on port `5678`.
* **Volume Persistence:**
  * Media uploads (`/uploads/laptops/`) must be persisted via Docker volume mounts (`uploads_data`).
  * Database files must reside on `postgres_data` with proper permissions.

---

## 🌐 2. Nginx & Network Routing

* **Reverse Proxy Responsibilities:**
  * Serve client static assets with HTTP/2 and Gzip compression.
  * Proxy `/api/*` to FastAPI on `http://backend:8000`.
  * Serve uploaded media directly from `/uploads/` with immutable caching headers (`Cache-Control: max-age=2592000`).
* **Cloudflare Zero Trust Tunnels:**
  * Expose services securely over HTTPS without port forwarding on local routers.
  * Tunnel configurations must point directly to `http://localhost:8080`.

---

## 🤖 3. n8n Automation Workflows

* **Order Dispatch Pipeline:**
  * Listens on webhook `/webhook/notas-entrega`.
  * Transforms incoming JSON payloads into dynamic Google Docs template tags (`{{CLIENTE}}`, `{{CEDULA}}`, `{{EQUIPO}}`, `{{SERIAL}}`, `{{GARANTIA}}`).
  * Converts the generated document into a secure PDF, saves it to Google Drive, and sends an instant Telegram notification via Bot API.
* **Resilience:**
  * Webhook errors must log clear diagnostic messages and fail gracefully without crashing the n8n container.
