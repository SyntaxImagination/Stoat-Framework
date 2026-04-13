/**
 * Module : HTTPS Server
 * PERF-6: keepAliveTimeout and headersTimeout set to avoid connection resets
 *         behind load balancers that use longer idle timeouts.
 */

const https            = require("https");
const { readFileSync } = require("fs");

function run(net) {
    const port = Number(net["data"].port);

    if (!isNaN(port)) {
        const sslOptions = {
            key  : readFileSync(`${_s.misc.rootParent}/${_s.paths.others}/SSL/${net.certKey}`),
            cert : readFileSync(`${_s.misc.rootParent}/${_s.paths.others}/SSL/${net.certPem}`),
        };

        const server = https.createServer(sslOptions, (request, response) => {
            try {
                require(`${_s.misc.rootPath}/${_s.paths.config}/App/middleware.js`)(request, response);
            } catch (err) {
                console.log(err);
                console.log("Config Path Invalid");
            }
        });

        // PERF-6: set above typical load-balancer idle timeout
        server.keepAliveTimeout = 65000;  // 65 s
        server.headersTimeout   = 66000;  // must be > keepAliveTimeout

        server.listen(port, () => {
            console.log(`Stoat HTTPS Started on ${new Date()} | Port: ${port}`);
        });
    }
}

module.exports = { run };
