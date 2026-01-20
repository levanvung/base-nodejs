const jwt = require('jsonwebtoken');

const generateTokens = (payload) => {
    // payload thuognwf chứa : id email username

    const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_KEY, {
        expiresIn: process.env.JWT_ACCESS_EXPIRE || '30m'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_KEY, {
        expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
    })

    return { accessToken, refreshToken };
}
module.exports = { generateTokens };