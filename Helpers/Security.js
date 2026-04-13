/**
 * Security Helper — application-level implementation
 * Merged into _s.helpers.Security at startup, overriding StoatCore defaults.
 *
 * SEC-5: Implements native HS256 JWT without any external packages.
 *        Uses Node.js built-in `crypto` throughout.
 *
 * Required environment variable:
 *   JWT_SECRET — a long, random string kept out of source control.
 *                Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
 *
 * Exports:
 *   signToken(payload, expiresInSeconds?)   — create a signed JWT
 *   verifyToken(token)                       — verify and decode a JWT
 *   domainSecurity(request)                  — middleware hook (called per request with Authorization header)
 */

const { createHmac, timingSafeEqual } = require("crypto");

function getSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        if (_s?.config?.environment === "production") {
            throw new Error("[Stoat Security] JWT_SECRET environment variable is not set. Cannot process tokens.");
        }
        // In development/staging, warn but use a fallback so the app boots
        console.warn("[Stoat Security] WARNING: JWT_SECRET is not set. Using insecure fallback — set JWT_SECRET before deploying.");
        return "stoat-dev-fallback-secret-change-before-production";
    }
    return secret;
}

function base64url(buffer) {
    return buffer.toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
}

function base64urlDecode(str) {
    // Re-pad, convert URL-safe chars back, then decode
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) str += "=";
    return Buffer.from(str, "base64").toString("utf8");
}

module.exports = {

    /**
     * Sign a JWT.
     * @param {Object} payload         — any JSON-serialisable data
     * @param {number} expiresInSeconds — default 1 hour
     * @returns {string} signed JWT string
     */
    signToken(payload, expiresInSeconds = 3600) {
        const secret = getSecret();

        const header = base64url(Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })));
        const body   = base64url(Buffer.from(JSON.stringify({
            ...payload,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
        })));

        const sig = base64url(
            createHmac("sha256", secret).update(`${header}.${body}`).digest()
        );

        return `${header}.${body}.${sig}`;
    },

    /**
     * Verify and decode a JWT.
     * @param {string} token
     * @returns {{ valid: boolean, payload?: Object, message?: string }}
     */
    verifyToken(token) {
        try {
            const secret = getSecret();
            const parts  = token.split(".");

            if (parts.length !== 3) {
                return { valid: false, message: "Malformed token" };
            }

            const expectedSig = base64url(
                createHmac("sha256", secret).update(`${parts[0]}.${parts[1]}`).digest()
            );

            // Constant-time comparison — prevents timing attacks
            const sigBuf      = Buffer.from(parts[2]);
            const expectedBuf = Buffer.from(expectedSig);

            if (sigBuf.length !== expectedBuf.length ||
                !timingSafeEqual(sigBuf, expectedBuf)) {
                return { valid: false, message: "Invalid signature" };
            }

            const payload = JSON.parse(base64urlDecode(parts[1]));

            if (payload.exp < Math.floor(Date.now() / 1000)) {
                return { valid: false, message: "Token expired" };
            }

            return { valid: true, payload };

        } catch (err) {
            return { valid: false, message: err.message };
        }
    },

    /**
     * Middleware hook — called by middleware.js for every request
     * that carries an Authorization header.
     *
     * Must return: { status: 1, data: { source } }  on success
     *              { status: 2, message }             on failure
     */
    async domainSecurity(request) {
        const authHeader = request.headers.authorization || "";

        if (!authHeader.startsWith("Bearer ")) {
            return { status: 2, message: "Missing or malformed Authorization header" };
        }

        const token  = authHeader.slice(7);
        const result = this.verifyToken(token);

        if (!result.valid) {
            return { status: 2, message: result.message };
        }

        return {
            status: 1,
            data  : { source: result.payload.source || result.payload.sub || "api" },
        };
    },
};
