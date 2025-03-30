// /**
//  * This file act as db
//  */
const paths = _s.paths;
const log = require("console").log;

const copyFileSync = require("fs").copyFileSync;
const readdirSync = require("fs").readdirSync;
const mkdirSync = require("fs").mkdirSync;

let type = __stoatData.appType;

const systemPath = `${_s.misc.rootPath}/${paths.config}`;
const {
  checkPackage,
  installPackage
} = require(`${systemPath}/App/installer`);

let modelsPath = `${_s.misc.rootPath}/${paths.model}`;

if (type === "ts") {
  modelsPath = `${__stoatData.tsDir}/${paths.model}`;
}

module.exports = async (databases, callback = ({}) => {}) => {

  databases.forEach(async (db) => {
    if (
      db.type !== "" ||
      db.name !== "" ||
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
          setUpDBFile(db);
        } else {
          callback({
            status: 0
          });
        }
      } else {
        setUpDBFile(db);
      }
    }
  });

  async function setUpDBFile(db) {
    const dbFiles = readdirSync(modelsPath);
    let dbs = [];

    //Check if db folder exist else create it
    if (!dbFiles.includes('dbs')) {
      try {
        mkdirSync(`${modelsPath}/dbs`);
      } catch (error) {
        log(error);
        log("Unable to create folder");
        return;
      }
    }

    //Check if db folder exist else create it
    dbs = readdirSync(`${modelsPath}/dbs`);
    if (
      !dbs.includes(db.type)
    ) {
      try {
        mkdirSync(`${modelsPath}/dbs/${db.type}`);
      } catch (error) {
        log(error);
        log("Unable to create type folder");
      }
    }

    //Now Copy from Models/templates to Models/db/db.name
    let checkForDbFile = readdirSync(`${modelsPath}/dbs/${db.type}`);

    if (!checkForDbFile.includes(`${db.name}.${type}`)) {
      try {
        copyFileSync(
          `${modelsPath}/templates/${db.type}.${type}`,
          `${modelsPath}/dbs/${db.type}/${db.name}.${type}`
        );
        callback({
          status: 1
        });
      } catch (error) {
        callback({
          status: 2
        });
      }
    }
  }
};