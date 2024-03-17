/**
 * This is the Module that mounts and clean up the module file
 */

import { log } from "console";
import { readFileSync, readdirSync } from "fs";

export function runConfig() {

    /**
     * CONFIG
     */
    let configData: Obj = {};
    let configRawData: string = readFileSync(`${_s.misc.rootParent}/bin/.config`, 'utf-8');


    if (typeof (configRawData) === 'string') {
        configData = JSON.parse(configRawData);
        configData = new Object(configData)
    }

    let neededConfigs = [
        'environment',
        'environmentVariables',
        'baseUrl',
        'app',
        'packages',
        'definitions',
        'appType'
    ],
        returnConfig = {
            net: configData.net,
        }

    //Merge Data for Config
    neededConfigs.forEach(key => {
        _s.config[key] = configData[key];
    });

    //Endure Environment is set
    if (_s.config.environment === '') {
        _s.config.environment = 'stagging';
    }

    //Paths
    if ('folders' in configData) {
        _s.paths = configData.folders;
    }

    //Database
    if ('db' in configData) {
        _s.dbConfig = configData.db;
    }

    //Request and Responses
    if ('request' in configData) {
        _s.config.requestConf = configData.request;
    }
    if ('response' in configData) {
        _s.config.responseConf = configData.response;
    }

    /**
     * HELPERS
     */

    //Go through base helpers and add user defined helpers
    for (let key in _s.helpers) {
        try {

            const module = require(`${_s.misc.rootPath}/${_s.paths.helpers}/${key}`);

            for (let funx in module) {
                _s.helpers[key][funx] = module[funx];
            }

        } catch (error) {
            log(error);
        }
    }
    //Now add Keys not in helpers (Defined by users)
    const helperDir = readdirSync(`${_s.misc.rootPath}/${_s.paths.helpers}`);
    helperDir.forEach(fileName => {
        //Remove the Dot
        const mod = fileName.split('.')[0],
            availableHelpers = Object.keys(_s.helpers);

        if (
            !(availableHelpers.includes(mod))
            && mod != 'MimeTypes'
        ) {

            //Add the Helper
            _s.helpers[mod] = {};

            const module = require(`${_s.misc.rootPath}/${_s.paths.helpers}/${mod}`);

            for (let funx in module) {
                _s.helpers[mod][funx] = module[funx];
            }
        }
    });

    //Net and MimeTypes
    try {

        const MimeTypes = require(`${_s.misc.rootPath}/${_s.paths.helpers}/MimeTypes`);

        MimeTypes.default.forEach((mime: Obj) => {
            _s.__system.mimeTypes.push(mime);
        })


    } catch (error) {
        log(error)
    }

    //Do Installations - Package Installer path
    const systemPath = `${_s.misc.rootPath}/${_s.paths.config}`,
        { checkPackage, installPackage } = require(`${systemPath}/App/installer`);

    //Now Check and install packages
    configData.packages.forEach(async (p: string) => {
        let verifyPackage: boolean = await checkPackage(p),
            verifyInstall: boolean;

        if (verifyPackage === false) {
            installPackage(p);
        }
    });

    //Return Net Config
    return returnConfig;

}