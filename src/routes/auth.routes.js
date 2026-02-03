const express = require('express');
const router = express.Router();

const passport = require('@/configs/config.passport');
const { generateTokens } = require('@/utils/jwt.utils');

const authController = require('@/controllers/auth.controller');
const asyncHandler = require('@/middlewares/asyncHandler')

const { verifyToken } = require('@/middlewares/auth.middleware')
const { rateLimiter } = require('@/middlewares/rateLimiter')
const { loginLimiter } = require('@/middlewares/loginLitmiter')

router.post('/register/send-otp', rateLimiter, asyncHandler(authController.registerSendOTP));
router.post('/register/verify-otp', asyncHandler(authController.registerVerifyOTP));
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
module.exports = router;