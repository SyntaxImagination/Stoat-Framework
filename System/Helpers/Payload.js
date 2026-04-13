/**
 * Module  : Core Payload Helper
 * Desc    : Processes inbound request data and writes outbound responses.
 *
 * PERF-5: gzip compression added to renderObject() and renderFile().
 *         Responses are compressed when the client sends Accept-Encoding: gzip.
 *         Uses only the native `zlib` module — no extra packages.
 */

const fs             = require("fs");
const url            = require("url");
const { gzipSync }   = require("zlib");
const StringDecoder  = require("string_decoder").StringDecoder;
const console        = require("console");

const mimetypes = _s.__system.mimeTypes;

class Payload {
    constructor() {}

    // ── Internal helpers ─────────────────────────────────────────────

    __setRenderHeader(filePath, response) {
        response.setHeader("Content-Type", "application/octet-stream");
        for (let x = 0; x < mimetypes.length; x++) {
            if (mimetypes[x].file.some((ext) => filePath.endsWith(ext))) {
                response.setHeader("Content-Type", mimetypes[x].content);
                break;
            }
        }
    }

    __acceptsGzip(response) {
        const accepts = (response.req?.headers?.["accept-encoding"] || "").toLowerCase();
        return accepts.includes("gzip");
    }

    // ── Request ───────────────────────────────────────────────────────

    async getRequestData(request) {
        const method = request.method?.toLowerCase();

        if (method === "get" && request.query) {
            const parsedURL = url.parse(request.url, true);
            return parsedURL.query;
        }

        const decoder = new StringDecoder("utf-8");
        let buffer    = "";

        return new Promise((resolve) => {
            request.on("data", (data) => {
                buffer += decoder.write(data);
            });

            request.on("end", () => {
                let requestBody = {};

                if (buffer !== "") {
                    try {
                        requestBody = JSON.parse(buffer);
                    } catch (_) {
                        requestBody = { payload: buffer };
                    }
                }

                resolve(requestBody);
            });
        });
    }

    // ── Response ──────────────────────────────────────────────────────

    async renderFile(filePath, response) {
        this.__setRenderHeader(filePath, response);

        let file;
        try {
            file = fs.readFileSync(filePath);
        } catch (_) {
            response.setHeader("Content-Type", "application/json");
            response.writeHead(500);
            response.end(JSON.stringify({ status: 2, message: "Error Reading File" }));
            return false;
        }

        if (file.length === 0) {
            response.setHeader("Content-Type", "application/json");
            response.writeHead(500);
            response.end(JSON.stringify({ status: 2, message: "Empty File" }));
            return;
        }

        // PERF-5: compress if client accepts gzip
        if (this.__acceptsGzip(response)) {
            response.setHeader("Content-Encoding", "gzip");
            response.setHeader("Vary", "Accept-Encoding");
            response.end(gzipSync(file));
        } else {
            response.end(file);
        }
    }

    async renderObject(obj, response) {
        try {
            response.setHeader("Content-Type", "application/json");

            if (!obj.hasOwnProperty("data"))   obj.data   = {};
            if (!obj.hasOwnProperty("status"))  obj.status = 2;
            if (!obj.hasOwnProperty("code"))    obj.code   = "";

            if (obj.hasOwnProperty("contentType")) {
                response.setHeader("Content-Type", obj.contentType);
            }

            const body = JSON.stringify({
                status    : obj.status,
                message   : obj.message,
                data      : obj.data,
                errorcode : obj.code,
            });

            // PERF-5: compress if client accepts gzip
            if (this.__acceptsGzip(response)) {
                response.setHeader("Content-Encoding", "gzip");
                response.setHeader("Vary", "Accept-Encoding");
                response.writeHead(obj.headCode);
                response.end(gzipSync(body));
            } else {
                response.writeHead(obj.headCode);
                response.end(body);
            }

        } catch (error) {
            console.log(error);
            setTimeout(() => {
                try {
                    response.writeHead(500);
                    response.end(
                        JSON.stringify({ status: 2, message: "Response Error", data: {}, errorcode: "P000" })
                    );
                } catch (_) {}
            }, 2500);
        }
    }
}

module.exports = Payload;
