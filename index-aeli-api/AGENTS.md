# AI Agent Guidelines & Architecture Rules

This repository is **Hoople Event API**, a backend service for an event builder and ticketing platform built with Express.js, TypeScript, PostgreSQL, and Prisma.

---

## 📌 1. Primary Documentation & Single Source of Truth

- **Comprehensive API & Technical Specifications**: Always consult [dev_documentation.md](file:///Users/a/01%20Projects/Web/index-aeli-project/index-aeli-api/dev_documentation.md) for domain rules, payload schemas, OTP flows, booking lifecycle, PDF ticket generation, and Hoople Payment integration.
- **Project Setup & Operations**: See [README.md](file:///Users/a/01%20Projects/Web/index-aeli-project/index-aeli-api/README.md) for local setup, environment variables, Prisma migration commands, and Docker server maintenance.
- **Detailed Coding Guidelines**: See [.agents/rules/guidelinescoding.md](file:///Users/a/01%20Projects/Web/index-aeli-project/index-aeli-api/.agents/rules/guidelinescoding.md) for extended architectural and coding behavior constraints.

---

## 🏗️ 2. Express.js Layered Architecture

Always strictly adhere to the layered structure:

```text
Route
  ↓
Controller (HTTP Concerns ONLY)
  ↓
Service (Business Logic ONLY)
  ↓
Prisma Model / Database
```

### Controller Rules (Thin Controller)
- **Allowed**: Read `req.params`, `req.query`, `req.body`, `req.user`, call a service method, return HTTP response envelope (`res.status(...).json(...)`), pass errors via `next(error)`.
- **Forbidden**: Business logic, calculations, direct database/Prisma operations, payment orchestration, state transitions.

### Service Rules (Fat Service)
- **Allowed**: Business rules, calculations, Prisma database operations, external API orchestration (Payment, Email, etc.), throwing custom domain errors.
- **Forbidden**: Using `req`, `res`, sending HTTP responses, importing or depending on Express HTTP objects.

---

## 🎯 3. Core Behavioral Guidelines for AI Agents

1. **Think Before Coding**:
   - Understand existing patterns and database schema before creating new files.
   - Surface tradeoffs and clarify ambiguities if they affect architecture or business logic.
2. **Simplicity First**:
   - Minimum code that solves the problem. No speculative abstractions, single-use utility wrappers, or premature patterns.
3. **Surgical Changes**:
   - Touch only the lines/files necessary for the task.
   - Preserve existing code formatting, comments, and unaffected logic.
   - Remove only unused imports or variables introduced by your own changes.
4. **Standard Response Envelope**:
   All API endpoints must return the standardized response structure:
   ```json
   {
     "success": true | false,
     "message": "Human readable message",
     "data": { ... } | null,
     "meta": { "page": 1, "perPage": 10, "total": 50, "totalPages": 5 } | null,
     "error": null | {
       "code": "VALIDATION_ERROR" | "NOT_FOUND" | "UNAUTHORIZED" | "FORBIDDEN" | "CONFLICT" | "SERVER_ERROR",
       "errors": { "field": ["detail"] }
     }
   }
   ```
5. **Knowledge Graph & Doc Synchronization**:
   - After creating or modifying endpoints, services, or domain logic, update [dev_documentation.md](file:///Users/a/01%20Projects/Web/index-aeli-project/index-aeli-api/dev_documentation.md).
   - Keep the knowledge graph synced via `graphify update .`.
