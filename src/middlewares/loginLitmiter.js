const redisClient = require('@/dbs/init.redis')
const ErrorResponse = require('@/utils/error.response')

const loginLimiter = async (req, res, next) => {
    const ip = req.ip;
    const key = `login_fail:${ip}`;

    const attempts = await redisClient.get(key);
   
    if(attempts && attempts >= 5) {
        return next(new ErrorResponse('Đăng nhập sai quá nhiều lần thử lại sau 10 phút', 429));
    }

    next();
}

module.exports = { loginLimiter };