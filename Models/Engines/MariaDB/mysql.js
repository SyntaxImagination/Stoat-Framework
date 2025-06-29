/**
 * Name : MySQL Connector                                                                                                        MySQL Connector
 * Description : MySQL is a NodeJS Pakcage that enable easy MySQL connection
 * Requirement : mysql - npm install mysql | yarn install mysql  
 */

const log = require("console").log;
const mysql = require("mysql");

let connection;

async function initDB (dbData){ 
      _s.db[dbData.ref] = {};

      //Connection to the database
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
                  // log(connection); 

                  //Check if connection is successful
                  connection.connect((err) => {
                        if (err) {
                              log(err);
                              log("Unable to connect to Database");
                              return false;
                        } else {
                              log("Connected to Database");
                              makeConnections();
                        }
                  });

            } catch (error) {
                  log(error);
                  log("Unable to connect to Database");

                  return false;
            }
      }

      //Connect
      await connect();

      //Make Connection part of our Stoat Object so it can be accessible globally
      function makeConnections() {
            stoat.db[dbData.ref].connection = connection;
      }
};

module.exports = {
      initDB
}