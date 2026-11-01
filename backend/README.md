# Inventory Management API

REST API for managing per-user inventory items, built with Node.js, Express 5,
TypeScript, MySQL 8, Prisma, JWT, bcrypt, Zod, and Swagger.

single conditional SQL `UPDATE`, so concurrent requests can never drive stock
below zero.

---

## 1. Project overview

The repository originally contained a minimal Express skeleton in `backend/`
(`createApp()` + an empty router), with no database, Prisma setup, authentication,
or test framework. This implementation extends that skeleton in place:

- It is **one modular Express service**, not a microservice split. No unrelated
  service or frontend code was changed.
- The existing ESM/NodeNext TypeScript conventions and `createApp()` factory are
  preserved so the app can be imported by integration tests without listening.
- The route prefix moved from `/api` to the required `/api/v1`.

## 2. Stack

| Concern | Choice |
| --- | --- |
| Runtime | Node.js 22, ESM |
| HTTP | Express 5 |
| Language | TypeScript 5.9 (strict) |
| Database | MySQL 8 (InnoDB) |
| ORM / migrations | Prisma 6 |
| Auth | bcrypt (cost 10+), JSON Web Tokens |
| Validation | Zod |
| Docs | OpenAPI 3.0 + Swagger UI |
| Tests | Vitest + Supertest against a real MySQL test database |

## 3. Project structure

```text
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│       └── 20261101103545_init/migration.sql   # tables, FK, CHECK constraints
├── src/
│   ├── app.ts                    # createApp(): middleware, docs, routes
│   ├── server.ts                 # listen + graceful shutdown
│   ├── config/env.ts             # Zod-validated environment
│   ├── docs/
│   │   ├── components.ts         # OpenAPI schemas + reusable responses
│   │   ├── paths.ts              # OpenAPI paths and operations
│   │   ├── openapi.ts            # assembled document metadata
│   │   └── router.ts             # Swagger UI + /docs.json endpoints
│   ├── lib/
│   │   ├── prisma.ts             # one shared PrismaClient
│   │   ├── token.ts              # sign/verify JWT
│   │   ├── response.ts           # response envelope helpers
│   │   ├── request.ts            # typed bodyOf/queryOf/paramsOf accessors
│   │   ├── errors.ts             # HTTP error catalog
│   │   ├── http-error.ts         # typed HTTP error
│   │   └── prisma-error.ts       # Prisma error-code reader
│   ├── middlewares/
│   │   ├── auth.ts               # Bearer token authentication
│   │   ├── validate.ts           # Zod body/query/params validation
│   │   ├── errorHandler.ts       # centralized error envelope
│   │   └── notFound.ts           # 404 envelope
│   ├── schemas/{auth,item}.ts    # request schemas + inferred types
│   ├── services/{auth,item}.service.ts
│   ├── controllers/{auth,item}.controller.ts
│   ├── routes/{auth,item}.routes.ts, index.ts
│   └── types/                    # auth type + Express request augmentation
├── tests/                        # integration tests (auth, items, concurrency, docs)
├── vitest.config.ts
├── .env.example
└── README.md
```

## 4. Architecture and request lifecycle (Question A)

A request flows through these layers:

```text
HTTP request
  → Express app            JSON body parsing, size limit
  → Router                 /api/v1/auth, /api/v1/items
  → authenticate           verifies the Bearer JWT, attaches req.auth
  → validate               parses body/query/params with Zod into req.validated
  → controller             reads validated input, calls one service function
  → service                business rules + Prisma queries
  → MySQL                  unique index, FK, CHECK constraints, row locks
  → controller             wraps the result in the success envelope
  → errorHandler           converts thrown HttpError / unknown errors to envelopes
```

Example for `POST /api/v1/items/:id/reduce-stock`:

1. `item.routes.ts` matches the path.
2. `authenticate()` rejects a missing/invalid token with `401 UNAUTHORIZED`.
3. `validate()` checks `id` and `{ quantity }`; invalid input becomes
   `400 VALIDATION_ERROR`.
4. `item.controller.ts` reads `requireAuth(req).id`, `paramsOf<ItemIdParams>(req).id`,
   and `bodyOf<ReduceStockInput>(req).quantity`. It contains no business logic.
5. `item.service.ts` performs the atomic update and maps the Prisma row to an
   API DTO (no `userId`, `price` as a decimal string).
6. `sendSuccess()` returns `200` with the standard envelope.
7. If stock is insufficient, the service throws `insufficientStock()` from the
   error catalog; the error middleware renders the error envelope.

Why the separation is worth it:

- **Routes** stay declarative and readable.
- **Middleware** is reused by every endpoint (auth, validation, errors).
- **Controllers** only translate HTTP ↔ service calls, so they stay trivial.
- **Services** hold all business rules and are the only layer touching Prisma.
- **Error handling is centralized**, so response shapes cannot drift per route.

There is intentionally **no repository layer, factory, or interface-per-service**.
Prisma is already the data-access boundary and each service has one consumer; an
extra abstraction would add files without adding behavior.

## 5. Installation and setup

### Prerequisites

- Node.js >= 22
- pnpm
- Docker (for the local MySQL container)

### 5.1 Install dependencies

From the repository root:

```bash
pnpm install
```

### 5.2 Start MySQL

```bash
docker run -d --name inventory-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=inventory \
  -e MYSQL_USER=inventory \
  -e MYSQL_PASSWORD=inventory \
  -p 3307:3306 mysql:8
```

The container maps MySQL to host port `3307` to avoid clashing with a local
installation on `3306`.

Create the test database and grant the app user access to it:

```bash
docker exec inventory-mysql mysql -uroot -proot -e \
  "CREATE DATABASE IF NOT EXISTS inventory_test; \
   GRANT ALL PRIVILEGES ON inventory_test.* TO 'inventory'@'%'; \
   FLUSH PRIVILEGES;"
```

Wait until MySQL accepts connections:

```bash
docker exec inventory-mysql mysqladmin ping -h 127.0.0.1 -uinventory -pinventory
```

### 5.3 Configure environment

```bash
cd backend
cp .env.example .env
```

Generate a real JWT secret (never reuse the example value):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

The app validates configuration at startup and refuses to boot if
`DATABASE_URL` is missing or `JWT_SECRET` is shorter than 32 characters.

### 5.4 Apply migrations

```bash
pnpm db:deploy
```

Migrations are committed and create both tables, the unique email index, the
foreign key, the `(userId, name)` index, and the stock/price CHECK constraints.
No manual schema editing is required.

For the test database:

```powershell
# PowerShell
$env:DATABASE_URL="mysql://inventory:inventory@127.0.0.1:3307/inventory_test"
pnpm db:deploy
```

```bash
# bash / Git Bash
DATABASE_URL="mysql://inventory:inventory@127.0.0.1:3307/inventory_test" pnpm db:deploy
```

### 5.5 Seeding

There is no seed script. The API tests create their own users and items, and
the database starts empty by design. A quick way to create demo data is the
register/login/create flow in section 12.

## 6. Environment variables

| Variable | Required | Default | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | no | `development` | `development`, `test`, or `production` |
| `PORT` | no | `3000` | HTTP port |
| `DATABASE_URL` | yes | — | MySQL connection string |
| `JWT_SECRET` | yes | — | Minimum 32 characters |
| `JWT_EXPIRES_IN` | no | `1d` | Passed to `jsonwebtoken` (`1h`, `7d`, …) |
| `BCRYPT_ROUNDS` | no | `10` | Integer 10–15 |

`.env` and `.env.test` are git-ignored. Only `.env.example` is committed.

## 7. Database schema and migrations

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique @db.VarChar(191)
  password  String   @db.VarChar(60)   // bcrypt hash, never returned
  name      String?  @db.VarChar(100)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  items     Item[]
}

model Item {
  id          Int      @id @default(autoincrement())
  userId      Int
  name        String   @db.VarChar(150)
  description String?  @db.Text
  stock       Int      @default(0)
  price       Decimal  @db.Decimal(12, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, name])
}
```

The migration SQL adds constraints Prisma cannot express in the schema:

```sql
ALTER TABLE `Item` ADD CONSTRAINT `Item_stock_non_negative` CHECK (`stock` >= 0);
ALTER TABLE `Item` ADD CONSTRAINT `Item_price_non_negative` CHECK (`price` >= 0);
```

These are the last line of defense; the application also validates input and
the stock update is conditional.

**Creating a new migration:**

```bash
pnpm prisma:migrate
```

`prisma migrate dev` needs a shadow database. The `inventory` user has rights on
its own databases only, so for local migration authoring use a privileged
`DATABASE_URL` (for example the `root` user) or grant global
`CREATE`/`DROP` privileges. Applying existing migrations with `pnpm db:deploy`
does not need a shadow database.

## 8. Running the API

```bash
cd backend
pnpm dev          # tsx watch, reloads on change
```

Production-style run:

```bash
pnpm build
pnpm start
```

The server logs the HTTP port and the Swagger URL on startup.

## 9. Endpoints

Base URL: `http://localhost:3000/api/v1`

| Method | Path | Auth | Success | Description |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | no | `201` | Create an account |
| `POST` | `/auth/login` | no | `200` | Return `{ token, user }` |
| `POST` | `/items` | yes | `201` | Create an item |
| `GET` | `/items` | yes | `200` | List own items (`search`, `page`, `limit`) |
| `GET` | `/items/:id` | yes | `200` | Get one own item |
| `PUT` | `/items/:id` | yes | `200` | Update any subset of fields |
| `DELETE` | `/items/:id` | yes | `200` | Delete own item |
| `POST` | `/items/:id/reduce-stock` | yes | `200` | Atomically reduce stock |

Query parameters for `GET /items`:

- `search` — partial, case-insensitive match on name (max 150 chars).
- `page` — integer >= 1, default `1`.
- `limit` — integer 1–100, default `10`.

Authentication uses `Authorization: Bearer <jwt>`.

Error status codes:

| Status | Meaning |
| --- | --- |
| `400` | Validation error, malformed JSON, or invalid id |
| `401` | Missing/invalid/expired token, bad credentials |
| `403` | Reserved by the spec; not emitted because ownership failures return 404 |
| `404` | Item does not exist **or belongs to another user** |
| `409` | Duplicate email or insufficient stock |
| `500` | Unexpected error |

Cross-user access returns `404` instead of `403` so an attacker cannot probe for
the existence of other users' item ids.

### `reduce-stock` note

The take-home requirements describe stock reduction but do not name an endpoint.
This API adds the smallest endpoint that makes the requirement testable:
`POST /items/:id/reduce-stock` with `{ "quantity": 3 }`. Stock can also be set
through `PUT`, but every path is guarded by validation and the database CHECK
constraint.

## 10. Response format

Success:

```json
{
  "success": true,
  "message": "Items retrieved successfully",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

Error:

```json
{
  "success": false,
  "message": "Insufficient stock",
  "error": {
    "code": "INSUFFICIENT_STOCK"
  }
}
```

`meta` is only present on paginated responses. `totalPages` is `0` when the
result set is empty.

**Money representation:** `price` is returned as a decimal string with two
fraction digits (for example `"150000.50"`) because MySQL stores it as
`DECIMAL(12,2)`. Strings avoid JavaScript floating-point rounding; the request
body accepts a JSON number.

## 11. Authentication and JWT security (Question B)

### How it works here

1. `POST /auth/register` hashes the password with bcrypt (cost from
   `BCRYPT_ROUNDS`, minimum 10) and stores only the hash. Passwords must be
   8–72 characters and at most 72 UTF-8 bytes, matching bcrypt's input limit.
2. `POST /auth/login` compares the submitted password with the stored hash. It
   also performs a bcrypt comparison against a dummy hash when the email is
   unknown, so response timing does not reveal whether an account exists.
3. A JWT is signed with `sub` (user id), `email`, `iss` (`inventory-api`), and
   `exp`. The API returns it in the response body; it does **not** set a cookie.
4. `authenticate()` requires `Authorization: Bearer <token>`, verifies the
   signature, issuer, and expiry, then attaches `{ id, email }` to `req`.
5. Passwords and hashes are never included in any response.

### Local Storage vs HttpOnly cookie

**JWT in Local Storage**

- Any JavaScript on the page can read it, so a single XSS flaw can exfiltrate
  the token. Stored tokens also survive tab/browser restarts.
- It is not sent automatically, so classic CSRF is not a concern for API calls
  that explicitly attach the header.
- Easy for SPAs and mobile clients; logout/revocation must be implemented by
  the client or with server-side token state.

**JWT in an HttpOnly cookie**

- `HttpOnly` prevents JavaScript from reading the token, which reduces the
  impact of XSS token theft. `Secure` prevents plaintext transport.
- Cookies are sent automatically, which introduces CSRF unless `SameSite` is
  set appropriately and/or a CSRF token is used. Cross-site cookie rules also
  add deployment complexity.
- Revocation still requires server-side state or short-lived tokens plus refresh
  rotation.

**Neither option is universally secure.** XSS can still perform actions in the
victim's session even when it cannot read an HttpOnly cookie; CSRF protections
can still be bypassed by misconfiguration. The choice depends on the threat
model.

**Chosen approach:** the API returns a bearer JWT in the response body and is
storage-agnostic. This keeps the service stateless and simple to test. For a
production browser SPA, the safer default is a short-lived access token plus a
rotating refresh token delivered in an `HttpOnly; Secure; SameSite` cookie,
with an explicit CSRF strategy. The current implementation does not include
refresh, logout, or revocation, and the default access-token lifetime is `1d`;
reduce it for production. TLS is mandatory in production.

## 12. Concurrency handling (Question C)

### The race condition

Suppose stock is `10` and two requests each try to reduce it by `8`. A
read-then-write implementation can interleave:

```text
Request A: SELECT stock  → 10
Request B: SELECT stock  → 10          (A has not written yet)
Request A: stock >= 8? yes → UPDATE stock = 2
Request B: stock >= 8? yes → UPDATE stock = 2   (lost update, oversold)
```

Both requests believe they succeeded, but only 2 units were actually taken.

### The fix used here

`item.service.ts` performs one conditional update and never reads stock first:

```ts
const { count } = await prisma.item.updateMany({
  where: { id: itemId, userId, stock: { gte: quantity } },
  data: { stock: { decrement: quantity } },
});

if (count === 0) {
  // 404 if the item is missing/not owned; otherwise 409 INSUFFICIENT_STOCK
}
```

This becomes roughly:

```sql
UPDATE `Item`
SET `stock` = `stock` - ?
WHERE `id` = ? AND `userId` = ? AND `stock` >= ?;
```

MySQL/InnoDB locks the matched row for the duration of the statement. The
second request waits, then re-evaluates `stock >= ?` against the committed
value. If the remainder is too small, it matches zero rows and the API returns
`409 INSUFFICIENT_STOCK`. Two requests can never both pass the check for the
same units.

Additional guarantees:

- The `CHECK (stock >= 0)` constraint rejects any negative value even if a future
  code path forgets the conditional predicate.
- A single statement is already atomic, so no explicit transaction is needed for
  this operation. Transactions are used only where multiple reads must be
  consistent (`GET /items`: page + count in one batch transaction).
- The concurrency integration test fires 10 simultaneous reductions against
  stock 50 and asserts exactly 5 succeed, 5 return 409, and final stock is `0`.

## 13. Testing

Tests are integration tests against real MySQL. They are not mocked.

```bash
cd backend
pnpm test
```

The suite uses `.env.test` (loaded by `vitest.config.ts` before the app imports)
and the `inventory_test` database. Test files run sequentially
(`fileParallelism: false`) because they share one database; each file owns its
own fixtures.

Coverage (52 tests):

- Register success, email normalization, duplicate email (409), invalid input,
  unknown fields, malformed JSON.
- Login success, wrong password, unknown email, JWT shape, no password hash in
  responses.
- Authentication middleware: missing, malformed, or expired tokens on every item
  route.
- CRUD: create, read, update (partial and `null` description), delete.
- Cross-user access: get/update/delete/reduce all return 404.
- Validation: negative stock/price, fractional stock, blank name, missing price,
  invalid id, empty update body.
- Search (case-insensitive) and pagination (defaults, bounds, `meta`).
- Insufficient stock (409) with stock unchanged, exact-stock reduction.
- Concurrency: 10 parallel reductions, correct success/conflict split, final
  stock non-negative; uneven quantities; reduction after zero.
- Documentation: Swagger UI and raw JSON respond, bearer scheme is declared, and
  every implemented path/operation is present in the OpenAPI document.

Useful commands:

```bash
pnpm test          # run once
pnpm test:watch    # watch mode
pnpm typecheck     # tsc --noEmit
pnpm build         # compile to dist/
```

## 14. Swagger documentation

Start the API, then open:

- Swagger UI: <http://localhost:3000/api/docs>
- Raw OpenAPI document: <http://localhost:3000/api/docs.json>

Click **Authorize**, paste the `token` returned by `/auth/login` (without the
`Bearer ` prefix), and the item endpoints can be tried from the browser. The
document covers authentication, request bodies, query parameters, response
envelopes, and all error responses implemented by the API.

The document is assembled from `src/docs/components.ts` (schemas and reusable
responses), `src/docs/paths.ts` (operations), and `src/docs/openapi.ts`
(metadata); `src/docs/router.ts` serves both endpoints.

## 15. Design decisions

- **Single Express service**: the repository had no microservice split to
  preserve; adding one would be over-engineering for this scope.
- **Ownership in every query**: item lookups filter by `{ id, userId }` rather
  than loading an item and comparing afterward. Cross-user ids therefore behave
  exactly like missing ids (404).
- **Atomic stock update**: `updateMany` with `stock: { gte }` + `decrement` is one
  SQL statement and the core correctness guarantee.
- **Validation at the edge**: Zod schemas own request shape; services assume
  valid input; Prisma/MySQL enforce persistence invariants.
- **Centralized errors**: services throw `HttpError`; one middleware renders the
  envelope so every route returns the same error shape.
- **Explicit DTOs**: item responses omit `userId` and expose `price` as a string.
- **One PrismaClient**: created once in `lib/prisma.ts` and reused.
- **Fail-fast configuration**: startup aborts on missing `DATABASE_URL` or a
  weak `JWT_SECRET`.
- **Testable app factory**: `createApp()` returns the Express instance without
  calling `listen`; `server.ts` owns the process lifecycle.

## 16. Known limitations

- **No refresh token, logout, or server-side revocation.** A stolen JWT remains
  valid until expiry; use short expiry and a refresh/rotation design in
  production.
- **No login rate limiting or account lockout.** Add rate limiting at the edge
  or in a middleware for production.
- **No CORS configuration.** The API is same-origin/server-to-server by default;
  a browser SPA on another origin needs an explicit allowlist.
- **No seed script.** Tests create isolated fixtures; the app database starts
  empty.
- **Single MySQL instance.** Correctness relies on InnoDB row locking and the
  CHECK constraint; there is no replication or distributed transaction handling.
- **`PUT` accepts partial bodies.** This is pragmatic for an API client; a strict
  PUT-replacement contract would require all fields.
- **Cross-user access returns 404.** This intentionally diverges from using 403,
  to avoid leaking whether an id exists.

## 17. Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Watch-mode development server |
| `pnpm build` | Compile TypeScript to `dist/` |
| `pnpm start` | Run compiled server |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Run integration tests once |
| `pnpm test:watch` | Watch-mode tests |
| `pnpm prisma:generate` | Regenerate Prisma Client |
| `pnpm prisma:migrate` | Create/apply a migration in development |
| `pnpm db:deploy` | Apply committed migrations (dev/CI/production) |

## 18. Quick manual check

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123","name":"Demo"}'

# Login and copy the token
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password123"}'

# Create an item
curl -X POST http://localhost:3000/api/v1/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"name":"Mechanical Keyboard","description":"TKL","stock":10,"price":1500000}'

# Reduce stock
curl -X POST http://localhost:3000/api/v1/items/1/reduce-stock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"quantity":3}'

# List with search + pagination
curl "http://localhost:3000/api/v1/items?search=keyboard&page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```
