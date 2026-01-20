const prisma = require('@/dbs/init.prisma.js');
const generateOTP = require('@/utils/generateOTP');
const { sendMail } = require('@/services/email.service');
const ErrorResponse = require('@/utils/error.response');
const bcrypt = require('bcryptjs');
const { generateTokens } = require('@/utils/jwt.utils');

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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.otp.create({
        data: {
            email: email,
            otpCode: otpCode,
            otpType: 'REGISTER',
            expiresAt: expiresAt
        }
    });

    // guui email 

    await sendMail({
        to: email, 
        subject: 'Mã xác thực đăng ký tài khoản',
        html:`
        <h1> Mã OPT của bạn là : <b>${otpCode}</b></h1>
        <p>Mã có hiệu lực trong vòng 5 phút.</p>
        <p>Vui lòng không chia sẻ mã này cho ai khác.</p>
        `
    });

    // trả về kết quả

    return res.status(200).json({
        status: 'success',
        message:'OTP đã gửi thành công. Vui lòng kiểm tra email'
    });
};


const registerVerifyOTP = async (req, res) => {
    const { email, otp, password, username } = req.body;

    // validate dau vào 1 tí nhỉ

    if(!email || !otp || !password || !username){
        throw new ErrorResponse('Vui lòng nhập đủ thông tin (email, opt, pass, username', 400);
    }

    const otpRecord = await prisma.otp.findFirst({
        where: {
            email: email, 
            otpCode: otp, 
            otpType: 'REGISTER',
            isUsed: false,
            expiresAt: {
                gte: new Date(Date.now()) // gt = greater than = lớn hơn thời gian hiện tại
            }
        }
    });
    if(!otpRecord) {
        throw new ErrorResponse('OPT không chính xác hoặc đã hết hạn', 400);
    }

    // hash password để bỏa mật

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
        data: {
            email, 
            username, 
            password: hashedPassword,
            status: 'active',
            isVerified: true
        }
    });

    // đánh dấu otp đã dùng để mất hiệu lực

    await prisma.otp.update({
        where:{id: otpRecord.id},
        data: {isUsed: true }
    });
    
    return res.status(200).json({
        status: 'success',
        message: 'Đăng ký tài khoản thành công',
        data: {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username
        }
    })
}

const login = async (req, res) => {
    const { email, password } = req.body;

    // validate 1 tí

    if(!email || !password) {
        throw new ErrorResponse('Vui lòng nhập tài khoản mật khẩu', 400);
    }

    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    });
    if(!user) {
        throw new ErrorResponse('Email hoặc mật khẩu không chính xác', 400);
    }
    // check pass

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) {
        throw new ErrorResponse('Email hoặc mật khẩu không chính xác', 400);
    }

    // tạo token 
    const tokens = generateTokens({
        id: user.id, 
        email: user.email,
        username: user.username
    });

    return res.status(200).json({
        status: 'success',
        message: ' Đăng nhập thành công ',
        data: {
            user: {id: user.id, email: user.email, username: user.username},
            tokens
        }
    })

}

const getMe = async (req, res) => {
    // req.user đã có sẵn vì đã verifyToken

    return res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
};

module.exports = {
    registerSendOTP,
    registerVerifyOTP,
    login,
    getMe
}
