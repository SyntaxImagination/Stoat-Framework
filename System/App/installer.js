/**
 * Name : Installer
 * Description : The installer Module helps in checking if module exist and installing it
 * Author : Abayomi Oyewumi
 * Date : 18th March 2023
 */

const { log } = require("console"),
  { execSync } = require("child_process");

const isBun = typeof Bun !== "undefined";

function checkPackage(moduleName) {
  try {
    require.resolve(moduleName);
    return true;
  } catch (error) {
    return false;
  }
}

function installPackage(moduleName, type) {
  log(`Stoat Installing : ${moduleName}`);

  let runInstall;
  if (isBun) {
    runInstall = `bun add ${moduleName}`;
  } else if (!type || type === 0) {
    runInstall = `npm install ${moduleName} --save`;
  } else {
    runInstall = `npm install ${moduleName} --save-dev`;
  }

  try {
    execSync(runInstall, {
      stdio: "inherit",
    });
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  checkPackage,
  installPackage,
};
