/**
 * Name : Installer
 * Description : The installer Module helps in checking if module exist and installing it
 * Author : Abayomi Oyewumi
 * Date : 18th March 2023
 */

import { log } from "console";
import { execSync } from 'child_process';

async function checkPackage(moduleName: string){
    try {
        require.resolve(moduleName);
        return true;
    } catch (error) {
        return false;
    }
}

async function installPackage(moduleName: string, type: number){
    log(`Stoat Installing : ${moduleName}`);

    let runInstall = `npm install ${moduleName}`;
    if (type === 1) {
        runInstall = `${runInstall} --save`;
    } else {
        runInstall = `${runInstall} --save-dev`;
    }

    try {
        execSync(runInstall, {
            stdio: 'inherit'
        });
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    checkPackage,
    installPackage
}