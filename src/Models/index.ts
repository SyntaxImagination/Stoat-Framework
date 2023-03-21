/**
 * This file act as db
 */

import { log } from "console";
import { copyFileSync, readdirSync } from "fs";

let typ = __stoatData.appType;

const systemPath = `${__rootPath}/${stoat.config.folders.system}`,
{ checkPackage, installPackage } = require(`${systemPath}/App/installer`);
let modelsPath = `${__rootPath}/${stoat.config.folders.model}`;
if (typ === 'ts'){
    modelsPath = `${__stoatData.tsDir}/${stoat.config.folders.model}`;
}

log(modelsPath);

type DatabaseRecord = {
    type: string,
    name: string,
    package: string,
    file: string,
    url: string,
    port: number | string
};

module.exports = async (databases: DatabaseRecord[], callback:Function) => {

    databases.forEach(async (db:DatabaseRecord) => {
        
        if (
            db.type !== ''
            || db.name !== ''
            || db.package !== ''
            || db.file !== ''
            || db.url !== ''
            || db.port > 0
        ) {
            
            //Check if pakage exist and install if not
            let verifyPackage: boolean = await checkPackage(db.package),
                verifyInstall: boolean;
            
            if (verifyPackage === false) {
                verifyInstall = installPackage(db.package);

                if (verifyInstall) {
                    setUpDBFile(db);
                }else{
                    callback({ status : 0 });
                }
            }else{
                setUpDBFile(db);
            }
        }

    })

    

    async function setUpDBFile(db:DatabaseRecord){
        const dbFiles = readdirSync(modelsPath);

        if(!dbFiles.includes(`${db.name}-mongoose.js`)){
            try {
                copyFileSync(`${modelsPath}/templates/mongoose.${typ}`, `${modelsPath}/${db.name}-mongoose.${typ}`);
                callback({ status : 1 });
            } catch (error) {
                callback({ status : 2 });
            }
        }else{
            callback({ status: 1 });
        }
    }

}