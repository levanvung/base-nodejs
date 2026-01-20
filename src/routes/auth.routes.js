const express = require('express');
const router = express.Router();

const authController = require('@/controllers/auth.controller');
const asyncHandler = require('@/middlewares/asyncHandler')

const { verifyToken } = require('@/middlewares/auth.middleware')

router.post('/register/send-otp', asyncHandler(authController.registerSendOTP));
router.post('/register/verify-otp', asyncHandler(authController.registerVerifyOTP));
router.post('/login', asyncHandler(authController.login));


router.get('/me', verifyToken, asyncHandler(authController.getMe));
router.post('/forgot-password/send-otp', asyncHandler(authController.forgotPasswordSendOTP));
router.post('/forgot-password/reset-password', asyncHandler(authController.resetPassword));

router.post('/refresh-token', asyncHandler(authController.refreshToken));
router.post('/logout', verifyToken, asyncHandler(authController.logout));
router.post('/change-password', verifyToken, asyncHandler(authController.changePassword));
module.exports = router;