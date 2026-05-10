/**
 * templates.js
 * Returns generated file content strings for each runtime / language variant.
 * Every export is a function that takes an options object and returns a string.
 */

// ─── Entry points ────────────────────────────────────────────────────────────

function baseJs(opts) {
    const { name = "my-stoat-app" } = opts;
    return `// ${name} — Stoat entry point (Node / Bun JS)
require("stoatcore");

global.log = console.log;

const path = require("path");

if (typeof __stoatData === "undefined") {
    global.__stoatData = {};
    __stoatData.appType = "js";
}

_s.misc.rootPath   = path.join(__dirname);
_s.misc.rootParent = _s.misc.rootPath;

init();

async function init() {
    const configFile = require("./runStoatConfig");
    const configData = await configFile.runConfig();

    var httpConfig  = {},
        httpsConfig = {},
        wsConfig    = {},
        wssConfig   = {};

    configData.net.forEach(function (item) {
        for (var key in item) {
            if      (key === "http")  httpConfig  = item;
            else if (key === "https") httpsConfig = item;
            else if (key === "ws")    wsConfig    = item;
            else if (key === "wss")   wssConfig   = item;
        }
    });

    if (httpConfig.http === true || httpsConfig.https === true) {
        try {
            if (_s.dbConfig.length > 0) {
                _s.dbConfig.forEach(function (database) {
                    if (database.engine !== "" && database.package !== "") {
                        try {
                            require(_s.misc.rootPath + "/" + _s.paths.model)([ database ]);
                        } catch (error) {
                            log("DB init error:", error.message);
                        }
                    }
                });
            }

            runConnection();

            function runConnection() {
                var httpServer  = null;
                var httpsServer = null;

                configData.net.forEach(function (net) {
                    for (var key in net) {
                        if (key === "http" && net[key] === true) {
                            var m = require("./" + _s.paths.config + "/Core/http.js");
                            httpServer = m.run(net);
                        } else if (key === "https" && net[key] === true) {
                            var m = require("./" + _s.paths.config + "/Core/https.js");
                            httpsServer = m.run(net);
                        }
                    }
                });

                configData.net.forEach(function (net) {
                    for (var key in net) {
                        if (key === "ws" && net[key] === true) {
                            var m = require("./" + _s.paths.config + "/Core/ws.js");
                            m.run(net, httpServer);
                        } else if (key === "wss" && net[key] === true) {
                            var m = require("./" + _s.paths.config + "/Core/ws.js");
                            m.run(net, httpsServer);
                        }
                    }
                });
            }
        } catch (error) {
            log(error);
            log("Error: Application cannot start — check your config file.");
        }
    }
}
`;
}

function baseTs(opts) {
    const { name = "my-stoat-app" } = opts;
    return `// ${name} — Stoat entry point (Bun TS)
require("stoatcore");

global.log = console.log;

const path = require("path");

if (typeof __stoatData === "undefined") {
    (global as any).__stoatData = {};
    (global as any).__stoatData.appType = "ts";
}

(_s as any).misc.rootPath   = path.join(__dirname);
(_s as any).misc.rootParent = (_s as any).misc.rootPath;

init();

async function init(): Promise<void> {
    const configFile = require("./runStoatConfig");
    const configData = await configFile.runConfig();

    let httpConfig:  Record<string, any> = {};
    let httpsConfig: Record<string, any> = {};
    let wsConfig:    Record<string, any> = {};
    let wssConfig:   Record<string, any> = {};

    configData.net.forEach((item: Record<string, any>) => {
        for (const key in item) {
            if      (key === "http")  httpConfig  = item;
            else if (key === "https") httpsConfig = item;
            else if (key === "ws")    wsConfig    = item;
            else if (key === "wss")   wssConfig   = item;
        }
    });

    if (httpConfig.http === true || httpsConfig.https === true) {
        try {
            if ((_s as any).dbConfig.length > 0) {
                (_s as any).dbConfig.forEach((database: Record<string, any>) => {
                    if (database.engine !== "" && database.package !== "") {
                        try {
                            require((_s as any).misc.rootPath + "/" + (_s as any).paths.model)([ database ]);
                        } catch (error: any) {
                            log("DB init error:", error.message);
                        }
                    }
                });
            }

            runConnection();

            function runConnection(): void {
                let httpServer:  any = null;
                let httpsServer: any = null;

                configData.net.forEach((net: Record<string, any>) => {
                    for (const key in net) {
                        if (key === "http" && net[key] === true) {
                            const m = require("./" + (_s as any).paths.config + "/Core/http.js");
                            httpServer = m.run(net);
                        } else if (key === "https" && net[key] === true) {
                            const m = require("./" + (_s as any).paths.config + "/Core/https.js");
                            httpsServer = m.run(net);
                        }
                    }
                });

                configData.net.forEach((net: Record<string, any>) => {
                    for (const key in net) {
                        if (key === "ws" && net[key] === true) {
                            const m = require("./" + (_s as any).paths.config + "/Core/ws.js");
                            m.run(net, httpServer);
                        } else if (key === "wss" && net[key] === true) {
                            const m = require("./" + (_s as any).paths.config + "/Core/ws.js");
                            m.run(net, httpsServer);
                        }
                    }
                });
            }
        } catch (error) {
            log(error);
            log("Error: Application cannot start — check your config file.");
        }
    }
}
`;
}

function baseDeno(opts) {
    const { name = "my-stoat-app" } = opts;
    return `// ${name} — Stoat entry point (Deno TS)
//
// Deno strategy: createRequire bridges the CJS framework files into the ESM entry point.
// stoatcore is mapped to ./StoatCore/core.js via the "imports" field in deno.json.
// Run: deno run --allow-all base.ts

import { createRequire }  from "node:module";
import { dirname }        from "node:path";
import { fileURLToPath }  from "node:url";

const require   = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));

// Bootstrap stoatcore — sets up globalThis._s / globalThis.stoat
require("stoatcore");

(globalThis as any).log = console.log;

if (typeof (globalThis as any).__stoatData === "undefined") {
    (globalThis as any).__stoatData = { appType: "ts" };
}

const _s: any = (globalThis as any)._s;
_s.misc.rootPath   = __dirname;
_s.misc.rootParent = __dirname;

init();

async function init(): Promise<void> {
    const configFile = require("./runStoatConfig.js");
    const configData = await configFile.runConfig();

    let httpConfig:  any = {};
    let httpsConfig: any = {};
    let wsConfig:    any = {};
    let wssConfig:   any = {};

    configData.net.forEach((item: any) => {
        for (const key in item) {
            if      (key === "http")  httpConfig  = item;
            else if (key === "https") httpsConfig = item;
            else if (key === "ws")    wsConfig    = item;
            else if (key === "wss")   wssConfig   = item;
        }
    });

    if (httpConfig.http === true || httpsConfig.https === true) {
        try {
            if (_s.dbConfig.length > 0) {
                _s.dbConfig.forEach((database: any) => {
                    if (database.engine !== "" && database.package !== "") {
                        try {
                            require(_s.misc.rootPath + "/" + _s.paths.model)([database]);
                        } catch (e: any) {
                            log("DB init error:", e.message);
                        }
                    }
                });
            }

            runConnection();

            function runConnection(): void {
                let httpServer:  any = null;
                let httpsServer: any = null;

                configData.net.forEach((net: any) => {
                    for (const key in net) {
                        if (key === "http" && net[key] === true) {
                            const m = require("./" + _s.paths.config + "/Core/http.js");
                            httpServer = m.run(net);
                        } else if (key === "https" && net[key] === true) {
                            const m = require("./" + _s.paths.config + "/Core/https.js");
                            httpsServer = m.run(net);
                        }
                    }
                });

                configData.net.forEach((net: any) => {
                    for (const key in net) {
                        if (key === "ws" && net[key] === true) {
                            const m = require("./" + _s.paths.config + "/Core/ws.js");
                            m.run(net, httpServer);
                        } else if (key === "wss" && net[key] === true) {
                            const m = require("./" + _s.paths.config + "/Core/ws.js");
                            m.run(net, httpsServer);
                        }
                    }
                });
            }
        } catch (error) {
            log(error);
            log("Error: Application cannot start — check your config file.");
        }
    }
}
`;
}

function denoJson(opts) {
    const { name = "my-stoat-app", port = 5000 } = opts;
    return JSON.stringify({
        name,
        version: "1.0.0",
        nodeModulesDir: "auto",
        imports: {
            stoatcore: "./StoatCore/core.js",
        },
        tasks: {
            start: "deno run --allow-all base.ts",
            dev:   "deno run --allow-all --watch base.ts",
        },
        compilerOptions: {
            strict: false,
        },
    }, null, 4);
}

// ─── runStoatConfig ───────────────────────────────────────────────────────────

function runStoatConfig() {
    return `const log = require("console").log;
const { readFileSync, readdirSync, existsSync, writeFileSync } = require("fs");

function runConfig() {
    let configData    = {};
    let configRawData = readFileSync(\`\${_s.misc.rootParent}/bin/.config\`, "utf-8");

    if (typeof configRawData === "string") {
        configData = JSON.parse(configRawData);
        configData = new Object(configData);
    }

    let neededConfigs = [
        "environment", "environmentVariables", "baseUrl",
        "app", "packages", "definitions", "appType",
    ];

    let returnConfig = { net: configData.net };

    neededConfigs.forEach((key) => { _s.config[key] = configData[key]; });

    if (!_s.config.environment) _s.config.environment = "staging";
    if ("folders"  in configData) _s.paths    = configData.folders;
    if ("db"       in configData) _s.dbConfig = configData.db;
    if ("request"  in configData) _s.config.requestConf  = configData.request;
    if ("response" in configData) _s.config.responseConf = configData.response;

    // Helpers — check .js first, then .ts (Bun TS support)
    for (let key in _s.helpers) {
        let helperFile = \`\${_s.misc.rootPath}/\${_s.paths.helpers}/\${key}.js\`;
        if (!existsSync(helperFile)) {
            helperFile = \`\${_s.misc.rootPath}/\${_s.paths.helpers}/\${key}.ts\`;
        }
        if (existsSync(helperFile)) {
            try {
                const mod = require(helperFile);
                for (let fn in mod) _s.helpers[key][fn] = mod[fn];
            } catch (error) {
                log(\`HelperError: Failed to load \${key}:\`, error.message);
            }
        }
    }

    // Discover extra helper files not in the core set
    const helperDir        = readdirSync(\`\${_s.misc.rootPath}/\${_s.paths.helpers}\`);
    const availableHelpers = Object.keys(_s.helpers);

    helperDir.forEach((fileName) => {
        if (!/\\.(js|ts)$/.test(fileName)) return;
        const mod = fileName.replace(/\\.(js|ts)$/, "");
        if (!availableHelpers.includes(mod) && mod !== "MimeTypes") {
            _s.helpers[mod] = {};
            try {
                const m = require(\`\${_s.misc.rootPath}/\${_s.paths.helpers}/\${mod}\`);
                for (let fn in m) _s.helpers[mod][fn] = m[fn];
            } catch (error) {
                log(\`HelperError: Failed to load custom helper \${mod}:\`, error.message);
            }
        }
    });

    try {
        const userMimes = require(\`\${_s.misc.rootPath}/\${_s.paths.helpers}/MimeTypes\`);
        userMimes.forEach((mime) => _s.__system.mimeTypes.push(mime));
    } catch (_) {}

    function loadAllowedOrigins() {
        const filePath = \`\${_s.misc.rootPath}/\${_s.paths.others}/allowedUrls.txt\`;
        if (!existsSync(filePath)) writeFileSync(filePath, "http://localhost");
        _s.__system.allowedOrigins = readFileSync(filePath, "utf-8").split(/\\r?\\n/).filter(Boolean);
    }

    loadAllowedOrigins();
    process.on("SIGHUP", loadAllowedOrigins);

    const publicPath  = \`\${_s.misc.rootPath}/\${_s.paths.view}\`;
    const customErr   = \`\${publicPath}/\${_s.config.responseConf?.notFoundPage || "index.html"}\`;
    const fallbackErr = \`\${_s.misc.rootPath}/\${_s.paths.config}/Public/404.html\`;
    _s.__system.notFoundPage = existsSync(customErr) ? customErr : fallbackErr;

    _s.__system.routes = {};
    const engineRoot   = \`\${_s.misc.rootPath}/\${_s.paths.controller}\`;
    const versions     = _s.config.app?.api?.versionPrefix || [];

    versions.forEach((version) => {
        const versionDir = \`\${engineRoot}/\${version}\`;
        if (!existsSync(versionDir)) return;
        try {
            readdirSync(versionDir).forEach((file) => {
                if (!/\\.(js|ts)$/.test(file)) return;
                const name     = file.replace(/\\.(js|ts)$/, "");
                const routeKey = \`\${version}/\${name}\`;
                try {
                    _s.__system.routes[routeKey] = require(\`\${versionDir}/\${file}\`);
                } catch (err) {
                    log(\`RouteError: Failed to load controller \${routeKey}:\`, err.message);
                }
            });
        } catch (err) {
            log(\`RouteError: Cannot read controller directory \${versionDir}:\`, err.message);
        }
    });

    const systemPath = \`\${_s.misc.rootPath}/\${_s.paths.config}\`;
    const { checkPackage, installPackage } = require(\`\${systemPath}/App/installer\`);

    configData.packages.forEach(async (p) => {
        const found = await checkPackage(p);
        if (!found) installPackage(p);
    });

    return returnConfig;
}

module.exports = { runConfig };
`;
}

// ─── bin/.config ─────────────────────────────────────────────────────────────

const DB_TEMPLATES = {
    none: [],
    MongoDB: [{
        engine: "MongoDB", package: "mongoose", file: "users.json",
        url: "localhost", port: 27017, user: "", password: "",
        name: "mydb", ref: "Users", schema: "users",
    }],
    MySQL: [{
        engine: "MySQL", package: "mysql", file: "users.json",
        url: "localhost", port: 3306, user: "root", password: "",
        name: "mydb", ref: "MainDB", schema: "users",
    }],
    MariaDB: [{
        engine: "MariaDB", package: "mysql", file: "users.json",
        url: "localhost", port: 3306, user: "root", password: "",
        name: "mydb", ref: "MainDB", schema: "users",
    }],
    PostgreSQL: [{
        engine: "PostgresSQL", package: "pg", file: "users.json",
        url: "localhost", port: 5432, user: "postgres", password: "",
        name: "mydb", ref: "MainDB", schema: "users",
    }],
    QuestDB: [{
        engine: "QuestDB", package: "@questdb/nodejs-client", file: "metrics.json",
        url: "localhost", port: 9000, user: "", password: "",
        name: "", ref: "Metrics", schema: "metrics",
    }],
    ClickHouse: [{
        engine: "ClickHouse", package: "@clickhouse/client", file: "events.json",
        url: "localhost", port: 8123, user: "default", password: "",
        name: "default", ref: "Analytics", schema: "events",
    }],
    CouchDB: [{
        engine: "CouchDB", package: "nano", file: "users.json",
        url: "localhost", port: 5984, user: "admin", password: "",
        name: "mydb", ref: "Users", schema: "users",
    }],
    Redis: [{
        engine: "Redis", package: "redis", file: "cache.json",
        url: "localhost", port: 6379, user: "", password: "",
        name: "0", ref: "Cache", schema: "cache",
    }],
};

function dotConfig(opts) {
    const { port = 5000, db = "none" } = opts;
    const dbConfig = DB_TEMPLATES[db] || [];
    return JSON.stringify({
        environment: "development",
        environmentVariables: {},
        baseUrl: "http://localhost",
        net: [
            { http: true,  data: { port } },
            { https: false, data: { port: 443, ssl: { cert: "cert.pem", key: "key.pem" } } },
            { ws:    false, data: { port: 0 } },
            { wss:   false, data: { port: 0 } },
        ],
        folders: {
            config:          "System",
            helpers:         "Helpers",
            model:           "Models",
            view:            "Public",
            controller:      "Engine",
            uploadDirectory: "Uploads",
            flatStorage:     "FlatFiles",
            others:          "OtherFiles",
        },
        app: { api: { allow: true, versionPrefix: ["v1"] } },
        request: {
            cors:            false,
            checkOrigin:     false,
            maxBodyBytes:    1048576,
            allowedMethods:  ["GET", "POST", "OPTIONS", "PATCH", "DELETE"],
            allowedHeaders:  ["Content-Type", "Authorization", "Accept"],
        },
        response: { indexPage: "index.html", notFoundPage: "index.html" },
        db:       dbConfig,
        packages: [],
        definitions: {},
    }, null, 4);
}

// ─── Controllers ─────────────────────────────────────────────────────────────

function controllerJs(name) {
    const cls = name.charAt(0).toLowerCase() + name.slice(1);
    return `class ${cls} {
    get methods() {
        return [
            { name: "index",  method: "get"    },
            { name: "create", method: "post"   },
            { name: "update", method: "patch"  },
            { name: "remove", method: "delete" },
        ];
    }

    index(request, callback) {
        callback({ headCode: 200, status: 1, message: "OK", data: {} });
    }

    async create(request, callback) {
        const { body } = request;
        return { headCode: 201, status: 1, message: "Created", data: body };
    }

    async update(request, callback) {
        const { body } = request;
        return { headCode: 200, status: 1, message: "Updated", data: body };
    }

    async remove(request, callback) {
        return { headCode: 200, status: 1, message: "Deleted", data: {} };
    }
}

module.exports = { ${cls} };
`;
}

function controllerTs(name) {
    const cls = name.charAt(0).toLowerCase() + name.slice(1);
    return `interface StoatRequest {
    body:   Record<string, any>;
    header: Record<string, any>;
    query:  Record<string, any>;
}

type StoatCallback = (response: Record<string, any>) => void;

class ${cls} {
    get methods() {
        return [
            { name: "index",  method: "get"    },
            { name: "create", method: "post"   },
            { name: "update", method: "patch"  },
            { name: "remove", method: "delete" },
        ];
    }

    index(request: StoatRequest, callback: StoatCallback): void {
        callback({ headCode: 200, status: 1, message: "OK", data: {} });
    }

    async create(request: StoatRequest, _callback: StoatCallback) {
        const { body } = request;
        return { headCode: 201, status: 1, message: "Created", data: body };
    }

    async update(request: StoatRequest, _callback: StoatCallback) {
        const { body } = request;
        return { headCode: 200, status: 1, message: "Updated", data: body };
    }

    async remove(_request: StoatRequest, _callback: StoatCallback) {
        return { headCode: 200, status: 1, message: "Deleted", data: {} };
    }
}

module.exports = { ${cls} };
`;
}

// ─── TypeScript support files ─────────────────────────────────────────────────

function globalsTs() {
    return `// Stoat global type definitions
// Add this file to your tsconfig.json include array

interface StoatConfig {
    environment:         string;
    environmentVariables: Record<string, string>;
    requestConf:         Record<string, any>;
    responseConf:        Record<string, any>;
    app:                 Record<string, any>;
    definitions:         Record<string, any>;
    [key: string]:       any;
}

interface StoatSystem {
    mimeTypes:      Array<{ file: string[]; content: string }>;
    allowedOrigins: string[];
    notFoundPage:   string;
    routes:         Record<string, any>;
    wsServer?:      any;
}

interface StoatGlobal {
    config:    StoatConfig;
    paths:     Record<string, string>;
    misc:      { rootPath: string; rootParent: string };
    dbConfig:  any[];
    db:        Record<string, any>;
    helpers:   Record<string, Record<string, Function>>;
    net:       Record<string, Function>;
    __system:  StoatSystem;
}

declare const _s: StoatGlobal;
declare const stoat: StoatGlobal;
declare const log: typeof console.log;
declare var __stoatData: { appType: "js" | "ts" };
`;
}

function tsConfig() {
    return JSON.stringify({
        compilerOptions: {
            target:              "ES2020",
            module:              "CommonJS",
            moduleResolution:    "node",
            strict:              false,
            esModuleInterop:     true,
            skipLibCheck:        true,
            outDir:              "./dist",
            rootDir:             "./",
            typeRoots:           ["./node_modules/@types"],
        },
        include: ["./**/*.ts"],
        exclude: ["node_modules", "dist"],
    }, null, 4);
}

// ─── package.json for new project ────────────────────────────────────────────

function packageJson(opts) {
    const { name, runtime, lang } = opts;
    const isTs  = lang === "ts";
    const isBun = runtime === "bun";

    const scripts = isBun
        ? {
            start: `bun run base.${isTs ? "ts" : "js"}`,
            dev:   `bun --watch base.${isTs ? "ts" : "js"}`,
          }
        : {
            start: "node base.js",
            dev:   "node --watch base.js",
          };

    const obj = {
        name,
        version:     "1.0.0",
        description: "",
        main:        `base.${isTs ? "ts" : "js"}`,
        scripts,
        dependencies: { stoatcore: "file:./StoatCore" },
    };

    if (isTs && !isBun) {
        obj.devDependencies = { "@types/node": "^20.0.0" };
    }

    return JSON.stringify(obj, null, 4);
}

// ─── Static files ─────────────────────────────────────────────────────────────

function indexHtml(name) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name}</title>
    <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center;
               justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .card { text-align: center; padding: 2rem; background: #fff;
                border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,.1); }
        h1 { margin: 0 0 .5rem; font-size: 1.8rem; }
        p  { margin: 0; color: #666; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${name}</h1>
        <p>Powered by Stoat Framework</p>
    </div>
</body>
</html>
`;
}

function notFoundHtml() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>404 — Not Found</title>
    <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center;
               justify-content: center; height: 100vh; margin: 0; background: #f5f5f5; }
        .card { text-align: center; padding: 2rem; }
        h1 { font-size: 5rem; margin: 0; color: #ccc; }
        p  { color: #666; }
    </style>
</head>
<body>
    <div class="card">
        <h1>404</h1>
        <p>Page not found</p>
    </div>
</body>
</html>
`;
}

module.exports = {
    baseJs,
    baseTs,
    baseDeno,
    runStoatConfig,
    dotConfig,
    denoJson,
    controllerJs,
    controllerTs,
    globalsTs,
    tsConfig,
    packageJson,
    indexHtml,
    notFoundHtml,
};
