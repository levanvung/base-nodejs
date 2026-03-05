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

// Tất cả routes yêu cầu: đăng nhập + role admin
router.use(verifyToken, authorize('admin'));

/**
 * @swagger
 * /v1/users:
 *   get:
 *     summary: Lấy danh sách tất cả users (có phân trang)
 *     tags: [Users (Admin)]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Danh sách users với metadata pagination
 *       403:
 *         description: Không có quyền
 */
router.get('/',
    asyncHandler(UserController.getAllUsers)
);

/**
 * @swagger
 * /v1/users/{id}:
 *   get:
 *     summary: Lấy thông tin 1 user theo ID
 *     tags: [Users (Admin)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thông tin user
 *       404:
 *         description: Không tìm thấy user
 */
router.get('/:id',
    validate(getUserByIdSchema, 'params'),
    asyncHandler(UserController.getUserById)
);

/**
 * @swagger
 * /v1/users/{id}:
 *   put:
 *     summary: Cập nhật thông tin user
 *     tags: [Users (Admin)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy user
 */
router.put('/:id',
    validate(getUserByIdSchema, 'params'),
    validate(updateUserSchema),
    asyncHandler(UserController.updateUser)
);

/**
 * @swagger
 * /v1/users/{id}:
 *   delete:
 *     summary: Vô hiệu hóa user (soft delete)
 *     tags: [Users (Admin)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Vô hiệu hóa thành công
 *       400:
 *         description: Không thể xóa chính mình
 *       404:
 *         description: Không tìm thấy user
 */
router.delete('/:id',
    validate(getUserByIdSchema, 'params'),
    asyncHandler(UserController.deleteUser)
);

/**
 * @swagger
 * /v1/users/{id}/role:
 *   patch:
 *     summary: Cập nhật role user
 *     tags: [Users (Admin)]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin, moderator]
 *     responses:
 *       200:
 *         description: Cập nhật role thành công
 *       400:
 *         description: Role không hợp lệ hoặc đang đổi role chính mình
 *       404:
 *         description: Không tìm thấy user
 */
router.patch('/:id/role',
    validate(getUserByIdSchema, 'params'),
    validate(updateUserRoleSchema),
    asyncHandler(UserController.updateUserRole)
);

module.exports = router;
