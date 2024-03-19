/**
 * Name : Installer
 * Description : The installer Module helps in checking if module exist and installing it
 * Author : Abayomi Oyewumi
 * Date : 18th March 2023
 */

const { log } = require("console"),
  { execSync } = require("child_process");

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

  let runInstall = `npm install ${moduleName}`;
  if (!type || type === 0) {
    runInstall = `${runInstall} --save`;
  } else {
    runInstall = `${runInstall} --save-dev`;
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
