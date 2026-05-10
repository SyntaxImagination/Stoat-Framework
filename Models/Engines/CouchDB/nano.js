/**
 * Name        : CouchDB Connector
 * Description : CouchDB is an open-source document-oriented NoSQL database using JSON.
 * Requirement : nano — npm install nano | bun add nano
 *
 * Schema file format (Models/Schemas/<name>.json):
 * [
 *   {
 *     "name": "users",
 *     "indexes": [
 *       { "name": "email-index", "fields": ["email"] }
 *     ]
 *   }
 * ]
 *
 * Each schema entry maps to one CouchDB database. Indexes are Mango-style
 * (_find API). The database is created if it doesn't already exist.
 *
 * Usage in a controller:
 *   const db      = new _s.db.Users();
 *   const couch   = db.connection;               // nano database handle
 *   const doc     = await couch.get("doc-id");
 *   const created = await couch.insert({ name: "Ada" });
 *   const found   = await couch.find({ selector: { email: "a@b.com" } });
 */

"use strict";

const log = require("console").log;

async function initDB(dbRef) {
    const nano = require("nano");

    const db     = new _s.db[dbRef]();
    const dbData = db.config;
    const schemas = db.schema;

    const auth    = dbData.user && dbData.password
        ? `${encodeURIComponent(dbData.user)}:${encodeURIComponent(dbData.password)}@`
        : "";
    const host    = dbData.url  || "localhost";
    const port    = dbData.port || 5984;
    const baseUrl = `http://${auth}${host}:${port}`;

    const server = nano(baseUrl);

    // Attach the nano server handle for administrative use
    _s.db[dbRef].prototype.server     = server;
    _s.db[dbRef].prototype.connection = null;   // set per-database below
    _s.db[dbRef].prototype.find       = findDocs;
    _s.db[dbRef].prototype.run        = findDocs;  // alias for consistency

    // Use the first schema entry as the primary database
    const primarySchema = schemas[0];
    if (!primarySchema) {
        log(`CouchDB [${dbRef}]: No schema defined — skipping database setup`);
        return;
    }

    const dbName = dbData.name || primarySchema.name;

    try {
        // Create database if it doesn't exist
        try {
            await server.db.create(dbName);
            log(`CouchDB: Created database ${dbName}`);
        } catch (err) {
            if (err.statusCode === 412) {
                // 412 = database already exists — not an error
                log(`CouchDB: Connected to existing database ${dbName}`);
            } else {
                throw err;
            }
        }

        const dbHandle = server.use(dbName);
        _s.db[dbRef].prototype.connection = dbHandle;

        // Ensure Mango indexes declared in schema
        for (const sch of schemas) {
            if (!Array.isArray(sch.indexes)) continue;
            for (const idx of sch.indexes) {
                try {
                    await dbHandle.createIndex({
                        index: { fields: idx.fields },
                        name : idx.name || idx.fields.join("_"),
                        type : "json",
                    });
                    log(`CouchDB: Index "${idx.name || idx.fields.join("_")}" ready on ${dbName}`);
                } catch (err) {
                    log(`CouchDB: Index error — ${err.message}`);
                }
            }
        }

        log(`CouchDB: ${dbRef} initialised on ${dbName}`);
    } catch (err) {
        log(`CouchDB: Failed to initialise ${dbRef} — ${err.message}`);
    }
}

async function findDocs(selector, options = {}) {
    try {
        const query = {
            selector: typeof selector === "object" ? selector : {},
            ...options,
        };
        return await this.connection.find(query);
    } catch (err) {
        log("CouchDB: find error —", err.message);
        throw err;
    }
}

module.exports = { initDB };
