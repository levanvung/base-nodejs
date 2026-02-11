// ==================== HTTP Status Codes ====================
const HttpStatus = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER: 500,
};

// ==================== User Roles ====================
const UserRole = {
    USER: 'user',
    ADMIN: 'admin',
    MODERATOR: 'moderator',
};
const ALL_ROLES = Object.values(UserRole);

// ==================== User Status ====================
const UserStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BANNED: 'banned',
};

// ==================== Auth Type ====================
const AuthType = {
    LOCAL: 'local',
    GOOGLE: 'google',
};

// ==================== OTP Types ====================
const OtpType = {
    REGISTER: 'REGISTER',
    FORGOT_PASSWORD: 'FORGOT_PASSWORD',
    LOGIN_2FA: 'LOGIN_2FA',
};

// ==================== OTP Config ====================
const OtpConfig = {
    EXPIRY_MINUTES: 5,
    LENGTH: 6,
};

// ==================== Redis Key Prefixes ====================
const RedisKey = {
    BLACKLIST: 'blacklist',
    LOGIN_FAIL: 'login_fail',
    OTP_LIMIT: 'otp_limit',
    LOGIN_2FA_PENDING: 'login_2fa_pending', // tạm lưu userId chờ xác thực 2FA
};

// ==================== Rate Limit Config ====================
const RateLimit = {
    OTP_MAX_ATTEMPTS: 3,
    OTP_WINDOW_SECONDS: 300,        // 5 phút
    LOGIN_MAX_ATTEMPTS: 5,
    LOGIN_WINDOW_SECONDS: 600,      // 10 phút
};

module.exports = {
    HttpStatus,
    UserRole,
    ALL_ROLES,
    UserStatus,
    AuthType,
    OtpType,
    OtpConfig,
    RedisKey,
    RateLimit,
};
