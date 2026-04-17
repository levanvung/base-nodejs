const redisClient = require('@/dbs/init.redis');
const { TooManyRequestsError } = require('@/responses');

const REFRESH_TOKEN_MAX_ATTEMPTS = 10;
const REFRESH_TOKEN_WINDOW_SECONDS = 60;

const refreshTokenLimiter = async (req, res, next) => {
    try {
        const key = `rate_limit:refresh_token:${req.ip}`;
        const attempts = await redisClient.get(key);

        if (!attempts) {
            await redisClient.set(key, 1, 'EX', REFRESH_TOKEN_WINDOW_SECONDS);
            return next();
        }

        if (parseInt(attempts) >= REFRESH_TOKEN_MAX_ATTEMPTS) {
            const ttl = await redisClient.ttl(key);
            throw new TooManyRequestsError(
                `Quá nhiều yêu cầu. Vui lòng thử lại sau ${ttl} giây`
            );
        }

        await redisClient.incr(key);
        next();

    } catch (error) {
        if (error instanceof TooManyRequestsError) {
            return next(error);
        }
        console.error('Refresh token limiter error:', error);
        next();
    }
};

module.exports = { refreshTokenLimiter };