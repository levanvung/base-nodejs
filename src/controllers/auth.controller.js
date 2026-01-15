const prisma = require('@/dbs/init.prisma.js');
const generateOTP = require('@/utils/generateOTP');
const { sendMail } = require('@/services/email.service');
const ErrorResponse = require('@/utils/error.response');

// hamf guiwr opt dangw kis 

const registerSendOTP = async (req, res) => {

    const { email } = req.body;

    // validate dau vao

    if(!email) {
        throw new ErrorResponse('Email is required', 400);
    }

    const userCheck = await prisma.user.findUnique({
        where: {
            email: email
        }
    });
    if(userCheck) {
        throw new ErrorResponse('Email is existed', 400);
    }

    // tao opt
    
    const otpCode = generateOTP();

    // lưu vào bảng opt (dùng prisma)

    // nếu là sql raw thì sẽ là insert into , otp

    //prisma tự động convert  thơi gian 
    // expriesAt: lấy thời gian hiện tại cộng thêm 5 phút
    const expriesAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.otp.create({
        data: {
            email: email,
            otpCode: otpCode,
            otpType: 'REGISTER',
            expiresAt: expiresAt
        }
    });

    // guui email 

    
}
