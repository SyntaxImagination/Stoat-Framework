/**
 * Module  : Middleware
 * Updated : 2026
 * Desc    : Single request handler — CORS, auth, routing, security hardening.
 *
 * Security fixes applied:
 *  SEC-1  Path traversal guard on URL segments before controller lookup
 *  SEC-2  Static file path confined to Public/ via path.resolve()
 *  SEC-3  Request body size limit (configurable via bin/.config request.maxBodyBytes)
 *  SEC-4  Security response headers on every response
 *
 * Performance improvements applied:
 *  PERF-1 allowedOrigins read from _s.__system cache (loaded once at startup)
 *  PERF-2 notFoundPage resolved from _s.__system cache (no existsSync per request)
 *  PERF-3 Controller looked up from _s.__system.routes map (O(1), no require() per request)
 *  PERF-4 Per-request state in local __Stoat — replaces global.__Stoat mutation
 */

"use strict";

const fs      = require("fs");
const path    = require("path");
const url     = require("url");
const console = require("console");
const Payload = require("../Helpers/Payload");

module.exports = async (request, response) => {

    const paths    = _s.paths;
    const config   = _s.config;
    const security = _s.helpers.Security;

    // PERF-4: request-scoped state — replaces global.__Stoat mutation
    const __Stoat = { Query: null, hasQuery: 0, requestEndPoint: null };

    const PayloadHelper = new Payload();

    const urlString = request.url;
    const passedUrl = url.parse(urlString, true);
    const urlPath   = passedUrl.pathname;

    const segmentedPath = urlPath.split("/");
    const method        = request.method.toLowerCase();
    const headers       = request.headers;

    headers.urlPath = urlPath;

    // SEC-4: Security hardening headers — written before any other response output
    response.setHeader("X-Content-Type-Options",  "nosniff");
    response.setHeader("X-Frame-Options",          "DENY");
    response.setHeader("X-XSS-Protection",         "1; mode=block");
    response.setHeader("Referrer-Policy",           "strict-origin-when-cross-origin");
    response.setHeader("Permissions-Policy",        "geolocation=(), microphone=(), camera=()");
    if (config.environment === "production") {
        response.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }

    // ── Origin check ─────────────────────────────────────────────────────────

    let targetOrigin = [];

    if (config.requestConf.checkOrigin === true) {
        // PERF-1: use startup-cached list — no disk I/O per request
        const allowedUrls = _s.__system.allowedOrigins || [];
        targetOrigin = allowedUrls.filter((origin) => origin === headers.origin);

        if (targetOrigin.length > 0) {
            headers.source = targetOrigin[0];
        }
    } else {
        response.setHeader("Access-Control-Allow-Origin", "*");
        if (!("origin" in headers)) {
            headers.origin = headers.host;
        }
    }

    // ── Auth ──────────────────────────────────────────────────────────────────

    if ("authorization" in headers) {
        const check = await security.domainSecurity(request);

        if (check.status !== 1) {
            PayloadHelper.renderObject(
                { headCode: 406, message: check.message, status: 2, code: "C000-406" },
                response
            );
            return;
        }

        request.headers.source = check.data.source;

    } else {
        if (method !== "get" && method !== "head") {
            if (!headers.hasOwnProperty("origin") || headers.origin === "") {
                PayloadHelper.renderObject(
                    { headCode: 406, message: "Unknown Origin", status: 2, code: "C001-406" },
                    response
                );
                return;
            }

            if (config.environment !== "production") {
                response.setHeader("Access-Control-Allow-Origin", "*");
                response.setHeader("Application-Environment", config.environment);
            } else {
                if (targetOrigin.length === 0) {
                    PayloadHelper.renderObject(
                        { headCode: 406, message: "Origin not Allowed", status: 2, code: "C002-406" },
                        response
                    );
                    return;
                }
                response.setHeader("Access-Control-Allow-Origin", String(headers.origin));
            }
        } else {
            response.setHeader("Access-Control-Allow-Origin", "*");
        }
    }

    // ── CORS headers ──────────────────────────────────────────────────────────

    let allowedMethods = "";
    config.requestConf.allowedMethods.forEach((m) => {
        allowedMethods = `${allowedMethods}, ${m.toUpperCase()}`;
    });
    response.setHeader("Access-Control-Allow-Method", allowedMethods);

    let allowedHeaders;
    if (Array.isArray(config.requestConf.allowedHeaders)) {
        allowedHeaders = config.requestConf.allowedHeaders.join(", ");
    } else if (typeof config.requestConf.allowedHeaders === "string") {
        allowedHeaders = config.requestConf.allowedHeaders;
    } else {
        allowedHeaders = "Content-Type";
    }
    response.setHeader("Access-Control-Allow-Headers", allowedHeaders);
    response.setHeader("Access-Control-Allow-Credential", String(true));

    // ── Query string capture ──────────────────────────────────────────────────

    if (method === "get" || method === "head") {
        const rawUrl  = String(request.url);
        const qsIndex = rawUrl.indexOf("?");
        if (qsIndex !== -1) {
            __Stoat.Query    = rawUrl.slice(qsIndex + 1);
            __Stoat.hasQuery = 1;
        }
    }

    // ── Routing ───────────────────────────────────────────────────────────────

    if (config.app.api.allow === true) {

        // OPTIONS preflight
        if (config.requestConf.cors === true && method === "options") {
            response.writeHead(204, headers);
            response.end();
            return;
        }

        // PERF-2: use pre-resolved notFoundPage — no existsSync per request
        const publicPath  = `${_s.misc.rootPath}/${paths.view}`;
        const notFoundPage = _s.__system.notFoundPage ||
            `${publicPath}/${config.responseConf.notFoundPage}`;

        // SEC-1: validate URL segments — only allow alphanumeric, hyphen, underscore
        function isSafeSegment(seg) {
            return typeof seg === "string" && /^[a-zA-Z0-9_-]+$/.test(seg);
        }

        // PERF-3: O(1) route map lookup — no path construction + require() per request
        const routeKey  = `${segmentedPath[1]}/${segmentedPath[2]}`;
        const isApiRoute = (
            segmentedPath.length >= 3 &&
            _s.__system.routes &&
            routeKey in _s.__system.routes
        );

        if (isApiRoute) {

            // SEC-3: body size limit — checked before reading any body bytes
            const MAX_BODY    = config.requestConf.maxBodyBytes || 1048576;
            const contentLen  = parseInt(headers["content-length"] || "0", 10);
            if (contentLen > MAX_BODY) {
                PayloadHelper.renderObject(
                    { headCode: 413, message: "Payload Too Large", status: 2, code: "C011-413" },
                    response
                );
                return;
            }

            // SEC-1: block traversal characters
            if (!isSafeSegment(segmentedPath[1]) || !isSafeSegment(segmentedPath[2])) {
                PayloadHelper.renderObject(
                    { headCode: 400, message: "Invalid path", status: 2, code: "C010-400" },
                    response
                );
                return;
            }

            const requestData = await PayloadHelper.getRequestData(request);
            __Stoat.requestEndPoint = segmentedPath[2];

            // Resolve controller class from route map
            const module = _s.__system.routes[routeKey];
            let endpointClass = null;

            if (typeof module === "object") {
                for (const key in module) {
                    if (key.toLowerCase() === segmentedPath[2].toLowerCase()) {
                        endpointClass = module[key];
                    }
                }
            } else if (typeof module === "function") {
                endpointClass = module;
            }

            if (endpointClass === null) {
                PayloadHelper.renderObject(
                    { headCode: 406, message: "Invalid Endpoint Path", status: 2, code: "C005-1-406" },
                    response
                );
                return;
            }

            const methodClass = new endpointClass();

            // Parse query string for GET / HEAD
            let query = {};
            if ((method === "get" || method === "head") && __Stoat.hasQuery === 1 && __Stoat.Query) {
                const decoded = decodeURIComponent(__Stoat.Query);
                try {
                    query = JSON.parse(decoded);
                } catch (_) {
                    // Try key=value pairs
                    try {
                        const result = {};
                        decoded.split("&").forEach((pair) => {
                            const [k, v] = pair.split("=");
                            if (k) result[k] = decodeURIComponent(v || "");
                        });
                        query = result;
                    } catch (_) {
                        query = {};
                    }
                }
            }

            // Dispatch
            try {
                let classMethod, requestMethod;

                try {
                    classMethod   = methodClass.methods;
                    requestMethod = classMethod.filter(
                        (mth) => segmentedPath[3] === mth.name && method === mth.method
                    );
                } catch (_) {
                    PayloadHelper.renderObject(
                        { headCode: 500, message: "Endpoint Unavailable", status: 2, code: "C006-500" },
                        response
                    );
                    return;
                }

                if (requestMethod.length > 0) {
                    // Merge query params into requestData
                    Object.keys(query).forEach((k) => { requestData[k] = query[k]; });

                    let validCallBack = 0;
                    const runMethod  = methodClass[segmentedPath[3]](
                        { body: requestData, header: headers, query },
                        (callback) => {
                            validCallBack = 1;
                            PayloadHelper.renderObject(callback, response);
                        }
                    );

                    if (runMethod instanceof Promise) {
                        const result = await runMethod;
                        PayloadHelper.renderObject(result, response);
                    } else if (validCallBack === 0 && runMethod !== undefined) {
                        PayloadHelper.renderObject(runMethod, response);
                    }

                } else {
                    PayloadHelper.renderObject(
                        { headCode: 406, message: "Invalid Endpoint Method", status: 2, code: "C007-406" },
                        response
                    );
                }

            } catch (error) {
                log(error);
                PayloadHelper.renderObject(
                    { headCode: 500, message: "Error Processing Request", status: 2, code: "C008-406" },
                    response
                );
            }

        } else {
            // Static file serving
            if (method === "get") {
                let file = urlPath;
                if (file === "" || file === "/") file = "index.html";

                // SEC-2: confine to publicPath — prevent path traversal
                const publicRoot    = path.resolve(publicPath);
                const requestedFile = path.resolve(path.join(publicRoot, file));

                if (
                    !requestedFile.startsWith(publicRoot + path.sep) &&
                    requestedFile !== publicRoot
                ) {
                    PayloadHelper.renderFile(notFoundPage, response);
                    return;
                }

                if (fs.existsSync(requestedFile)) {
                    PayloadHelper.renderFile(requestedFile, response);
                } else {
                    const baseName = file.split("/").pop();
                    if (baseName === "favicon.ico") {
                        PayloadHelper.renderFile(
                            `${_s.misc.rootPath}/${paths.config}/Public/favicon.ico`,
                            response
                        );
                    } else {
                        PayloadHelper.renderFile(notFoundPage, response);
                    }
                }

            } else {
                PayloadHelper.renderObject(
                    { headCode: 406, message: "Invalid Endpoint, Please verify and try again", status: 2, code: "C009-406" },
                    response
                );
            }
        }

    } else {
        // API disabled — GET only
        response.setHeader("Access-Control-Allow-Methods", "GET");
        if (method !== "get") {
            PayloadHelper.renderObject(
                { headCode: 406, message: "Request Undefined", status: 2, code: "C003-406" },
                response
            );
        }
    }
};
