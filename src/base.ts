global.stoat = require('./Core/Stoat');

import path from 'path';
import { readFileSync } from 'fs';
import { log } from 'console';

global.__rootPath = path.join(__dirname);
global.__rootParent = path.resolve(__dirname, "..");

const configFile = '.config';

let configData:Obj = {};
let configRawData:string = readFileSync(`${__rootParent}/bin/${configFile}`, 'utf-8');

if (typeof (configRawData) === 'string') {
    configData = JSON.parse(configRawData);
}

let httpConfig:Obj = {},
    httpsConfig:Obj = {},
    wsConfig:Obj = {},
    wssConfig:Obj = {},

    socketIOConfig:Obj = {},
    socketIOConnection = 0,
    webSocketConnection = 0;


configData.net.forEach( (item:{}) => {
    for(let key in item){

        if (key === 'http') {
            httpConfig = item;
        } else if (key === 'https') {
            httpsConfig = item;
        } else if (key === 'ws') {
            wsConfig = item;
        } else if (key === 'wss') {
            wssConfig = item;
        } else if (key === 'socketio') {
            socketIOConfig = item;
        }

    }   
});


if(
    httpConfig.http === true
    || httpsConfig.http === true
    ){
        
    try {
        stoat.config = configData;
    
        //Database Connections
            if(
                stoat.db.length > 0
            ){
            
                type DatabaseRecord = {
                    type:string,
                    name:string,
                    engine:string,
                    package:string,
                    file:string,
                    url:string,
                    port: number | string
                };
                //Foreach DB check values and load db file
                stoat.db.forEach( (database:DatabaseRecord) => {

                    if(
                        database.type !== ''
                        || database.name !== ''
                        || database.engine !== ''
                        || database.package !== ''
                        || database.file !== ''
                        || database.url !== ''
                        || database.port > 0
                    ){
                        require(`${__rootPath}/${stoat.config.folders.model}/${database.package}/${database.file}`)(database);
                    }
                });
            }

            //Net Connections
            type NetRecord = Record<string, string | boolean | any>;
            stoat.config.net.forEach((net: NetRecord) => {
                
                for(let key in net){
                    if(key !== 'data'){
                        
                        //HTTP
                        if(key === 'http' && net[key] === true){
                            const httpModule = require(`./${stoat.config.folders.config}/Core/http.js`);
                            
                            httpModule.run(net);
                        }

                        
                        //HTTPS
                        if (key === 'https' && net[key] === true) {
                            const httpsModule = require(`./${stoat.config.folders.config}/Core/https.js`);

                            httpsModule.run(net);
                        }
                        //@TODO : Fix the other types

                        //WEBSOCKET

                        //SOCKETIO

                    }
                }

            });


        // }


    } catch (error) {
        // log(error);
        log('Error : Application cannot start, no config file defined / config file not found / Invalid config file');
    }

}