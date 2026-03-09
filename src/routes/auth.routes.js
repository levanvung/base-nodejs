const express = require('express');
const router = express.Router();
const passport = require('@/configs/config.passport');

const AuthController = require('@/controllers/auth.controller');
const TfaController = require('@/controllers/tfa.controller');
const asyncHandler = require('@/middlewares/asyncHandler');
const { verifyToken } = require('@/middlewares/auth.middleware');
const { rateLimiter } = require('@/middlewares/rateLimiter');
const { loginLimiter } = require('@/middlewares/loginLimiter');
const { otpVerifyLimiter } = require('@/middlewares/otpVerifyLimiter');
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

// ======================== REGISTER ========================

/**
 * @swagger
 * /v1/auth/register/send-otp:
 *   post:
 *     summary: Gửi OTP đăng ký tài khoản
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@gmail.com
 *     responses:
 *       200:
 *         description: OTP đã gửi thành công
 *       400:
 *         description: Email không hợp lệ
 *       409:
 *         description: Email đã được đăng ký
 *       429:
 *         description: Gửi quá nhiều yêu cầu
 */
router.post('/register/send-otp',
    rateLimiter,
    validate(registerSendOtpSchema),
    asyncHandler(AuthController.registerSendOTP)
);

/**
 * @swagger
 * /v1/auth/register/verify-otp:
 *   post:
 *     summary: Xác thực OTP và tạo tài khoản
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, password, username]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@gmail.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 example: "MyPass@123"
 *               username:
 *                 type: string
 *                 example: johndoe
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: OTP sai hoặc hết hạn
 */
router.post('/register/verify-otp',
    otpVerifyLimiter,
    validate(registerVerifyOtpSchema),
    asyncHandler(AuthController.registerVerifyOTP)
);

// ======================== LOGIN ========================

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     summary: Đăng nhập
 *     description: Nếu user bật 2FA, sẽ trả về tempToken thay vì tokens. Dùng tempToken để gọi /login/2fa
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@gmail.com
 *               password:
 *                 type: string
 *                 example: "MyPass@123"
 *     responses:
 *       200:
 *         description: Đăng nhập thành công hoặc yêu cầu 2FA
 *       400:
 *         description: Email/mật khẩu sai, tài khoản bị khóa
 *       429:
 *         description: Đăng nhập sai quá nhiều lần
 */
router.post('/login',
    loginLimiter,
    validate(loginSchema),
    asyncHandler(AuthController.login)
);

/**
 * @swagger
 * /v1/auth/login/2fa:
 *   post:
 *     summary: Xác thực 2FA khi đăng nhập
 *     description: Gửi mã 2FA + tempToken nhận được từ /login để hoàn tất đăng nhập
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tempToken, token]
 *             properties:
 *               tempToken:
 *                 type: string
 *                 description: Temp token nhận từ /login
 *               token:
 *                 type: string
 *                 example: "123456"
 *                 description: Mã 6 số từ app xác thực (Google Authenticator)
 *     responses:
 *       200:
 *         description: Đăng nhập 2FA thành công
 *       400:
 *         description: Mã 2FA sai
 *       401:
 *         description: Phiên 2FA hết hạn
 */
router.post('/login/2fa',
    validate(login2faSchema),
    asyncHandler(AuthController.login2FA)
);

// ======================== GOOGLE OAUTH ========================

/**
 * @swagger
 * /v1/auth/google:
 *   get:
 *     summary: Đăng nhập bằng Google
 *     tags: [Auth - OAuth]
 *     security: []
 *     responses:
 *       302:
 *         description: Redirect đến trang đăng nhập Google
 */
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

/**
 * @swagger
 * /v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth - OAuth]
 *     security: []
 *     responses:
 *       200:
 *         description: Đăng nhập Google thành công, trả về tokens
 */
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

// ======================== TOKEN ========================

/**
 * @swagger
 * /v1/auth/refresh-token:
 *   post:
 *     summary: Làm mới access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Trả về cặp token mới
 *       401:
 *         description: Refresh token không hợp lệ hoặc hết hạn
 */
router.post('/refresh-token',
    validate(refreshTokenSchema),
    asyncHandler(AuthController.refreshToken)
);

// ======================== PROTECTED ROUTES ========================

/**
 * @swagger
 * /v1/auth/me:
 *   get:
 *     summary: Lấy thông tin user đang đăng nhập
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Thông tin user
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/me',
    verifyToken,
    asyncHandler(AuthController.getMe)
);

/**
 * @swagger
 * /v1/auth/logout:
 *   post:
 *     summary: Đăng xuất
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Đăng xuất thành công
 */
router.post('/logout',
    verifyToken,
    asyncHandler(AuthController.logout)
);

/**
 * @swagger
 * /v1/auth/change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 description: "Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số, ký tự đặc biệt"
 *                 example: "NewPass@456"
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công. Tất cả session bị hủy
 *       400:
 *         description: Mật khẩu cũ sai hoặc mật khẩu mới không đủ mạnh
 */
router.post('/change-password',
    verifyToken,
    validate(changePasswordSchema),
    asyncHandler(AuthController.changePassword)
);

// ======================== FORGOT PASSWORD ========================

/**
 * @swagger
 * /v1/auth/forgot-password/send-otp:
 *   post:
 *     summary: Gửi OTP quên mật khẩu
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@gmail.com
 *     responses:
 *       200:
 *         description: OTP đã gửi
 *       400:
 *         description: Email không tồn tại
 *       429:
 *         description: Gửi quá nhiều
 */
router.post('/forgot-password/send-otp',
    rateLimiter,
    validate(forgotPasswordSchema),
    asyncHandler(AuthController.forgotPasswordSendOTP)
);

/**
 * @swagger
 * /v1/auth/forgot-password/reset-password:
 *   post:
 *     summary: Đặt lại mật khẩu bằng OTP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp, newPassword]
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@gmail.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: "NewPass@789"
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công. Tất cả session bị hủy
 *       400:
 *         description: OTP sai hoặc hết hạn
 */
router.post('/forgot-password/reset-password',
    otpVerifyLimiter,
    validate(resetPasswordSchema),
    asyncHandler(AuthController.resetPassword)
);

// ======================== 2FA ========================

/**
 * @swagger
 * /v1/auth/2fa/generate:
 *   post:
 *     summary: Tạo secret 2FA và QR code
 *     tags: [Auth - 2FA]
 *     responses:
 *       200:
 *         description: Trả về QR code và secret key
 *       400:
 *         description: 2FA đã được bật
 */
router.post('/2fa/generate',
    verifyToken,
    asyncHandler(TfaController.generate2FA)
);

/**
 * @swagger
 * /v1/auth/2fa/verify:
 *   post:
 *     summary: Xác thực mã 2FA và bật tính năng
 *     tags: [Auth - 2FA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Bật 2FA thành công
 *       400:
 *         description: Mã 2FA sai
 */
router.post('/2fa/verify',
    verifyToken,
    validate(verify2faSchema),
    asyncHandler(TfaController.verify2FA)
);

/**
 * @swagger
 * /v1/auth/2fa/disable:
 *   post:
 *     summary: Tắt xác thực 2FA
 *     tags: [Auth - 2FA]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "123456"
 *                 description: Mã 2FA hiện tại để xác nhận tắt
 *     responses:
 *       200:
 *         description: Tắt 2FA thành công
 *       400:
 *         description: Mã 2FA sai hoặc 2FA chưa bật
 */
router.post('/2fa/disable',
    verifyToken,
    validate(verify2faSchema),
    asyncHandler(TfaController.disable2FA)
);

module.exports = router;
