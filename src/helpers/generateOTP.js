const crypto = require('crypto');
const { OtpConfig } = require('@/constants');

/**
 * Tạo OTP ngẫu nhiên 6 chữ số
 */
const generateOTP = () => {
    const randomOTP = crypto.randomInt(0, Math.pow(10, OtpConfig.LENGTH));
    return randomOTP.toString().padStart(OtpConfig.LENGTH, '0');
};

module.exports = generateOTP;
