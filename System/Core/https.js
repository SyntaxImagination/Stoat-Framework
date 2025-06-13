const https = require("https");
const http = require("http");
const {readFileSync} = require("fs");

const paths = stoat.paths;

function run(net) {
  const port = Number(net["data"].port);

  if (!isNaN(net["data"].port)) {
    const sslOptions = {
      key: readFileSync(
        `${_s.misc.rootParent}/${paths.others}/SSL/${net.certKey}`
      ),
      cert: readFileSync(
        `${_s.misc.rootParent}/${paths.others}/SSL/${net.certPem}`
      ),
    };

    const server = https.createServer(sslOptions, (request, response) => {
      try {
        require(`${_s.misc.rootPath}/${paths.config}/App/middleware.js`)(
          request,
          response
        );
      } catch (err) {
        console.log(err);
        console.log("Config Path Invalid");
      }
    });

    server.listen(port, () => {
      console.log(`Stoat HTTPS Started on ${new Date()} | Port: ${port}`);
    });
  }
}

module.exports = {
  run
};