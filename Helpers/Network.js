/*
 **
 **    Author : Syntax Imagination Team
 **    Date : 28 Feb, 2020
 **
 **    The Network Helper is a group of functions to proccess network based activities like sending request, consuming APIs, etc
 **
 */

const http = require('http');
const https = require('https');
const {
    StringDecoder
} = require('string_decoder');

module.exports = {

    //Send Post Request
    netPost: async (params) => {
        params.method = 'POST';
        let response = await processRequest(params);
        return response;
    },

    //Send Get Request
    netGet: async (params) => {
        params.method = 'GET';
        let response = await processRequest(params);
        return response;
    },

    //Send Patch Request
    netPatch: async (params) => {
        params.method = 'PATCH';
        let response = await processRequest(params);
        return response;
    }

}

//Process The Request
function processRequest(params) {

    return new Promise((success, failed) => {
        let response = {};

        //Get Method
        let url = params.url.split('://');

        switch (url[0]) {
            case 'http':
                method = http;
                break;

            case 'https':
                method = https;
                break;

            case 'ws':
                method = ws;
                break;

            case 'wss':
                method = wss;
                break;
        }

        //Convert Data to String
        if (params.hasOwnProperty('data')) {
            params.data = JSON.stringify(params.data);
        } else {
            params.data = '{}';
        }

        //Check if there is port
        let urlPort = url[1].split(':');

        //Build Request Data
        let requestDetails = {
            protocol: `${url[0]}:`,
            hostname: urlPort[0],
            method: params.method,
            path: encodeURI(params.endpoint),
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': params.data.length
            }
        }

        //Port
        if (urlPort.length > 0) {
            requestDetails.port = urlPort[1];
        }


        //Append all headers
        if (params.hasOwnProperty('headers')) {
            for (key in params.headers) {
                requestDetails.headers[key] = params.headers[key];
            }
        }

        //Add Port if Port isk there
        if (params.hasOwnProperty('port')) {
            for (key in params.port) {
                requestDetails.port = params.port;
            }
        }

        //Check for any parameter that is not set and add it
        for (key in params) {
            if (!requestDetails.hasOwnProperty(key)) {

                if (key === 'endpoint' || key === 'url' || key === 'data' || key === 'headers') {} else {
                    requestDetails[key] = params[key];
                }
            }
        }

        let req = method.request(requestDetails, resp => {

            response.statusCode = resp.statusCode;
            response.message = resp.statusMessage;
            response.headers = resp.headers;

            resp.on('data', rx => {
                  // process.stdout.write(rx);

                  let decoder = new StringDecoder('utf8');
                  let stringResponse = decoder.write(rx);

                  //Since we deal with REST API convert data to Object
                  if(typeof stringResponse === 'string'){
                        try {
                              stringResponse = JSON.parse(stringResponse);
                        } catch (e) {
                              // console.log(e);
                              response.statusCode = 2;
                              stringResponse = {};
                        }
                  }

                  response.body = stringResponse;
                  // console.log(response);

                  success(response);
            })

        });

        req.on('error', err => {
            response.error = err;
            response.internalStatus = 2;

            success(response);
        });

        req.write(params.data);

        req.end();
    });

}
