/*
 **
 **    Author : Syntax Imagination Team
 **    Date : 15th Mar, 2022
 **
 **    The General Helper file provides as much as possible resuable helper methods to ease the developers works
 **
 */

const fs = require('fs');


//Generate Random Numbers by providing lenght
const generateRandomNumbers = (len) => {
    let text = "";

    let charset = "1234567890";

    for (let i = 0; i < len; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));

    return text;
}

//Random Numbers and Letters 
const generateNumbersAndLetters = (len) => {
    let randomstrings = '';

    if (!len) {
        len = 30;
    }

    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZ";
    var string_length = len;
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstrings += chars.substring(rnum, rnum + 1);
    }
    return randomstrings;
}

//Radom Letters
const generateRandomLetters = (len) => {
    let text = "";

    let charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let i = 0; i < len; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));

    return text;
}

//Generate Number Bwtween
const generateNumberBetween = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Write base 64 String to File
const writeBase64ToFile = async (base64Data, path, name = false) => {
    let imageData = base64Data.split(';base64,');
    let imageFormat = imageData[0].split('/');

    let photo = imageData[1];
    let format = imageFormat[1];

    switch (format) {
        case 'png':
            format = '.png'
            break;

        case 'jpeg':
            format = '.jpg'
            break;

        case 'jpg':
            format = '.jpg'
            break;

        case 'gif':
            format = '.gif'
            break;
    }

    //Write Image to file
    let fileName = name;
    if(name){
        fileName = generateRandomMixedCharacters(25).toUpperCase();
    }

    try {
        fs.writeFileSync(`${path}/${fileName}${format}`, photo, { encoding: 'base64' });
        return {
            status: 1,
            data: {
                name: `${name}${format}`
            }
        };
    } catch (e) {
        console.log(e);
        return {
            status: 2
        };
    }

}

//Present Readable Date 
const readableDate = d => {
    let date = new Date(d);
    let monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    let day = date.getDate();
    let st = 'th';

    if (Number(day) == 1 || Number(day) == 21 || Number(day) == 31) {
        st = 'st';
    } else if (Number(day) == 2 || Number(day) == 22) {
        st = 'nd';
    } else if (Number(day) == 3 || Number(day) == 23) {
        st = 'rd';
    }

    // let monthIndex = Math.round(date.getMonth()-1);
    let monthIndex = Math.round(date.getMonth());
    let year = date.getFullYear();

    return day + st + ' ' + monthNames[monthIndex] + ' ' + year;
}

//Validate Email 
const validateEmail = (email) => {
    const res = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

    if (res.test(email.toLowerCase())) {
        return (true)
    }

    return false;
}


module.exports = {
    generateRandomNumbers,
    generateNumbersAndLetters,
    generateRandomLetters,
    generateNumberBetween,
    writeBase64ToFile,
    readableDate,
    validateEmail
}