const crypto = require('crypto');

const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

const csrfProtection = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    if (isSameOrigin(req)) {
        return next();
    }

    const csrfCookie = req.cookies?.[CSRF_COOKIE_NAME];
    const csrfHeader = req.headers[CSRF_HEADER_NAME?.toLowerCase()] || req.headers['x-csrf-token'];

    if (!csrfCookie || !csrfHeader) {
        return res.status(403).json({
            status: 403,
            message: 'CSRF token missing'
        });
    }

    if (csrfCookie !== csrfHeader) {
        return res.status(403).json({
            status: 403,
            message: 'Invalid CSRF token'
        });
    }

    next();
};

const isSameOrigin = (req) => {
    const origin = req.headers.origin || req.headers.referer;
    const host = req.headers.host;
    
    if (!origin) return false;
    
    try {
        const originUrl = new URL(origin);
        const hostUrl = new URL(`http://${host}`);
        return originUrl.hostname === hostUrl.hostname;
    } catch {
        return false;
    }
};

const generateCsrfToken = () => {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
};

const csrfMiddleware = (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        const token = generateCsrfToken();
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 3600000
        });
    }
    next();
};

module.exports = { 
    csrfProtection, 
    csrfMiddleware, 
    generateCsrfToken, 
    CSRF_HEADER_NAME 
};