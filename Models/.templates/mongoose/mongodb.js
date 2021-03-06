const mongoose = require('mongoose');

module.exports = (dbParams) => {

    const db = mongoose.createConnection(`mongodb://${dbParams.username}:${dbParams.password}@${dbParams.url}:${dbParams.port}/${dbParams.name}`, {
        useNewUrlParser: true
    });

    const Schema = mongoose.Schema;
    global.ObjectId = mongoose.Types.ObjectId;

}