"use strict";
/**
 * Module : Middleware
 * Date L 28th Dec, 2022
 * Desc : This is the intermediary file between the Staot Core and User applications
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const fs_1 = require("fs");
const url = __importStar(require("url"));
const console_1 = require("console");
const Security_1 = require("../Helpers/Security");
const Payload_1 = require("../Helpers/Payload");
module.exports = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    global.__Stoat = {};
    const PayloadHelper = new Payload_1.Payload();
    const urlString = request.url, passedUrl = url.parse(urlString, true), path = passedUrl.pathname;
    let segmentedPath = path.split('/');
    const method = (_a = request.method) === null || _a === void 0 ? void 0 : _a.toLowerCase(), headers = request.headers;
    headers.urlPath = path;
    //Authorize all GET and HEAD Requests while other methods requires Some Soerce
    let targetOrgin = [];
    //TODO - Need to work on Origins 
    if (config.request.checkOrigin === true) {
        let allowedUrls = [];
        try {
            let filePath = `${_OthersDir}/allowedUrls.txt`;
            const checkFile = (0, fs_1.existsSync)(filePath);
            if (!checkFile) {
                const writeFile = (0, fs_1.writeFileSync)(filePath, 'http://localhost');
            }
            const listOfAlllowedUrls = (0, fs_1.readFileSync)(filePath, 'utf-8');
            allowedUrls = listOfAlllowedUrls.split(/\r?\n/);
        }
        catch (error) {
            (0, console_1.log)(error);
        }
        targetOrgin = allowedUrls.filter((origin) => {
            return origin === headers.origin;
        });
        if (targetOrgin.length > 0) {
            headers.source = targetOrgin[0];
        }
    }
    //Check if we enabled Header Authorization
    if ('authorization' in headers) {
        const checkDomainSecurities = yield (0, Security_1.domainSecurity)(request);
        if (checkDomainSecurities.status !== 1) {
            PayloadHelper.renderObject({
                headCode: 406,
                message: checkDomainSecurities.message,
                status: 2,
                code: 'C000-406'
            }, response);
            return;
        }
        else {
            request.headers.source = checkDomainSecurities.data.source;
        }
    }
    else {
        if (method != 'get' && method != 'head') {
            if (!headers.hasOwnProperty('origin')
                || headers.origin === "") {
                PayloadHelper.renderObject({
                    headCode: 406,
                    message: "Uknown Origin",
                    status: 2,
                    code: "C001-406"
                }, response);
                return;
            }
            else {
                if (config.environment != 'production') {
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Application-Environment', config.environment);
                }
                else {
                    if (targetOrgin.length === 0) {
                        PayloadHelper.renderObject({
                            headCode: 406,
                            message: 'Origin not Allowed',
                            status: 2,
                            code: 'C002-406'
                        }, response);
                    }
                    else {
                        response.setHeader('Access-Control-Allow-Origin', String(headers.origin));
                    }
                }
            }
        }
        else {
            response.setHeader('Access-Control-Allow-Origin', '*');
        }
    }
    //Method Checks 
    let allowedMethods = "";
    config.request.allowedMethods.forEach((method) => {
        allowedMethods = `${allowedMethods}, ${method.toUpperCase()}`;
    });
    //Set All the Write Head Method Allowed
    response.setHeader('Access-Control-Allow-Method', allowedMethods);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Credential', String(true));
    if (method === 'get'
        || method === 'head') {
        const queryUrl = String(request.url);
        const queryURL = queryUrl.split('?')[0];
        __Stoat['Query'] = queryUrl.split('?')[1];
        __Stoat['hasQuery'] = 1;
    }
    //Block all Request Outside get if API not enabled
    if (config.app.api.allow === true) {
        //Check for CORS and enable Options
        if (config.request.cors === true) {
            if (method === 'options') {
                response.writeHead(204, headers);
                response.end();
                return;
            }
        }
        //Ensure API Endpoint is available
        const apiEndpoint = config.app.api.versionPrefix, publicPath = `${__rootPath}/${config.folders.view}`, indexPage = `${publicPath}/${config.response.indexPage}`;
        let notFoundPage = `${publicPath}/${config.response.notFoundPage}`;
        const errorFileCheck = (0, fs_1.existsSync)(notFoundPage);
        if (errorFileCheck === false) {
            notFoundPage = `${__rootPath}/${config.folders.config}/Public/404.html`;
        }
        let endpointMethod;
        if (segmentedPath[1].includes(apiEndpoint)) {
            const requestData = yield PayloadHelper.getRequestData(request);
            //@TODO: This is a temporal fix to know what method is called from any where, it will be removed later as we will have a stabbdard non memory tensed way to doing this
            __Stoat['requestEndPoint'] = segmentedPath[2];
            try {
                endpointMethod = require(`${__rootPath}/${config.folders.controller}/${segmentedPath[1]}/${segmentedPath[2]}`);
            }
            catch (error) {
                (0, console_1.log)(error);
                PayloadHelper.renderObject({
                    headCode: 406,
                    message: 'Invalid Endpoint Path',
                    status: 2,
                    code: 'C005-406'
                }, response);
                return;
            }
            //Run the Called Method
            const methodClass = new endpointMethod();
            //Handle Issues with Requests Coming with Queries and Params
            let query = {};
            if ((method === null || method === void 0 ? void 0 : method.toLowerCase()) === 'get'
                || (method === null || method === void 0 ? void 0 : method.toLowerCase()) === 'head') {
                //Build Query from params
                if (__Stoat.hasOwnProperty('Query')
                    && __Stoat.Query != undefined) {
                    let decodedQuery = decodeURIComponent(__Stoat.Query);
                    //If JSON is sent then convert
                    try {
                        query = JSON.parse(decodedQuery);
                    }
                    catch (error) {
                        query = false;
                    }
                    if (query === false) {
                        try {
                            const pairs = decodedQuery.split('&');
                            let result = {};
                            pairs.forEach(pair => {
                                pair.split('=');
                                result[pair[0]] = decodeURIComponent(pair[1] || '');
                            });
                            query = result;
                        }
                        catch (error) {
                            query = false;
                        }
                    }
                }
            }
            else {
                query = {};
            }
            //Run the Method 
            try {
                let classMethod = methodClass.method;
                let requestMethod = classMethod.filter((mth) => {
                    return segmentedPath[3] === mth.name && method === mth.method;
                });
                if (requestMethod > 0) {
                    if ((method === null || method === void 0 ? void 0 : method.toLowerCase()) === 'get'
                        || (method === null || method === void 0 ? void 0 : method.toLowerCase()) === 'head') {
                        if (__Stoat.hasQuery === 1) {
                            query = query;
                        }
                    }
                    if (Object.keys(query).length > 0) {
                        let queryKeys = Object.keys(query);
                        queryKeys.forEach(k => {
                            requestData[k] = query[k];
                        });
                    }
                    const runMethod = methodClass[segmentedPath[3]]({
                        body: requestData,
                        header: headers,
                        query: query
                    }
                    // ,callback
                    );
                }
                else {
                    PayloadHelper.renderObject({
                        headCode: 406,
                        message: "Invalid Edpoint Method",
                        status: 2,
                        code: 'C006-406'
                    }, response);
                }
            }
            catch (error) {
                (0, console_1.log)(error);
                PayloadHelper.renderObject({
                    headCode: 500,
                    message: 'Error Processing Request',
                    status: 2,
                    code: 'C007-406'
                }, response);
                return;
            }
        }
        else {
            if (method === 'get') {
                let file = path;
                if (file === '' || file === '/') {
                    file = 'index.html';
                }
                const filePath = `${_PublicPath}/${file}`;
                const fileCheck = (0, fs_1.existsSync)(filePath);
                if (fileCheck === true) {
                    PayloadHelper.renderFile(filePath, response);
                }
                else {
                    //Render Favicon is not existing
                    let targetFile = file.split('/');
                    targetFile = targetFile[(targetFile.length - 1)];
                    if (targetFile === 'favicon.ico') {
                        PayloadHelper.renderFile(`${__rootPath}/${config.folders.config}/Public/favicon.ico`, response);
                    }
                    else {
                        PayloadHelper.renderFile(notFoundPage, response);
                    }
                }
            }
            else {
                PayloadHelper.renderObject({
                    headCode: 406,
                    message: 'Invalid Endpoint, Please verify and try again',
                    status: 2,
                    code: 'C008-406'
                }, response);
                return;
            }
        }
    }
    else {
        response.setHeader('Access-Control-Allow-Methods', 'GET');
        if (method !== 'get') {
            PayloadHelper.renderObject({
                headCode: 406,
                message: 'Request Undefined',
                status: 2,
                code: 'C003-406'
            }, response);
            return;
        }
    }
});
