"use strict";
/**
 * Module : Core Payload Helper
 * Desc : This Helper will makes it possible to process payloads from the Core
 * Updated : 29th Dec 2022
 *
 *  The Request Module is needed to handle all requests
 *  Manage what comes in and help format in the right things where needed
 *  Also it will proccess the output and also format things as they go output
 *  This will make proccesses as fast as possible and make our application be stateless, thin and light
 *
*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payload = void 0;
const MimeTypes_1 = require("./MimeTypes");
const fs_1 = require("fs");
const url_1 = require("url");
const string_decoder_1 = require("string_decoder");
const console_1 = require("console");
const mimetypes = MimeTypes_1.MimeTypes;
class Payload {
    constructor() { }
    //Set the Render Header 
    __setRenderHeader(data, response) {
        response.setHeader('ContentType', 'text/plain');
        for (let x = 0; x < mimetypes.length; x++) {
            if (data.indexOf(mimetypes[x].file) > -1) {
                response.setHeader('Content-Type', mimetypes[x].content);
            }
        }
    }
    //Process data based on request Type
    getRequestData(request) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let method = (_a = request.method) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            let requestBody = {};
            if (method === 'get'
                && request.query) {
                let parsedURL = (0, url_1.parse)(request.url, true);
                requestBody = parsedURL.query;
                return requestBody;
            }
            //Other Methods
            else {
                let decoder = new string_decoder_1.StringDecoder('utf-8');
                let buffer = "";
                return new Promise(resolve => {
                    request.on('data', (data) => {
                        buffer += decoder.write(data);
                    });
                    request.on('end', () => {
                        if (buffer != "") {
                            requestBody = JSON.parse(buffer);
                        }
                        return resolve(requestBody);
                    });
                });
            }
        });
    }
    //Render Files for  Display
    renderFile(path, response) {
        return __awaiter(this, void 0, void 0, function* () {
            this.__setRenderHeader(path, response);
            const fullpath = `${path}`;
            let file;
            try {
                file = (0, fs_1.readFileSync)(fullpath);
            }
            catch (error) {
                console.log(error);
                response.setHeader('Content-Type', 'application/json');
                response.writeHead(500);
                response.end(JSON.stringify({
                    status: 2,
                    message: "Error Reading File"
                }));
                return false;
            }
            if (file.length > 0) {
                response.end(file);
            }
            else {
                response.setHeader('Content-Type', 'application/json');
                response.writeHead(500);
                // response.statusCode = 200;
                response.end(JSON.stringify({
                    status: 2,
                    message: "Empty File"
                }));
            }
        });
    }
    //Render Object
    renderObject(obj, response) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                response.setHeader('Content-Type', 'application/json');
                if (!obj.hasOwnProperty('data')) {
                    obj.data = {};
                }
                if (!obj.hasOwnProperty('status')) {
                    obj.status = 2;
                }
                if (!obj.hasOwnProperty('code')) {
                    obj.code = '';
                }
                if (obj.hasOwnProperty('contentType')) {
                    response.setHeader('Content-Type', obj.contentType);
                }
                response.writeHead(obj.headCode);
                response.end(JSON.stringify({
                    status: obj.status,
                    message: obj.message,
                    data: obj.data,
                    errorcode: obj.code,
                }));
            }
            catch (error) {
                (0, console_1.log)(error);
                setTimeout(() => {
                    response.writeHead(500);
                    response.end(JSON.stringify({
                        status: 2,
                        message: "Response Error",
                        data: {},
                        errorcode: "P000"
                    }));
                }, 2500);
            }
        });
    }
}
exports.Payload = Payload;
;
