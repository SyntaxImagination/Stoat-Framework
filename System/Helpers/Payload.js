/**
 * Module : Core Payload Helper
 * Desc : This Helper will makes it possible to process payloads from the Core
 * Updated : 14th March, 2023
 * 
 *  The Request Module is needed to handle all requests
 *  Manage what comes in and help format in the right things where needed
 *  Also it will proccess the output and also format things as they go output
 *  This will make proccesses as fast as possible and make our application be stateless, thin and light
 * 
*/

const fs = require("fs");
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const http = require("http");
const console = require("console");

const mimetypes = _s.__system.mimeTypes;

class Payload {
  constructor() {}

  __setRenderHeader(data, response) {
    response.setHeader("ContentType", "text/plain");

    for (let x = 0; x < mimetypes.length; x++) {
      if (data.indexOf(mimetypes[x].file) > -1) {
        response.setHeader("Content-Type", mimetypes[x].content);
      }
    }
  }

  async getRequestData(request) {
    let method = request.method?.toLowerCase();
    let requestBody = {};

    if (method === "get" && request.query) {
      let parsedURL = url.parse(request.url, true);
      requestBody = parsedURL.query;

      return requestBody;
    } else {
      let decoder = new StringDecoder("utf-8");
      let buffer = "";

      return new Promise((resolve) => {
        request.on("data", (data) => {
          buffer += decoder.write(data);
        });

        request.on("end", () => {
          if (buffer != "") {
            requestBody = JSON.parse(buffer);
          }

          return resolve(requestBody);
        });
      });
    }
  }

  async renderFile(path, response) {
    this.__setRenderHeader(path, response);

    const fullpath = `${path}`;
    let file;

    try {
      file = fs.readFileSync(fullpath);
    } catch (error) {
      console.log(error);

      response.setHeader("Content-Type", "application/json");
      response.writeHead(500);
      response.end(
        JSON.stringify({
          status: 2,
          message: "Error Reading File",
        })
      );
      return false;
    }

    if (file.length > 0) {
      response.end(file);
    } else {
      response.setHeader("Content-Type", "application/json");
      response.writeHead(500);
      response.end(
        JSON.stringify({
          status: 2,
          message: "Empty File",
        })
      );
    }
  }

  async renderObject(obj, response) {
    try {
      response.setHeader("Content-Type", "application/json");

      if (!obj.hasOwnProperty("data")) {
        obj.data = {};
      }

      if (!obj.hasOwnProperty("status")) {
        obj.status = 2;
      }

      if (!obj.hasOwnProperty("code")) {
        obj.code = "";
      }

      if (obj.hasOwnProperty("contentType")) {
        response.setHeader("Content-Type", obj.contentType);
      }

      response.writeHead(obj.headCode);
      response.end(
        JSON.stringify({
          status: obj.status,
          message: obj.message,
          data: obj.data,
          errorcode: obj.code,
        })
      );
    } catch (error) {
      console.log(error);

      setTimeout(() => {
        response.writeHead(500);
        response.end(
          JSON.stringify({
            status: 2,
            message: "Response Error",
            data: {},
            errorcode: "P000",
          })
        );
      }, 2500);
    }
  }
}

module.exports = Payload;