global.rootpath = __dirname;
const { env } = require('process');

const configFile = '.config';

const fs = require('fs');

let config;

config = fs.readFileSync(`${rootpath}/bin/${configFile}`, 'utf-8');
if (typeof (config) === 'string') {
    config = JSON.parse(config);
}

let httpConfig, httpsConfig, wsConfig, wssConfig, socketIOConfig,
    socketIOConnection = 0, webSocketConnection = 0;

config.net.forEach(item => {
    for (key in item) {
        if (key === 'http') {
            httpConfig = item;
        } else if (key === 'https') {
            httpsConfig = item;
        } else if (key === 'ws') {
            wsConfig = item;
        } else if (key === 'wss') {
            wssConfig = item;
        } else if (key === 'socketio') {
            socketIOConfig = item;
        }
    }
});

if (httpConfig.http === true || httpConfig.https === true) {

    try {

        //Globalize Config
        global.config = config;

        global.db = {};

        //Connected to Database
        config.db.forEach((db) => {
            require(`${rootpath}/${config.folders.model}/${db.package}/${db.file}`)(db);
        });

        //Net Connections
        config.net.forEach((net) => {

            for (key in net) {
                if (key !== 'data') {

                    //HTTP
                    if (key === 'http' && net[key] === true) {
                        const http = require('http');
                        const port = Number(net['data'].port);

                        if (!isNaN(net['data'].port)) {


                            const server = http.createServer((request, response) => {

                                try {
                                    require(`${rootpath}/${config.folders.config}/index.js`);
                                    require(`${rootpath}/${config.folders.controller}/middleware.js`)(request, response);
                                } catch (err) {
                                    console.log(err);
                                    console.log('Config Path Invalid');
                                }
                            });

                            server.listen(port, () => {
                                console.log(`Started on ${new Date()}`);
                            });

                        }
                    }


                }
            }

        });


    } catch (e) {
        console.log(e);
        console.log('Error : Application cannot start, no config file defined / config file not found');
    }

}

if (
    wsConfig.ws === true ||
    wsConfig.ws === 'true' ||
    wsConfig.wss === true ||
    wsConfig.wss === 'true'
) {
    const Websocket = require(`${rootpath}/${config.folders.helpers}/Websocket.js`);
    // const SocketIO = require(`${rootpath}/${config.folders.helpers}/SocketIO.js`);

    if (wsConfig.ws === true) {
        new Websocket().startSocket(wsConfig);
        // new SocketIO().startServer(wsConfig);
    }
    else if (wsConfig.wss === true) {
        new Websocket().startServer(wssConfig);
    }

}
