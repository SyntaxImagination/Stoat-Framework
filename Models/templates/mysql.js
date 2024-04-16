/**
 * Name : MySQL Connector                                                                                                        MySQL Connector
 * Description : MySQL is a NodeJS Pakcage that enable easy MySQL connection
 * Requirement : mysql - npm install mysql | yarn install mysql  
 */

const log = require("console").log;
const mysql = require("mysql");

let connection;

module.exports = async (dbData) => {
      _s.db[dbData.ref] = {};

      async function connect() {
            try {
                  //This is basic connection and can be extended further
                  const options = {
                        host: dbData.url || "localhost",
                        user: dbData.username || "root",
                        password: dbData.password || "",
                        database: dbData.name,
                        port: dbData.port || 3306,
                  };

                  //Make Connection
                  connection = await mysql.createConnection(options);

                  makeConnections();
            } catch (error) {
                  log(error);
                  log("Unable to connect to Database");

                  return false;
            }
      }

      await connect();

      //Make Connection part of our Stoat Object so it can be accessible globally
      function makeConnections() {
            stoat.db[dbData.ref].connection = connection;
      }
};