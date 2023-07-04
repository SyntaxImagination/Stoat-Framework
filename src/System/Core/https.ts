const paths = stoat.paths;

import * as https from "https";
import * as http from "http";
import {readFileSync} from 'fs';

type NetStructure = Record<string, any>;

type HttpsRequest = http.IncomingMessage;
type HttpsResponse = http.ServerResponse;

export function run(
    net:NetStructure
){

    const port = Number(net['data'].port);

    if (!isNaN(net['data'].port)) {

        const sslOptions = {
            key: readFileSync(`${_s.misc.rootParent}/${paths.others}/SSL/${net.certKey}`),
            cert: readFileSync(`${_s.misc.rootParent}/${paths.others}/SSL/${net.certPem}`)
        };

        const server = https.createServer(
            sslOptions,
            (request: HttpsRequest, response: HttpsResponse) => {

            try {
                require(`${_s.misc.rootPath}/${paths.config}/App/middleware.js`)(request, response);
            } catch (err) {
                console.log(err);
                console.log('Config Path Invalid');
            }
        });

        server.listen(port, () => {
            console.log(`Stoat HTTPS Started on ${new Date()} | Port: ${port}`);
        });

    }
}