//Load Stoat
import 'stoatcore';

import path from 'path';
import { readFileSync } from 'fs';
import { log } from 'console';

//Set Defaults
_s.misc.rootPath = path.join(__dirname);
_s.misc.rootParent = path.resolve(__dirname, "..");

//Run Config into application Memory
import { runConfig } from './runStoatConfig';
const configData: Obj = runConfig();

let httpConfig: Obj = {},
    httpsConfig: Obj = {},
    wsConfig: Obj = {},
    wssConfig: Obj = {},

    socketIOConfig: Obj = {},
    socketIOConnection = 0,
    webSocketConnection = 0;


configData.net.forEach((item: {}) => {
    for (let key in item) {

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


if (
    httpConfig.http === true
    || httpsConfig.http === true
) {

    try {

        //Database Connections
        if (
            _s.dbConfig.length > 0
        ) {

            type DatabaseRecord = {
                type: string,
                name: string,
                engine: string,
                package: string,
                file: string,
                url: string,
                port: number
            };
            //Foreach DB check values and load db file
            _s.dbConfig.forEach(async (database: DatabaseRecord) => {

                if (
                    database.type !== ''
                    || database.name !== ''
                    || database.engine !== ''
                    || database.package !== ''
                    || database.file !== ''
                    || database.url !== ''
                    || database.port > 0
                ) {
                    try {
                        require(`${_s.misc.rootPath}/${_s.paths.model}/dbs/${database.package}/${database.file}`)(database);

                        runConnection();
                    } catch (error) {
                        const runDBInstaller = require(`${_s.misc.rootPath}/${_s.paths.model}`);
                        await runDBInstaller(_s.db);

                        runConnection();
                    }
                }
            });
        } else {
            runConnection();
        }


        //Net Connections
        function runConnection() {
            type NetRecord = Record<string, string | boolean | any>;
            configData.net.forEach((net: NetRecord) => {

                for (let key in net) {
                    if (key !== 'data') {

                        //HTTP
                        if (key === 'http' && net[key] === true) {
                            const httpModule = require(`./${_s.paths.config}/Core/http.js`);

                            httpModule.run(net);
                        }


                        //HTTPS
                        if (key === 'https' && net[key] === true) {
                            const httpsModule = require(`./${_s.paths.config}/Core/https.js`);

                            httpsModule.run(net);
                        }
                        //@TODO : Fix the other types

                        //WEBSOCKET

                        //SOCKETIO

                    }
                }

            });
        }


        // }


    } catch (error) {
        log(error);
        log('------------');
        log('Error : Application cannot start, no config file defined / config file not found / Invalid config file');
    }

}