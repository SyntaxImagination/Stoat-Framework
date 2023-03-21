declare global {
    
    type Obj = Record<string, any>;

    var __Stoat: Obj, //Global Stoat Variable 
    stoat : {
        paths : Obj,
        config : Obj,
        // db : unknown,
        db : any,
        dynamicImport : Function,
    },

    __rootPath: string,
    __rootParent: string,
    
    // StoatAppType : string,

    //Stoat Global Variable
    __stoatData:Obj
}

export {};
