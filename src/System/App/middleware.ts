/**
 * Module : Middleware
 * Date L 28th Dec, 2022
 * Desc : This is the intermediary file between the Staot Core and User applications 
*/

const paths = stoat.paths,
config = stoat.config;

import { existsSync, readFileSync, writeFileSync } from "fs";
import * as url from 'url';

import * as http from "http";
import { log } from "console";

import { domainSecurity } from '../Helpers/Security';

import {Payload} from '../Helpers/Payload';

type HttpRequest = http.IncomingMessage;
type HttpResponse = http.ServerResponse;

module.exports = async (request:HttpRequest, response:HttpResponse) => {

    global.__Stoat = {};

    const PayloadHelper = new Payload();
    
    const urlString:any = request.url,
    passedUrl = url.parse(urlString, true),
    path:any = passedUrl.pathname;
    
    let segmentedPath = path.split('/');

    const method = request.method?.toLowerCase(),
    headers = request.headers;

    headers.urlPath = path;

    //Authorize all GET and HEAD Requests while other methods requires Some Soerce
    let targetOrgin = [];

    //TODO - Need to work on Origins 
    if(config.request.checkOrigin === true){

        let allowedUrls:string[] = [];

        try {
            let filePath = `${paths._OthersDir}/allowedUrls.txt`; 

            const checkFile = existsSync(filePath);
            
            if(!checkFile){  
                const writeFile = writeFileSync(filePath, 'http://localhost');
            }
            const listOfAlllowedUrls = readFileSync(filePath, 'utf-8');
            allowedUrls = listOfAlllowedUrls.split(/\r?\n/);

        } catch (error) {
            // log(error);
        }

        targetOrgin = allowedUrls.filter((origin:string) => {
            return origin === headers.origin
        });

        if(targetOrgin.length > 0){
            headers.source = targetOrgin[0]
        }
    } 
    else{
        response.setHeader('Access-Control-Allow-Origin', '*');
        if('origin' in headers){
        }else{
            headers.origin = headers.host;
        }
    }

    //Check if we enabled Header Authorization
    if('authorization' in headers){

        const checkDomainSecurities:Record<string, any> = await domainSecurity(request);

        if(checkDomainSecurities.status !== 1){
            PayloadHelper.renderObject({
                headCode : 406,
                message : checkDomainSecurities.message,
                status : 2,
                code : 'C000-406'
            }, 
            response);

            return;
        }else{
            request.headers.source = checkDomainSecurities.data.source;
        }

    }
    else {

        if (method != 'get' && method != 'head') {


            if (
                !headers.hasOwnProperty('origin')
                || headers.origin === ""
            ) {

                PayloadHelper.renderObject({
                    headCode: 406,
                    message: "Uknown Origin",
                    status: 2,
                    code: "C001-406"
                },
                    response);

                return;

            } else {

                if (config.environment != 'production') {
                    response.setHeader('Access-Control-Allow-Origin', '*');
                    response.setHeader('Application-Environment', config.environment);
                } else {

                    if (targetOrgin.length === 0) {
                        PayloadHelper.renderObject({
                            headCode: 406,
                            message: 'Origin not Allowed',
                            status: 2,
                            code: 'C002-406'
                        }, response);
                    } else {
                        response.setHeader('Access-Control-Allow-Origin', String(headers.origin));
                    }

                }

            }

        } else {
            response.setHeader('Access-Control-Allow-Origin', '*');
        }

    }


    //Method Checks 
    let allowedMethods = "";
    
    config.request.allowedMethods.forEach((method:string) => {
        allowedMethods = `${allowedMethods}, ${method.toUpperCase()}`;
    });

    //Set All the Write Head Method Allowed
    response.setHeader('Access-Control-Allow-Method', allowedMethods);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Credential', String(true));

    if(
        method === 'get' 
        || method === 'head'
    ){
        const queryUrl = String(request.url);
        const queryURL = queryUrl.split('?')[0];

        __Stoat['Query'] = queryUrl.split('?')[1];
        __Stoat['hasQuery'] = 1;
    }

    //Block all Request Outside get if API not enabled
    if(config.app.api.allow === true){
        //Check for CORS and enable Options
        if(config.request.cors === true){
            if(method === 'options'){
                response.writeHead(204, headers);
                response.end();
                return;
            }
        }


        //Ensure API Endpoint is available
        const apiEndpoint = config.app.api.versionPrefix,

        publicPath = `${__rootPath}/${config.folders.view}`,
        indexPage = `${publicPath}/${config.response.indexPage}`;
        let notFoundPage = `${publicPath}/${config.response.notFoundPage}`;
        
        const errorFileCheck = existsSync(notFoundPage);
        if(errorFileCheck === false){
            notFoundPage = `${__rootPath}/${config.folders.config}/Public/404.html`;
        }

        let endpointClass;
        
        if( segmentedPath[1].includes(apiEndpoint) ){
            const requestData:any = await PayloadHelper.getRequestData(request);

            //@TODO: This is a temporal fix to know what method is called from any where, it will be removed later as we will have a stabbdard non memory tensed way to doing this
            __Stoat['requestEndPoint'] = segmentedPath[2];

            try {
                endpointClass = require(`${__rootPath}/${config.folders.controller}/${segmentedPath[1]}/${segmentedPath[2]}`);
                
            } catch (error) {
                // log(error);

                PayloadHelper.renderObject({
                    headCode : 406,
                    message : 'Invalid Endpoint Path',
                    status : 2,
                    code : 'C005-406'
                }, response);

                return;
            }

            //Run the Called Method
            const methodClass = new endpointClass();

            //Handle Issues with Requests Coming with Queries and Params
            let query:any = {};

            if(
                method?.toLowerCase() === 'get'
                || method?.toLowerCase() === 'head'
            ){
                //Build Query from params
                if(
                    __Stoat.hasOwnProperty('Query')
                    && __Stoat.Query != undefined
                ){ 
                    let decodedQuery = decodeURIComponent(__Stoat.Query)

                    //If JSON is sent then convert
                    try {
                        query = JSON.parse(decodedQuery);
                    } catch (error) {
                        query = false;
                    }

                    if(query === false){

                        try {
                            const pairs = decodedQuery.split('&');
                            let result:Record<string, any> = {};
                            
                            pairs.forEach( pair => {
                                pair.split('=');
                                result[pair[0]] = decodeURIComponent(pair[1] || '');
                            } );

                            query = result;

                        } catch (error) {
                            query = false;
                        }

                    }

                }
            }else{
                query = {};
            }

            //Run the Method 
            try {
    
                let classMethod = methodClass.methods,
                requestMethod;
                
                try {
                    
                    requestMethod = classMethod.filter( (mth:{ name:string, method:string }) => {
                        return segmentedPath[3] === mth.name && method === mth.method
                    });

                } catch (error) {
                    
                    PayloadHelper.renderObject({
                        headCode: 500,
                        message: 'Endpoint Unavailable',
                        status: 2,
                        code: 'C006-500'
                    }, response);

                    return;
                }


                if(requestMethod.length > 0){

                    if(
                        method?.toLowerCase() === 'get'
                        || method?.toLowerCase() === 'head'
                    ){
                        if(__Stoat.hasQuery === 1){
                            query = query;
                        }
                    }

                    if(
                        Object.keys(query).length > 0
                    ){
                        let queryKeys = Object.keys(query);
                        queryKeys.forEach(k => {
                            requestData[k] = query[k];
                        })
                    }
                    
                    let validCallBack = 0; //Valid callback variable to ensure we dont resend 
                    const runMethod = methodClass[segmentedPath[3]](
                        {
                            body : requestData,
                            header : headers,
                            query : query
                        }
                        ,
                        //If its callback function then run it here
                        (callback:Obj) => {
                            //Send Reponse to User
                            validCallBack = 1;
                            PayloadHelper.renderObject(callback, response);
                        }
                    );

                    // else if not a callback function but a return function we shoudl check if its a promise or a normal function
                    if(runMethod instanceof Promise ){
                        const feedbackResponse = await runMethod;
                        //Send Reponse to User
                        PayloadHelper.renderObject(feedbackResponse, response);
                    }else{
                        //Send Reponse to User
                        // if(validCallBack === 0){
                        if(
                            validCallBack === 0
                            && runMethod !== undefined
                        ){
                            PayloadHelper.renderObject(runMethod, response);
                        }
                    }

                    

                }else{
                    PayloadHelper.renderObject({
                        headCode : 406,
                        message : "Invalid Edpoint Method",
                        status : 2,
                        code : 'C007-406'
                    }, response);
                }
                
            } catch (error) {
                // log(error);
    
                PayloadHelper.renderObject({
                    headCode: 500,
                    message: 'Error Processing Request',
                    status: 2,
                    code: 'C008-406'
                }, response);

                return;
            }
        } else {
            
            if (method === 'get'){

                let file = path;
                
                if (file === '' || file === '/') {
                    file = 'index.html';
                }

                const filePath = `${paths._PublicPath}/${file}`;
                const fileCheck = existsSync(filePath);

                if (fileCheck === true) {
                    PayloadHelper.renderFile(filePath, response);
                } else {

                    //Render Favicon is not existing
                    let targetFile = file.split('/');
                    targetFile = targetFile[(targetFile.length - 1)];

                    if (targetFile === 'favicon.ico') {
                        PayloadHelper.renderFile(`${__rootPath}/${config.folders.config}/Public/favicon.ico`, response); 
                    } else {
                        PayloadHelper.renderFile(notFoundPage, response);
                    }

                }

                

            } else{
                PayloadHelper.renderObject({
                    headCode: 406,
                    message: 'Invalid Endpoint, Please verify and try again',
                    status: 2,
                    code: 'C009-406'
                },
                response);
                return;
            }

        }

    } else {

        response.setHeader('Access-Control-Allow-Methods', 'GET');

        if (method !== 'get') {
            PayloadHelper.renderObject({
                headCode: 406,
                message: 'Request Undefined',
                status: 2,
                code: 'C003-406'
            },
            response);
            return;
        }

    }

}