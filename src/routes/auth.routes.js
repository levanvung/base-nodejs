const express = require('express');
const router = express.Router();

const authController = require('@/controllers/auth.controller');
const asyncHandler = require('@/middlewares/asyncHandler')

router.post('/register/send-otp', asyncHandler(authController.registerSendOTP));

module.exports = router;