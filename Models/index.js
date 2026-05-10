// /**
//  * This file act as db
//  */
const log = require("console").log;

const paths = _s.paths;

const {
      copyFileSync,
      readdirSync,
      mkdirSync,
      writeFileSync,
      readFileSync,
      existsSync,
} = require("fs");

const systemPath = `${_s.misc.rootPath}/${paths.config}`,
      schemaFolder = `${_s.misc.rootPath}/${paths.model}/Schemas`;

const { checkPackage, installPackage } = require(`${systemPath}/App/installer`);

// Bun executes .ts natively but engine files are always .js — use rootPath directly
const modelsPath = `${_s.misc.rootPath}/${paths.model}`;

module.exports = async (databases, callback = ({}) => {}) => {
      databases.forEach(async (db, index) => {
            if (
                  db.type !== "" ||
                  db.package !== "" ||
                  db.file !== "" ||
                  db.url !== "" ||
                  db.port > 0
            ) {
                  //Check if package exist and install if not
                  let verifyPackage = await checkPackage(db.package);
                  let verifyInstall;

                  if (verifyPackage === false) {
                        verifyInstall = installPackage(db.package);

                        if (verifyInstall) {
                              runDBFile(db, index);
                        } else {
                              callback({
                                    status: 0,
                              });
                        }
                  } else {
                        runDBFile(db);
                  }
            }
      });

      async function runDBFile(db, index) {
            //Check if _s.db has db already defined else create a contructor to hold the db
            if (!(db.schema in _s.db)) {
                  _s.db[db.ref] = function () {};
                  _s.db[db.ref].prototype.config = db;
            }

            //Now Run the DB File in Templates to create
            // Prefer .js engine file (engine files are always CJS); .ts fallback for future use
            const dbFileJs = `${modelsPath}/Engines/${db.engine}/${db.package}.js`;
            const dbFileTs = `${modelsPath}/Engines/${db.engine}/${db.package}.ts`;
            let dbFile = existsSync(dbFileJs) ? dbFileJs : dbFileTs;

            //Set Up Schema
            if ("file" in db) {
                  let schemaFile = "";

                  if (db.file.includes(".json")) {
                        schemaFile = `${schemaFolder}/${db.file}`;
                  } else {
                        schemaFile = `${schemaFolder}/${db.file}.json`;
                  }

                  try {
                        let schema = require(schemaFile);

                        const { initDB } = require(dbFile);

                        //Set Schema to the db
                        _s.db[db.ref].prototype.schema = schema;

                        await initDB(db.ref);
                  } catch (error) {
                        log(error);
                        log(
                              `ModelError : Schema file not found: ${schemaFile}`
                        );
                  }
            }
      }
};