declare global {
    type ConfigRecord = Record<string, any>;
    type Staot = Record<string, any>;

    var __Stoat: Staot, //Global Stoat Variable 
    __rootPath: string,
    __rootParent: string,
    
    config:ConfigRecord,
    db:[],

    //Paths
    _HelperDir: string,
    _OthersDir: string,
    
    _Helper: string,
    _PayloadHelper: string,
    _EncryptionHelper: string,
    _NetworkHelper: string,
    _MailHelper: string,
    _ExtendedHelper: string,
    _WebsocketHelper: string,
    _SecurityHelper: string,
    _ConfigFile: string,

    _PublicPath: string, 

    //Stoat Global Variable
    _stoatData:Record<string, any>
}
export {};