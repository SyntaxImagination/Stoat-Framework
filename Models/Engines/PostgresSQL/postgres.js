/**
 * Name : Postgres Connector
 * Description : Postgres is a NodeJS Pakcage that enable easy Postgres connection
 * Requirement : pg - npm install pg | yarn install pg
 */

const log = require("console").log;
const {
      Pool
} = require("pg");

let connection;

module.exports = async (dbData) => {
      _s.db[dbData.ref] = {};

      async function connect() {
            try {
                  //This is basic connection and can be extended further
                  const options = {
                        user: dbData.user || "root",
                        host: dbData.url || "localhost",
                        database: dbData.name,
                        password: dbData.password || "",
                        port: dbData.port || 5432
                  };

                  //Make Connection
                  connection = new Pool(options);



                  makeConnections();
            } catch (error) {
                  log(error);
                  log("Unable to connect to Database");

                  return false;
            }
      }

      await connect();

      //Define all your Schemas / Collections in this function, they will be available globally
      function makeConnections() {
            stoat.db[dbData.ref].connection = connection;
      }
};