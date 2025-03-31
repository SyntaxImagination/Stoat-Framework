/**
 * Name : QuestDB Connector
 * Description : QuestDB is a high-performance time-series database.
 * Requirement : @questdb/nodejs-client - npm install @questdb/nodejs-client
 */

const log = require("console").log;


async function initDB(dbRef) {

      //Set our run function to be part of _s.db so we can call it from anywhere
      _s.db[dbRef].prototype.run = runQuery;

      const db = new _s.db[dbRef]();

      const tables = db.schema;

      let queries = tables.map(async table => {
            if (table.name === 'tempTable') {
                  return;
            }

            await ensureTableSchema(table, db);
      });

      await Promise.all(queries);
}

async function ensureTableSchema(table, db) {
      // Step 1: Attempt to create the table if it does not exist
      let createTableQuery = `CREATE TABLE IF NOT EXISTS ${table.name} ( `;
      createTableQuery += table.columns.map(column => `${column.name} ${column.type}`).join(', ');
      createTableQuery += ' );';

      await db.run({
            query: createTableQuery
      });

      // Step 2: Check if the table exists and update the schema if necessary
      try {
            let tableExistsQuery = `SELECT count() FROM '${table.name}';`;
            let tableExistsResult = await db.run({
                  query: tableExistsQuery
            });

            if (
                  tableExistsResult &&
                  Number(tableExistsResult.dataset[0][0]) > -1
            ) {

                  // Table exists, check and update schema if necessary
                  let currentSchemaQuery = `SHOW COLUMNS FROM ${table.name};`;
                  let currentSchema = await db.run({
                        query: currentSchemaQuery
                  });

                  // Extract current columns from the dataset
                  let currentColumns = currentSchema.dataset.map(row => ({
                        name: row[0],
                        type: row[1]
                  }));
                  let desiredColumns = table.columns.map(column => ({
                        name: column.name,
                        type: column.type
                  }));

                  let alterStatements = [];

                  // Check for missing or mismatched columns
                  for (let desiredColumn of desiredColumns) {
                        let currentColumn = currentColumns.find(col => col.name === desiredColumn.name);
                        if (!currentColumn) {
                              // Column does not exist, add it
                              alterStatements.push(`ALTER TABLE ${table.name} ADD COLUMN ${desiredColumn.name} ${desiredColumn.type};`);
                        } else if (currentColumn.type !== desiredColumn.type) {
                              // Column type mismatch, modify it
                              alterStatements.push(`ALTER TABLE ${table.name} ALTER COLUMN ${desiredColumn.name} TYPE ${desiredColumn.type};`);
                        }
                  }

                  // Check for columns that need to be deleted
                  for (let currentColumn of currentColumns) {
                        let desiredColumn = desiredColumns.find(col => col.name === currentColumn.name);
                        if (!desiredColumn) {
                              // Column does not exist in desired schema, drop it
                              alterStatements.push(`ALTER TABLE ${table.name} DROP COLUMN ${currentColumn.name};`);
                        }
                  }

                  // Execute the ALTER TABLE statements
                  for (let statement of alterStatements) {
                        await db.run({
                              query: statement
                        });
                  }

            }


            
      } catch (error) {
            log(`Failed to execute table (${table.name}) process`);
            log(error);
      }
      
      
}

async function runQuery(query) { 

      const config = this.config;

      try {
            // Since our request is a GET request, we need to convert the query object to a query string
            let queryString = '';
            for (let key in query) {
                  queryString += `${key}=${query[key]}&`;
            } 
            // const dbData = _s.dbConfig.find(db => db.file === dbRef.file);

            const url = `http://${config.host}:${config.port}/exec`;


            // Remove the last '&' character
            queryString = queryString.slice(0, -1);

            const response = await fetch(`http://${config.host}:${config.port}/exec?${queryString}`, {
                  method: 'GET',
                  headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Basic ${Buffer.from(`${config.user}:${config.password}`).toString('base64')}`
                  }
            });

            if (!response || !response.ok) {
                  log(`Query: ${JSON.stringify(query)}`);
                  throw new Error('Failed to execute query');
            }

            return await response.json();
      } catch (error) {
            log('Error executing query:', error);
            throw error;
      }
}

module.exports = {
      initDB
};