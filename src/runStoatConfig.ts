/**
 * This is the Module that mounts and clean up the module file
 */

import { log } from "console";
import { readFileSync } from "fs";

export function runConfig(){ 

    /**
     * CONFIG
     */
    let configData:Obj = {};
    let configRawData:string = readFileSync(`${_s.misc.rootParent}/bin/.config`, 'utf-8');


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
        'definitions'
    ],
    returnConfig = {
        net : configData.net,
    }

    //Merge Data for Config
    neededConfigs.forEach(key => {
        _s.config[key] = configData[key];
    });

    //Paths
    if('folders' in configData){
        _s.paths = configData.folders;
    }

    //Database
    if('db' in configData){
        _s.db = configData.db;
    }

    //Request and Responses
    if('request' in configData){
        _s.config.requestConf = configData.request;
    }
    if('response' in configData){
        _s.config.responseConf = configData.response;
    }

    /**
     * HELPERS
     */

    //Go through base helpers and add user defined helpers
    for(let key in _s.helpers){
        try {
            
            const module = require(`${_s.misc.rootPath}/${_s.paths.helpers}/${key}`);

            for (let funx in module) {
                _s.helpers[key][funx] = module[funx];
            }

        } catch (error) {
            log(error); 
        }
    }

    //Net and MimeTypes
    try {
        
        const MimeTypes = require(`${_s.misc.rootPath}/${_s.paths.helpers}/MimeTypes`);

        MimeTypes.default.forEach((mime:Obj) => {
            _s.__system.mimeTypes.push(mime);
        })
        

    } catch (error) {
        log(error)
    }

    //Return Net Config
    return returnConfig;
    
}