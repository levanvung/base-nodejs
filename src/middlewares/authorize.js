const { ForbiddenError } = require('@/responses');

/**
 * Middleware phân quyền theo role
 * Dùng: authorize('admin', 'moderator') → chỉ admin hoặc moderator mới vào được
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ForbiddenError('Không có thông tin user'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(new ForbiddenError(`Bạn không có quyền truy cập. Yêu cầu role: ${allowedRoles.join(', ')}`));
        }

        next();
    };
};

module.exports = authorize;
