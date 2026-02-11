const express = require('express');
const router = express.Router();

const authRoutes = require('@/routes/auth.routes');
const userRoutes = require('@/routes/user.routes');

router.use('/v1/auth', authRoutes);
router.use('/v1/users', userRoutes);

module.exports = router;
