# AI Agent Instructions & Workspace Knowledge

Welcome to the **INDEX-AELI Platform** codebase.

> [!IMPORTANT]
> **Single Source of Truth**:
> All AI coding agents (Claude, Gemini, Cursor, Copilot, Antigravity) must refer to [ARCHITECTURE.md](file:///Users/a/01%20Projects/Web/index-aeli-project/ARCHITECTURE.md) for complete system architecture, database schema, RBAC roles, microservices routing, React 19/Turbopack pitfalls, and operational commands.

---

## ⚡ Quick Architecture Overview

INDEX-AELI consists of 3 distinct applications and 1 centralized PostgreSQL database:

1. **`index-aeli-api/` (Port 7009 Gateway)**:
   - Microservices architecture in Express.js + TypeScript.
   - API Gateway (`7009`) routes to:
     - Identity Service (`7010`): Auth, JWT, RBAC, Users lifecycle, Permanent Cascade Delete.
     - Content Service (`7011`): Destinations, Attractions, App Config, CTA banners.
     - Program Service (`7012`): Programs, Itineraries, Rundowns, Inclusions, Providers, Categories.
     - Media Service (`7013`): Static uploads (`/uploads/`), Media Asset registry.
   - Database: PostgreSQL on port `5432` with schemas: `identity`, `content`, `program`, `media`, `audit`.

2. **`index-aeli-cms/` (Port 7008)**:
   - Admin CMS built with Next.js 16 (Turbopack), React 19, Tailwind v4, Base UI (`@base-ui/react`), and Zustand.
   - Role-guarded sidebar and pages:
     - `super_admin`: Full access (Users, Roles, App Config, Programs, Content).
     - `admin`: User Access (Users, Roles), Programs, Content.
     - `content_editor`: Default role for new users. Can create/edit Location, Experience, Programs. User Access & Config are hidden.
     - `viewer`: Read-only access.

3. **`index-aeli-web/` (Port 7007)**:
   - Public-facing traveler portal built with Next.js 16, React 19, Tailwind v4, and Framer Motion.
   - Features dynamic destinations, attractions, programs, booking calendar, and dynamic App Config (tax, contact, about, footer).

---

## 🛑 Strict Agent Rules

1. **Never bypass API Gateway from Frontend**: All browser requests from `index-aeli-cms` and `index-aeli-web` must hit Gateway port `7009` (`/api/v1/...`).
2. **Turbopack & Client/Server Boundaries**: Never export/import runtime objects or defaults from `"use client"` files into Server Components (`page.tsx`).
3. **HTML Paragraph Tag Rule**: Avoid nesting `<p>` inside `<AlertDialogDescription>` or `<DialogDescription>` (they render `<p>` by default).
4. **Base UI Select Event**: `@base-ui/react` `onValueChange` passes `string | null`. Always handle potential null: `(v) => v && setState(v)`.
5. **Always Typecheck Before Finishing**:
   - `npm --prefix index-aeli-api run build`
   - `./index-aeli-cms/node_modules/.bin/tsc -p index-aeli-cms/tsconfig.json --noEmit`
   - `./index-aeli-web/node_modules/.bin/tsc -p index-aeli-web/tsconfig.json --noEmit`

For full details, see [ARCHITECTURE.md](file:///Users/a/01%20Projects/Web/index-aeli-project/ARCHITECTURE.md).

