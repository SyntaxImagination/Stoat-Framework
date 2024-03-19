// /**
//  * This file act as db
//  */
const paths = _s.paths;

const log = require("console").log;
const copyFileSync = require("fs").copyFileSync;
const readdirSync = require("fs").readdirSync;

let typ = __stoatData.appType;

const systemPath = `${_s.misc.rootPath}/${paths.system}`;
const { checkPackage, installPackage } = require(`${systemPath}/App/installer`);

let modelsPath = `${_s.misc.rootPath}/${paths.model}`;
if (typ === "ts") {
  modelsPath = `${__stoatData.tsDir}/${paths.model}`;
}

module.exports = async (databases, callback) => {
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
          callback({ status: 0 });
        }
      } else {
        setUpDBFile(db);
      }
    }
  });

  async function setUpDBFile(db) {
    const dbFiles = readdirSync(modelsPath);

    if (!dbFiles.includes(`${db.name}-mongoose.js`)) {
      try {
        copyFileSync(
          `${modelsPath}/templates/mongoose.${typ}`,
          `${modelsPath}/${db.name}-mongoose.${typ}`
        );
        callback({ status: 1 });
      } catch (error) {
        callback({ status: 2 });
      }
    } else {
      callback({ status: 1 });
    }
  }
};