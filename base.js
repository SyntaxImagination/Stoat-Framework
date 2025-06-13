//Load Stoat
require('stoatcore');

const path = require('path');
const {readFileSync} = require('fs');
const log = require('console').log;

// If __staotData is not defined, define it and set __stoatData.appType set it to "js"
if (typeof __stoatData === "undefined") {
      global.__stoatData = {};
      __stoatData.appType = "js";
}

//Set Defaults
_s.misc.rootPath = path.join(__dirname);
_s.misc.rootParent = _s.misc.rootPath;

//Run Config into application Memory
const configFile = require('./runStoatConfig');
configData = configFile.runConfig();

var httpConfig = {},
      httpsConfig = {},
      wsConfig = {},
      wssConfig = {},
      socketIOConfig = {},
      socketIOConnection = 0,
      webSocketConnection = 0;

configData.net.forEach(function (item) {
      for (var key in item) {
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

if (
      httpConfig.http === true ||
      httpsConfig.http === true
) {
      try {
            //Database Connections
            if (
                  _s.dbConfig.length > 0
            ) {
                  //Foreach DB check values and load db file
                  _s.dbConfig.forEach(function (database) {
                        if (
                              database.type !== '' ||
                              database.name !== '' ||
                              database.engine !== '' ||
                              database.package !== '' ||
                              database.file !== '' ||
                              database.url !== '' ||
                              database.port > 0
                        ) {
                              try {
                                    require(_s.misc.rootPath + "/" + _s.paths.model + "/dbs/" + database.package + "/" + database.file)(database);

                                    runConnection();
                              } catch (error) {
                                    var runDBInstaller = require(_s.misc.rootPath + "/" + _s.paths.model);
                                    runDBInstaller(_s.dbConfig);

                                    runConnection();
                              }
                        } else {
                              log('Database parameters are not defined or completed');
                              runConnection();
                        }
                  });
            } else {
                  runConnection();
            }

            //Net Connections
            function runConnection() {
                  configData.net.forEach(function (net) {
                        for (var key in net) {
                              if (key !== 'data') {
                                    //HTTP
                                    if (key === 'http' && net[key] === true) {
                                          var httpModule = require("./" + _s.paths.config + "/Core/http.js");

                                          httpModule.run(net);
                                    }

                                    //HTTPS
                                    if (key === 'https' && net[key] === true) {
                                          var httpsModule = require("./" + _s.paths.config + "/Core/https.js");

                                          httpsModule.run(net);
                                    }
                                    //@TODO : Fix the other types

                                    //WEBSOCKET

                                    //SOCKETIO

                              }
                        }
                  });
            }
      } catch (error) {
            log(error);
            log('------------');
            log('Error : Application cannot start, no config file defined / config file not found / Invalid config file');
      }
}