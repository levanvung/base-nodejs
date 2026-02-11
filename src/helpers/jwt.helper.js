const jwt = require('jsonwebtoken');

/**
 * Tạo cặp access token + refresh token
 * Payload chỉ chứa id và role (tối thiểu cần thiết)
 */
const generateTokens = (payload) => {
    const accessToken = jwt.sign(
        { id: payload.id, role: payload.role },
        process.env.JWT_ACCESS_KEY,
        { expiresIn: process.env.JWT_ACCESS_EXPIRE || '30m' }
    );

    const refreshToken = jwt.sign(
        { id: payload.id, role: payload.role },
        process.env.JWT_REFRESH_KEY,
        { expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d' }
    );

    return { accessToken, refreshToken };
};

module.exports = { generateTokens };
