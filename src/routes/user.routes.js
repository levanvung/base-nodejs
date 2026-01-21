const express = require('express');
const router = express.Router();
const userController = require('@/controllers/user.controller');
const asyncHandler = require('@/middlewares/asyncHandler');
const { verifyToken } = require('@/middlewares/auth.middleware');
const authorize = require('@/middlewares/authorize');

// Tất cả routes đều cần token và role admin
router.get('/', verifyToken, authorize('admin'), asyncHandler(userController.getAllUsers));
router.get('/:id', verifyToken, authorize('admin'), asyncHandler(userController.getUserById));
router.put('/:id', verifyToken, authorize('admin'), asyncHandler(userController.updateUser));
router.delete('/:id', verifyToken, authorize('admin'), asyncHandler(userController.deleteUser));
router.patch('/:id/role', verifyToken, authorize('admin'), asyncHandler(userController.updateUserRole));

module.exports = router;
