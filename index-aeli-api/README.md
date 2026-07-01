# INDEX-AELI API Gateway & Microservices Backend

This is the backend API for the **INDEX-AELI Content Management System (CMS)** and **Visitor Web Application**. It is structured as an Express.js-based microservices architecture running on TypeScript, integrated with PostgreSQL, and ready for containerization.

---

## 1. System Architecture

The project consists of 5 microservices coordinated through an API Gateway:
- **API Gateway (Port 7009)**: Acts as the single entry point. Handles cross-origin requests (CORS) for the CMS (port `7008`) and Web (port `7007`), rate-limiting, JWT authentication, and request proxying.
- **Identity Service (Port 7010)**: Handles user credentials, login, refresh sessions, and user accounts.
- **Content Service (Port 7011)**: Manages Destinations, Attractions, and CTA Sections.
- **Program Service (Port 7012)**: Manages Providers, Programs (tours), Itineraries, Rundown Items, and Include/Exclude items. Calls Content Service internally to resolve destination mapping.
- **Media Service (Port 7013)**: Handles image/video uploads (up to 10MB limit) and serves static files.

```
                  ┌───────────────┐
                  │  Client Apps  │  (CMS: 7008, Web: 7007, Flutter)
                  └───────┬───────┘
                          │ (Port 7009)
                          ▼
                  ┌───────────────┐
                  │  API Gateway   │  (JWT verify, Rate limiter, Cors, Audit logger)
                  └───────┬───────┘
      ┌─────────────┬─────┼─────────────┬─────────────┐
      ▼             ▼     ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ identity │ │ content  │ │ program  │ │  media   │ │  audit   │  (Audit logging schema)
│ service  │ │ service  │ │ service  │ │ service  │ │  (DB)    │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────────┘
     │            │            │            │
     └────────────┼────────────┼────────────┘
                  ▼
            ┌───────────┐
            │ PostgreSQL│  (Single cluster, isolated schemas per service)
            └───────────┘
```

---

## 2. Ports and Services Mapping

| Port | Service Name | DB Schema | Description |
|---|---|---|---|
| **7009** | `api-gateway` | `audit` | Main entrance, JWT verification, rate limiting, and audit logging |
| **7010** | `identity-service` | `identity` | User Authentication, JWT issuance, Roles, and Permission enforcement |
| **7011** | `content-service` | `content` | Destination, Attraction, and CTA Section CRUD operations |
| **7012** | `program-service` | `program` | Providers, Programs, Itineraries, Rundowns, and Includes/Excludes CRUD |
| **7013** | `media-service` | `media` | File uploads, static image serving, and Polymorphic media asset links |

---

## 3. Database Schema Layout

All microservices write to their own isolated database schemas within the `index_aeli_db` PostgreSQL database:
- **`identity.users`**: Email logins, hashed passwords, roles (`super_admin`, `admin`, `content_editor`, `viewer`), and status (`active`, `inactive`).
- **`content.destinations`**: Tourism cities/regions with slugs and overview summaries.
- **`content.attractions`**: Points of interest linked to a Destination.
- **`content.cta_sections`**: Editable homepage sections (e.g. "Why Travel with INDEX-AELI").
- **`program.providers`**: Partner legal names, PICs, and contact details.
- **`program.programs`**: Detailed tours featuring pricing, duration, capacities, and links.
- **`program.itinerary_stops`**: Ordered travel checkpoints of a program.
- **`program.rundown_items`**: Time-delimited agenda sessions for programs.
- **`program.include_exclude_items`**: Explicit descriptions of what is included or excluded from prices.
- **`media.media_assets`**: Polymorphic asset records linked to destinations, attractions, or programs.
- **`audit.audit_logs`**: Logging of all mutations (create, update, delete, publish) targeting `/api/v1/admin/*`.

---

## 4. Setup & Running Instructions

### Prerequisites
- Node.js (v18 or v20 recommended)
- PostgreSQL (running locally or via Docker)

### Option A: Local Workspace Dev Mode (Recommended)
1. Ensure your local PostgreSQL instance is running on port `5432` with a `postgres` password.
2. Initialize the database (this will create `index_aeli_db`):
   ```bash
   psql -h localhost -U postgres -c "CREATE DATABASE index_aeli_db;"
   ```
3. Install dependencies from the project root:
   ```bash
   npm install
   ```
4. Start all 5 microservices and the Gateway concurrently:
   ```bash
   npm run dev
   ```
   *Note: On initial boot, database schemas and tables will automatically build and seed themselves with default user accounts and the 25+ tours.*

### Option B: Docker Compose Setup
Run the entire stack (PostgreSQL + Gateway + Services) in containers:
```bash
docker compose up --build -d
```

---

## 5. Seed Accounts (Default Credentials)

Upon schema initialization, the following administrative test users are seeded:
- **Super Admin**: `superadmin@indexaeli.com` / `superadminpassword` (can manage user accounts & roles)
- **Admin**: `admin@indexaeli.com` / `adminpassword` (can edit and publish all content)
- **Content Editor**: `editor@indexaeli.com` / `editorpassword` (can edit content, submit for review)
- **Viewer**: `viewer@indexaeli.com` / `viewerpassword` (read-only CMS viewer)

---

## 6. Contract API Endpoints

All admin endpoints require an `Authorization: Bearer <accessToken>` header. Downstream services enforce authorization based on headers injected by the API Gateway.

### Identity Service
- `POST /api/v1/auth/login` - Authenticate credentials and receive JWT access/refresh tokens.
- `POST /api/v1/auth/refresh` - Swap a valid refresh token for a new access token.
- `POST /api/v1/auth/logout` - Invalidate a refresh token.
- `GET /api/v1/users` - List all CMS users (requires Admin/Super Admin).
- `POST /api/v1/users` - Create a new user (requires Super Admin).
- `PATCH /api/v1/users/:id/role` - Modify a user's role or status (requires Super Admin).

### Content Service
- `GET /api/v1/destinations` - Get all published destinations (supports `?is_popular=true` and `?search=`).
- `GET /api/v1/destinations/:slug` - Get destination details.
- `GET /api/v1/destinations/:slug/attractions` - List all published attractions for a destination.
- `GET /api/v1/attractions/:idOrSlug` - Get attraction details.
- `GET /api/v1/cta?scope=homepage` - Get active CTA section content for a page scope.
- `GET /api/v1/admin/destinations` - CMS list of all destinations (Editor+).
- `POST /api/v1/admin/destinations` - Create destination (Editor+).
- `PUT /api/v1/admin/destinations/:id` - Update destination (Editor+).
- `PATCH /api/v1/admin/destinations/:id/status` - Change destination status (draft, review, published, archived) (Admin+).
- `DELETE /api/v1/admin/destinations/:id` - Soft/Hard delete destination (Admin+).
- `POST /api/v1/admin/attractions` - Create attraction (Editor+).
- `PUT /api/v1/admin/attractions/:id` - Update attraction (Editor+).
- `PATCH /api/v1/admin/attractions/:id/status` - Change attraction status (Admin+).
- `GET /api/v1/admin/cta` - CMS list of all CTA sections (Editor+).
- `PUT /api/v1/admin/cta/:id` - Edit CTA text and button routing (Editor+).

### Program Service
- `GET /api/v1/programs` - List published programs (supports filtering by `category`, `destination`, `price_min`, `price_max`, `provider_id`).
- `GET /api/v1/programs/:id` - Retrieve full program details (includes resolved Destination details, itineraries, rundowns, and include/exclude items).
- `GET /api/v1/admin/programs` - CMS list of all programs (Editor+).
- `POST /api/v1/admin/programs` - Create program with nested itineraries, rundown, and included/excluded text (Editor+).
- `PUT /api/v1/admin/programs/:id` - Update program and replace its nested arrays (Editor+).
- `PATCH /api/v1/admin/programs/:id/status` - Publish, unpublish, or archive a program (Admin+).
- `GET /api/v1/admin/providers` - List all registered tour providers (Editor+).
- `POST /api/v1/admin/providers` - Register a new provider (Editor+).
- `PUT /api/v1/admin/providers/:id` - Edit provider details (Editor+).

### Media Service
- `POST /api/v1/admin/media/upload` - Upload an image/video (multipart form-data, max 10MB) linked to an `owner_type` and `owner_id` (Editor+). Returns the static URL path.
- `GET /api/v1/media?owner_type=program&owner_id=:id` - Fetch all media attachments for a program or destination.
- `DELETE /api/v1/admin/media/:id` - Delete media from the database and remove the physical file from the storage directory (Editor+).
