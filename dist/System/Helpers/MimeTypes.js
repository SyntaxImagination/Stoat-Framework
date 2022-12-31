"use strict";
/**
 * Module : Core Mimetypes
 * Desc : Mimetypes are used to decide what files are translatable by the server
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MimeTypes = void 0;
console.log(_Helper);
// import definedMimeTypes from `${_Helper}/MimeTypes`;
const { definedMimeTypes } = require(`${_HelperDir}/MimeTypes`);
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
;
exports.MimeTypes = coreMimeTypes.concat(definedMimeTypes)
    .reduce((acc, cur) => {
    const found = acc.find((item) => {
        item.file[0] === cur.file[0];
    });
    if (found) {
        Object.assign(found, cur);
    }
    else {
        acc.push(cur);
    }
    return acc;
}, []);
