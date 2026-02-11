const jwt = require('jsonwebtoken');
const prisma = require('@/dbs/init.prisma');
const redisClient = require('@/dbs/init.redis');
const { UnauthorizedError } = require('@/responses');
const { RedisKey } = require('@/constants');

/**
 * Middleware xác thực JWT token
 * Kiểm tra: token có hợp lệ → có bị blacklist → user còn tồn tại → gán req.user
 */
const verifyToken = async (req, res, next) => {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('Không tìm thấy Token. Vui lòng đăng nhập'));
    }

    const token = authHeader.split(' ')[1];

    // 2. Check blacklist (token đã logout)
    const isBlacklisted = await redisClient.exists(`${RedisKey.BLACKLIST}:${token}`);
    if (isBlacklisted) {
        return next(new UnauthorizedError('Token đã bị vô hiệu hóa. Vui lòng đăng nhập lại'));
    }

    try {
        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_KEY);

        // 4. Check user còn tồn tại trong DB
        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                status: true,
                isVerified: true,
            },
        });

        if (!user) {
            return next(new UnauthorizedError('User không tồn tại'));
        }

        // 5. Check trạng thái tài khoản
        if (user.status === 'banned') {
            return next(new UnauthorizedError('Tài khoản đã bị khóa'));
        }
        if (user.status === 'inactive') {
            return next(new UnauthorizedError('Tài khoản đã bị vô hiệu hóa'));
        }

        // 6. Gán user vào request
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Token đã hết hạn'));
        }
        return next(new UnauthorizedError('Token không hợp lệ'));
    }
};

module.exports = { verifyToken };
