# Stoat Framework

**Version:** 1.8.0
**Author:** Syntax Imagination
**License:** ISC
**Repository:** [SyntaxImagination/Stoat-Framework](https://github.com/SyntaxImagination/Stoat-Framework)
**Runtimes:** Node.js 16+ · Bun 1.0+ · Deno 1.28+
**Languages:** JavaScript · TypeScript (Bun — native; Node — requires ts-node/tsx)

A slim Node.js/Bun/Deno framework designed with a focus on minimal package usage and maximum native runtime functionality. Inspired by the simplicity of PHP's **CodeIgniter** and **Flight** frameworks, Stoat follows an **MVC** pattern while encouraging developers to understand and leverage the runtime at its core.

---

## Table of Contents

1. [Philosophy](#philosophy)
2. [Installation](#installation)
3. [CLI — `stoat init` & `stoat generate`](#cli--stoat-init--stoat-generate)
4. [Bun Support](#bun-support)
5. [TypeScript Support](#typescript-support)
6. [Project Structure](#project-structure)
7. [Configuration (`bin/.config`)](#configuration-binconfig)
8. [Entry Point (`base.js`)](#entry-point-basejs)
9. [Routing & Controllers](#routing--controllers)
10. [Request & Response](#request--response)
11. [Middleware](#middleware)
12. [Database Engines](#database-engines)
    - [MongoDB (Mongoose)](#mongodb-mongoose)
    - [MySQL](#mysql)
    - [MariaDB](#mariadb)
    - [PostgreSQL](#postgresql)
    - [QuestDB](#questdb)
    - [ClickHouse](#clickhouse)
    - [CouchDB](#couchdb)
    - [Redis](#redis)
13. [Helpers](#helpers)
    - [Encryption](#encryption)
    - [Security](#security)
    - [Database](#database)
    - [Helper](#helper)
    - [MimeTypes](#mimetypes)
14. [HTTP, HTTPS & WebSocket Servers](#http-https--websocket-servers)
15. [Package Auto-Installer](#package-auto-installer)
16. [Origin & CORS Security](#origin--cors-security)
17. [Error Codes Reference](#error-codes-reference)
18. [Global State (`_s` / `stoat`)](#global-state-_s--stoat)
19. [Stoatcore: Source & Fixes](#stoatcore-source--fixes)
20. [Security & Performance](#security--performance)

---

## Philosophy

Stoat challenges the culture of reaching for an npm package for every task. Every abstraction in the framework is built on native Node.js modules (`http`, `https`, `fs`, `url`, `string_decoder`, `crypto`, `child_process`). The single runtime dependency is `stoatcore`, which seeds the global `_s` / `stoat` object that all parts of the framework share.

---

## Installation

### Using the CLI (recommended)

```bash
# Run the interactive project scaffold — no prior install needed
npx stoatframework init
```

This launches the `stoat init` wizard. See [CLI section](#cli--stoat-init--stoat-generate) for full details.

### Manual install

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

## CLI — `stoat init` & `stoat generate`

The Stoat CLI is bundled with the package and exposed via the `stoat` binary. It handles project scaffolding and code generation with zero additional dependencies — built entirely on native Node.js `readline`, `fs`, and `path`.

### `stoat init`

Interactive project scaffold. Run from any directory:

```bash
npx stoatframework init
# or, if installed globally:
stoat init
```

The wizard asks:

| Prompt | Options | Default |
|---|---|---|
| Project name | Any valid directory name | `my-stoat-app` |
| Runtime | Node · Bun · Deno | Node |
| Language | JavaScript · TypeScript | JavaScript (Bun/Deno only — Node defaults to JS; Deno always TS) |
| HTTP port | Any port number | `5000` |
| Database | None · MongoDB · MySQL · MariaDB · PostgreSQL · QuestDB · ClickHouse · CouchDB · Redis | None |

What gets generated in `<project-name>/`:

```
<project-name>/
├── base.js / base.ts         ← entry point for chosen runtime + language
├── runStoatConfig.js         ← config loader (TS-aware helper loading)
├── bin/.config               ← pre-filled with chosen port + database
├── StoatCore/                ← fixed stoatcore v1.1.1 (bundled)
├── System/                   ← framework system layer (copied from package)
├── Helpers/                  ← helper modules
├── Models/                   ← database layer + engine files
├── Engine/
│   └── v1/
│       └── home.js / home.ts ← sample controller
├── Public/
│   ├── index.html
│   └── 404.html
├── OtherFiles/
│   └── allowedUrls.txt
├── Uploads/
├── FlatFiles/
│
│   ── Node / Bun ──────────────────────────────────────────────────────
├── package.json              ← scripts + "stoatcore": "file:./StoatCore"
├── globals.d.ts              ← TypeScript globals (Bun TS only)
├── tsconfig.json             ← TypeScript config (Bun TS only)
│
│   ── Deno ──────────────────────────────────────────────────────────
├── deno.json                 ← nodeModulesDir, import map, task definitions
└── globals.d.ts              ← TypeScript globals (always included for Deno)
```

**Next steps after scaffold:**

```bash
cd <project-name>

# Node
npm install && node base.js

# Bun JS
bun install && bun run base.js

# Bun TS
bun install && bun run base.ts

# Deno (no install step — dependencies downloaded on first run)
deno run --allow-all base.ts
# or via deno.json task:
deno task start
```

---

### `stoat generate`

Generate controllers and model schemas inside an existing Stoat project. Run from the project root.

```bash
# Full form
stoat generate controller <name>
stoat generate model <name>

# Short aliases
stoat g c <name>
stoat g m <name>
```

**Controller** — creates `Engine/v1/<name>.js` (or `.ts` if `tsconfig.json` is present):

```bash
stoat g c users
# → Engine/v1/users.js
```

**Model schema** — creates `Models/Schemas/<name>.json`:

```bash
stoat g m users
# → Models/Schemas/users.json  (engine: MongoDB)
```

The generated controller includes all four HTTP methods pre-wired. The schema generator reads the first `db` engine from `bin/.config` and produces the correct shape automatically:

| Engine | Generated schema shape |
|---|---|
| MongoDB · MySQL · MariaDB · PostgreSQL | `{ name, structure: { … } }` |
| ClickHouse | `{ name, engine, orderBy, columns: [{ name, type }] }` |
| CouchDB | `{ name, indexes: [{ name, fields }] }` |
| Redis | `{ name, keyPrefix, defaultTTL }` |
| QuestDB | `{ name, columns: [{ name, type }] }` |

---

### CLI internals

| File | Purpose |
|---|---|
| [CLI/bin/stoat.js](CLI/bin/stoat.js) | Entry point — arg parsing, command dispatch, help text |
| [CLI/commands/init.js](CLI/commands/init.js) | Interactive scaffold — prompts, file generation, directory copy |
| [CLI/commands/generate.js](CLI/commands/generate.js) | Controller and model code generation |
| [CLI/lib/prompt.js](CLI/lib/prompt.js) | Native `readline` wrapper — sequential questions, numbered select menus |
| [CLI/lib/templates.js](CLI/lib/templates.js) | All file content generators (`baseJs`, `baseTs`, `controllerJs`, `controllerTs`, `globalsTs`, etc.) |
| [CLI/lib/scaffold.js](CLI/lib/scaffold.js) | File system utilities — `ensureDir`, `writeFile`, `copyDir` |

---

## Bun Support

Stoat runs on **Bun 1.0+** without any code changes to your application. All Node.js built-in modules used by the framework (`http`, `https`, `fs`, `url`, `crypto`, `string_decoder`, `child_process`, `path`) are fully supported by Bun's Node.js compatibility layer.

### Running with Bun

```bash
bun run base.js     # JavaScript project
bun run base.ts     # TypeScript project
```

### What changes under the hood

Two framework-level adjustments activate automatically when Bun is detected:

| Area | Node.js behaviour | Bun behaviour |
|---|---|---|
| Package installer | `npm install <pkg> --save` | `bun add <pkg>` |
| Runtime detection | — | `typeof Bun !== "undefined"` |

### Bun-specific notes

- Use `bun add` instead of `npm install` when adding packages to a Bun project.
- Bun reads from `node_modules/` just like Node.js — existing projects require no restructuring.
- TypeScript files (`.ts`) are executed natively by Bun — use `stoat init` and choose **Bun + TypeScript** to get a pre-configured TS project.

---

## TypeScript Support

### Bun TypeScript (fully supported)

Bun executes `.ts` files natively — no `tsc`, no `ts-node`, no build step. A Bun TS project looks identical to a JS project, just with `.ts` extensions and optional type annotations.

**Scaffold a Bun TS project:**

```bash
npx stoatframework init
# → Runtime: Bun
# → Language: TypeScript
```

This generates:
- `base.ts` — typed entry point using `require()` (Bun supports CJS in `.ts`)
- `globals.d.ts` — ambient declarations for `_s`, `stoat`, `log`, `__stoatData`
- `tsconfig.json` — `CommonJS` module target, `skipLibCheck: true`
- `.ts` controllers in `Engine/v1/`

**Running:**

```bash
bun run base.ts         # start
bun --watch base.ts     # dev mode with hot reload
```

**Writing TypeScript controllers:**

```ts
// Engine/v1/users.ts
interface StoatRequest {
    body:   Record<string, any>;
    header: Record<string, any>;
    query:  Record<string, any>;
}

type StoatCallback = (response: Record<string, any>) => void;

class users {
    get methods() {
        return [
            { name: "getUser",    method: "get"  },
            { name: "createUser", method: "post" },
        ];
    }

    getUser(request: StoatRequest, callback: StoatCallback): void {
        callback({ headCode: 200, status: 1, message: "OK", data: {} });
    }

    async createUser(request: StoatRequest, _cb: StoatCallback) {
        return { headCode: 201, status: 1, message: "Created", data: request.body };
    }
}

module.exports = { users };
```

**TypeScript helpers:**

Helpers can be written as `.ts` files. The framework loader checks `.js` first, then falls back to `.ts` automatically — no config change needed:

```ts
// Helpers/MyHelper.ts
export function formatDate(d: Date): string {
    return d.toISOString().split("T")[0];
}
```

Access via `_s.helpers.MyHelper.formatDate(new Date())`.

### Global type definitions (`globals.d.ts`)

Generated automatically by `stoat init` for TS projects:

```ts
declare const _s: StoatGlobal;
declare const stoat: StoatGlobal;
declare const log: typeof console.log;
declare var __stoatData: { appType: "js" | "ts" };
```

Extend the interfaces in `globals.d.ts` to type your own database connections and custom helpers.

### Node.js TypeScript

Node.js does not execute `.ts` natively. To use TypeScript with Node:

```bash
# Option A — ts-node (dev only)
npx ts-node base.ts

# Option B — tsx (faster, ESM-compatible)
npx tsx base.ts
```

`stoat init` defaults Node projects to JavaScript. TypeScript is recommended via **Bun** where it requires zero extra tooling.

### Deno TypeScript (fully supported)

Deno 1.28+ is TypeScript-native and has first-class Node.js compatibility. Stoat uses a `createRequire` bridge in the Deno entry file so the CJS framework files work without any rewrites.

**Scaffold a Deno project:**

```bash
npx stoatframework init
# → Runtime: Deno
# → Language: TypeScript (automatic — Deno's native language)
```

This generates:
- `base.ts` — ESM entry using `createRequire(import.meta.url)` to load CJS framework files
- `deno.json` — `nodeModulesDir: "auto"`, import map wiring `stoatcore` → `./StoatCore/core.js`, `start` / `dev` task definitions
- `globals.d.ts` — ambient declarations for `_s`, `stoat`, `log`

**Running:**

```bash
deno run --allow-all base.ts    # start (downloads deps automatically on first run)
deno run --allow-all --watch base.ts  # dev mode
# or via deno.json tasks:
deno task start
deno task dev
```

**How the CJS bridge works:**

`base.ts` imports `createRequire` from `node:module` and uses it to load all framework files (which are CJS). The `stoatcore` bootstrap is resolved via the import map in `deno.json`:

```jsonc
// deno.json
{
  "nodeModulesDir": "auto",
  "imports": {
    "stoatcore": "./StoatCore/core.js"   // always resolves to fixed v1.1.1
  }
}
```

This means `require("stoatcore")` inside `base.ts` via `createRequire` loads the local fixed copy — same bundling strategy as Node/Bun. Auto-installed packages use `deno add npm:<pkg>`, which Deno writes back into `deno.json` imports.

**Writing Deno controllers:**

Deno controllers are identical to Bun TS controllers — same `module.exports` syntax, same request/callback shape. The `createRequire` bridge handles CJS controller loading transparently.

---

## Project Structure

```
project-root/
├── base.js / base.ts         # Application entry point
├── runStoatConfig.js         # Config loader & bootstrap
├── CLI/                      # Stoat CLI (bundled with package)
│   ├── bin/stoat.js          # CLI entry point
│   ├── commands/
│   │   ├── init.js           # stoat init
│   │   └── generate.js       # stoat generate
│   └── lib/
│       ├── prompt.js         # readline wrapper
│       ├── templates.js      # file content generators
│       └── scaffold.js       # fs utilities
├── StoatCore/                # Fixed stoatcore v1.1.1 (local source)
│   ├── core.js
│   ├── Helpers/
│   ├── Net/
│   └── System/
├── bin/
│   └── .config               # JSON configuration file
├── System/                   # Framework system layer
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
│       └── <endpoint>.js / <endpoint>.ts
├── Models/                   # Database layer
│   ├── index.js              # DB bootstrap & schema loader
│   ├── Schemas/              # JSON schema definitions
│   └── Engines/
│       ├── MongoDB/mongoose.js
│       ├── MySQL/mysql.js
│       ├── MariaDB/mysql.js
│       ├── PostgresSQL/postgres.js
│       └── QuestDB/questdb.js
├── Helpers/                  # User-defined helpers (.js or .ts)
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
├── Uploads/                  # File upload directory
├── globals.d.ts              # TypeScript globals (TS projects only)
└── tsconfig.json             # TypeScript config (TS projects only)
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

1. Loads `stoatcore` (from `StoatCore/` via `file:` dependency) — bootstraps the global `_s` object.
2. Sets `_s.misc.rootPath` to the project root.
3. Calls `init()` which:
   - Parses `bin/.config` via `runStoatConfig.js`.
   - Iterates over `configData.net` to resolve which protocols are active.
   - Initialises all database connections listed under `_s.dbConfig`.
   - Calls `runConnection()` which starts the HTTP/HTTPS/WS servers.

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

For **Bun TypeScript** projects, the entry file is `base.ts`. The structure is identical but with TypeScript annotations. `require()` works natively in Bun `.ts` files — no import rewriting needed.

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
- Controller files can be `.js` or `.ts` — the route scanner detects both.
- Use `stoat g c <name>` to scaffold a new controller with all four methods pre-wired.

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

Engine files are always `.js`. For TypeScript projects running on Bun, `Models/index.js` loads them as `.js` directly — no transpilation or `.ts` engine variants are needed.

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

### ClickHouse

**File:** [Models/Engines/ClickHouse/clickhouse.js](Models/Engines/ClickHouse/clickhouse.js)
**Package:** `@clickhouse/client`

Column-oriented OLAP database optimised for analytical queries on large datasets. Schema sync runs on startup — tables are created and columns added automatically.

**Schema file format** (`Models/Schemas/events.json`):

```json
[
    {
        "name":    "events",
        "engine":  "MergeTree()",
        "orderBy": "timestamp",
        "columns": [
            { "name": "timestamp", "type": "DateTime" },
            { "name": "user_id",   "type": "UInt64"   },
            { "name": "action",    "type": "String"   }
        ]
    }
]
```

**`bin/.config` entry:**
```json
{
    "engine": "ClickHouse", "package": "@clickhouse/client", "file": "events.json",
    "url": "localhost", "port": 8123, "user": "default", "password": "",
    "name": "default", "ref": "Analytics", "schema": "events"
}
```

**Usage in a controller:**
```js
const db = new _s.db.Analytics();

// SQL query — returns array of row objects
const rows = await db.run("SELECT count() FROM events WHERE action = 'click'");

// Insert rows
await db.insert("events", [
    { timestamp: new Date(), user_id: 1, action: "click" }
]);

// Raw client access for advanced operations
const client = db.client;
```

**Startup behaviour:**
- Creates tables that don't exist (`CREATE TABLE IF NOT EXISTS … ENGINE = MergeTree()`)
- Adds columns that appear in schema but are missing from the live table
- Does not drop or rename columns automatically (safe for production)

---

### CouchDB

**File:** [Models/Engines/CouchDB/nano.js](Models/Engines/CouchDB/nano.js)
**Package:** `nano`

Document-oriented database. Each schema entry maps to one CouchDB database. Mango indexes declared in the schema are created/verified on startup.

**Schema file format** (`Models/Schemas/users.json`):

```json
[
    {
        "name": "users",
        "indexes": [
            { "name": "email-index", "fields": ["email"] }
        ]
    }
]
```

**`bin/.config` entry:**
```json
{
    "engine": "CouchDB", "package": "nano", "file": "users.json",
    "url": "localhost", "port": 5984, "user": "admin", "password": "",
    "name": "mydb", "ref": "Users", "schema": "users"
}
```

**Usage in a controller:**
```js
const db    = new _s.db.Users();
const couch = db.connection;   // nano database handle

// CRUD
const doc     = await couch.get("doc-id");
const created = await couch.insert({ name: "Ada", email: "ada@example.com" });
await couch.destroy(doc._id, doc._rev);

// Mango find (shorthand via db.find / db.run)
const found = await db.find({ email: "ada@example.com" });
// or with options:
const found = await db.find({ type: "user" }, { limit: 10, skip: 0 });

// Direct nano server access for database management
const server = db.server;
```

---

### Redis

**File:** [Models/Engines/Redis/redis.js](Models/Engines/Redis/redis.js)
**Package:** `redis`

In-memory key-value store for caching, sessions, pub/sub, and queues. All keys are automatically prefixed with `keyPrefix` from the schema to avoid collisions when multiple apps share an instance.

**Schema file format** (`Models/Schemas/cache.json`):

```json
[
    {
        "name":       "cache",
        "keyPrefix":  "app:",
        "defaultTTL": 3600
    }
]
```

**`bin/.config` entry:**
```json
{
    "engine": "Redis", "package": "redis", "file": "cache.json",
    "url": "localhost", "port": 6379, "user": "", "password": "",
    "name": "0", "ref": "Cache", "schema": "cache"
}
```

`name` is the Redis database index (default `0`).

**Usage in a controller:**
```js
const cache = new _s.db.Cache();

// Set with default TTL (3600 s from schema)
await cache.set("user:1", { name: "Ada", role: "admin" });

// Set with custom TTL (seconds)
await cache.set("session:abc", { userId: 1 }, 900);

// Get — returns parsed JSON or null
const user = await cache.get("user:1");

// Delete
await cache.del("user:1");

// Check existence
const exists = await cache.has("user:1");   // true | false

// Reset TTL without changing value
await cache.expire("session:abc", 1800);

// Raw Redis command (RESP protocol)
await cache.run("LPUSH", "queue", "job-1");
const len = await cache.run("LLEN", "queue");
```

---

## Helpers

Helper modules live in the `Helpers/` folder. At startup `runStoatConfig.js` scans this directory and merges every exported function into the corresponding `_s.helpers.<HelperName>` namespace. User-defined helpers placed in this folder are discovered automatically.

Helper files can be `.js` or `.ts`. The loader checks `.js` first, then falls back to `.ts` — no configuration needed to use TypeScript helpers on Bun.

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

**File:** [StoatCore/Helpers/Database.js](StoatCore/Helpers/Database.js)

Namespace: `_s.helpers.Database`

Sanitization utilities for every supported database engine. Always sanitize user-supplied input before building queries.

| Method | Engines | Description |
|---|---|---|
| `sanitizeMongoData(data)` | MongoDB | Strips `$`-prefixed operator keys recursively — prevents NoSQL injection |
| `sanitizeSQLData(data)` | MySQL · MariaDB · PostgreSQL · ClickHouse | Escapes SQL special characters (`'`, `"`, `\`, `%`, control chars) |
| `sanitizeCouchData(data)` | CouchDB | Strips `_`-prefixed CouchDB internal keys and `$`-prefixed Mango operators |
| `sanitizeClickHouseData(data)` | ClickHouse | SQL escaping + strips backticks and format braces `{}` used in ClickHouse parameterised query strings |
| `sanitizeRedisKey(key)` | Redis | Allows only `[a-zA-Z0-9:._\-/@]` — blocks `\r\n` which break RESP framing |
| `sanitizeRedisValue(value)` | Redis | Ensures values can be safely serialized; objects are JSON-stringified |

```js
// MongoDB
const safe = _s.helpers.Database.sanitizeMongoData(req.body);

// SQL
const name = _s.helpers.Database.sanitizeSQLData(req.body.name);

// CouchDB
const doc = _s.helpers.Database.sanitizeCouchData(req.body);

// ClickHouse
const val = _s.helpers.Database.sanitizeClickHouseData(req.body.action);

// Redis
const key = _s.helpers.Database.sanitizeRedisKey(`user:${req.body.id}`);
const val = _s.helpers.Database.sanitizeRedisValue(req.body);
```

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
| `installPackage(moduleName, type)`| Runs the correct install command for the active runtime (see table below) |

Runtime is detected once at module load — no configuration required.

| Runtime | Install command |
|---|---|
| Deno | `deno add npm:<pkg>` |
| Bun | `bun add <pkg>` |
| Node (prod dep) | `npm install <pkg> --save` |
| Node (dev dep, `type === 1`) | `npm install <pkg> --save-dev` |

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
| `_s.helpers.Database`        | Object     | DB sanitization helpers — Mongo, SQL, CouchDB, ClickHouse, Redis |
| `_s.net`                     | Object     | Outbound HTTP/HTTPS client — `get`, `post`, `put`, `patch`, `delete`, `option`, `head` |
| `_s.__system.mimeTypes`      | Array      | Loaded MIME type definitions                     |
| `_s.__system.allowedOrigins` | Array      | Cached entries from `OtherFiles/allowedUrls.txt` |
| `_s.__system.notFoundPage`   | String     | Resolved absolute path to 404 page (cached)      |
| `_s.__system.routes`         | Object     | Pre-built controller map `"{version}/{name}"` → module |
| `_s.__system.wsServer`       | Object     | Active `WebSocket.Server` instance (set when WS is enabled) |
| `global.__stoatData`         | Object     | App-type metadata (`appType: "js"` or `"ts"`)   |
| `global.log`                 | Function   | Alias for `console.log`                          |

---

## Stoatcore: Source & Fixes

`stoatcore` is loaded from a local copy at `StoatCore/` (nested in the repo). All known bugs (SC-1 through SC-8) have been fixed directly at source.

### Bundling strategy

Every project scaffolded by `stoat init` receives a copy of `StoatCore/` and references it via a `file:` dependency:

```json
"dependencies": {
  "stoatcore": "file:./StoatCore"
}
```

This ensures `require("stoatcore")` always resolves to the fixed v1.1.1, not the npm-published v1.0.0 which has the bugs below.

**When the fixes are published to npm**, migrating any project is a one-line change:

```json
"stoatcore": "^1.1.1"
```

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

### `_s.net` streaming responses (SC-F3)

Pass `stream: true` to any `_s.net` method to receive the raw `IncomingMessage` instead of buffering the full response. This avoids OOM on large or chunked responses.

```js
// Pipe a large file download directly into an HTTP response
const res = await _s.net.get({ url: "https://example.com/large-file.zip", stream: true });
// res.stream  — raw Node.js IncomingMessage
// res.statusCode, res.headers — available immediately
res.stream.pipe(response);   // pipe into Stoat's outbound response

// Or consume manually
res.stream.on("data",  (chunk) => { /* ... */ });
res.stream.on("end",   ()      => { /* ... */ });
res.stream.on("error", (err)   => { /* ... */ });
```

> The caller owns the stream — always consume or destroy it to avoid memory leaks.

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
