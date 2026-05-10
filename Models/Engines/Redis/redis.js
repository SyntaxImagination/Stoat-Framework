/**
 * Name        : Redis Connector
 * Description : Redis is an in-memory key-value store used for caching, sessions, queues.
 * Requirement : redis — npm install redis | bun add redis
 *
 * Schema file format (Models/Schemas/<name>.json):
 * [
 *   {
 *     "name": "cache",
 *     "keyPrefix": "app:",
 *     "defaultTTL": 3600
 *   }
 * ]
 *
 * `keyPrefix` is prepended to every key automatically — prevents key collisions
 * when multiple apps share the same Redis instance.
 * `defaultTTL` (seconds) is used when no TTL is passed to set().
 *
 * Usage in a controller:
 *   const cache = new _s.db.Cache();
 *
 *   await cache.set("user:1", { name: "Ada" });           // set with defaultTTL
 *   await cache.set("user:1", { name: "Ada" }, 600);      // set with custom TTL (s)
 *   const val  = await cache.get("user:1");               // returns parsed value or null
 *   await cache.del("user:1");
 *   const exists = await cache.has("user:1");             // true | false
 *   await cache.expire("user:1", 120);                    // reset TTL
 *   await cache.run("SET", "raw-key", "value");           // raw Redis command via sendCommand
 */

"use strict";

const log = require("console").log;

async function initDB(dbRef) {
    const { createClient } = require("redis");

    const db      = new _s.db[dbRef]();
    const dbData  = db.config;
    const schemas = db.schema;

    const schema    = schemas[0] || {};
    const keyPrefix = schema.keyPrefix || "";
    const defaultTTL = Number(schema.defaultTTL) || 0;

    const url = dbData.url && dbData.url !== "localhost"
        ? dbData.url
        : `redis://${dbData.user && dbData.password
            ? `${encodeURIComponent(dbData.user)}:${encodeURIComponent(dbData.password)}@`
            : ""}${dbData.url || "localhost"}:${dbData.port || 6379}/${dbData.name || 0}`;

    const client = createClient({ url });

    client.on("error", (err) => log(`Redis [${dbRef}]: Client error —`, err.message));

    try {
        await client.connect();
        log(`Redis: Connected to ${dbData.url || "localhost"}:${dbData.port || 6379} (db ${dbData.name || 0})`);
    } catch (err) {
        log(`Redis: Unable to connect — ${err.message}`);
        return;
    }

    // Bind methods and client onto the prototype
    _s.db[dbRef].prototype.client     = client;
    _s.db[dbRef].prototype.keyPrefix  = keyPrefix;
    _s.db[dbRef].prototype.defaultTTL = defaultTTL;
    _s.db[dbRef].prototype.set        = redisSet;
    _s.db[dbRef].prototype.get        = redisGet;
    _s.db[dbRef].prototype.del        = redisDel;
    _s.db[dbRef].prototype.has        = redisHas;
    _s.db[dbRef].prototype.expire     = redisExpire;
    _s.db[dbRef].prototype.run        = redisRun;
}

function _key(instance, key) {
    return `${instance.keyPrefix}${key}`;
}

async function redisSet(key, value, ttl) {
    const serialized = JSON.stringify(value);
    const expiry     = ttl ?? this.defaultTTL;
    try {
        if (expiry > 0) {
            await this.client.set(_key(this, key), serialized, { EX: expiry });
        } else {
            await this.client.set(_key(this, key), serialized);
        }
    } catch (err) {
        log("Redis: set error —", err.message);
        throw err;
    }
}

async function redisGet(key) {
    try {
        const raw = await this.client.get(_key(this, key));
        if (raw === null) return null;
        try { return JSON.parse(raw); } catch (_) { return raw; }
    } catch (err) {
        log("Redis: get error —", err.message);
        throw err;
    }
}

async function redisDel(key) {
    try {
        await this.client.del(_key(this, key));
    } catch (err) {
        log("Redis: del error —", err.message);
        throw err;
    }
}

async function redisHas(key) {
    try {
        return (await this.client.exists(_key(this, key))) === 1;
    } catch (err) {
        log("Redis: exists error —", err.message);
        throw err;
    }
}

async function redisExpire(key, ttl) {
    try {
        await this.client.expire(_key(this, key), ttl);
    } catch (err) {
        log("Redis: expire error —", err.message);
        throw err;
    }
}

async function redisRun(...args) {
    try {
        return await this.client.sendCommand(args.map(String));
    } catch (err) {
        log("Redis: command error —", err.message);
        throw err;
    }
}

module.exports = { initDB };
