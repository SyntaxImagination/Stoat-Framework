declare global {
    
    type Obj = Record<string, any>;

    var __Stoat: Obj, //Global Stoat Variable 
    stoat : {
        paths : Obj,
        config : Obj,
        db : Obj|[],
        dynamicImport : Function
    },

    __rootPath: string,
    __rootParent: string,
    
    db : [],

    //Stoat Global Variable
    _stoatData:Obj
}

export {};
