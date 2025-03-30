const paths = _s.paths;

const http = require("http"); 

function run(
    net
){

    const port = Number(net['data'].port);

    if (!isNaN(net['data'].port)) {

        const server = http.createServer((request, response) => {

            try {
                require(`${_s.misc.rootPath}/${paths.config}/App/middleware.js`)(request, response);
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

module.exports = {
    run
};