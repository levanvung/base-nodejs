const ErrorResponse = require('@/utils/error.response');

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if(!allowedRoles.includes(req.user.role)) {
            return next(new ErrorResponse('Bạn không có quyền truy cập', 403));
        }
        next();
    }
}
module.exports = authorize;