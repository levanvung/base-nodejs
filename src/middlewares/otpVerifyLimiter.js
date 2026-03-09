const redisClient = require('@/dbs/init.redis');
const { TooManyRequestsError } = require('@/responses');
const { RedisKey, RateLimit } = require('@/constants');

/**
 * Rate limiter cho OTP verify requests
 * Giới hạn: tối đa 5 lần nhập sai OTP trong 10 phút theo email
 * 
 * TẠI SAO CẦN CÁI NÀY?
 * - OTP 6 chữ số chỉ có 1 triệu tổ hợp (000000 → 999999)
 * - Nếu không giới hạn, attacker gọi API verify liên tục sẽ đoán đúng OTP trong vài phút
 * - Cần giới hạn theo EMAIL (không phải IP) vì attacker có thể dùng nhiều IP khác nhau
 */
const otpVerifyLimiter = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next();

        const key = `${RedisKey.OTP_VERIFY_FAIL}:${email}`;
        const attempts = await redisClient.get(key);

        if (attempts && parseInt(attempts) >= RateLimit.OTP_VERIFY_MAX_ATTEMPTS) {
            const ttl = await redisClient.ttl(key);
            throw new TooManyRequestsError(
                `Nhập sai OTP quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(ttl / 60)} phút`
            );
        }

        // Lưu ý: KHÔNG tăng counter ở đây
        // Counter sẽ tăng trong service khi OTP sai (xem auth.service.js)
        // Vì nếu OTP đúng thì không nên tính là "fail attempt"
        next();

    } catch (error) {
        if (error instanceof TooManyRequestsError) {
            return next(error);
        }
        console.error('OTP verify limiter error:', error);
        next(); // Graceful degradation nếu Redis lỗi
    }
};

module.exports = { otpVerifyLimiter };
