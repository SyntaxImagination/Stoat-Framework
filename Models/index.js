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
} = require("fs");

let type = __stoatData.appType;

const systemPath = `${_s.misc.rootPath}/${paths.config}`,
      schemaFolder = `${_s.misc.rootPath}/${paths.model}/Schemas`;

const { checkPackage, installPackage } = require(`${systemPath}/App/installer`);

let modelsPath = `${_s.misc.rootPath}/${paths.model}`;

if (type === "ts") {
      modelsPath = `${__stoatData.tsDir}/${paths.model}`;
}

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
                  _s.db[db.schema] = function () {};

                  _s.db[db.schema].prototype.config = db;
            }

            //Now Run the DB File in Templates to create
            let dbFile = `${modelsPath}/Engines/${db.type}/${db.package}.${type}`;

            //Set Up Schema
            if ("schema" in db) {
                  let schemaFile = "";

                  if (db.schema.includes(".json")) {
                        schemaFile = `${schemaFolder}/${db.schema}`;
                  } else {
                        schemaFile = `${schemaFolder}/${db.schema}.json`;
                  }

                  try {
                        let schema = require(schemaFile);

                        const { initDB } = require(dbFile);

                        //Set Schema to the db
                        _s.db[db.schema].prototype.schema = schema;

                        initDB(db.schema);
                  } catch (error) {
                        log(error);
                        log(
                              `ModelError : Schema file not found: ${schemaFile}`
                        );
                  }
            }
      }
};
