/**
 * Module : Security Helper
 * Desc : Core Security features bundled by default 
*/

const paths = stoat.paths;
let dynamicModule;

export const domainSecurity = async (request:Obj) => {   
    return {
        status : 1
    }
}



//Export extended Security Module
dynamicModule = stoat.dynamicImport(`${paths._HelperDir}/Security`);
export { dynamicModule };