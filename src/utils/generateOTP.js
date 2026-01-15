const crypto = require('crypto');

const generateOTP = () => {
 const randomOTP = crypto.randomInt(0, 999999);
 const otp = randomOTP.toString().padStart(6, '0');
 return otp;
}
module.exports = generateOTP;
