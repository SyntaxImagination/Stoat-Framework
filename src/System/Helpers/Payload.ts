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

import { MimeTypes } from './MimeTypes';
import { readFileSync } from 'fs';
import { parse } from 'url';
import { StringDecoder } from 'string_decoder';

import { ServerResponse, IncomingMessage } from 'http';
import { log } from 'console';

type HttpRequest = IncomingMessage;
type HttpResponse = ServerResponse;


const mimetypes:{ file:any, content:string }[] = MimeTypes; 


export class Payload {
    constructor(){}

    //Set the Render Header 
    __setRenderHeader(data:string, response:HttpResponse){
        response.setHeader('ContentType', 'text/plain');

        for(
            let x = 0;
            x < mimetypes.length;
            x++
        ){
            if (data.indexOf(mimetypes[x].file) > -1){
                response.setHeader('Content-Type', mimetypes[x].content);
            }
        }   
    }

    //Process data based on request Type
    async getRequestData(request:any){

        let method = request.method?.toLowerCase();
        let requestBody = {};

        if(
            method === 'get'
            && request.query
        ){
            let parsedURL = parse(request.url, true);
            requestBody = parsedURL.query;

            return requestBody;
        }
        //Other Methods
        else{
            let decoder = new StringDecoder('utf-8');
            let buffer = ""; 

            return new Promise(resolve => {
                request.on('data', (data:any) => {
                    buffer += decoder.write(data);
                });

                request.on('end', () => {
                    if(buffer != ""){
                        requestBody = JSON.parse(buffer);
                    }

                    return resolve(requestBody);
                })
            });
        }

    }

    //Render Files for  Display
    async renderFile(path:string, response:HttpResponse){
        this.__setRenderHeader(path, response);
        
        const fullpath = `${path}`;
        let file;

        try {
            file = readFileSync(fullpath);
        } catch (error) {
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
        } else {

            response.setHeader('Content-Type', 'application/json');
            response.writeHead(500);
            // response.statusCode = 200;
            response.end(JSON.stringify({
                status: 2,
                message: "Empty File"
            }));
        }
    }

    //Render Object
    async renderObject(obj:Record<string, any>, response:HttpResponse){

        try {

            response.setHeader('Content-Type', 'application/json');

            if(!obj.hasOwnProperty('data')){
                obj.data = {};
            }

            if(!obj.hasOwnProperty('status')){
                obj.status = 2;
            }

            if(!obj.hasOwnProperty('code')){
                obj.code = '';
            }

            if(obj.hasOwnProperty('contentType')){
                response.setHeader('Content-Type', obj.contentType);
            }

            response.writeHead(obj.headCode);
            response.end(
                JSON.stringify({
                    status : obj.status,
                    message: obj.message,
                    data : obj.data,
                    errorcode : obj.code,
                })
            );
            
        } catch (error) {
            log(error);

            setTimeout(() => {
                response.writeHead(500);
                response.end(
                    JSON.stringify({
                        status : 2,
                        message : "Response Error",
                        data : {},
                        errorcode : "P000"
                    })
                );
            }, 2500);
            
        }

    } 
};