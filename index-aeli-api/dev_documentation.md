# INDEX-AELI API Developer & Technical Documentation

This document serves as the technical single source of truth for the **INDEX-AELI API Backend**, built with Express.js, TypeScript, PostgreSQL, and a microservices architecture.

---

## 1. System Architecture & Layering

The backend is composed of 5 microservices that strictly adhere to the layered Express.js architecture:

```text
Route
  ↓
Controller (HTTP Concerns ONLY: parse req.params/query/body/headers, call Service, return HTTP responses, next(err))
  ↓
Service (Business Logic ONLY: domain rules, calculations, db orchestration, transactions, external integrations)
  ↓
Model / Database (PostgreSQL pools, SQL queries, relational schema)
```

### Services & Ports

| Service | Port | DB Schema | Responsibilities |
|---|---|---|---|
| **API Gateway** | `7009` | `audit` | Reverse proxy, CORS for CMS (`7008`) and Web (`7007`), rate-limiting, JWT authentication, audit logging |
| **Identity Service** | `7010` | `identity` | User authentication, registration, JWT issuance/refresh, user accounts and system roles |
| **Content Service** | `7011` | `content` | Tourism destinations, attractions, and homepage/page CTA sections |
| **Program Service** | `7012` | `program` | Providers, tour programs (with nested itineraries, rundowns, included/excluded), categories, destination resolution |
| **Media Service** | `7013` | `media` | File uploads (images, videos up to 10MB), Sharp image optimization (AVIF conversion), polymorphic media asset records, static file serving |

---

## 2. Authentication Flow & Security

### Gateway Authentication (`api-gateway`)
1. Client sends `Authorization: Bearer <accessToken>` header on requests to `/api/v1/admin/*`, `/api/v1/users`, and `/api/v1/roles`.
2. Gateway verifies token via `authMiddleware`.
3. If valid, Gateway decorates proxy request with:
   - `x-user-id`: User UUID
   - `x-user-email`: User email address
   - `x-user-role`: User role (`super_admin`, `admin`, `content_editor`, `viewer`)
4. Downstream microservices verify permissions using `requireRole` or `checkEditorRole` / `checkAdminRole` middlewares by inspecting `x-user-role`.

### Tokens Lifecycle (`identity-service`)
- **Access Token**: JWT valid for 15 minutes (`expiresIn: '15m'`).
- **Refresh Token**: JWT valid for 7 days (`expiresIn: '7d'`), tracked in active refresh tokens pool.
- Refresh endpoint: `POST /api/v1/auth/refresh` swaps valid refresh token for fresh access token.
- Logout endpoint: `POST /api/v1/auth/logout` invalidates the refresh token.

---

## 3. Error Handling & Standard Response Envelope

### Standard Response Envelope
All endpoints return consistent JSON envelopes:
- **Success Response**:
  ```json
  {
    "success": true,
    "data": { ... }
  }
  ```
  *(or `{ "success": true, "message": "..." }` for message-only operations)*

- **Error Response**:
  ```json
  {
    "success": false,
    "error": "Error message description"
  }
  ```

### Centralized Error Handling
Each service defines a custom `AppError` class inheriting from `Error`:
```ts
export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}
```
Controllers catch exceptions and forward to `next(err)`. The `errorHandler` middleware catches `AppError` and system errors, returning the appropriate HTTP status code (`400`, `401`, `403`, `404`, `409`, `500`) and the clean error envelope.

---

## 4. Complete API Endpoints Catalog

### 4.1. Identity Service (Port 7010)

#### `POST /api/v1/auth/login`
- **Access**: Public (Rate-limited at Gateway)
- **Body**: `{ "email": "superadmin@indexaeli.com", "password": "superadminpassword" }`
- **Response** `200`:
  ```json
  {
    "success": true,
    "data": {
      "accessToken": "eyJhbG...",
      "refreshToken": "eyJhbG...",
      "user": { "id": "...", "email": "superadmin@indexaeli.com", "role": "super_admin" }
    }
  }
  ```

#### `POST /api/v1/auth/register`
- **Access**: Public
- **Body**: `{ "email": "user@example.com", "password": "password123" }`
- **Response** `201`: User object. (First registered user automatically becomes `super_admin`, subsequent users default to `viewer`).

#### `POST /api/v1/auth/refresh`
- **Access**: Public
- **Body**: `{ "refreshToken": "eyJhbG..." }`
- **Response** `200`: `{ "success": true, "data": { "accessToken": "..." } }`

#### `POST /api/v1/auth/logout`
- **Access**: Public
- **Body**: `{ "refreshToken": "eyJhbG..." }`
- **Response** `200`: `{ "success": true, "message": "Logged out successfully" }`

#### `GET /api/v1/users`
- **Access**: Admin, Super Admin
- **Response** `200`: List of user records (`id`, `email`, `role`, `status`, `created_at`, `updated_at`).

#### `GET /api/v1/roles`
- **Access**: Admin, Super Admin
- **Response** `200`: System roles list with user count per role (`Super Admin`, `Admin`, `Content Editor`, `Viewer`).

#### `POST /api/v1/users`
- **Access**: Super Admin
- **Body**: `{ "email": "editor@indexaeli.com", "password": "tempPassword", "role": "content_editor" }`
- **Response** `201`: Created user record.

#### `PATCH /api/v1/users/:id/role`
- **Access**: Super Admin
- **Body**: `{ "role": "admin", "status": "active" }`
- **Response** `200`: Updated user record.

---

### 4.2. Content Service (Port 7011)

#### Public Endpoints
- `GET /api/v1/destinations` - Query published destinations.
  - Query parameters: `?is_popular=true`, `?search=keyword`
  - Returns destinations with aggregated `attraction_count`.
- `GET /api/v1/destinations/:idOrSlug` - Get single published destination details by UUID or URL slug.
- `GET /api/v1/destinations/:idOrSlug/attractions` - List all published attractions for a destination.
- `GET /api/v1/attractions` - List published attractions (supports filter `?destination_id=UUID_OR_SLUG`).
- `GET /api/v1/attractions/:idOrSlug` - Get single attraction details.
- `GET /api/v1/cta?scope=homepage` - Fetch active published CTA banner section for a specific page scope.

#### Internal Endpoints (Service-to-Service)
- `GET /internal/destinations/:id` - Internal lookup for `program-service` to resolve destination name and slug.

#### Admin Endpoints
- `GET /api/v1/admin/destinations` - (Editor+) List all destinations across all statuses.
- `POST /api/v1/admin/destinations` - (Editor+) Create destination draft. Generates slug automatically.
- `PUT /api/v1/admin/destinations/:id` - (Editor+) Update destination data.
- `PATCH /api/v1/admin/destinations/:id/status` - (Admin+) Change status (`draft`, `review`, `published`, `archived`).
- `DELETE /api/v1/admin/destinations/:id` - (Admin+) Hard delete destination and cascade attractions.
- `GET /api/v1/admin/attractions` - (Editor+) List all attractions with linked destination metadata.
- `POST /api/v1/admin/attractions` - (Editor+) Create attraction draft.
- `PUT /api/v1/admin/attractions/:id` - (Editor+) Update attraction details.
- `PATCH /api/v1/admin/attractions/:id/status` - (Admin+) Change attraction status.
- `DELETE /api/v1/admin/attractions/:id` - (Admin+) Delete attraction.
- `GET /api/v1/admin/cta` - (Editor+) List all CTA sections.
- `PUT /api/v1/admin/cta/:id` - (Editor+) Update CTA section text, links, and status.

---

### 4.3. Program Service (Port 7012)

#### Public Endpoints
- `GET /api/v1/programs` - List published programs.
  - Query parameters: `category`, `destination` (UUID or slug), `price_min`, `price_max`, `provider_id`.
  - Dynamically resolves Destination info, Itinerary Stops, Rundowns, and Included/Excluded items.
- `GET /api/v1/programs/:id` - Get full program details.
- `GET /api/v1/categories` - List available tour categories.

#### Admin Endpoints
- `GET /api/v1/admin/programs` - (Editor+) List all programs.
- `GET /api/v1/admin/programs/:id` - (Editor+) Get program details (including drafts).
- `POST /api/v1/admin/programs` - (Editor+) Create program with nested relational data:
  ```json
  {
    "provider_id": "...",
    "destination_id": "...",
    "attraction_id": "...",
    "name": "Mount Batur Sunrise Trek",
    "category": "Adventure & Challenge",
    "location_label": "Kintamani, Bali",
    "short_description": "...",
    "duration_label": "1 Day",
    "min_quota": 5,
    "max_quota": 25,
    "max_guest_min": 5,
    "max_guest_max": 25,
    "date_availability": "all_days",
    "price_min": 500000,
    "price_max": 750000,
    "itinerary": [
      { "location_name": "Basecamp", "unique_feature": "Warm tea briefing", "activity_challenge": "Gear check" }
    ],
    "rundown": [
      { "time_label": "03:00 AM", "duration_minutes": 120, "session_activity": "Night Trekking" }
    ],
    "included": ["Flashlight", "Breakfast box", "Guide"],
    "excluded": ["Personal expenses"]
  }
  ```
  *Executes transactional multi-table insert (`program.programs`, `program.itinerary_stops`, `program.rundown_items`, `program.include_exclude_items`).*
- `PUT /api/v1/admin/programs/:id` - (Editor+) Update program and atomically replace nested relations.
- `PATCH /api/v1/admin/programs/:id/status` - (Admin+) Change status (`draft`, `review`, `published`, `archived`).
- `GET /api/v1/admin/providers` - (Editor+) List registered tour providers.
- `POST /api/v1/admin/providers` - (Editor+) Register tour provider.
- `PUT /api/v1/admin/providers/:id` - (Editor+) Update provider details.
- `GET /api/v1/admin/categories` - (Editor+) List tour categories.
- `POST /api/v1/admin/categories` - (Editor+) Create custom tour category.

---

### 4.4. Media Service (Port 7013)

- `GET /api/v1/media?owner_type=program&owner_id=<UUID>` - Public fetch of media assets for an entity.
- `POST /api/v1/admin/media/upload` - (Editor+) Multipart upload (`file`, `owner_type`, `owner_id`, `caption`, `order_index`).
  - Converts images automatically to `.avif` using `sharp`.
  - Saves videos directly in original format.
  - Inserts polymorphic record into `media.media_assets`.
- `DELETE /api/v1/admin/media/:id` - (Editor+) Deletes DB record and removes physical file from disk.
- `GET /uploads/:filename` - Static media asset serving (with `Content-Type: image/avif` header for AVIF files).

---

## 5. Development and Build Instructions

### Build All Services
```bash
cd index-aeli-api
npm run build
```

### Run Concurrently in Development Mode
```bash
cd index-aeli-api
npm run dev
```

### Docker Compose
```bash
docker compose up --build -d
```

