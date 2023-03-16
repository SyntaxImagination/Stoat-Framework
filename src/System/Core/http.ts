const paths = stoat.paths,
    config = stoat.config;

type NetStructure = Obj;

import * as http from "http"; 

type HttpRequest = http.IncomingMessage;
type HttpResponse = http.ServerResponse;

export function run(
    net:NetStructure
){

    const port = Number(net['data'].port);

    if (!isNaN(net['data'].port)) {

        const server = http.createServer((request: HttpRequest, response: HttpResponse) => {

            try {
                require(`${__rootPath}/${config.folders.config}/App/helperPaths.js`);
                require(`${__rootPath}/${config.folders.config}/App/middleware.js`)(request, response);
            } catch (err) {
                console.log(err);
                console.log('Config Path Invalid');
            }
        });

        server.listen(port, () => {
            console.log(`Stoat HTTP Started on ${new Date()} | Port : ${port}`);
        });

    }
}