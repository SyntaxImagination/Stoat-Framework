"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
const http = __importStar(require("http"));
function run(net) {
    const port = Number(net['data'].port);
    if (!isNaN(net['data'].port)) {
        const server = http.createServer((request, response) => {
            try {
                require(`${__rootPath}/${config.folders.config}/App/helperPaths.js`);
                require(`${__rootPath}/${config.folders.config}/App/middleware.js`)(request, response);
            }
            catch (err) {
                console.log(err);
                console.log('Config Path Invalid');
            }
        });
        server.listen(port, () => {
            console.log(`Stoat HTTP Started on ${new Date()} | Port : ${port}`);
        });
    }
}
exports.run = run;