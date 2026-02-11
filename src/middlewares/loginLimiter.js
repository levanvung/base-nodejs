const redisClient = require('@/dbs/init.redis');
const { TooManyRequestsError } = require('@/responses');
const { RedisKey, RateLimit } = require('@/constants');

/**
 * Rate limiter cho login requests
 * Giới hạn: tối đa 5 lần login fail trong 10 phút theo IP
 */
const loginLimiter = async (req, res, next) => {
    try {
        const key = `${RedisKey.LOGIN_FAIL}:${req.ip}`;
        const attempts = await redisClient.get(key);

        if (attempts && parseInt(attempts) >= RateLimit.LOGIN_MAX_ATTEMPTS) {
            const ttl = await redisClient.ttl(key);
            throw new TooManyRequestsError(
                `Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${Math.ceil(ttl / 60)} phút`
            );
        }

        next();

    } catch (error) {
        if (error instanceof TooManyRequestsError) {
            return next(error);
        }
        console.error('Login limiter error:', error);
        next();
    }
};

module.exports = { loginLimiter };
