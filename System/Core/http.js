/**
 * Module : HTTP Server
 * PERF-6: keepAliveTimeout and headersTimeout set to avoid connection resets
 *         behind load balancers that use longer idle timeouts.
 */

const http  = require("http");
const paths = _s.paths;

function run(net) {
    const port = Number(net["data"].port);

    if (!isNaN(port)) {
        const server = http.createServer((request, response) => {
            try {
                require(`${_s.misc.rootPath}/${paths.config}/App/middleware.js`)(request, response);
            } catch (err) {
                console.log(err);
                console.log("Config Path Invalid");
            }
        });

        // PERF-6: set above typical load-balancer idle timeout (default is 5 s in Node.js)
        server.keepAliveTimeout = 65000;  // 65 s
        server.headersTimeout   = 66000;  // must be > keepAliveTimeout

        server.listen(port, () => {
            console.log(`Stoat HTTP Started on ${new Date()} | Port : ${port}`);
        });

        return server;
    }
}

module.exports = { run };
