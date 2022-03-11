/*
 **
 **     Author : Abayomi Oyewumi
 **     Group : Syntax Imagination - Stout Framework
 **     Date : 11th March 2020
 **
 **    Hello Module to handle actions as regards Hello like world 
 **
 */


class hello {
    constructor() {
        this.methods = [
            { name: 'world', method: 'post', title : "Hello World", allowRole : true }
        ];
    }

    //Register user
    async world(requestData) {

        let data = requestData.body;
        let header = requestData.header;

        console.log(data);
        console.log(header);

        return {
            status : 1,
            message : "Welcome to the world",
            headCode : 400,
            data : {}
        }
    }

 

}

module.exports = hello;
