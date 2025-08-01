const crypto = require('crypto');

async function generateHash(string) {
    return crypto.createHash('md5').update(string).digest('hex');
}

module.exports = generateHash;
