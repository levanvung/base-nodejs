const logger = require('@/configs/config.logger');

/**
 * Global Error Handler Middleware
 * Tất cả error đều đi qua đây
 */
const errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    const message = err.message || 'Internal Server Error';

    // Log server errors
    if (statusCode >= 500) {
        logger.error(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`, {
            stack: err.stack,
            body: req.body,
            params: req.params,
            ip: req.ip,
        });
    } else {
        logger.warn(`[${req.method}] ${req.originalUrl} - ${statusCode} - ${message}`);
    }

    res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = errorHandler;
