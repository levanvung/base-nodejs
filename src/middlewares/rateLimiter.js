const redisClient = require('@/dbs/init.redis');
const ErrorResponse = require('@/utils/error.response')
const rateLimiter = async (req, res, next) => {
    const { email } = req.body;

    const key  = `otp_limit:${email}`

    await redisClient.get(key)
    .then(async (value) => {
         if(!value){
          await redisClient.set(key, 1, 'EX', 300)
            next();
         } else if (value < 3) {
            await redisClient.incr(key);
            next();
         } else {
            await redisClient.ttl(key)
            .then((ttl) => {
                if(ttl < 0){
                    redisClient.set(key, 1, 'EX', 300)
                    next();
                } else {
                    next(new ErrorResponse(`Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${ttl} giây.`, 429))
                }
            })
         }
    })
    .catch((err) => {
        console.log(err)
    })
    
}
module.exports = {rateLimiter}