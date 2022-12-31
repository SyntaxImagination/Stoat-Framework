"use strict";
/**
 * Module : Paths
 * Desc : The paths file holds the definition of all defined paths in the application
*/
//Definitions
const _HelperDirPath = `${__rootPath}/${config.folders.helpers}`;
global._HelperDir = _HelperDirPath;
global._OthersDir = `${__rootPath}/${config.folders.others}`;
global._Helper = `${_HelperDir}/Helper.js`;
global._PayloadHelper = `${_HelperDir}/Payload.js`;
global._EncryptionHelper = `${_HelperDir}/Encryption.js`;
global._NetworkHelper = `${_HelperDir}/Network.js`;
global._MailHelper = `${_HelperDir}/Mail.js`;
global._ExtendedHelper = `${_HelperDir}/Extended.js`;
global._WebsocketHelper = `${_HelperDir}/Websocket.js`;
global._SecurityHelper = `${_HelperDir}/Security/index.js`;
global._PublicPath = `${__rootPath}/${config.folders.view}`;
global._ConfigFile = config.folders.config;
