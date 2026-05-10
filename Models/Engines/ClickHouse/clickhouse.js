/**
 * Name        : ClickHouse Connector
 * Description : ClickHouse is a fast open-source column-oriented OLAP database.
 * Requirement : @clickhouse/client — npm install @clickhouse/client | bun add @clickhouse/client
 *
 * Schema file format (Models/Schemas/<name>.json):
 * [
 *   {
 *     "name": "events",
 *     "engine": "MergeTree()",
 *     "orderBy": "timestamp",
 *     "columns": [
 *       { "name": "timestamp", "type": "DateTime" },
 *       { "name": "user_id",   "type": "UInt64" },
 *       { "name": "action",    "type": "String" }
 *     ]
 *   }
 * ]
 *
 * Usage in a controller:
 *   const db     = new _s.db.Analytics();
 *   const result = await db.run("SELECT count() FROM events");
 *   const rows   = await db.insert("events", [{ timestamp: new Date(), user_id: 1, action: "click" }]);
 */

"use strict";

const log = require("console").log;

async function initDB(dbRef) {
    const { createClient } = require("@clickhouse/client");

    const db     = new _s.db[dbRef]();
    const dbData = db.config;
    const tables = db.schema;

    const client = createClient({
        host    : `http://${dbData.url || "localhost"}:${dbData.port || 8123}`,
        username: dbData.user     || "default",
        password: dbData.password || "",
        database: dbData.name     || "default",
    });

    // Verify connectivity
    try {
        await client.ping();
        log(`ClickHouse: Connected to ${dbData.name || "default"} at ${dbData.url || "localhost"}:${dbData.port || 8123}`);
    } catch (err) {
        log(`ClickHouse: Unable to connect — ${err.message}`);
        return;
    }

    // Attach client and operations to the prototype
    _s.db[dbRef].prototype.client = client;
    _s.db[dbRef].prototype.run    = runQuery;
    _s.db[dbRef].prototype.insert = insertRows;

    // Sync schema — create tables that don't exist, add missing columns
    for (const table of tables) {
        await ensureTableSchema(table, client, dbData.name || "default");
    }
}

async function ensureTableSchema(table, client, database) {
    const engine  = table.engine  || "MergeTree()";
    const orderBy = table.orderBy || table.columns[0]?.name || "tuple()";

    const colDefs = table.columns.map((c) => `${c.name} ${c.type}`).join(", ");
    const createSQL = `
        CREATE TABLE IF NOT EXISTS \`${database}\`.\`${table.name}\`
        (${colDefs})
        ENGINE = ${engine}
        ORDER BY ${orderBy}
    `;

    try {
        await client.exec({ query: createSQL });
        log(`ClickHouse: Table ${table.name} ready`);
    } catch (err) {
        log(`ClickHouse: Failed to create table ${table.name} — ${err.message}`);
        return;
    }

    // Discover existing columns
    try {
        const result = await client.query({
            query          : `DESCRIBE TABLE \`${database}\`.\`${table.name}\``,
            format         : "JSONEachRow",
        });
        const existing   = await result.json();
        const existingNames = existing.map((r) => r.name);

        for (const col of table.columns) {
            if (!existingNames.includes(col.name)) {
                await client.exec({
                    query: `ALTER TABLE \`${database}\`.\`${table.name}\` ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`,
                });
                log(`ClickHouse: Added column ${col.name} to ${table.name}`);
            }
        }
    } catch (err) {
        log(`ClickHouse: Schema sync error for ${table.name} — ${err.message}`);
    }
}

async function runQuery(sql, format = "JSONEachRow") {
    try {
        const result = await this.client.query({ query: sql, format });
        return await result.json();
    } catch (err) {
        log("ClickHouse: Query error —", err.message);
        throw err;
    }
}

async function insertRows(table, rows) {
    try {
        await this.client.insert({
            table,
            values: rows,
            format: "JSONEachRow",
        });
    } catch (err) {
        log("ClickHouse: Insert error —", err.message);
        throw err;
    }
}

module.exports = { initDB };
