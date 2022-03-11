/*
 **
 **     Author : Abayomi Oyewumi
 **     Group : Syntax Imagination - Stout Framework
 **     Date : 11th March 2020
 **
 **    This module handles all request as they come in and proccess the accordingly
 **    This file also act as our router to all requests and proccesses
 **
 */

const fs = require('fs');
const url = require('url');
const querystring = require('querystring');

const StringDecoder = require('string_decoder').StringDecoder;
const payloadHelper = require(`${rootpath}/${config.folders.helpers}/Payload`);

const { domainSecurity } = require(_SecurityHelper);

module.exports = async (request, response) => {

    //Append Ignite to request to use as extra request lef
    request._stout = {};

    const Payload = new payloadHelper();

    const passedUrl = url.parse(request.url, true);
    const path = passedUrl.pathname;

    let segmentedPath = path.split('/');

    const method = request.method.toLowerCase();
    const headers = request.headers;

    headers.urlPath = path;

    //First Ensure all Request comes with Origin except for GET or Header has Authorization
    let targetOrigin = {};

    if (config.request.checkOrigin === true) {

        targetOrigin = config.request.allowedURLS.filter(origin => {
            return origin.url === headers.origin
        });

        if(targetOrigin.length > 0){
            headers.source = targetOrigin[0].id;
        }
    }

    if('authorization' in headers){

        //Check if Domains allowed to run can make request
        const checkDomainSecurities = await domainSecurity(request);

        if(checkDomainSecurities.status !== 1){

            Payload.renderObject({
                headCode: 406,
                message: checkDomainSecurities.message,
                status: 2,
                code: 'C000-406'
            },
            response);

            return;

        }else{
            request.headers.source = checkDomainSecurities.data.source;
        }

    } else {

        if (method != 'get') {

            if (!headers.hasOwnProperty('origin') || headers.origin === "") {

                Payload.renderObject({
                    headCode: 406,
                    message: 'Unknown Origin',
                    status: 2,
                    code: 'C000-406'
                },
                response);

                return;

            } else {

                if(config.environment != 'production') {
                    response.setHeader('Access-Control-Allow-Origin', '*');
                }else{

                    if(targetOrigin.length === 0){

                        Payload.renderObject({
                            headCode: 406,
                            message: 'Origin not Allowed',
                            status: 2,
                            code: 'C001-406'
                        },
                        response);
                        return;
                    }else{
                        response.setHeader('Access-Control-Allow-Origin', headers.origin);
                    }

                }



            }

        }else{
            response.setHeader('Access-Control-Allow-Origin', '*');
        }

    }

    //Set Response Data
    let allowedMethods = "";

    config.request.allowedMethod.forEach(mthd => {
        allowedMethods = `${allowedMethods}, ${mthd.toUpperCase()}`;
    });

    //Set All the Write Head Method allowed
    response.setHeader('Access-Control-Allow-Methods', allowedMethods);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    response.setHeader('Access-Control-Allow-Credentials', true);

    if(method === 'get' || method === 'head'){
        const queryURL = request.url.split('?')[0];

        request._stout.Query = request.url.split('?')[1];
        request._stout.hasQuery = 1;
        // request.url = queryURL;
    }

    //Block all request outside get if API is not enabled
    if (config.app.api.allow === true) {
        //Check if CORS is allowed then enable OPTIONS
        if (config.request.cors === true) {
            if (method === 'options') {
                response.writeHead(204, headers);
                response.end();
                return;
            }
        }


        //Ensure API Endpoint is available in request
        const apiEndpoint = config.app.api.versionPrefix;

        const publicPath = `${rootpath}/${config.folders.view}`;
        const indexPage = `${publicPath}/${config.response.indexPage}`;
        let notFoundPage = `${publicPath}/${config.response.notFoundPage}`;

        //Framework Error Page if Error Page does not Exist
        const errorFileCheck = fs.existsSync(notFoundPage);
        if (errorFileCheck === false) {
            notFoundPage = `${rootpath}/${config.folders.config}/extras/404.html`;
        }

        let endpointMethod;

        if (segmentedPath[1].includes(apiEndpoint)) {

            const requestData = await Payload.getRequestData(request);

            //@TODO: This is a temporal fix to know what method is called from any where, it will be removed later as we will have a stabbdard non memory tensed way to doing this
            global['requestEndPoint'] = segmentedPath[2];

            try {
                endpointMethod = require(`${rootpath}/${config.folders.controller}/${segmentedPath[1]}/${segmentedPath[2]}`);
            } catch (e) {

                console.log(e);

                Payload.renderObject({
                    headCode: 406,
                    message: 'Invalid Endpoint Path',
                    status: 2,
                    code: 'C005-406'
                },
                response);

                return;
            }

            // console.log(endpointMethod);
            //Run Methid
            const methodClass = new endpointMethod();


            //Hanle Issues with Request coming with Query Params too
            let query = {};

            if(method.toLowerCase() === 'get' || method.toLowerCase() === 'head'){
                // Build Query Body from request Params

                if('Query' in request._stout && request._stout.Query !== undefined){

                    let requestQuery = request._stout.Query;
                    let decodedQuery = decodeURIComponent(requestQuery);
                    // console.log(decodedQuery);


                    //If JSON is sent it will work here
                    try {
                        query = JSON.parse( decodedQuery );
                    } catch (e) {
                        query = false;
                    }


                    if(query === false){

                        try {

                            const pairs = decodedQuery.split('&');
                            let result = {};
                            pairs.forEach(function(pair) {
                                pair = pair.split('=');
                                result[pair[0]] = decodeURIComponent(pair[1] || '');
                            });

                            query = result;


                        } catch (e) {
                            query = false;
                        }

                    }

                }else{
                    query = {};
                }

            }

            try {

                let classMethod = methodClass.methods;
                let requestMethod = classMethod.filter(mth => {
                    return segmentedPath[3] === mth.name && method === mth.method
                });


                if (requestMethod.length > 0) {

                    if(method.toLowerCase() === 'get' || method.toLowerCase() === 'head'){
                        if(request._stout.hasQuery === 1){
                            query = query;
                        }

                        //Merge the Objects if RequestData exists
                        // if(requestData){
                        //     let omitNull = obj => {
                        //         Object.keys(obj).filter(k => obj[k] === null).forEach(k => delete(obj[k]))
                        //         return obj
                        //     }
                        //
                        //     const result = { ...omitNull(requestData), ...omitNull(body) };
                        //
                        //     body = result;
                        // }
                    }


                    //Add All children of query to body
                    if(Object.keys(query).length > 0){
                        let querykeys = Object.keys(query)
                        querykeys.forEach(k => {
                            requestData[k] = query[k];
                        });
                    }

                    const runMethod = await methodClass[segmentedPath[3]]({
                        body: requestData,
                        header: headers,
                        query : query
                    });

                    Payload.renderObject(runMethod, response);

                    // runMethod.then(resp => {
                    // });
                } else {

                    Payload.renderObject({
                            headCode: 406,
                            message: 'Invalid Endpoint Method',
                            status: 2,
                            code: 'C006-406'
                        },
                        response);
                }


            } catch (e) {

                console.log(e);

                Payload.renderObject({
                        headCode: 500,
                        message: 'Error Processing Request',
                        status: 2,
                        code: 'C007-406'
                    },
                    response);

                return;
            }



        } else {

            if (method === 'get') {

                let file = path;

                if (file === '' || file === '/') {
                    file = 'index.html';
                }

                const filePath = `${publicPath}/${file}`;
                const fileCheck = fs.existsSync(filePath);

                if (fileCheck === true) {
                    Payload.renderFile(filePath, response);
                } else {

                    //Render Favicon is not existing
                    let targetFile = file.split('/');
                    targetFile = targetFile[(targetFile.length - 1)];

                    if (targetFile === 'favicon.ico') {
                        Payload.renderFile(`${rootpath}/${config.folders.config}/extras/favicon.ico`, response);
                    } else {
                        Payload.renderFile(notFoundPage, response);
                    }

                }

            } else {
                Payload.renderObject({
                        headCode: 406,
                        message: 'Invalid Endpoint, Please verify and try again',
                        status: 2,
                        code: 'C004-406'
                    },
                    response);
                return;
            }

        }


    } else {
        response.setHeader('Access-Control-Allow-Methods', 'GET');
        if (method !== 'get') {
            Payload.renderObject({
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
