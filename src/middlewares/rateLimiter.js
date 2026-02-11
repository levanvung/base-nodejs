const redisClient = require('@/dbs/init.redis');
const { TooManyRequestsError } = require('@/responses');
const { RedisKey, RateLimit } = require('@/constants');

/**
 * Rate limiter cho OTP requests
 * Giới hạn: tối đa 3 lần gửi OTP trong 5 phút theo email
 */
const rateLimiter = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return next();

        const key = `${RedisKey.OTP_LIMIT}:${email}`;
        const attempts = await redisClient.get(key);

        if (!attempts) {
            await redisClient.set(key, 1, 'EX', RateLimit.OTP_WINDOW_SECONDS);
            return next();
        }

        if (parseInt(attempts) >= RateLimit.OTP_MAX_ATTEMPTS) {
            const ttl = await redisClient.ttl(key);
            throw new TooManyRequestsError(
                `Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${ttl} giây`
            );
        }

        await redisClient.incr(key);
        next();

    } catch (error) {
        if (error instanceof TooManyRequestsError) {
            return next(error);
        }
        // Nếu Redis lỗi → cho request đi tiếp (graceful degradation)
        console.error('Rate limiter error:', error);
        next();
    }
};

module.exports = { rateLimiter };
