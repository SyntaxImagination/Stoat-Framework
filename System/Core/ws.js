/**
 * Module : WebSocket Server
 *
 * Behaviour:
 *   - If net.data.port === 0 and an HTTP/HTTPS server is passed in, WS upgrades
 *     are handled on the same port (shared server — no extra port needed).
 *   - If net.data.port > 0, a standalone WS server is started on that port.
 *
 * Package requirement: ws — auto-installed on first use.
 *
 * Message format (client → server):
 *   {
 *     "version"  : "v1",          // optional, defaults to "v1"
 *     "endpoint" : "chat",        // controller filename under Engine/v1/
 *     "method"   : "sendMessage", // method name on the controller class
 *     "data"     : {}             // body passed to the controller
 *   }
 *
 * Response format (server → client):
 *   { "status": 1|2, "message": "...", "data": {}, "errorcode": "" }
 *
 * Inside a controller method the request object carries two extra fields:
 *   request.ws  — the individual WebSocket client (send to this client only)
 *   request.wss — the WebSocket server    (iterate wss.clients to broadcast)
 *
 * WS error codes:
 *   WS000 — Invalid JSON
 *   WS001 — Missing endpoint or method
 *   WS002 — Unsafe path segment (path traversal guard)
 *   WS003 — Endpoint not found in route map
 *   WS004 — Controller class not found in module
 *   WS005 — Method not listed in controller.methods
 *   WS006 — Unhandled exception during dispatch
 */

"use strict";

function run(net, attachServer) {
    const installerPath = `${_s.misc.rootPath}/${_s.paths.config}/App/installer.js`;
    const { checkPackage, installPackage } = require(installerPath);

    if (!checkPackage("ws")) {
        installPackage("ws");
    }

    const WebSocket = require("ws");
    const port      = Number(net?.data?.port || 0);

    let wss;

    if (attachServer && port === 0) {
        // Shared port — attach WS upgrade handling to the existing HTTP/HTTPS server
        wss = new WebSocket.Server({ server: attachServer });
        console.log(`Stoat WS attached to existing server | ${new Date()}`);
    } else if (port > 0) {
        // Standalone — own port
        wss = new WebSocket.Server({ port });
        console.log(`Stoat WS Started on ${new Date()} | Port: ${port}`);
    } else {
        console.log("WS: no valid port or server to attach to — skipping");
        return null;
    }

    _s.__system.wsServer = wss;

    wss.on("connection", (ws, req) => {

        ws.on("message", async (raw) => {
            // --- 1. Parse JSON ---
            let msg;
            try {
                msg = JSON.parse(raw.toString());
            } catch (_) {
                return ws.send(JSON.stringify({
                    status: 2, message: "Invalid JSON", errorcode: "WS000",
                }));
            }

            const { version = "v1", endpoint, method, data = {} } = msg;

            // --- 2. Presence check ---
            if (!endpoint || !method) {
                return ws.send(JSON.stringify({
                    status: 2, message: "Missing endpoint or method", errorcode: "WS001",
                }));
            }

            // --- 3. Path traversal guard (mirrors SEC-1 in middleware) ---
            const safe = /^[a-zA-Z0-9_-]+$/;
            if (!safe.test(version) || !safe.test(endpoint) || !safe.test(method)) {
                return ws.send(JSON.stringify({
                    status: 2, message: "Invalid path segment", errorcode: "WS002",
                }));
            }

            // --- 4. Route map lookup ---
            const routeKey = `${version}/${endpoint}`;
            const mod      = _s.__system.routes?.[routeKey];
            if (!mod) {
                return ws.send(JSON.stringify({
                    status: 2, message: "Invalid endpoint", errorcode: "WS003",
                }));
            }

            // --- 5. Controller class lookup ---
            const ControllerClass = mod[endpoint];
            if (!ControllerClass) {
                return ws.send(JSON.stringify({
                    status: 2, message: "Controller not found", errorcode: "WS004",
                }));
            }

            // --- 6. Method lookup ---
            const controller = new ControllerClass();
            const methodList = Array.isArray(controller.methods) ? controller.methods : [];
            const matched    = methodList.find((m) => m.name === method);

            if (!matched) {
                return ws.send(JSON.stringify({
                    status: 2, message: "Method not found", errorcode: "WS005",
                }));
            }

            // --- 7. Dispatch ---
            const requestObj = {
                body  : data,
                header: req.headers || {},
                query : {},
                ws,          // individual client — use ws.send() for targeted responses
                wss,         // server — iterate wss.clients for broadcast
            };

            try {
                const result = await new Promise((resolve) => {
                    const ret = controller[method](requestObj, resolve);
                    if (ret && typeof ret.then === "function") {
                        ret.then(resolve).catch((e) =>
                            resolve({ status: 2, message: e.message, errorcode: "WS006" })
                        );
                    } else if (ret !== undefined && typeof ret !== "function") {
                        resolve(ret);
                    }
                });

                if (result) {
                    ws.send(JSON.stringify({
                        status   : result.status    ?? 1,
                        message  : result.message   ?? "",
                        data     : result.data      ?? {},
                        errorcode: result.code      ?? "",
                    }));
                }
            } catch (err) {
                ws.send(JSON.stringify({
                    status: 2, message: "Internal server error", errorcode: "WS006",
                }));
            }
        });

        ws.on("error", (err) => console.log("WS client error:", err.message));
    });

    return wss;
}

module.exports = { run };
