const prisma = require('@/dbs/init.prisma');
const { NotFoundError, BadRequestError } = require('@/responses');
const { ALL_ROLES } = require('@/constants');

class UserService {

    /**
     * Lấy danh sách users có pagination
     */
    static async getAllUsers({ page = 1, limit = 20 }) {
        const skip = (page - 1) * limit;

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    username: true,
                    role: true,
                    status: true,
                    isVerified: true,
                    authType: true,
                    isTwoFactorEnabled: true,
                    createdAt: true,
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.user.count(),
        ]);

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Lấy user theo ID
     */
    static async getUserById(id) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                status: true,
                isVerified: true,
                authType: true,
                isTwoFactorEnabled: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            throw new NotFoundError('Không tìm thấy user');
        }

        return user;
    }

    /**
     * Cập nhật thông tin user (admin)
     */
    static async updateUser(id, { username, email, status }) {
        // Check user tồn tại
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            throw new NotFoundError('Không tìm thấy user');
        }

        // Check email trùng nếu cập nhật email
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({ where: { email } });
            if (emailExists) {
                throw new BadRequestError('Email đã được sử dụng');
            }
        }

        const user = await prisma.user.update({
            where: { id },
            data: { username, email, status },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
                status: true,
            },
        });

        return user;
    }

    /**
     * Soft delete user (đổi status thay vì xóa hẳn)
     */
    static async deleteUser(id, currentAdminId) {
        if (id === currentAdminId) {
            throw new BadRequestError('Không thể xóa chính mình');
        }

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundError('Không tìm thấy user');
        }

        // Soft delete: đổi status sang inactive
        await prisma.user.update({
            where: { id },
            data: { status: 'inactive' },
        });

        // Invalidate sessions
        await prisma.keyToken.deleteMany({ where: { userId: id } });
    }

    /**
     * Cập nhật role user (admin only)
     */
    static async updateUserRole(id, role, currentAdminId) {
        if (id === currentAdminId) {
            throw new BadRequestError('Không thể thay đổi role của chính mình');
        }

        if (!ALL_ROLES.includes(role)) {
            throw new BadRequestError('Role không hợp lệ');
        }

        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            throw new NotFoundError('Không tìm thấy user');
        }

        const user = await prisma.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                email: true,
                username: true,
                role: true,
            },
        });

        return user;
    }
}

module.exports = UserService;
