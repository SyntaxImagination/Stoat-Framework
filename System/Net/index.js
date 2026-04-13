/**
 * Module  : Net
 * Desc    : Outbound HTTP/HTTPS client. Replaces the broken stoatcore Net module.
 *
 * Bugs fixed from stoatcore Net/index.js:
 *  1. `{ stringDecoder }` → `{ StringDecoder }` (wrong destructure key — was always undefined)
 *  2. `response` object used without ever being declared (ReferenceError at runtime)
 *  3. `method.request(resp => {...})` missing `requestDetails` as first argument
 *  4. `option` and `delete` methods used `params` but received arg named `option`
 *  5. `Content-Length` used `params.data.length` (wrong for multi-byte chars) → Buffer.byteLength
 *  6. Response body was resolved inside `data` event before `end` — data was never fully buffered
 */

"use strict";

const http = require("http");
const https = require("https");
const { StringDecoder } = require("string_decoder");

const net = {
      get: async (params) => {
            params.method = "GET";
            return processRequest(params);
      },

      head: async (params) => {
            params.method = "HEAD";
            return processRequest(params);
      },

      post: async (params) => {
            params.method = "POST";
            return processRequest(params);
      },

      patch: async (params) => {
            params.method = "PATCH";
            return processRequest(params);
      },

      put: async (params) => {
            params.method = "PUT";
            return processRequest(params);
      },

      // Fix 4: parameter was named `option` but code referenced `params`
      option: async (params) => {
            params.method = "OPTIONS";
            return processRequest(params);
      },

      // Fix 4: same parameter naming bug as `option`
      delete: async (params) => {
            params.method = "DELETE";
            return processRequest(params);
      },
};

function processRequest(params) {
      return new Promise((success, failed) => {
            // Fix 2: declare response object before use
            let response = {};

            const urlParts = params.url.split("://");
            const protocol = urlParts[0];
            const rest = urlParts[1];

            let transport;
            switch (protocol) {
                  case "http":
                        transport = http;
                        break;
                  case "https":
                        transport = https;
                        break;
                  default:
                        return failed(new Error(`Unsupported protocol: ${protocol}`));
            }

            // Serialise body
            const body =
                  params.hasOwnProperty("data") ? JSON.stringify(params.data) : "{}";

            // Parse host, port, path
            const [hostAndPort, ...pathParts] = rest.split("/");
            const [hostname, portFromUrl] = hostAndPort.split(":");
            const endpointPath = `/${pathParts.join("/")}`;

            // Fix 5: use Buffer.byteLength for accurate Content-Length with unicode
            const requestDetails = {
                  protocol: `${protocol}:`,
                  hostname,
                  method: params.method,
                  path: encodeURI(endpointPath) || "/",
                  headers: {
                        "Content-Type": "application/json",
                        "Content-Length": Buffer.byteLength(body),
                  },
            };

            if (portFromUrl) {
                  requestDetails.port = portFromUrl;
            }

            if (params.hasOwnProperty("port")) {
                  requestDetails.port = params.port;
            }

            // Merge caller-supplied headers
            if (params.hasOwnProperty("headers")) {
                  for (const key in params.headers) {
                        requestDetails.headers[key] = params.headers[key];
                  }
            }

            // Forward any extra top-level params (e.g. auth, agent)
            for (const key in params) {
                  if (
                        !requestDetails.hasOwnProperty(key) &&
                        key !== "url" &&
                        key !== "data" &&
                        key !== "headers" &&
                        key !== "port"
                  ) {
                        requestDetails[key] = params[key];
                  }
            }

            // Fix 3: pass requestDetails as first arg to http.request
            const req = transport.request(requestDetails, (resp) => {
                  response.statusCode = resp.statusCode;
                  response.message = resp.statusMessage;
                  response.headers = resp.headers;

                  // Fix 6: buffer all chunks, resolve only on `end`
                  let rawBuffer = "";
                  const decoder = new StringDecoder("utf8");

                  resp.on("data", (chunk) => {
                        rawBuffer += decoder.write(chunk);
                  });

                  resp.on("end", () => {
                        rawBuffer += decoder.end();

                        if (rawBuffer !== "") {
                              try {
                                    response.body = JSON.parse(rawBuffer);
                              } catch (_) {
                                    response.body = rawBuffer;
                              }
                        } else {
                              response.body = {};
                        }

                        success(response);
                  });
            });

            req.on("error", (err) => {
                  response.error = err;
                  response.internalStatus = 2;
                  success(response);
            });

            req.write(body);
            req.end();
      });
}

module.exports = net;
