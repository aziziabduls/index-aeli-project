# AI Agent Guidelines & Architecture Rules: `index-aeli-api`

> [!IMPORTANT]
> **Primary Source of Truth**:
> For the platform-wide architecture, database schemas, RBAC matrix, and inter-service communication, see the root [ARCHITECTURE.md](file:///Users/a/01%20Projects/Web/index-aeli-project/ARCHITECTURE.md).

---

## 🏗️ 1. Architecture Overview

`index-aeli-api` is a modular microservice backend built with **Express.js**, **TypeScript**, and **PostgreSQL (raw `pg` pool)**.

### Microservices & Ports
- **`services/api-gateway` (Port 7009)**:
  - Entrypoint for all client apps (`index-aeli-cms` and `index-aeli-web`).
  - Handles JWT authentication (`authMiddleware`), CORS, rate limiting, and forwards user context headers (`x-user-id`, `x-user-role`, `x-user-email`).
  - Logs write operations (POST, PUT, PATCH, DELETE) to `audit.audit_logs`.
- **`services/identity-service` (Port 7010)**:
  - Schema: `identity`.
  - Authentication, password hashing (bcrypt), token issuance, user lifecycle, and permanent cascade user deletion.
- **`services/content-service` (Port 7011)**:
  - Schema: `content`.
  - Manages `content.destinations`, `content.attractions`, `content.app_config`, and `content.cta_sections`.
- **`services/program-service` (Port 7012)**:
  - Schema: `program`.
  - Manages `program.programs`, `program.providers`, `program.categories`, `program.itinerary_stops`, `program.rundown_items`, `program.include_exclude_items`.
- **`services/media-service` (Port 7013)**:
  - Schema: `media`.
  - Handles static file uploads to disk (`uploads/`), static serving at `/uploads/`, and `media.media_assets` registry.

---

## 📐 2. Layered Architecture & Coding Rules

Strictly adhere to the layered structure within each microservice:
```text
Route
  ↓
Controller (HTTP Concerns ONLY)
  ↓
Service (Business Logic & Database Queries)
  ↓
PostgreSQL Pool (pg)
```

### Controller Rules (Thin Controller)
- **Allowed**: Read `req.params`, `req.query`, `req.body`, `req.headers` (e.g. `x-user-id`, `x-user-role`), call service methods, return standardized JSON envelope, catch and forward errors via `next(error)`.
- **Forbidden**: Writing raw SQL queries, transaction orchestration, or direct database calls.

### Service Rules (Fat Service)
- **Allowed**: Business rules, raw SQL queries with parameterization (`$1`, `$2`), multi-table transactions (`BEGIN` ... `COMMIT`/`ROLLBACK`), throwing domain errors.
- **Forbidden**: Referencing `req` or `res` Express objects.

### Standard Response Envelope
All API endpoints must return:
```json
{
  "success": true,
  "message": "Human readable message",
  "data": { ... }
}
```
Or for errors:
```json
{
  "success": false,
  "message": "Error description",
  "error": "..."
}
```

---

## 🔒 3. RBAC & Headers
- Gateway automatically validates Bearer JWT tokens and forwards headers:
  - `x-user-id`: UUID of the authenticated user.
  - `x-user-role`: `super_admin` | `admin` | `content_editor` | `viewer`.
  - `x-user-email`: Email string.
- Services inspect `req.headers['x-user-role']` via role checking helper functions (`checkAdminRole`, `checkEditorRole`).
- **Registration**: Newly registered users automatically default to role `content_editor`.

---

## 🧪 4. Build & Verification
Always verify backend builds without errors before concluding changes:
```bash
npm --prefix index-aeli-api run build
```
