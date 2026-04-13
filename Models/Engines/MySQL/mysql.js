/**
 * Name        : MySQL Connector
 * Description : Connection pool for MySQL databases.
 * Requirement : mysql — npm install mysql | bun add mysql
 *
 * PERF-7: upgraded from createConnection() to createPool() — a dropped
 *         connection no longer crashes in-flight queries; the pool
 *         automatically reconnects and queues requests when all connections
 *         are busy.
 */

const log   = require("console").log;
const mysql = require("mysql");

async function initDB(dbData) {
    _s.db[dbData.ref] = {};

    try {
        const pool = mysql.createPool({
            host              : dbData.url      || "localhost",
            user              : dbData.user     || "root",
            password          : dbData.password || "",
            database          : dbData.name,
            port              : dbData.port     || 3306,
            connectionLimit   : dbData.connectionLimit   || 10,
            waitForConnections: true,
            queueLimit        : 0,
        });

        // Verify pool connectivity on startup
        pool.getConnection((err, connection) => {
            if (err) {
                log(`MySQL: Unable to connect to ${dbData.name} —`, err.message);
            } else {
                log(`MySQL: Connected to ${dbData.name} (pool, limit: ${dbData.connectionLimit || 10})`);
                connection.release();
            }
        });

        stoat.db[dbData.ref].connection = pool;

    } catch (error) {
        log("MySQL: Unexpected error during pool setup —", error.message);
    }
}

module.exports = { initDB };
