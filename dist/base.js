"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const console_1 = require("console");
global.__rootPath = path_1.default.join(__dirname);
global.__rootParent = path_1.default.resolve(__dirname, "..");
const configFile = '.config';
let configData = (0, fs_1.readFileSync)(`${__rootParent}/bin/${configFile}`, 'utf-8');
if (typeof (configData) === 'string') {
    configData = JSON.parse(configData);
}
let httpConfig = {}, httpsConfig = {}, wsConfig = {}, wssConfig = {}, socketIOConfig = {}, socketIOConnection = 0, webSocketConnection = 0;
configData.net.forEach((item) => {
    for (let key in item) {
        if (key === 'http') {
            httpConfig = item;
        }
        else if (key === 'https') {
            httpsConfig = item;
        }
        else if (key === 'ws') {
            wsConfig = item;
        }
        else if (key === 'wss') {
            wssConfig = item;
        }
        else if (key === 'socketio') {
            socketIOConfig = item;
        }
    }
});
if (httpConfig.http === true
    || httpsConfig.http === true) {
    try {
        global.config = configData;
        //Database Connections
        global.db = [];
        if (config.db.length > 0) {
            //Foreach DB check values and load db file
            config.db.forEach((database) => {
                if (database.type !== ''
                    || database.name !== ''
                    || database.engine !== ''
                    || database.package !== ''
                    || database.file !== ''
                    || database.url !== ''
                    || database.port > 0) {
                    require(`${__rootPath}/${config.folders.model}/${database.package}/${database.file}`)(database);
                }
            });
            config.net.forEach((net) => {
                for (let key in net) {
                    if (key !== 'data') {
                        //HTTP
                        if (key === 'http' && net[key] === true) {
                            const httpModule = require(`./${config.folders.config}/Core/http.js`);
                            httpModule.run(net);
                        }
                        //HTTPS
                        if (key === 'https' && net[key] === true) {
                            const httpsModule = require(`./${config.folders.config}/Core/https.js`);
                            httpsModule.run(net);
                        }
                        //@TODO : Fix the other types
                        //WEBSOCKET
                        //SOCKETIO
                    }
                }
            });
        }
    }
    catch (error) {
        (0, console_1.log)(error);
        (0, console_1.log)('Error : Application cannot start, no config file defined / config file not found / Invalid config file');
    }
}
