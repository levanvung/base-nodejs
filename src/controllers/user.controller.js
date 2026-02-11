const UserService = require('@/services/user.service');
const { OkResponse } = require('@/responses');

class UserController {

    /**
     * GET /users?page=1&limit=20
     */
    static getAllUsers = async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const result = await UserService.getAllUsers({ page, limit });

        new OkResponse({
            message: 'Lấy danh sách user thành công',
            data: result.users,
            metadata: result.pagination,
        }).send(res);
    };

    /**
     * GET /users/:id
     */
    static getUserById = async (req, res) => {
        const user = await UserService.getUserById(parseInt(req.params.id));

        new OkResponse({
            message: 'Lấy thông tin user thành công',
            data: user,
        }).send(res);
    };

    /**
     * PUT /users/:id
     */
    static updateUser = async (req, res) => {
        const user = await UserService.updateUser(parseInt(req.params.id), req.body);

        new OkResponse({
            message: 'Cập nhật user thành công',
            data: user,
        }).send(res);
    };

    /**
     * DELETE /users/:id  (soft delete)
     */
    static deleteUser = async (req, res) => {
        await UserService.deleteUser(parseInt(req.params.id), req.user.id);

        new OkResponse({
            message: 'Vô hiệu hóa user thành công',
        }).send(res);
    };

    /**
     * PATCH /users/:id/role
     */
    static updateUserRole = async (req, res) => {
        const user = await UserService.updateUserRole(
            parseInt(req.params.id),
            req.body.role,
            req.user.id
        );

        new OkResponse({
            message: 'Cập nhật role thành công',
            data: user,
        }).send(res);
    };
}

module.exports = UserController;
