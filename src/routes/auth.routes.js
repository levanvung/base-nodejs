const express = require('express');
const router = express.Router();

const authController = require('@/controllers/auth.controller');
const asyncHandler = require('@/middlewares/asyncHandler')

router.post('/register/send-otp', asyncHandler(authController.registerSendOTP));
router.post('/register/verify-otp', asyncHandler(authController.registerVerifyOTP));
router.post('/login', asyncHandler(authController.login));
module.exports = router;