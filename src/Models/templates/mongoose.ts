/**
 * Name :                                                                                                                Mongoose Connector
 * Description : Mongoose is a NodeJS Pakcage that enable easy MongoDB connection
 * Requirement : mongoose - npm install mongoose | yarn install mongoose  
 */

import { log } from 'console';
import mongoose from 'mongoose';

type DatabaseRecord = {
    type: string,
    name: string,
    package: string,
    file: string,
    url: string,
    port: number | string,
    username : string,
    password : string
};

let connection: mongoose.Mongoose;

module.exports = async (dbData:DatabaseRecord) => {

    stoat.db[dbData.name] = {};

    async function connect() {
        try {

            //This is basic connection and can be extended further
            const options = {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                ssl: true,
                authSource: 'admin'
            };

            //Make Connection
            connection = await mongoose.connect(
                `mongodb://${dbData.username}:${dbData.password}@${dbData.url}:${dbData.port}/${dbData.name}`,
                options
            );

            makeConnections();

            
        } catch (error) {
            log(error);
            log('Unable to connect to Database');

            return false;
        }
    }

    await connect();

    //Define all your Schemas / Collections in this function, they will be available globally
    function makeConnections(){
        
        const Schema = mongoose.Schema;
        stoat.db[dbData.name].ObjectId = mongoose.Types.ObjectId; //Object ID will always be available under same  
    
        //Define Collction Schemas - this is a sample, you can delete after
        const schema_sample = new Schema({
            name : String
        });
        schema_sample.set('strict', true);
        stoat.db[dbData.name].schema_sample = connection.model('schema_sample', schema_sample);

    }
}


