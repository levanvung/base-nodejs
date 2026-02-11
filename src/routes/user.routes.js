const express = require('express');
const router = express.Router();

const UserController = require('@/controllers/user.controller');
const asyncHandler = require('@/middlewares/asyncHandler');
const { verifyToken } = require('@/middlewares/auth.middleware');
const authorize = require('@/middlewares/authorize');
const validate = require('@/middlewares/validate');

const {
    updateUserSchema,
    updateUserRoleSchema,
    getUserByIdSchema,
} = require('@/validations/auth.validation');

// Tất cả routes đều cần: login + role admin
router.use(verifyToken, authorize('admin'));

router.get('/',
    asyncHandler(UserController.getAllUsers)
);

router.get('/:id',
    validate(getUserByIdSchema, 'params'),
    asyncHandler(UserController.getUserById)
);

router.put('/:id',
    validate(getUserByIdSchema, 'params'),
    validate(updateUserSchema),
    asyncHandler(UserController.updateUser)
);

router.delete('/:id',
    validate(getUserByIdSchema, 'params'),
    asyncHandler(UserController.deleteUser)
);

router.patch('/:id/role',
    validate(getUserByIdSchema, 'params'),
    validate(updateUserRoleSchema),
    asyncHandler(UserController.updateUserRole)
);

module.exports = router;
