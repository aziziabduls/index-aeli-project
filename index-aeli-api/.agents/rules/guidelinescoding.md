---
trigger: always_on
---

Behavioral guidelines to reduce common LLM coding mistakes when working on this Express.js backend.

**Tradeoff:** These guidelines bias toward caution, simplicity, and maintainable backend architecture over speed.

---

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

* State your assumptions explicitly if they affect the implementation.
* If multiple interpretations exist, present them instead of silently choosing one.
* If a simpler approach exists, prefer it.
* If something is unclear and would materially affect the implementation, stop and ask.
* Understand the existing project structure before creating new files or patterns.

---

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

* No features beyond what was asked.
* No abstractions for single-use code.
* No unnecessary design patterns.
* No unnecessary repositories, factories, interfaces, or dependency injection.
* Don't introduce Clean Architecture, DDD, or other complex patterns unless the project already uses them or they are explicitly requested.
* Prefer simple functions and existing project conventions.
* If 200 lines can reasonably become 50, simplify it.

Ask:

> "Would a senior Express.js engineer consider this unnecessarily complicated?"

If yes, simplify.

---

## 3. Express.js Layering

Use a simple layered architecture:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Model / Database
```

### Controller

**Controller is responsible only for HTTP concerns.**

Controllers may:

* Read `req.params`
* Read `req.query`
* Read `req.body`
* Read `req.user`
* Call a service
* Return HTTP responses
* Pass errors to `next(error)`

Controllers must NOT contain business logic.

Avoid putting the following in controllers:

* Business rules
* Complex conditionals
* Calculations
* Database operations
* Multi-step workflows
* Authorization/business decisions
* Payment logic
* Order processing
* Event state transitions
* Password/business authentication logic
* External API orchestration

Example:

```js
async function createEvent(req, res, next) {
  try {
    const result = await eventService.createEvent({
      userId: req.user.id,
      data: req.body,
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
```

The controller should be thin.

---

## 4. Service Layer

**All business logic must live in the Service layer.**

Create or use a `*.service.js` file for each feature/module when appropriate.

Services are responsible for:

* Business rules
* Use-case logic
* Calculations
* Business validation
* Authorization decisions related to business rules
* Multi-step operations
* Database orchestration
* Transactions
* External service orchestration
* Payment workflows
* Authentication workflows
* Password operations
* Event/order/user workflows

Example:

```js
async function createEvent({ userId, data }) {
  const user = await userModel.findById(userId);
  if (!user) throw new NotFoundError('User not found');
  if (!user.canCreateEvent) throw new BusinessError('User cannot create an event');

  return eventModel.create({
    ...data,
    organizerId: userId,
  });
}
```

### Service Rules

Services:

* MUST NOT use `req`.
* MUST NOT use `res`.
* MUST NOT send HTTP responses.
* MUST NOT depend on Express request/response objects.
* SHOULD receive plain values or objects as arguments.
* SHOULD return data or throw errors.

Bad:

```js
async function createEvent(req, res) {
  if (!req.user) {
    return res.status(401).json(...);
  }
}
```

Good:

```js
async function createEvent(userId, data) {
  if (!userId) {
    throw new UnauthorizedError('Unauthorized');
  }

  // business logic
}
```

---

## 5. Model / Database Layer

Models handle data persistence according to the existing project's ORM/database approach.

Examples:

```js
User.findById(...)
Event.create(...)
Order.update(...)
```

Do not move business rules into models unless the existing project already follows that pattern.

The general responsibility is:

```text
Controller
→ HTTP

Service
→ Business logic

Model
→ Data persistence
```

---

## 6. Controller → Service Rule

Whenever implementing a new endpoint:

**Do not implement the business logic directly inside the controller.**

Always follow:

```text
Route
  ↓
Controller
  ↓
Service
  ↓
Model / Database
```

Example:

### Bad

```js
async function changePassword(req, res) {
  const user = await User.findById(req.user.id);
  const isValid = await comparePassword(req.body.currentPassword, user.password);
  if (!isValid) return res.status(400).json({ message: 'Invalid password' });

  const hashedPassword = await hashPassword(req.body.newPassword);
  await User.updatePassword(user.id, hashedPassword);
  return res.json({ message: 'Password changed' });
}
```

### Good

```js
// controller
async function changePassword(req, res, next) {
  try {
    await authService.changePassword({
      userId: req.user.id,
      currentPassword: req.body.currentPassword,
      newPassword: req.body.newPassword,
    });
    return res.status(200).json({ message: 'Password changed' });
  } catch (error) {
    next(error);
  }
}

// service
async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await User.findById(userId);
  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) throw new BusinessError('Invalid password');

  const hashedPassword = await hashPassword(newPassword);
  await User.updatePassword(user.id, hashedPassword);
}
```

---

## 7. Validation vs Business Logic

Keep HTTP/input validation separate from business logic.

### Validation

Examples:

* Required fields
* String format
* Email format
* Password format
* Number format
* Enum validation
* Request schema

These can be handled by validation middleware or the project's existing validation mechanism.

### Service

Business rules belong in services.

Examples:

* User is allowed to perform an action.
* Event can be published.
* Ticket is still available.
* Order can be cancelled.
* Payment can be processed.
* Current password is correct.
* OTP is valid for the requested purpose.

Do not put business rules into request validation middleware.

---

## 8. Error Handling

Preserve the existing error-handling strategy.

If the project uses:

```js
next(error);
```

continue using it.

Services should throw errors instead of returning HTTP responses.

Good:

```js
throw new NotFoundError('User not found');
```

Bad:

```js
return res.status(404).json({
  message: 'User not found',
});
```

The Controller is responsible for HTTP status codes and responses.

---

## 9. External Services

External API integrations should not be implemented directly inside controllers.

Examples:

* Payment gateway
* Email provider
* SMS provider
* Firebase
* Cloud storage
* Third-party APIs

Business orchestration belongs in the Service layer.

For example:

```text
Controller
    ↓
Payment Service
    ↓
Payment Client / Provider
    ↓
External Payment API
```

Do not put external API calls directly inside controllers.

---

## 10. Surgical Changes

**Touch only what you must.**

When editing existing code:

* Don't refactor unrelated code.
* Don't change existing formatting unnecessarily.
* Don't rename unrelated variables.
* Don't change API contracts unless requested.
* Don't change business behavior.
* Match the existing project style.
* Remove only imports/variables/functions made unused by your changes.
* Don't clean up unrelated technical debt.

Every changed line should be traceable to the task.

---

## 11. Refactoring Existing Controllers

When an existing controller contains business logic:

1. Identify the business logic.
2. Create or use the appropriate service.
3. Move the business logic into the service.
4. Pass required values from the controller to the service.
5. Keep HTTP handling inside the controller.
6. Remove imports that are no longer needed.
7. Verify behavior remains unchanged.

Target:

```text
BEFORE

Route
  ↓
Large Controller
  ├── Business logic
  ├── Database queries
  ├── Calculations
  ├── External API
  └── HTTP response


AFTER

Route
  ↓
Thin Controller
  ↓
Service
  ├── Business logic
  ├── Calculations
  ├── Database operations
  └── External API orchestration
  ↓
Model / External Provider
```

Do not rewrite the entire project just to achieve this structure. Refactor incrementally.

---

## 12. Surgical Refactoring Rule

When asked to refactor a controller:

**Move the logic. Don't redesign the application.**

Do not:

* Introduce a repository layer unless explicitly requested.
* Introduce a new architecture.
* Rewrite working models.
* Rewrite routes.
* Change API responses.
* Change database schema.
* Add unnecessary abstractions.

The primary goal is:

> Move business logic from Controller → Service while preserving existing behavior.

---

## 13. Goal-Driven Execution & Task Workflow

**Always define workflow, tasks, and track implementation checklist before coding.**

Before touching any code:
1. **Outline Workflow:** Present a step-by-step workflow of how the task will be addressed.
2. **Break Down Tasks & Checklist:** Create an actionable checklist of items to implement (`- [ ] Task item`).
3. **Track Implementation:** As implementation proceeds, update the checklist with completed items (`- [x] Task item`).

Standard task lifecycle:
```text
1. Define Workflow & Task Checklist
    ↓
2. Implement Business Logic in Service (Keep Controller Thin)
    ↓
3. Verify Implementation (Test / Lint / Build)
    ↓
4. Update dev_documentation.md (and README.md if relevant)
    ↓
5. Run `graphify update .`
```

---

## 14. Final Checklist

Before finishing backend work, verify:

* [ ] Workflow and task checklist were defined and marked complete.
* [ ] Controller only handles HTTP concerns.
* [ ] Business logic is inside Service.
* [ ] Service does not use `req` or `res`.
* [ ] Service does not return HTTP responses.
* [ ] Database operations are not unnecessarily duplicated.
* [ ] Existing API contract is preserved.
* [ ] Existing error handling is preserved.
* [ ] No unnecessary abstraction was introduced.
* [ ] No unrelated files were changed.
* [ ] Tests/lint/build pass when available.
* [ ] Updated `dev_documentation.md` (and `README.md` if relevant).
* [ ] Ran `graphify update .` to keep knowledge graph synchronized.

---

## 15. Documentation & Graph Synchronization

Every new feature, API endpoint, behavior change, or significant refactoring must be documented and synced with the graph.

Update:
- `dev_documentation.md`
- `README.md` (when relevant)
- Graphify knowledge graph via command: `graphify update .`

### `dev_documentation.md`

Use this file for developer/technical documentation, including:

- API endpoints
- Request and response examples
- Authentication flow
- Business logic flow
- Service responsibilities
- Important implementation details
- Environment/configuration requirements
- External API integrations
- Important technical decisions

Keep the documentation aligned with the actual implementation.

### `README.md`

Update the README when the change affects:

- Project setup
- Installation
- Environment variables
- How to run the project
- Available features
- API usage that is important for developers/users
- Major architecture or workflow changes

Do not add unnecessary documentation for trivial internal changes.

### Documentation & Sync Rule

When implementing any task or feature:

```text
Code
 ↓
Verify implementation
 ↓
Update dev_documentation.md
 ↓
Update README.md when relevant
 ↓
Run: graphify update .
```

**Core rule:**

> In this Express.js backend, Controllers handle HTTP. Services handle business logic. Always define workflow & task checklist first, and sync graphify after.