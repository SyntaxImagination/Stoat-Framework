/**
 * Module : Core Mimetypes
 * Desc : Mimetypes are used to decide what files are translatable by the server
 */

const paths = stoat.paths;

// import definedMimeTypes from `${_Helper}/MimeTypes`;
const { definedMimeTypes } = require(`${paths._HelperDir}/MimeTypes`);

let coreMimeTypes = [
    //basic Web Assets
    {
        file: ['.css'],
        content: 'text/css'
    },
    {
        file: ['.js'],
        content: 'text/javascript'
    },
    {
        file: ['.json'],
        content: 'application/json'
    },
    {
        file: ['.html'],
        content: 'text/html'
    },
    {
        file: ['.htm'],
        content: 'text/html'
    },
    {
        file: ['.xml'],
        content: 'text/xml'
    },

    //Docs
    {
        file: ['.pdf'],
        content: 'application/pdf'
    },
    {
        file: ['.csv'],
        content: 'text/csv'
    },
    {
        file: ['.xls'],
        content: 'application/vnd.ms-excel'
    },
    {
        file: ['.xlsx'],
        content: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    },

    //Archive
    {
        file: ['.zip'],
        content: 'application/zip'
    },
    {
        file: ['.tar'],
        content: 'application/x-tar'
    },

    //Fonts
    {
        file: ['.eot'],
        content: 'application/vnd.ms-fontobject'
    },
    {
        file: ['.otf'],
        content: 'font/otf'
    },
    {
        file: ['.ttf'],
        content: 'font/ttf'
    },
    {
        file: ['.woff'],
        content: 'font/woff'
    },
    {
        file: ['.woff2'],
        content: 'font/woff2'
    },

    //Images
    {
        file: ['.jpeg'],
        content: 'image/jpeg'
    },
    {
        file: ['.jpg'],
        content: 'image/jpeg'
    },
    {
        file: ['.gif'],
        content: 'image/gif'
    },
    {
        file: ['.ico'],
        content: 'image/vnd.microsoft.icon'
    },
    {
        file: ['.png'],
        content: 'image/png'
    },
    {
        file: ['.tif'],
        content: 'image/tiff'
    },
    {
        file: ['.tiff'],
        content: 'image/tiff'
    },
    {
        file: ['.svg'],
        content: 'image/svg+xml'
    },
    {
        file: ['.bmp'],
        content: 'image/bmp'
    },

    //Calendar
    {
        file: ['.ics'],
        content: 'text/calendar'
    }
];


//Merge The types from user defined to core defined and allow user defined to overwrite core
interface Mime{
    file : string[],
    content : string
};

export const MimeTypes: Mime[] = coreMimeTypes.concat(definedMimeTypes)
.reduce((acc:Mime[], cur:Mime) => {
    const found = acc.find((item:Mime) => {
        item.file[0] === cur.file[0]
    });
    if(found){
        Object.assign(found, cur);
    }else{
        acc.push(cur);
    }

    return acc;
}, []);