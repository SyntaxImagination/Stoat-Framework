/**
 * Module : Middleware
 * Date : 28th Dec, 2022
 * Desc : This is the intermediary file between the Staot Core and User applications 
 */

const fs = require("fs");
const url = require("url");
const http = require("http");
const console = require("console");
const Payload = require("../Helpers/Payload");

const paths = _s.paths,
  config = _s.config,
  security = _s.helpers.Security;

const domainSecurity = security.domainSecurity;

module.exports = async (request, response) => {
  global.__Stoat = {};

  const PayloadHelper = new Payload();

  const urlString = request.url,
    passedUrl = url.parse(urlString, true),
    path = passedUrl.pathname;

  let segmentedPath = path.split("/");

  const method = request.method.toLowerCase(),
    headers = request.headers;

  headers.urlPath = path;

  let targetOrgin = [];

  if (config.requestConf.checkOrigin === true) {
    let allowedUrls = [];

    try {
      let filePath = `${paths._OthersDir}/allowedUrls.txt`;

      const checkFile = fs.existsSync(filePath);

      if (!checkFile) {
        fs.writeFileSync(filePath, "http://localhost");
      }
      const listOfAlllowedUrls = fs.readFileSync(filePath, "utf-8");
      allowedUrls = listOfAlllowedUrls.split(/\r?\n/);
    } catch (error) {
      // console.log(error);
    }

    targetOrgin = allowedUrls.filter((origin) => {
      return origin === headers.origin;
    });

    if (targetOrgin.length > 0) {
      headers.source = targetOrgin[0];
    }
  } else {
    response.setHeader("Access-Control-Allow-Origin", "*");
    if ("origin" in headers) {} else {
      headers.origin = headers.host;
    }
  }

  if ("authorization" in headers) {
    const checkDomainSecurities = await domainSecurity(request);

    if (checkDomainSecurities.status !== 1) {
      PayloadHelper.renderObject({
          headCode: 406,
          message: checkDomainSecurities.message,
          status: 2,
          code: "C000-406",
        },
        response
      );

      return;
    } else {
      request.headers.source = checkDomainSecurities.data.source;
    }
  } else {
    if (method !== "get" && method !== "head") {
      if (!headers.hasOwnProperty("origin") || headers.origin === "") {
        PayloadHelper.renderObject({
            headCode: 406,
            message: "Uknown Origin",
            status: 2,
            code: "C001-406",
          },
          response
        );

        return;
      } else {
        if (config.environment != "production") {
          response.setHeader("Access-Control-Allow-Origin", "*");
          response.setHeader("Application-Environment", config.environment);
        } else {
          if (targetOrgin.length === 0) {
            PayloadHelper.renderObject({
                headCode: 406,
                message: "Origin not Allowed",
                status: 2,
                code: "C002-406",
              },
              response
            );
          } else {
            response.setHeader(
              "Access-Control-Allow-Origin",
              String(headers.origin)
            );
          }
        }
      }
    } else {
      response.setHeader("Access-Control-Allow-Origin", "*");
    }
  }

  let allowedMethods = "";

  config.requestConf.allowedMethods.forEach((method) => {
    allowedMethods = `${allowedMethods}, ${method.toUpperCase()}`;
  });

  response.setHeader("Access-Control-Allow-Method", allowedMethods);
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Credential", String(true));

  if (method === "get" || method === "head") {
    const queryUrl = String(request.url);
    const queryURL = queryUrl.split("?")[0];

    __Stoat["Query"] = queryURL.split("?")[1];
    __Stoat["hasQuery"] = 1;
  }

  if (config.app.api.allow === true) {
    if (config.requestConf.cors === true) {
      if (method === "options") {
        response.writeHead(204, headers);
        response.end();
        return;
      }
    }

    const apiEndpoint = config.app.api.versionPrefix,
      publicPath = `${_s.misc.rootPath}/${paths.view}`,
      indexPage = `${publicPath}/${config.responseConf.indexPage}`;
    let notFoundPage = `${publicPath}/${config.responseConf.notFoundPage}`;

    const errorFileCheck = fs.existsSync(notFoundPage);
    if (errorFileCheck === false) {
      notFoundPage = `${_s.misc.rootPath}/${paths.config}/Public/404.html`;
    }

    let endpointClass = null;

    if (segmentedPath[1].includes(apiEndpoint)) {
      const requestData = await PayloadHelper.getRequestData(request);

      __Stoat["requestEndPoint"] = segmentedPath[2];

      try {
        let module = require(`${_s.misc.rootPath}/${paths.controller}/${segmentedPath[1]}/${segmentedPath[2]}`);

        if (typeof module === "object") {
          for (let key in module) {
            if (key.toLowerCase() === segmentedPath[2].toLowerCase()) {
              endpointClass = module[key];
            }
          }
        } else if (typeof module === "function") {
          endpointClass = module;
        }
      } catch (error) {
        console.log(error);

        PayloadHelper.renderObject({
            headCode: 406,
            message: "Invalid Endpoint Path",
            status: 2,
            code: "C005-406",
          },
          response
        );

        return;
      }

      let methodClass;

      if (endpointClass === null) {
        PayloadHelper.renderObject({
            headCode: 406,
            message: "Invalid Endpoint Path",
            status: 2,
            code: "C005-1-406",
          },
          response
        );
      } else {
        methodClass = new endpointClass();
      }

      let query = {};

      if (method.toLowerCase() === "get" || method.toLowerCase() === "head") {
        if (__Stoat.hasOwnProperty("Query") && __Stoat.Query != undefined) {
          let decodedQuery = decodeURIComponent(__Stoat.Query);

          try {
            query = JSON.parse(decodedQuery);
          } catch (error) {
            query = false;
          }

          if (query === false) {
            try {
              const pairs = decodedQuery.split("&");
              let result = {};

              pairs.forEach((pair) => {
                pair.split("=");
                result[pair[0]] = decodeURIComponent(pair[1] || "");
              });

              query = result;
            } catch (error) {
              query = false;
            }
          }
        }
      } else {
        query = {};
      }

      try {
        let classMethod = methodClass.methods,
          requestMethod;

        try {
          requestMethod = classMethod.filter((mth) => {
            return segmentedPath[3] === mth.name && method === mth.method;
          });
        } catch (error) {
          PayloadHelper.renderObject({
              headCode: 500,
              message: "Endpoint Unavailable",
              status: 2,
              code: "C006-500",
            },
            response
          );

          return;
        }

        if (requestMethod.length > 0) {
          if (
            method.toLowerCase() === "get" ||
            method.toLowerCase() === "head"
          ) {
            if (__Stoat.hasQuery === 1) {
              query = query;
            }
          }

          if (Object.keys(query).length > 0) {
            let queryKeys = Object.keys(query);
            queryKeys.forEach((k) => {
              requestData[k] = query[k];
            });
          }

          let validCallBack = 0;
          const runMethod = methodClass[segmentedPath[3]]({
              body: requestData,
              header: headers,
              query: query,
            },
            (callback) => {
              validCallBack = 1;
              PayloadHelper.renderObject(callback, response);
            }
          );

          if (runMethod instanceof Promise) {
            const feedbackResponse = await runMethod;
            PayloadHelper.renderObject(feedbackResponse, response);
          } else {
            if (validCallBack === 0 && runMethod !== undefined) {
              PayloadHelper.renderObject(runMethod, response);
            }
          }
        } else {
          PayloadHelper.renderObject({
              headCode: 406,
              message: "Invalid Edpoint Method",
              status: 2,
              code: "C007-406",
            },
            response
          );
        }
      } catch (error) {
        PayloadHelper.renderObject({
            headCode: 500,
            message: "Error Processing Request",
            status: 2,
            code: "C008-406",
          },
          response
        );

        return;
      }
    } else {
      if (method === "get") {
        let file = path;

        if (file === "" || file === "/") {
          file = "index.html";
        }

        const filePath = `${paths._PublicPath}/${file}`;
        const fileCheck = fs.existsSync(filePath);

        if (fileCheck === true) {
          PayloadHelper.renderFile(filePath, response);
        } else {
          let targetFile = file.split("/");
          targetFile = targetFile[targetFile.length - 1];

          if (targetFile === "favicon.ico") {
            PayloadHelper.renderFile(
              `${_s.misc.rootPath}/${paths.config}/Public/favicon.ico`,
              response
            );
          } else {
            PayloadHelper.renderFile(notFoundPage, response);
          }
        }
      } else {
        PayloadHelper.renderObject({
            headCode: 406,
            message: "Invalid Endpoint, Please verify and try again",
            status: 2,
            code: "C009-406",
          },
          response
        );
        return;
      }
    }
  } else {
    response.setHeader("Access-Control-Allow-Methods", "GET");

    if (method !== "get") {
      PayloadHelper.renderObject({
          headCode: 406,
          message: "Request Undefined",
          status: 2,
          code: "C003-406",
        },
        response
      );
      return;
    }
  }
};