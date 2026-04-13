/**
 * Name : Mongoose Connector
 * Description : Mongoose is a NodeJS Pakcage that enable easy MongoDB connection
 * Requirement : mongoose - npm install mongoose | yarn install mongoose
 */

const log = require("console").log;
const mongoose = require("mongoose");

// Store connections by database reference
const connections = {};

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
                        port: dbData.port || 27017,
                  };

                  //Make Connection
                  let connectionString;

                  if (options.user && options.password) {
                        connectionString = `mongodb://${options.user}:${options.password}@${options.host}:${options.port}/${options.database}`;
                  } else {
                        connectionString = `mongodb://${options.host}:${options.port}/${options.database}`;
                  }

                  // Check if connection already exists for this database reference
                  let connection;
                  if (
                        connections[dbRef] &&
                        connections[dbRef].readyState === 1
                  ) {
                        // Connection already exists and is connected
                        connection = connections[dbRef];
                        log(
                              `Reusing existing connection for database: ${dbRef}`
                        );
                  } else {
                        // Create a new connection using mongoose.createConnection
                        // This allows multiple independent connections to different databases
                        connection = await mongoose.createConnection(
                              connectionString,
                              {
                                    useNewUrlParser: true,
                                    useUnifiedTopology: true,
                              }
                        );

                        // Store the connection for future use
                        connections[dbRef] = connection;
                        log(`Created new connection for database: ${dbRef}`);
                  }

                  db.run(schemas, connection);
            } catch (error) {
                  log(error);
                  log("Error Running Process");

                  return false;
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
      schemas.forEach((sch) => {
            const schema = new Schema(sch.structure);
            schema.set("strict", true);

            // Apply declared indexes if provided
            if (Array.isArray(sch.indexes)) {
                  sch.indexes.forEach((idx) => {
                        if (idx && idx.fields) {
                              try {
                                    schema.index(idx.fields, idx.options || {});
                              } catch (e) {
                                    console.warn(
                                          `Index definition error on ${sch.name}:`,
                                          e.message
                                    );
                              }
                        }
                  });
            }

            if (connection.models[sch.name]) {
                  const existingSchema = connection.models[sch.name].schema;
                  if (
                        JSON.stringify(existingSchema.obj) !==
                        JSON.stringify(sch.structure)
                  ) {
                        console.log(`Updating schema for ${sch.name}`);
                        existingSchema.obj = sch.structure;
                        // Rebuild model with new schema + indexes
                        connection.models[sch.name].schema = new Schema(
                              sch.structure
                        );
                        if (Array.isArray(sch.indexes)) {
                              sch.indexes.forEach((idx) => {
                                    if (idx && idx.fields) {
                                          try {
                                                connection.models[
                                                      sch.name
                                                ].schema.index(
                                                      idx.fields,
                                                      idx.options || {}
                                                );
                                          } catch (e) {
                                                console.warn(
                                                      `Index rebuild error on ${sch.name}:`,
                                                      e.message
                                                );
                                          }
                                    }
                              });
                        }
                        this.models[sch.name] = connection.models[sch.name];
                  } else {
                        this.models[sch.name] = connection.models[sch.name];
                  }
            } else {
                  console.log(`Creating schema for ${sch.name}`);
                  this.models[sch.name] = connection.model(sch.name, schema);
            }
      });

      // Ensure indexes are built (non-blocking)
      Object.values(this.models).forEach((model) => {
            if (model && model.ensureIndexes) {
                  model.ensureIndexes().catch((e) =>
                        console.warn(
                              `ensureIndexes error for ${model.modelName}:`,
                              e.message
                        )
                  );
            }
      });

      // Rename models that are not in use
      existingModels.forEach((existingModel) => {
            if (!schemas.some((sch) => sch.name === existingModel)) {
                  console.log(
                        `Renaming schema for ${existingModel} to __deleted_${existingModel}`
                  );
                  connection.models[`__deleted_${existingModel}`] =
                        connection.models[existingModel];
                  delete connection.models[existingModel];
            }
      });
}

module.exports = {
      initDB,
};
