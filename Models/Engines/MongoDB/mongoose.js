/**
 * Name : Mongoose Connector
 * Description : Mongoose is a NodeJS Pakcage that enable easy MongoDB connection
 * Requirement : mongoose - npm install mongoose | yarn install mongoose  
 */

const log = require("console").log;
const mongoose = require("mongoose");


async function initDB(dbRef) {

      _s.db[dbRef].prototype.models = {};
      _s.db[dbRef].prototype.run = runSchema;

      const db = new _s.db[dbRef]();
      const dbData = db.config;
      const schemas = db.schema;

      async function connect() {
            try {
                  //This is basic connection and can be extended further
                  const options = {
                        user: dbData.user || "root",
                        password: dbData.password || "",
                        host: dbData.host || "localhost", 
                        database: dbData.schema,
                        port: dbData.port || 27017
                  };

                  //Make Connection
                  let connectionString;

                  if (options.user && options.password) {
                        connectionString = `mongodb://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`;
                  } else {
                        connectionString = `mongodb://${options.host}:${options.port}/${options.database}`;
                  }

                  const connection = await mongoose.connect(connectionString, {
                        useNewUrlParser: true,
                        useUnifiedTopology: true
                  });

                  db.run(schemas, connection);

            } catch (error) {
                  log(error);
                  log("Error Running Process");

                  return false;  s
            }
      }

      await connect();
}

async function runSchema(schemas, connection) {

      // const collections = await connection.db.listCollections().toArray();
      // console.log("Available collections:", collections);

      const Schema = mongoose.Schema;
      const existingModels = Object.keys(connection.models);
      

      // Create or update schemas
      schemas.forEach(sch => {
            const schema = new Schema(sch.structure);
            
            schema.set("strict", true);

            if (connection.models[sch.name]) {
                  // Compare and update schema if necessary
                  const existingSchema = connection.models[sch.name].schema;

                  if (JSON.stringify(existingSchema.obj) !== JSON.stringify(sch.structure)) {
                        console.log(`Updating schema for ${sch.name}`);
                        existingSchema.obj = sch.structure;
                        connection.models[sch.name].schema = new Schema(sch.structure);
                        this.models[sch.name] = connection.models[sch.name];
                  }
            } else {
                  // Create new schema
                  console.log(`Creating schema for ${sch.name}`);
                  this.models[sch.name] = connection.model(sch.name, schema);
            }
      });

      // Rename models that are not in use
      existingModels.forEach(existingModel => {
            if (!schemas.some(sch => sch.name === existingModel)) {
                  console.log(`Renaming schema for ${existingModel} to __deleted_${existingModel}`);
                  connection.models[`__deleted_${existingModel}`] = connection.models[existingModel];
                  delete connection.models[existingModel];
            } 
      });

}


module.exports = {
      initDB
};