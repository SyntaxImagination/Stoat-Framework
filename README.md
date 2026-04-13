# Stoat Framework

**Version:** 1.5.0
**Author:** Syntax Imagination
**License:** ISC
**Repository:** [SyntaxImagination/Stoat-Framework](https://github.com/SyntaxImagination/Stoat-Framework)
**Runtimes:** Node.js 16+ · Bun 1.0+

A slim Node.js/Bun framework designed with a focus on minimal package usage and maximum native runtime functionality. Inspired by the simplicity of PHP's **CodeIgniter** and **Flight** frameworks, Stoat follows an **MVC** pattern while encouraging developers to understand and leverage the runtime at its core.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Installation](#installation)
3. [Bun Support](#bun-support)
4. [Project Structure](#project-structure)
5. [Configuration (`bin/.config`)](#configuration-binconfig)
6. [Entry Point (`base.js`)](#entry-point-basejs)
7. [Routing & Controllers](#routing--controllers)
8. [Request & Response](#request--response)
9. [Middleware](#middleware)
10. [Database Engines](#database-engines)
    - [MongoDB (Mongoose)](#mongodb-mongoose)
    - [MySQL](#mysql)
    - [MariaDB](#mariadb)
    - [PostgreSQL](#postgresql)
    - [QuestDB](#questdb)
11. [Helpers](#helpers)
    - [Encryption](#encryption)
    - [Security](#security)
    - [Database](#database)
    - [Helper](#helper)
    - [MimeTypes](#mimetypes)
12. [HTTP, HTTPS & WebSocket Servers](#http-https--websocket-servers)
13. [Package Auto-Installer](#package-auto-installer)
14. [Origin & CORS Security](#origin--cors-security)
15. [Error Codes Reference](#error-codes-reference)
16. [Global State (`_s` / `stoat`)](#global-state-_s--stoat)
17. [Stoatcore: Source & Fixes](#stoatcore-source--fixes)
18. [Security & Performance](#security--performance)

---

## Philosophy

Stoat challenges the culture of reaching for an npm package for every task. Every abstraction in the framework is built on native Node.js modules (`http`, `https`, `fs`, `url`, `string_decoder`, `crypto`, `child_process`). The single runtime dependency is `stoatcore`, which seeds the global `_s` / `stoat` object that all parts of the framework share.

---

## Installation

```bash
# Node.js
npm install stoatframework
# or
yarn add stoatframework

# Bun
bun add stoatframework
```

Require it as the first line of your application entry file:

```js
require("stoatframework");
```

---

## Bun Support

Stoat runs on **Bun 1.0+** without any code changes to your application. All Node.js built-in modules used by the framework (`http`, `https`, `fs`, `url`, `crypto`, `string_decoder`, `child_process`, `path`) are fully supported by Bun's Node.js compatibility layer. `stoatcore` itself has zero external dependencies, making it equally clean on both runtimes.

### Running with Bun

```bash
bun run base.js
```

### What changes under the hood

Two framework-level adjustments activate automatically when Bun is detected:

| Area | Node.js behaviour | Bun behaviour |
|---|---|---|
| Package installer | `npm install <pkg> --save` | `bun add <pkg>` |
| Runtime detection | — | `typeof Bun !== "undefined"` |

The installer auto-detects the runtime at startup — no config change needed.

### Outbound HTTP client (`_s.net`)

All six bugs in `stoatcore`'s Net module (SC-1 through SC-6) have been fixed and will be published to npm. Once you have the updated package installed, `_s.net` works correctly on both Node.js and Bun with no additional patching. See [TODOS.md](TODOS.md) for details.

### Bun-specific notes

- Use `bun add` instead of `npm install` when adding packages to a Bun project.
- Bun reads from `node_modules/` just like Node.js — existing projects require no restructuring.
- TypeScript files (`.ts`) are executed natively by Bun — set `__stoatData.appType = "ts"` in `base.js` when using a TypeScript project layout.

---

## Project Structure

```
project-root/
├── base.js                   # Application entry point
├── runStoatConfig.js         # Config loader & bootstrap
├── bin/
│   └── .config               # JSON configuration file
├── System/                   # Framework system layer (config folder)
│   ├── App/
│   │   ├── middleware.js     # Request router & CORS handler
│   │   └── installer.js      # npm / bun auto-installer
│   ├── Core/
│   │   ├── http.js           # HTTP server
│   │   ├── https.js          # HTTPS server
│   │   └── ws.js             # WebSocket server (WS + WSS)
│   ├── Net/
│   │   └── index.js          # Outbound HTTP/HTTPS client
│   └── Helpers/
│       └── Payload.js        # Request/response processor
├── Engine/                   # Controllers (user-defined)
│   └── v1/
│       └── <endpoint>.js
├── Models/                   # Database layer
│   ├── index.js              # DB bootstrap & schema loader
│   ├── Schemas/              # JSON schema definitions
│   └── Engines/
│       ├── MongoDB/mongoose.js
│       ├── MySQL/mysql.js
│       ├── MariaDB/mysql.js
│       ├── PostgresSQL/postgres.js
│       └── QuestDB/questdb.js
├── Helpers/                  # User-defined helpers
│   ├── Encryption.js
│   ├── Security.js
│   ├── Helper.js
│   └── MimeTypes.js
├── Public/                   # Static files served directly
│   ├── index.html
│   └── 404.html
├── OtherFiles/               # Supporting files
│   ├── allowedUrls.txt       # Whitelisted CORS origins
│   └── SSL/                  # TLS certificate files
└── Uploads/                  # File upload directory
```

> All folder names are configurable in `bin/.config` under the `folders` key.

---

## Configuration (`bin/.config`)

The entire runtime behaviour of the framework is controlled by a single JSON file at `bin/.config`. It is parsed once at startup by `runStoatConfig.js` and its values are merged into the global `_s.config` object.

### Full annotated schema

```jsonc
{
  // "development" | "staging" | "production"
  // Defaults to "stagging" if empty.
  "environment": "development",

  // Arbitrary key/value pairs injected into _s.config.environmentVariables
  "environmentVariables": {},

  // Base URL of the application — informational only
  "baseUrl": "http://localhost",

  // Network listeners — one object per protocol
  "net": [
    {
      "http": true,          // Enable HTTP server
      "data": { "port": 5000 }
    },
    {
      "https": false,        // Enable HTTPS server
      "data": {
        "port": 443,
        "ssl": {
          "cert": "cert.pem",  // filename inside OtherFiles/SSL/
          "key":  "key.pem"
        }
      }
    },
    {
      "ws": false,           // WebSocket over HTTP
      "data": { "port": 0 } // 0 = share the HTTP server port; >0 = standalone port
    },
    {
      "wss": false,          // WebSocket over HTTPS
      "data": { "port": 0 } // 0 = share the HTTPS server port; >0 = standalone port
    }
  ],

  // Path aliases — all paths relative to project root
  "folders": {
    "config":          "System",       // Framework system directory
    "helpers":         "Helpers",      // Helper modules directory
    "model":           "Models",       // Database models directory
    "view":            "Public",       // Static files directory
    "controller":      "Engine",       // Controllers directory
    "uploadDirectory": "Uploads",
    "flatStorage":     "FlatFiles",
    "others":          "OtherFiles"
  },

  // API settings
  "app": {
    "api": {
      "allow": true,                   // Enable API routing
      "versionPrefix": ["v1"]          // Accepted version path segments
    }
  },

  // Incoming request settings
  "request": {
    "cors": false,                     // true = handle OPTIONS preflight
    "checkOrigin": false,              // true = validate against allowedUrls.txt
    "maxBodyBytes": 1048576,           // max request body in bytes (default 1 MB)
    "allowedMethods": ["GET", "POST", "OPTIONS", "PATCH", "DELETE"],
    "allowedHeaders": ["Content-Type", "Authorization", "Accept"]
  },

  // Static file serving
  "response": {
    "indexPage":    "index.html",      // Served at "/"
    "notFoundPage": "index.html"       // Served for unknown paths
  },

  // Database connections — one object per connection
  "db": [
    {
      "engine":   "MongoDB",           // Subfolder under Models/Engines/
      "package":  "mongoose",          // npm package name (auto-installed)
      "file":     "users.json",        // Schema file in Models/Schemas/
      "url":      "",                  // Host / connection string
      "port":     27017,
      "user":     "",
      "password": "",
      "name":     "mydb",             // Database name
      "ref":      "Users",            // Key on _s.db to store the connection
      "schema":   "users"             // Collection / schema identifier
    }
  ],

  // npm packages to verify & auto-install on startup
  "packages": ["some-package"],

  // Arbitrary application-level constants, available in _s.config.definitions
  "definitions": {}
}
```

---

## Entry Point (`base.js`)

`base.js` is the file that kicks off the entire application. It:

1. Loads `stoatcore` — bootstraps the global `_s` object.
2. Sets `_s.misc.rootPath` to the project root.
3. Calls `init()` which:
   - Parses `bin/.config` via `runStoatConfig.js`.
   - Iterates over `configData.net` to resolve which protocols are active.
   - Initialises all database connections listed under `_s.dbConfig`.
   - Calls `runConnection()` which starts the HTTP/HTTPS servers.

```js
// Minimal base.js
require("stoatcore");

global.log = console.log;

const path = require("path");

_s.misc.rootPath   = path.join(__dirname);
_s.misc.rootParent = _s.misc.rootPath;

init();

async function init() {
    const configFile = require("./runStoatConfig");
    const configData = await configFile.runConfig();
    // ... net loop & DB init ...
}
```

---

## Routing & Controllers

### URL structure

```
/{versionPrefix}/{endpointName}/{methodName}
```

| Segment          | Example    | Description                                      |
|-----------------|------------|--------------------------------------------------|
| versionPrefix   | `v1`       | Must match an entry in `app.api.versionPrefix`   |
| endpointName    | `users`    | Filename (without extension) under `Engine/v1/`  |
| methodName      | `getUser`  | Method on the controller class                   |

**Example:** `GET /v1/users/getUser`

### Controller file

Create `Engine/v1/users.js`:

```js
class users {
    // Declare all handled methods in this array
    get methods() {
        return [
            { name: "getUser",    method: "get"    },
            { name: "createUser", method: "post"   },
            { name: "updateUser", method: "patch"  },
            { name: "deleteUser", method: "delete" },
        ];
    }

    // Each method receives (request, callback)
    // request = { body, header, query }
    // Respond via callback OR return a plain object / Promise

    getUser(request, callback) {
        const { query } = request;

        callback({
            headCode: 200,
            status: 1,
            message: "User fetched",
            data: { id: query.id }
        });
    }

    async createUser(request, callback) {
        const { body } = request;

        // async controllers can return a plain object instead of calling callback
        return {
            headCode: 201,
            status: 1,
            message: "User created",
            data: body
        };
    }
}

module.exports = { users };
```

### Controller rules

- The exported key **must** match the class name and the URL `endpointName`.
- `methods` is a getter that returns an array of `{ name, method }` descriptors. A request is only dispatched if **both** the path segment and the HTTP method match.
- Controllers can respond in **three equivalent ways**:
  1. Call the `callback(responseObj)` argument.
  2. `return` a plain object synchronously.
  3. `return` a `Promise` that resolves to a plain object.

---

## Request & Response

### Request object

Every controller method receives a `request` object with three properties:

| Property | Type   | Contents                                                  |
|----------|--------|-----------------------------------------------------------|
| `body`   | Object | Parsed JSON body (POST/PATCH/DELETE) or empty `{}`       |
| `header` | Object | Raw Node.js `IncomingMessage` headers + `urlPath` key    |
| `query`  | Object | Parsed query-string or GET body (JSON or `key=value`)    |

### Response object shape

All responses — success and error — share the same JSON envelope:

```json
{
  "status":    1,
  "message":   "Human-readable message",
  "data":      {},
  "errorcode": ""
}
```

| Field       | Values                        |
|-------------|-------------------------------|
| `status`    | `1` = success, `2` = failure  |
| `errorcode` | Framework internal code string (see [Error Codes](#error-codes-reference)) or `""` |

### Building a response object in a controller

```js
return {
    headCode:    200,          // HTTP status code
    status:      1,            // 1 = ok, 2 = error
    message:     "Done",
    data:        { ... },      // optional — defaults to {}
    code:        "",           // optional error code
    contentType: "application/json"  // optional — overrides Content-Type header
};
```

---

## Middleware

[System/App/middleware.js](System/App/middleware.js) is the single request handler mounted on every HTTP/HTTPS server. Its processing pipeline:

```
Incoming Request
      │
      ▼
[1] Origin Check / CORS Headers
      │
      ▼
[2] Authorization header? → domainSecurity() check
      │
      ▼
[3] Parse URL path → segmentedPath[]
      │
      ▼
[4] API mode? (app.api.allow)
      ├── YES ─→ versionPrefix match?
      │              ├── YES ─→ Load controller → find method → dispatch
      │              └── NO  ─→ Serve static file from Public/
      └── NO  ─→ GET only; serve static file
```

### Key behaviours

- **OPTIONS preflight**: When `request.cors = true`, OPTIONS requests receive `204 No Content` and terminate.
- **Non-production environment**: Sets `Access-Control-Allow-Origin: *` and echoes `Application-Environment` header.
- **Production + `checkOrigin: true`**: Origin must appear in `OtherFiles/allowedUrls.txt` (one URL per line).
- **Authorization header present**: Triggers `_s.helpers.Security.domainSecurity()`. A non-`status: 1` result returns `406`.

---

## Database Engines

All database engines live under `Models/Engines/`. They are bootstrapped by `Models/index.js`, which:

1. Checks if the required npm package is installed (auto-installs if missing).
2. Creates a constructor on `_s.db[db.ref]` and attaches `config` and `schema` to its prototype.
3. Loads the JSON schema file from `Models/Schemas/`.
4. Calls the engine's `initDB(dbRef)` function.

### Configuration template (`bin/.config` → `"db"` array)

```jsonc
{
    "engine":   "<EngineFolderName>",  // e.g. "MongoDB", "MySQL"
    "package":  "<npmPackageName>",    // e.g. "mongoose", "mysql"
    "file":     "<schema>.json",       // Schema file in Models/Schemas/
    "url":      "localhost",
    "port":     0,
    "user":     "",
    "password": "",
    "name":     "<databaseName>",
    "ref":      "<globalKey>",         // _s.db.<ref> accessor
    "schema":   "<schemaIdentifier>"
}
```

---

### MongoDB (Mongoose)

**File:** [Models/Engines/MongoDB/mongoose.js](Models/Engines/MongoDB/mongoose.js)
**Package:** `mongoose`

Supports multiple independent connections to different databases. Each `db.ref` gets its own `mongoose.createConnection()` instance. Connections are cached and reused.

**Schema file format** (`Models/Schemas/users.json`):

```json
[
    {
        "name": "User",
        "structure": {
            "name":  { "type": "String", "required": true },
            "email": { "type": "String", "required": true },
            "age":   "Number"
        },
        "indexes": [
            { "fields": { "email": 1 }, "options": { "unique": true } }
        ]
    }
]
```

**Accessing models in a controller:**

```js
const db = new _s.db.Users();          // db.ref = "Users"
const UserModel = db.models.User;

const user = await UserModel.findOne({ email: "a@b.com" });
```

**Features:**
- Auto creates new models via `connection.model()`.
- Detects schema changes and updates `schema.obj` in-place.
- Marks removed collections as `__deleted_<name>` without dropping data.
- Calls `model.ensureIndexes()` non-blocking after registration.

---

### MySQL

**File:** [Models/Engines/MySQL/mysql.js](Models/Engines/MySQL/mysql.js)
**Package:** `mysql`

Creates a connection **pool** (`mysql.createPool`) and attaches it to `_s.db[ref].connection`. The pool reconnects automatically on dropped connections and queues requests when all connections are busy (`connectionLimit: 10` by default — override with `dbData.connectionLimit` in config).

**Usage in a controller:**

```js
const db = _s.db.MyDB;
db.connection.query("SELECT * FROM users", (err, results) => {
    // ...
});
```

---

### MariaDB

**File:** [Models/Engines/MariaDB/mysql.js](Models/Engines/MariaDB/mysql.js)
**Package:** `mysql`

Identical pool-based interface to the MySQL engine. Accepts both `user` and `username` fields in the db config for compatibility. Attaches the pool to `stoat.db[ref].connection`.

---

### PostgreSQL

**File:** [Models/Engines/PostgresSQL/postgres.js](Models/Engines/PostgresSQL/postgres.js)
**Package:** `pg`

Uses `pg.Pool` for connection pooling. The pool is attached to `stoat.db[ref].connection`.

**Default port:** `5432`

**Usage:**

```js
const pool = stoat.db.PgDB.connection;
const result = await pool.query("SELECT NOW()");
```

---

### QuestDB

**File:** [Models/Engines/QuestDB/questdb.js](Models/Engines/QuestDB/questdb.js)
**Package:** `@questdb/nodejs-client`

Communicates with QuestDB via its HTTP REST API (`/exec` endpoint). Automatically provisions tables and keeps schemas in sync on startup.

**Schema file format** (`Models/Schemas/metrics.json`):

```json
[
    {
        "name": "sensor_data",
        "columns": [
            { "name": "ts",          "type": "TIMESTAMP" },
            { "name": "sensor_id",   "type": "SYMBOL" },
            { "name": "temperature", "type": "DOUBLE" }
        ]
    }
]
```

**Schema sync behaviour on startup:**

1. `CREATE TABLE IF NOT EXISTS` — creates the table if absent.
2. Compares current columns against the schema definition.
3. Issues `ALTER TABLE ADD COLUMN` for new columns.
4. Issues `ALTER TABLE ALTER COLUMN ... TYPE` for type mismatches.
5. Issues `ALTER TABLE DROP COLUMN` for columns removed from the schema.

**Running a query in a controller:**

```js
const db = new _s.db.Metrics();
const result = await db.run({ query: "SELECT * FROM sensor_data LIMIT 10" });
```

---

## Helpers

Helper modules live in the `Helpers/` folder. At startup `runStoatConfig.js` scans this directory and merges every exported function into the corresponding `_s.helpers.<HelperName>` namespace. User-defined helpers placed in this folder are discovered automatically.

### Encryption

**File:** [Helpers/Encryption.js](Helpers/Encryption.js)

Namespace: `_s.helpers.Encryption`

Full AES-256-GCM encryption suite built on native Node.js `crypto`. No external dependencies.

| Method | Description |
|---|---|
| `encrypt(text, secret)` | AES-256-GCM encrypt — returns `iv:tag:ciphertext` hex string |
| `decrypt(str, secret)` | AES-256-GCM decrypt |
| `hash(value)` | SHA-256 hex digest |
| `hashPassword(password)` | scrypt-based password hash — returns `salt:hash` string |
| `verifyPassword(password, stored)` | Constant-time scrypt verification |
| `threeDESEncrypt` / `threeDESDecrypt` | Back-compat aliases → `encrypt` / `decrypt` |
| `MD5Encryption` | Back-compat alias → `hash` (SHA-256, not MD5) |

The key derivation for `encrypt`/`decrypt` uses `scryptSync(secret, "stoat-enc-salt-v1", 32)` internally — no separate key management required.

---

### Security

**File:** [Helpers/Security.js](Helpers/Security.js)

Namespace: `_s.helpers.Security`

Full native HS256 JWT implementation using Node.js `crypto`. Requires the `JWT_SECRET` environment variable.

```bash
# Generate a secure secret
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Method | Description |
|---|---|
| `signToken(payload, expiresInSeconds?)` | Creates a signed HS256 JWT (default TTL: 1 hour) |
| `verifyToken(token)` | Returns `{ valid, payload }` or `{ valid: false, message }` |
| `domainSecurity(request)` | Middleware hook — validates `Authorization: Bearer <token>` header |

**`domainSecurity`** is called automatically by middleware on every request that carries an `Authorization` header. It must return `{ status: 1, data: { source } }` on success or `{ status: 2, message }` on failure.

> **Deploy requirement:** Set `JWT_SECRET` in your environment before going to production. The framework will throw at startup if the variable is missing in a production environment.

---

### Database

**File:** [Helpers/Database.js](Helpers/Database.js) (loaded from StoatCore)

Namespace: `_s.helpers.Database`

SQL and MongoDB sanitization utilities.

| Method | Description |
|---|---|
| `sanitizeSQL(value)` | Escapes SQL special characters to prevent injection |
| `sanitizeMongo(obj)` | Strips MongoDB operator keys (`$`-prefixed) from query objects |

---

### Helper

**File:** [Helpers/Helper.js](Helpers/Helper.js)

Namespace: `_s.helpers.Helper`

General-purpose stub module — add any reusable utility functions here and they will be accessible globally as `_s.helpers.Helper.<functionName>`.

---

### MimeTypes

**File:** [Helpers/MimeTypes.js](Helpers/MimeTypes.js)

An array of `{ file: ['.ext'], content: 'mime/type' }` objects loaded into `_s.__system.mimeTypes` at boot. Used by `Payload.renderFile()` to set the correct `Content-Type` header.

```js
// Helpers/MimeTypes.js — extending the list
module.exports = [
    { file: [".txt"],  content: "text/plain" },
    { file: [".html"], content: "text/html" },
    { file: [".json"], content: "application/json" },
    { file: [".png"],  content: "image/png" },
    { file: [".jpg", ".jpeg"], content: "image/jpeg" },
    { file: [".css"],  content: "text/css" },
    { file: [".js"],   content: "application/javascript" }
];
```

---

## HTTP, HTTPS & WebSocket Servers

### HTTP — [System/Core/http.js](System/Core/http.js)

Creates a standard `http.Server` on the configured port. Every request is handed directly to `middleware.js`.

```jsonc
// bin/.config
"net": [{ "http": true, "data": { "port": 5000 } }]
```

### HTTPS — [System/Core/https.js](System/Core/https.js)

Creates an `https.Server` using TLS certificate files from `OtherFiles/SSL/`. The filenames are read from `net[].certKey` and `net[].certPem`.

```jsonc
"net": [{
    "https": true,
    "certKey": "server.key",
    "certPem": "server.crt",
    "data": { "port": 443 }
}]
```

### WebSocket — [System/Core/ws.js](System/Core/ws.js)

**Package:** `ws` (auto-installed on first use)

Two modes — controlled by `net[].data.port`:

| `port` value | Behaviour |
|---|---|
| `0` (default) | WS upgrades handled on the **same port** as HTTP/HTTPS (no extra port) |
| `> 0` | Standalone WS server on that port |

```jsonc
// bin/.config — shared port with HTTP (most common)
"net": [
    { "http": true, "data": { "port": 5000 } },
    { "ws":   true, "data": { "port": 0 } }
]

// bin/.config — WSS sharing the HTTPS port
"net": [
    { "https": true, "certKey": "server.key", "certPem": "server.crt", "data": { "port": 443 } },
    { "wss":   true, "data": { "port": 0 } }
]

// bin/.config — WS on its own port
"net": [
    { "http": true, "data": { "port": 5000 } },
    { "ws":   true, "data": { "port": 5001 } }
]
```

#### Message format (client → server)

```json
{
    "version":  "v1",
    "endpoint": "chat",
    "method":   "sendMessage",
    "data":     { "text": "Hello" }
}
```

`version` defaults to `"v1"` if omitted. `endpoint` and `method` map to the same controller classes used by HTTP — the **same controller handles both protocols**.

#### Response format (server → client)

```json
{ "status": 1, "message": "...", "data": {}, "errorcode": "" }
```

#### Controller example

```js
// Engine/v1/chat.js
class chat {
    get methods() {
        return [
            { name: "sendMessage", method: "post" },
            { name: "history",     method: "get"  },
        ];
    }

    sendMessage(request, callback) {
        const { body, ws, wss } = request;

        // Broadcast to all connected clients
        wss.clients.forEach((client) => {
            if (client.readyState === 1) {   // 1 = WebSocket.OPEN
                client.send(JSON.stringify({ event: "message", data: body }));
            }
        });

        callback({ status: 1, message: "Broadcast sent", data: body });
    }
}

module.exports = { chat };
```

The `request` object for WS methods carries two extra fields:

| Field | Description |
|---|---|
| `request.ws` | The individual WebSocket client — call `ws.send()` to reply to this client only |
| `request.wss` | The WebSocket server — iterate `wss.clients` to broadcast to all connections |

#### WS error codes

| Code | Trigger |
|---|---|
| `WS000` | Invalid JSON in message |
| `WS001` | Missing `endpoint` or `method` field |
| `WS002` | Unsafe path segment (path traversal guard) |
| `WS003` | Endpoint not in route map |
| `WS004` | Controller class not found in module |
| `WS005` | Method not listed in `controller.methods` |
| `WS006` | Unhandled exception during dispatch |

---

## Package Auto-Installer

**File:** [System/App/installer.js](System/App/installer.js)

Two exported functions are used throughout the framework:

| Function                          | Description                                              |
|-----------------------------------|----------------------------------------------------------|
| `checkPackage(moduleName)`        | Returns `true` if the module resolves, `false` otherwise |
| `installPackage(moduleName, type)`| Runs `bun add <pkg>` under Bun, `npm install <pkg> --save` (or `--save-dev` if `type === 1`) under Node.js |

The runtime is detected once at module load via `typeof Bun !== "undefined"` — no configuration required.

Packages listed in `"packages"` in `bin/.config` are verified and installed at every application startup. Database engine packages are also auto-installed when a new DB connection is first encountered.

---

## Origin & CORS Security

### `checkOrigin: false` (default)

- Sets `Access-Control-Allow-Origin: *`.
- Falls back `headers.origin` to `headers.host` if the `origin` header is absent.

### `checkOrigin: true`

- Reads `OtherFiles/allowedUrls.txt` (created with `http://localhost` if missing).
- Each line is one allowed origin.
- Only matching origins are reflected in the `Access-Control-Allow-Origin` response header.
- In **production** mode, non-matching origins receive `406 Origin not Allowed (C002-406)`.

### CORS preflight (`cors: true`)

- `OPTIONS` requests return `204 No Content` immediately — no controller is invoked.

### Allowed methods & headers

Configured via `request.allowedMethods` and `request.allowedHeaders` in `bin/.config`. These populate the `Access-Control-Allow-Method` and `Access-Control-Allow-Headers` response headers on every request.

---

## Error Codes Reference

All framework-generated errors share the same response envelope with `status: 2`.

| Code        | HTTP | Trigger                                                        |
|-------------|------|----------------------------------------------------------------|
| `C000-406`  | 406  | `domainSecurity()` returned a non-success status              |
| `C001-406`  | 406  | Non-GET/HEAD request with no `origin` header                  |
| `C002-406`  | 406  | Production mode — origin not in `allowedUrls.txt`             |
| `C003-406`  | 406  | `app.api.allow = false` and method is not GET                 |
| `C005-406`  | 406  | Controller file not found for the requested endpoint          |
| `C005-1-406`| 406  | Controller file loaded but matching class not found           |
| `C006-500`  | 500  | `methods` array missing or malformed on controller class      |
| `C007-406`  | 406  | No `methods` entry matches the path + HTTP method combination |
| `C008-406`  | 500  | Unhandled exception during controller method execution        |
| `C009-406`  | 406  | Non-API path requested with a non-GET method                  |
| `C010-400`  | 400  | URL segment contains unsafe characters (path traversal guard) |
| `C011-413`  | 413  | Request body exceeds `request.maxBodyBytes` limit             |
| `P000`      | 500  | Unhandled exception inside `Payload.renderObject()`           |

---

## Global State (`_s` / `stoat`)

`stoatcore` seeds a global object accessible everywhere as `_s` (and as `stoat` — they are the same reference). The most commonly used namespaces:

| Path                         | Type       | Description                                      |
|------------------------------|------------|--------------------------------------------------|
| `_s.config`                  | Object     | Merged application configuration                |
| `_s.config.environment`      | String     | `"development"` / `"staging"` / `"production"`  |
| `_s.config.requestConf`      | Object     | Parsed `request` block from `.config`            |
| `_s.config.responseConf`     | Object     | Parsed `response` block from `.config`           |
| `_s.paths`                   | Object     | Folder aliases from `.config`                    |
| `_s.misc.rootPath`           | String     | Absolute path to project root                    |
| `_s.misc.rootParent`         | String     | Same as `rootPath` (alias for parent resolution) |
| `_s.dbConfig`                | Array      | Raw `db` array from `.config`                    |
| `_s.db`                      | Object     | Live database connections keyed by `db.ref`      |
| `_s.helpers`                 | Object     | All loaded helper modules by name                |
| `_s.helpers.Security`        | Object     | Security helper (incl. `domainSecurity`)         |
| `_s.helpers.Encryption`      | Object     | Encryption helper                                |
| `_s.helpers.Database`        | Object     | SQL/MongoDB sanitization helpers                 |
| `_s.__system.mimeTypes`      | Array      | Loaded MIME type definitions                     |
| `_s.__system.allowedOrigins` | Array      | Cached entries from `OtherFiles/allowedUrls.txt` |
| `_s.__system.notFoundPage`   | String     | Resolved absolute path to 404 page (cached)      |
| `_s.__system.routes`         | Object     | Pre-built controller map `"{version}/{name}"` → module |
| `_s.__system.wsServer`       | Object     | Active `WebSocket.Server` instance (set when WS is enabled) |
| `global.__stoatData`         | Object     | App-type metadata (`appType: "js"` or `"ts"`)   |
| `global.log`                 | Function   | Alias for `console.log`                          |

---

## Stoatcore: Source & Fixes

`stoatcore` is loaded from a local copy at `StoatCore/` (nested in the repo, excluded from parent git via `.gitignore`). All known bugs have been fixed directly at source — no patch layer is needed at runtime. Full details are tracked in [TODOS.md](TODOS.md).

### Bugs fixed in `StoatCore/` source

| ID | Component | Fix |
|---|---|---|
| SC-1 | `Net/index.js` | `StringDecoder` import casing fixed |
| SC-2 | `Net/index.js` | `let response = {}` added before first use |
| SC-3 | `Net/index.js` | `requestDetails` now passed as first arg to `http.request()` |
| SC-4 | `Net/index.js` | `option`/`delete` parameter renamed from `option` → `params` |
| SC-5 | `Net/index.js` | `Content-Length` uses `Buffer.byteLength(body)` |
| SC-6 | `Net/index.js` | Response body buffered across `data` events, resolved on `end` |
| SC-7 | `Helpers/Helper.js` | `writeBase64ToFile` — added `fs`/`path` imports, fixed path construction |
| SC-8 | `Helpers/Encryption.js` | 3DES → AES-256-GCM; MD5 → SHA-256; added scrypt password hashing |

### Pending stoatcore features

| ID | Item |
|---|---|
| SC-F1 | WebSocket support |
| SC-F2 | CLI scaffolding tool |
| SC-F3 | `_s.net` streaming responses |

---

## Security & Performance

All hardening items have been implemented. See [TODOS.md](TODOS.md) for implementation notes.

### Security (all implemented)

| ID | Description | Where |
|---|---|---|
| SEC-1 | Path traversal guard — URL segments validated with `/^[a-zA-Z0-9_-]+$/` | `middleware.js` |
| SEC-2 | Static file confinement via `path.resolve()` — no escape from `Public/` | `middleware.js` |
| SEC-3 | Body size limit — configurable via `request.maxBodyBytes` (default 1 MB) | `middleware.js` |
| SEC-4 | Security headers on every response — CSP, X-Frame-Options, HSTS (prod) | `middleware.js` |
| SEC-5 | Native HS256 JWT — `signToken`, `verifyToken`, `domainSecurity` | `Helpers/Security.js` |

### Performance (all implemented)

| ID | Description | Where |
|---|---|---|
| PERF-1 | `allowedUrls.txt` cached at startup → `_s.__system.allowedOrigins`; `SIGHUP` reloads | `runStoatConfig.js` |
| PERF-2 | `notFoundPage` path resolved once → `_s.__system.notFoundPage` | `runStoatConfig.js` |
| PERF-3 | Controller route map pre-built → `_s.__system.routes` — no `require()` per request | `runStoatConfig.js` |
| PERF-4 | `global.__Stoat` replaced with request-scoped `const __Stoat` | `middleware.js` |
| PERF-5 | Gzip compression via `zlib.gzipSync` when client sends `Accept-Encoding: gzip` | `System/Helpers/Payload.js` |
| PERF-6 | `keepAliveTimeout: 65 s` / `headersTimeout: 66 s` on HTTP + HTTPS servers | `System/Core/http.js`, `https.js` |
| PERF-7 | MySQL / MariaDB upgraded from single connection to `mysql.createPool()` | `Models/Engines/*/mysql.js` |

---

## Contributing

Bug reports and feature requests: [GitHub Issues](https://github.com/SyntaxImagination/Stoat-Framework/issues)

The project welcomes contributions that stay true to the core philosophy: prefer native Node.js/Bun built-ins, justify every external dependency, and keep the API surface small and learnable.
