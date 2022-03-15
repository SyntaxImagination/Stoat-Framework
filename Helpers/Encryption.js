/*
 **
 **    Author : Syntax Imagination Team
 **    Date : 15 Mar, 2022
 **
 **    The Encryption Helper provides encryptions methods that normally will be needing plugins
 **
 */

const fs = require('fs');
const crypto = require('crypto'),
    algorithm = 'aes192';

const {
    generateNumberBetween,
    generateRandomMixedCharacters
} = require(_Helper);

//MD5 Encryption
const generateMD5 = (text) => {
    return crypto.createHash('md5').update(text).digest('hex');
}

//Convert String to Base64
const convertStringToBase64 = (text) => {
    const buff = Buffer.from(text, 'utf-8');
    const base64 = buff.toString('base64');

    return base64;
}

//Convert to String to Base64
const convertStringFromBase64 = (base64) => {
    const buff = Buffer.from(base64, 'base64');
    const text = buff.toString('utf-8');

    return text;
}

//Hexadecimal to String
const convertHexToString = (hex) => {
    var hex = hex.toString();
    var str = '';

    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}

// 3Des Encrypt
const threeDESEncrypt = (secretKey, text) => {

    secretKey = crypto.createHash('md5').update(secretKey).digest();
    secretKey = Buffer.concat([secretKey, secretKey.slice(0, 8)]); // properly expand 3DES key from 128 bit to 192 bit

    const cipher = crypto.createCipheriv('des-ede3', secretKey, '');
    const encrypted = cipher.update(text, 'utf8', 'base64');

    return encrypted + cipher.final('base64');

}

//3Des Decrypt
const threeDESDecrypt = (secretKey, encryptedString) => {

    secretKey = crypto.createHash('md5').update(secretKey).digest();
    secretKey = Buffer.concat([secretKey, secretKey.slice(0, 8)]); // properly expand 3DES key from 128 bit to 192 bit

    const decipher = crypto.createDecipheriv('des-ede3', secretKey, '');

    let decrypted = decipher.update(encryptedString, 'base64');
    decrypted += decipher.final();

    return decrypted;
}


module.exports = {
    generateMD5,
    convertStringToBase64,
    convertStringFromBase64,
    convertHexToString,
    threeDESEncrypt,
    threeDESDecrypt
}
