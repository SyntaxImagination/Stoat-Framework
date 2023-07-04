// /**
//  * This file act as db
//  */
const paths = _s.paths;

import { log } from "console";
import { copyFileSync, readdirSync } from "fs";

let typ = __stoatData.appType;

const systemPath = `${_s.misc.rootPath}/${paths.system}`,
{ checkPackage, installPackage } = require(`${systemPath}/App/installer`);

let modelsPath = `${_s.misc.rootPath}/${paths.model}`;
if (typ === 'ts'){
    modelsPath = `${__stoatData.tsDir}/${paths.model}`;
}

type DatabaseRecord = {
    type: string,
    name: string,
    package: string,
    file: string,
    url: string,
    port: number
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