/**
 * Module : Paths
 * Desc : The paths file holds the definition of all defined paths in the application 
*/

const paths = stoat.paths,
    config = stoat.config;

//Definitions
const _HelperDirPath = `${__rootPath}/${config.folders.helpers}`;
const _SystemHelperPath = `${__rootPath}/System/Helpers`;


const _HelperDir = _HelperDirPath;

paths._HelperDir = _HelperDirPath;

paths._OthersDir = `${__rootPath}/${config.folders.others}`;

paths._Helper = `${_SystemHelperPath}/Helper.js`;
paths._PayloadHelper = `${_SystemHelperPath}/Payload.js`;
paths._EncryptionHelper = `${_SystemHelperPath}/Encryption.js`;
paths._NetworkHelper = `${_SystemHelperPath}/Network.js`;
paths._MailHelper = `${_SystemHelperPath}/Mail.js`;
paths._ExtendedHelper = `${_SystemHelperPath}/Extended.js`;
paths._WebsocketHelper = `${_SystemHelperPath}/Websocket.js`;

paths._SecurityHelper = `${_SystemHelperPath}/Security/index.js`;


paths._PublicPath = `${__rootPath}/${config.folders.view}`;
// paths._ConfigFile = config.folders.config;