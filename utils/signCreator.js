const crypto = require('crypto');
const ApiCredential = require('../models/ApiCredential');

async function generateSign(time, method) {
    const api = await ApiCredential.findOne();
    const raw = `${time}${api.secretkey}${method}${api.apikey}`;
    return crypto.createHash('md5').update(raw).digest('hex');
}

module.exports = generateSign;
