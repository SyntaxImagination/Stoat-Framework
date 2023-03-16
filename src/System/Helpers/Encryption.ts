/*
 **
 **    Author : Syntax Imagination Team
 **    Date : 14 Mar, 2023
 **
 **    The Encryption Helper provides encryptions methods that normally will be needing plugins
 **
 */

import { 
    createHash,
    createDecipheriv,
    createCipheriv
} from 'crypto';

const algorithm = 'aes192';

// 3Des Encrypt
const threeDESEncrypt = (secretKey:any, text:string) => {

    secretKey = createHash('md5').update(secretKey).digest();
    secretKey = Buffer.concat([secretKey, secretKey.slice(0, 8)]); // properly expand 3DES key from 128 bit to 192 bit

    const cipher = createCipheriv('des-ede3', secretKey, '');
    const encrypted = cipher.update(text, 'utf8', 'base64');

    return encrypted + cipher.final('base64');

}

//3Des Decrypt
const threeDESDecrypt = (secretKey:any, encryptedString:string) => {

    secretKey = createHash('md5').update(secretKey).digest();
    secretKey = Buffer.concat([secretKey, secretKey.slice(0, 8)]); // properly expand 3DES key from 128 bit to 192 bit

    const decipher = createDecipheriv('des-ede3', secretKey, '');

    let decrypted:any = decipher.update(encryptedString, 'base64');
    decrypted += decipher.final();

    return decrypted;
}

//MD5 Encryption
const generateMD5 = (text:string) => {
    return createHash('md5').update(text).digest('hex');
}

//Convert String to Base64
const convertStringToBase64 = (text:string) => {
    const buff = Buffer.from(text, 'utf-8');
    const base64 = buff.toString('base64');

    return base64;
}

//Convert to String to Base64
const convertStringFromBase64 = (base64:string) => {
    const buff = Buffer.from(base64, 'base64');
    const text = buff.toString('utf-8');

    return text;
}

//Hexadecimal to String
const convertHexToString = (hex:string) => {
    var hex = hex.toString();
    var str = '';

    for (var n = 0; n < hex.length; n += 2) {
        str += String.fromCharCode(parseInt(hex.substr(n, 2), 16));
    }
    return str;
}



export {
    threeDESEncrypt,
    threeDESDecrypt,
    generateMD5,
    convertStringToBase64,
    convertStringFromBase64,
    convertHexToString
}

//Export extended Security Module
const dynamicModule = stoat.dynamicImport(`${paths._HelperDir}/Encryption`);
export { dynamicModule };