const express = require('express');
const router = express.Router();

const passport = require('@/configs/config.passport');
const { generateTokens } = require('@/utils/jwt.utils');

const authController = require('@/controllers/auth.controller');
const asyncHandler = require('@/middlewares/asyncHandler')
const tfaController = require('@/controllers/tfa.controller');

const { verifyToken } = require('@/middlewares/auth.middleware')
const { rateLimiter } = require('@/middlewares/rateLimiter')
const { loginLimiter } = require('@/middlewares/loginLitmiter')
/**
 * @swagger
 * /v1/auth/register/send-otp:
 *   post:
 *     summary: Gửi OTP đăng ký tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *     responses:
 *       200:
 *         description: OTP đã gửi thành công
 *       400:
 *         description: Lỗi validation hoặc email đã tồn tại
 * 
 * 
 */

router.post('/register/send-otp', rateLimiter, asyncHandler(authController.registerSendOTP));
router.post('/register/verify-otp', asyncHandler(authController.registerVerifyOTP));

/**
 * @swagger
 * /v1/auth/login:
 *   post:
 *     summary: Gửi OTP đăng ký tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: test@gmail.com
 *     responses:
 *       200:
 *         description: OTP đã gửi thành công
 *       400:
 *         description: Lỗi validation hoặc email đã tồn tại
 * 
 * 
 */
router.post('/login', loginLimiter, asyncHandler(authController.login));

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email' ]}));

router.get('/google/callback',
    passport.authenticate('google', { session: false}),
    async (req, res) => {
        const tokens = generateTokens(req.user);

        res.status(200).json({
            status: 'success',
            message: ' Google Login Succesfully',
            data: {
                user: req.user,
                tokens
            }
        })
    }
)


router.get('/me', verifyToken, asyncHandler(authController.getMe));
router.post('/forgot-password/send-otp',rateLimiter, asyncHandler(authController.forgotPasswordSendOTP));
router.post('/forgot-password/reset-password', asyncHandler(authController.resetPassword));

router.post('/refresh-token', asyncHandler(authController.refreshToken));
router.post('/logout', verifyToken, asyncHandler(authController.logout));
router.post('/change-password', verifyToken, asyncHandler(authController.changePassword));

router.post('/2fa/generate', verifyToken, asyncHandler(tfaController.generate2FA));
router.post('/2fa/verify', verifyToken, asyncHandler(tfaController.verify2FA));
module.exports = router;