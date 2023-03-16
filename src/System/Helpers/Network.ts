/**
 * Module : Network Module
 * Desc : The Network Helper is a group of functions to proccess network based activities like sending request, consuming APIs, etc
 * Date : 14th March 2023
 */

import * as http from "http";
import * as https from "https";

// type HttpRequest = http.IncomingMessage;
// type HttpResponse = http.ServerResponse;


import { StringDecoder } from 'string_decoder'

const netPost = async (params: Obj) => {
    params.method = 'POST';
    return await runReturn(params);
}

const netGet = async (params: Obj) => {
    params.method = 'GET';
    return await runReturn(params);
}

const netPatch = async (params: Obj) => {
    params.method = 'PATCH';
    return await runReturn(params);
}

const netPut = async (params: Obj) => {
    params.method = 'PUT';
    return await runReturn(params);
}

const netDelete = async (params: Obj) => {
    params.method = 'DELETE';
    return await runReturn(params);
}

async function runReturn(params: Obj) {
    let response = await processRequest(params);
    return response;
}

function processRequest(params: Obj) {
    
    let method:{ 
        request : Function;
        [key: string]: unknown; 
    };
    
    return new Promise((success, failed) => {
        let response:{
            statusCode : number;
            message : string;
            error : string | unknown;
            internalStatus : number;
            headers : { [key:string] : unknown };
            body: string | { [key:string] : unknown };
        };

        //Get Method
        let url = params.url.split('://');

        switch (url[0]) {
            case 'http':
                method = http;
                break;

            case 'https':
                method = https;
                break;

            // case 'ws':
            //     method = ws;
            //     break;

            // case 'wss': 
            //     method = wss;
            //     break;
        }

        //Convert Data to String
        if (params.hasOwnProperty('data')) {
            params.data = JSON.stringify(params.data);
        } else {
            params.data = '{}';
        }

        //Check if there is port
        let urlPort = url[1].split(':');

        let x:string,
        endpoint:string[]|string; 

        [x, ...endpoint] = url[1].split('/');
        endpoint = `/${endpoint.join('/')}`;


        //Build Request Data
        type requestDetailsType = {
            protocol : string;
            hostname : string;
            method : string;
            path : string;
            headers : {
                [key: string]: unknown;  
            };
            [key: string]: unknown;
        }

        let requestDetails:requestDetailsType = {
            protocol: `${url[0]}:`,
            hostname: urlPort[0],
            method: params.method,
            // path: encodeURI(params.endpoint),
            path: encodeURI(endpoint),
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': params.data.length
            }
        }

        //Port
        if (urlPort.length > 0) {
            requestDetails.port = urlPort[1].split('/')[0];
        }


        //Append all headers
        if (params.hasOwnProperty('headers')) {
            for (let key in params.headers) {
                requestDetails.headers[key] = params.headers[key];
            }
        }

        //Add Port if Port isk there
        if (params.hasOwnProperty('port')) {
            for (let key in params.port) {
                requestDetails.port = params.port;
            }
        }

        //Check for any parameter that is not set and add it
        for (let key in params) {
            if (!requestDetails.hasOwnProperty(key)) {

                if (key === 'endpoint' || key === 'url' || key === 'data' || key === 'headers') { } else {
                    requestDetails[key] = params[key];
                }
            }
        }

        // let req = method.request((requestDetails, resp:HttpResponse) => {
        let req = method.request((resp:any) => {

            response.statusCode = resp.statusCode;
            response.message = resp.statusMessage;
            response.headers = resp.headers;

            resp.on('data', (rx:Buffer) => {
                // process.stdout.write(rx);

                let decoder = new StringDecoder('utf8');
                let stringResponse = decoder.write(rx);

                //Since we deal with REST API convert data to Object
                if (typeof stringResponse === 'string') {
                    try {
                        stringResponse = JSON.parse(stringResponse);
                    } catch (e) {
                        // console.log(e);
                        response.statusCode = 2;
                        stringResponse = "";
                    }
                }

                response.body = stringResponse;

                success(response);
            })

        });

        req.on('error', (err:unknown) => {
            response.error = err;
            response.internalStatus = 2;

            success(response);
        });

        req.write(params.data);

        req.end();

    });
}


export {
    netPost,
    netGet,
    netPatch,
    netDelete,
    netPut
}