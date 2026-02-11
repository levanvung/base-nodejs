const express = require('express');
const router = express.Router();
const passport = require('@/configs/config.passport');

const AuthController = require('@/controllers/auth.controller');
const TfaController = require('@/controllers/tfa.controller');
const asyncHandler = require('@/middlewares/asyncHandler');
const { verifyToken } = require('@/middlewares/auth.middleware');
const { rateLimiter } = require('@/middlewares/rateLimiter');
const { loginLimiter } = require('@/middlewares/loginLimiter');
const validate = require('@/middlewares/validate');
const AuthService = require('@/services/auth.service');
const { OkResponse } = require('@/responses');

const {
    registerSendOtpSchema,
    registerVerifyOtpSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    refreshTokenSchema,
    verify2faSchema,
    login2faSchema,
} = require('@/validations/auth.validation');

// ==================== Register ====================
router.post('/register/send-otp',
    rateLimiter,
    validate(registerSendOtpSchema),
    asyncHandler(AuthController.registerSendOTP)
);

router.post('/register/verify-otp',
    validate(registerVerifyOtpSchema),
    asyncHandler(AuthController.registerVerifyOTP)
);

// ==================== Login ====================
router.post('/login',
    loginLimiter,
    validate(loginSchema),
    asyncHandler(AuthController.login)
);

router.post('/login/2fa',
    validate(login2faSchema),
    asyncHandler(AuthController.login2FA)
);

// ==================== Google OAuth ====================
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    asyncHandler(async (req, res) => {
        const result = await AuthService.googleOAuthLogin(req.user);
        new OkResponse({
            message: 'Google Login thành công',
            data: result,
        }).send(res);
    })
);

// ==================== Token ====================
router.post('/refresh-token',
    validate(refreshTokenSchema),
    asyncHandler(AuthController.refreshToken)
);

// ==================== Protected Routes (require login) ====================
router.get('/me',
    verifyToken,
    asyncHandler(AuthController.getMe)
);

router.post('/logout',
    verifyToken,
    asyncHandler(AuthController.logout)
);

router.post('/change-password',
    verifyToken,
    validate(changePasswordSchema),
    asyncHandler(AuthController.changePassword)
);

// ==================== Forgot Password ====================
router.post('/forgot-password/send-otp',
    rateLimiter,
    validate(forgotPasswordSchema),
    asyncHandler(AuthController.forgotPasswordSendOTP)
);

router.post('/forgot-password/reset-password',
    validate(resetPasswordSchema),
    asyncHandler(AuthController.resetPassword)
);

// ==================== 2FA ====================
router.post('/2fa/generate',
    verifyToken,
    asyncHandler(TfaController.generate2FA)
);

router.post('/2fa/verify',
    verifyToken,
    validate(verify2faSchema),
    asyncHandler(TfaController.verify2FA)
);

router.post('/2fa/disable',
    verifyToken,
    validate(verify2faSchema),
    asyncHandler(TfaController.disable2FA)
);

module.exports = router;
