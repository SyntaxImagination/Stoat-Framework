/**
 * The Stoat Declartion makes it easy to use stoat to manage globals and seperate it from true globals
 */

// Defined Paths 
const paths:Record<string, string> = {
    _HelperDir: "",
    _OthersDir: "",

    _Helper: "",
    _PayloadHelper: "",
    _EncryptionHelper: "",
    _NetworkHelper: "",
    _MailHelper: "",
    _ExtendedHelper: "",
    _WebsocketHelper: "",
    _SecurityHelper: "",
    _ConfigFile: "",

    _PublicPath: "",
}

const config:Obj = {};

const db:[] = [];

const dynamicImport = async (path:string) => {
    // console.log(await import(path));
    return await import(path);
}

export {
    paths,
    config,
    db,

    //Functions
    dynamicImport
}