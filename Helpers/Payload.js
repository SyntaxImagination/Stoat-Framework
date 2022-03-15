/*
 **
 **    Author : Syntax Imagination Team
 **    Members : Abayomi Oyewumi
 **    Date : 28 Feb, 2020
 **    Updated : 9th June 2021
 **
 **    The Request Module is needed to handle all requests
 **    Manage what comes in and help format in the right things where needed
 **    Also it will proccess the output and also format things as they go output
 **    This will make proccesses as fast as possible and make our application be stateless, thin and light
 **    Update : Made Object Oriented Class
 */

const mimetype = require('./MimeTypes');
const fs = require('fs');

const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const queryString = require('querystring');

class Payload {
    constructor() {}

    __setRenderHeader(data, response) {
        response.setHeader('ContentType', 'text/plain');

        //Split File
        // data = data.split('/');
        // let fileName = data[(data.length - 1)];
        // fileName = fileName.split('.');
        // const ext = fileName[(fileName.length - 1)];

        for (let x = 0; x < mimetype.length; x++) {
            if (data.indexOf(mimetype[x].file) > -1) {
                response.setHeader('Content-Type', mimetype[x].content);
            }
        }
    }

    //proccess data based on request Type
    async getRequestData(request) {
        let method = request.method.toLowerCase();
        let requestBody = {};

        //Request Method to generate Data
        if (method === 'get' && request.query) {

            let parsedURL = url.parse(request.url, true);
            requestBody = parsedURL.query;

            return requestBody;

        } else { //POST, PUT, HEAD, DELETE etc
            //Prepare decoder
            let decoder = new StringDecoder('utf-8');
            let buffer = "";

            let fileName = new Date().getTime();

            return new Promise((resolve, reject) => {
                request.on('data', data => {
                    buffer += decoder.write(data);
                });

                request.on('end', () => {
                    if (buffer !== "") {
                        //Convert to object as we will be using JSON
                        requestBody = JSON.parse(buffer);
                        // requestBody = queryString.parse(buffer);
                    }
                    return resolve(requestBody);
                })
            });

        }
    }

    renderFile(path, response) {
        this.__setRenderHeader(path, response);

        const fullpath = `${path}`;
        let file;

        try {
            file = fs.readFileSync(fullpath);
        } catch (e) {
            console.log(e);

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

    //Render An Object
    renderObject(data, response) {

        try {
            response.setHeader('Content-Type', 'application/json');

            if (!data.hasOwnProperty('data')) {
                data.data = {};
            }

            if (!data.hasOwnProperty('status')) {
                data.status = 2;
            }

            if (!data.hasOwnProperty('code')) {
                data.code = "";
            }

            if (data.hasOwnProperty('contentType')) {
                response.setHeader('Content-Type', data.contentType);
            }

            response.writeHead(data.headCode);
            response.end(JSON.stringify({
                status: data.status,
                message: data.message,
                data: data.data,
                errorcode: data.code
            }));

        } catch (e) {

            console.log(e);

            setTimeout(function () {

                response.writeHead(500);
                response.end(JSON.stringify({
                    status: 2,
                    message: "Response Error",
                    data: {},
                    errorcode: "P000"
                }));

            }, 5000);

        }

    }

    //Redirect URL
    redirectToWebsite(url, response){
        response.writeHead(301, {
            'Location' : url
        });
        response.end();
    }
}

module.exports = Payload;
