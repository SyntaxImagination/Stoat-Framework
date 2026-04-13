# Stoat Framework — Todo Tracker

Items are grouped by **owner** (which repo the fix lands in) and **priority**.
Work through them top-to-bottom within each section.

Legend: `[F]` = StoatFramework repo · `[SC]` = stoatcore repo · `[BOTH]` = coordinated change

---

## Stoatcore Bugs (upstream fixes — `[SC]`)

All six Net bugs and both Helper bugs have been fixed directly in the local `StoatCore/` source
(which is nested in the repo and ignored by the parent `.gitignore`).
`base.js` now loads `./StoatCore/core.js` directly — no patch layer required.

---

### SC-1 — `Net/index.js`: wrong `StringDecoder` destructure
- [x] **Status:** Fixed in `StoatCore/Net/index.js`
- **File:** `StoatCore/Net/index.js:3`
- **Bug:** `const { stringDecoder } = require('string_decoder')` — key casing is wrong, always resolves to `undefined`
- **Fix:** Changed to `const { StringDecoder } = require('string_decoder')`

---

### SC-2 — `Net/index.js`: `response` object undeclared
- [x] **Status:** Fixed in `StoatCore/Net/index.js`
- **File:** `StoatCore/Net/index.js` — `processRequest()`
- **Bug:** `response.statusCode`, `response.body` etc. are all written before `response` is ever declared — `ReferenceError` at runtime
- **Fix:** Added `let response = {}` at the top of `processRequest()`

---

### SC-3 — `Net/index.js`: `http.request()` called without options argument
- [x] **Status:** Fixed in `StoatCore/Net/index.js`
- **File:** `StoatCore/Net/index.js` — `processRequest()`
- **Bug:** `method.request(resp => {...})` — `requestDetails` is built but never passed; no connection is ever made
- **Fix:** Changed to `method.request(requestDetails, resp => {...})`

---

### SC-4 — `Net/index.js`: `option` and `delete` methods reference wrong parameter name
- [x] **Status:** Fixed in `StoatCore/Net/index.js`
- **File:** `StoatCore/Net/index.js`
- **Bug:** Both methods declare `async (option) =>` but the body references `params` — `ReferenceError`
- **Fix:** Renamed the parameter to `params` in both `option` and `delete`

---

### SC-5 — `Net/index.js`: `Content-Length` calculated incorrectly for multi-byte characters
- [x] **Status:** Fixed in `StoatCore/Net/index.js`
- **File:** `StoatCore/Net/index.js` — `requestDetails` construction
- **Bug:** `'Content-Length': params.data.length` uses JS string length — wrong for any non-ASCII content
- **Fix:** Changed to `'Content-Length': Buffer.byteLength(body)`

---

### SC-6 — `Net/index.js`: response body resolved inside `data` event (truncation on large responses)
- [x] **Status:** Fixed in `StoatCore/Net/index.js`
- **File:** `StoatCore/Net/index.js` — `resp.on('data', ...)`
- **Bug:** `success(response)` called inside the `data` handler — response truncates after the first TCP chunk
- **Fix:** Buffer all chunks, moved `success(response)` into `resp.on('end', ...)`

---

### SC-7 — `Helpers/Helper.js`: `writeBase64ToFile` missing imports and wrong variable name
- [x] **Status:** Fixed in `StoatCore/Helpers/Helper.js`
- **File:** `StoatCore/Helpers/Helper.js` — `writeBase64ToFile`
- **Bug:** Uses `writeFileSync` and `path` without importing them; uses `path` as the destination variable but the parameter is named `pathToSaveAt`
- **Fix:**
  - Added `const { writeFileSync } = require('fs')` and `const path = require('path')` at top of file
  - Replaced `${path}/${fileName}${format}` with `path.join(pathToSaveAt, fileName + format)`

---

### SC-8 — `Helpers/Encryption.js`: weak cryptographic primitives
- [x] **Status:** Fixed in `StoatCore/Helpers/Encryption.js` and `Helpers/Encryption.js`
- **File:** `StoatCore/Helpers/Encryption.js`
- **Bug:**
  - `threeDESEncrypt` / `threeDESDecrypt` — uses `des-ede3` (3DES), deprecated by NIST since 2023; susceptible to Sweet32 attack
  - `MD5Encryption` — MD5 is cryptographically broken; must not be used for passwords or integrity
- **Fix applied:**
  - Replaced `threeDESEncrypt` / `threeDESDecrypt` with AES-256-GCM (`aes-256-gcm`) using `createCipheriv` / `createDecipheriv` + random IV + auth tag. Old names kept as back-compat aliases.
  - Replaced `MD5Encryption` with SHA-256 (`createHash('sha256')`) for integrity. Old name kept as alias.
  - Added `hashPassword` / `verifyPassword` using native `scrypt` with `timingSafeEqual`

---

## Stoatcore Pending Features (`[SC]`)

---

### SC-F1 — WebSocket support
- [ ] **Status:** Not started
- **Files:** `StoatCore/Net/index.js`, `System/Core/` (new `ws.js` / `wss.js`), `base.js`
- **Description:** stoatcore's Net module has `// WebSocket Coming Soon`. `bin/.config` already exposes `ws` / `wss` net entries but `base.js` has `// @TODO : Fix the other types` and does nothing with them.
- **Scope:**
  1. Add WebSocket server support to stoatcore (or `System/Core/ws.js` in the framework)
  2. Wire up `ws` and `wss` entries in `base.js` `runConnection()` loop
  3. Define a controller dispatch pattern for WebSocket messages

---

### SC-F2 — CLI scaffolding tool
- [ ] **Status:** Not started
- **Files:** new `StoatCore/cli/` or standalone `stoat-cli` package
- **Description:** stoatcore README lists CLI as a pending feature. No create-project, generate-controller, or generate-schema commands exist.
- **Scope (minimum):**
  - `stoat new <project-name>` — scaffold a new project from template
  - `stoat make:controller <name>` — generate `Engine/v1/<name>.js`
  - `stoat make:schema <name>` — generate `Models/Schemas/<name>.json`

---

### SC-F3 — `_s.net` streaming support
- [ ] **Status:** Not started
- **Files:** `StoatCore/Net/index.js`
- **Description:** The outbound HTTP client fully buffers responses before resolving. Large or streaming responses will exhaust memory.
- **Fix:** Add a `stream` option that returns the raw `IncomingMessage` instead of buffering:
  ```js
  // Usage
  const stream = await _s.net.get({ url: "...", stream: true });
  stream.pipe(response);
  ```

---

## Security Fixes (`[F]` — StoatFramework)

---

### SEC-1 — Path traversal in controller loading (Critical)
- [x] **Status:** Fixed in `System/App/middleware.js`
- **File:** `System/App/middleware.js`
- **Risk:** A crafted URL like `/v1/../../../etc/passwd` traverses outside the project root via the controller `require()` call
- **Fix applied:** `isSafeSegment()` regex `/^[a-zA-Z0-9_-]+$/` validates all URL path segments before routing. Invalid segments return `C010-400`.

---

### SEC-2 — Path traversal in static file serving (Critical)
- [x] **Status:** Fixed in `System/App/middleware.js`
- **File:** `System/App/middleware.js` — static GET file serving block
- **Risk:** `file` is derived from `request.url` and passed directly to `renderFile()`. `GET /../../etc/passwd` escapes `Public/`
- **Fix applied:** `path.resolve()` confinement — `requestedFile.startsWith(publicRoot + path.sep)` check prevents any path outside `Public/` from being served.

---

### SEC-3 — No request body size limit (High)
- [x] **Status:** Fixed in `System/App/middleware.js`; configurable via `bin/.config`
- **File:** `System/App/middleware.js`
- **Risk:** No body size cap — a client can stream gigabytes into the process causing OOM
- **Fix applied:**
  - `Content-Length` header checked before body is read; requests exceeding limit receive `413 C011-413`
  - Limit is configurable: `request.maxBodyBytes` in `bin/.config` (default `1048576` = 1 MB)

---

### SEC-4 — Missing security response headers (High)
- [x] **Status:** Fixed in `System/App/middleware.js`
- **File:** `System/App/middleware.js`
- **Fix applied:** Headers set on every response:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), microphone=(), camera=()`
  - `Strict-Transport-Security` (production only)

---

### SEC-5 — `domainSecurity` stub always returns success (High)
- [x] **Status:** Fixed in `Helpers/Security.js`
- **File:** `Helpers/Security.js`
- **Risk:** stoatcore's default `domainSecurity` returns `{ status: 1 }` unconditionally — any request with an `Authorization` header passes
- **Fix applied:** Full native HS256 JWT implementation using Node.js `crypto`:
  - `signToken(payload, expiresInSeconds)` — creates signed JWT with `iat` + `exp`
  - `verifyToken(token)` — constant-time signature check via `timingSafeEqual`
  - `domainSecurity(request)` — extracts Bearer token, verifies, returns `source` from payload
  - Requires `JWT_SECRET` env var — warns in dev/staging, throws in production if missing

---

## Performance Improvements (`[F]` — StoatFramework)

---

### PERF-1 — Cache `allowedUrls.txt` — eliminates per-request disk I/O (High impact)
- [x] **Status:** Fixed in `runStoatConfig.js` and `System/App/middleware.js`
- **Problem:** `middleware.js` reads `allowedUrls.txt` from disk on every single request
- **Fix applied:** Loaded once at startup into `_s.__system.allowedOrigins[]`. `SIGHUP` signal reloads the file without a process restart. Middleware reads from the cache.

---

### PERF-2 — Cache `notFoundPage` path resolution at startup
- [x] **Status:** Fixed in `runStoatConfig.js` and `System/App/middleware.js`
- **Problem:** `fs.existsSync(notFoundPage)` runs on every request to decide which 404 file to serve
- **Fix applied:** Resolved once at startup into `_s.__system.notFoundPage`. Middleware reads the cached string.

---

### PERF-3 — Pre-build controller route map at startup
- [x] **Status:** Fixed in `runStoatConfig.js` and `System/App/middleware.js`
- **Problem:** Every API request constructs the controller file path string and calls `require()` inside a `try/catch`
- **Fix applied:** `Engine/<version>/` directories scanned at startup; all controllers required and stored in `_s.__system.routes["{version}/{name}"]`. Middleware looks up the route map instead of calling `require()` per request.

---

### PERF-4 — Replace per-request `global.__Stoat` with a request-scoped local
- [x] **Status:** Fixed in `System/App/middleware.js`
- **Problem:** `global.__Stoat = {}` runs on every request. Global mutation is not concurrency-safe (two simultaneous requests overwrite each other's state) and creates GC pressure.
- **Fix applied:** Replaced `global.__Stoat = {}` with `const __Stoat = {}` — lexically scoped to the request handler closure.

---

### PERF-5 — Add response compression via native `zlib`
- [x] **Status:** Fixed in `System/Helpers/Payload.js`
- **Problem:** All responses sent uncompressed regardless of client capability
- **Fix applied:** `renderObject()` and `renderFile()` detect `Accept-Encoding: gzip`, compress with `zlib.gzipSync`, and set `Content-Encoding: gzip` + `Vary: Accept-Encoding`.

---

### PERF-6 — Set `keepAliveTimeout` on HTTP/HTTPS servers
- [x] **Status:** Fixed in `System/Core/http.js` and `System/Core/https.js`
- **Problem:** Default keep-alive timeout (5 s in Node.js) causes connection resets when an upstream load balancer or proxy has a longer idle timeout
- **Fix applied:**
  ```js
  server.keepAliveTimeout = 65000;  // 65 s — above typical LB idle timeout
  server.headersTimeout   = 66000;  // must be > keepAliveTimeout
  ```

---

### PERF-7 — Upgrade MySQL / MariaDB engines to connection pool
- [x] **Status:** Fixed in `Models/Engines/MySQL/mysql.js` and `Models/Engines/MariaDB/mysql.js`
- **Problem:** Both engines used `mysql.createConnection()` — a single dropped connection kills all in-flight queries with no reconnect
- **Fix applied:** Replaced with `mysql.createPool()` with `connectionLimit: 10`, `waitForConnections: true`, `queueLimit: 0`. Pool connectivity verified at startup.

---

## Completion Checklist

| ID | Area | Owner | Priority | Done |
|---|---|---|---|---|
| SC-1 | Net: StringDecoder import | stoatcore | Medium | [x] |
| SC-2 | Net: response undeclared | stoatcore | Medium | [x] |
| SC-3 | Net: missing requestDetails arg | stoatcore | Medium | [x] |
| SC-4 | Net: wrong param name in option/delete | stoatcore | Medium | [x] |
| SC-5 | Net: Content-Length byte count | stoatcore | Medium | [x] |
| SC-6 | Net: body resolution on data vs end | stoatcore | Medium | [x] |
| SC-7 | Helper: writeBase64ToFile missing imports | stoatcore | Medium | [x] |
| SC-8 | Encryption: 3DES + MD5 weak crypto | stoatcore | High | [x] |
| SC-F1 | WebSocket support | stoatcore + framework | Low | [ ] |
| SC-F2 | CLI scaffolding tool | stoatcore | Low | [ ] |
| SC-F3 | `_s.net` streaming support | stoatcore + framework | Low | [ ] |
| SEC-1 | Path traversal — controller loading | Framework | Critical | [x] |
| SEC-2 | Path traversal — static file serving | Framework | Critical | [x] |
| SEC-3 | No request body size limit | Framework | High | [x] |
| SEC-4 | Missing security response headers | Framework | High | [x] |
| SEC-5 | domainSecurity stub always passes | Framework | High | [x] |
| PERF-1 | Cache allowedUrls.txt | Framework | High | [x] |
| PERF-2 | Cache notFoundPage resolution | Framework | High | [x] |
| PERF-3 | Pre-build controller route map | Framework | Medium | [x] |
| PERF-4 | Replace global __Stoat with local | Framework | Medium | [x] |
| PERF-5 | Response compression via zlib | Framework | Medium | [x] |
| PERF-6 | HTTP keep-alive timeout | Framework | Medium | [x] |
| PERF-7 | MySQL/MariaDB connection pool | Framework | Medium | [x] |
