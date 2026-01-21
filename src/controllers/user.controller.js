const prisma = require('@/dbs/init.prisma');
const ErrorResponse = require('@/utils/error.response');

const getAllUsers = async (req, res) => {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            username: true, 
            role: true,
            status: true, 
            createdAt: true
        }
    });
    res.status(200).json({
        success: true,
        message: 'Lấy danh sách user thành công',
        data: users
    })
}



const getUserById = async (req, res) => {
    const user = await prisma.user.findUnique({
        where: {id: parseInt(req.params.id)},
        select: {
            id: true,
            email: true,
            username: true,
            role:true,
            status: true,
            isVerifed: true,
            createdAt: true,
            updatedAt: true, 
        }
    });
    if(!user) throw new ErrorResponse('Không tìm thấy user', 404);
    res.status(200).json({
        success: true,
        message: 'Lấy thông tin user thành công',
        data: user
    })
}

const updateUser  = async (req, res) => {
    const { username, email, status } = req.body;

    const user = await prisma.user.update({
        where: {id: parseInt(req.params.id)},
        data: {username, email, status},
        select: {
            id: true,
            email: true,
            username: true,
            role:true,
            status: true,
        }
    });
    res.status(200).json({
        status: 'success',
        data: {user}
    })   ; 
};

const deleteUser = async (req, res) => {
    await prisma.user.delete({
        where: {id: parseInt(req.params.id)}
    });
    res.status(200).json({
        status: 'success',
        message: 'Xóa user thành công'
    });
};


const updateUserRole = async (req, res) => {
    const { role } = req.body;
    if(!['user', 'admin', 'moderator'].includes(role)){
        throw new ErrorResponse('Role không hợp lệ', 400);
    }

    const user = await prisma.user.update({
        where: { id: parseInt(req.params.id)},
        data: {role},
        select: {
            id:true,
            email: true,
            username: true,
            role:true
        }
    });
    res.status(200).josn({
        status: 'success',
        data: {user}
    })
};
module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    updateUserRole 
}