const prisma = require('@/dbs/init.prisma.js');
const generateOTP = require('@/utils/generateOTP');
const { sendMail } = require('@/services/email.service');
const ErrorResponse = require('@/utils/error.response');
const bcrypt = require('bcryptjs');
const { generateTokens } = require('@/utils/jwt.utils');
const redisClient = require('@/dbs/init.redis');
const { sendEmailToQueue } = require('@/services/queue.service');
const { registerSchema } = require('@/utils/validation');

// hamf guiwr opt dangw kis 

const registerSendOTP = async (req, res) => {

    const { email } = req.body;

    // validate dau vao

   const { error } = registerSchema.validate(req.body);
    if (error) {
        throw new ErrorResponse(error.details[0].message, 400); 
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

    await sendEmailToQueue({
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
     const key = `login_fail:${req.ip}`;
     await redisClient.incr(key);
     await redisClient.expire(key, 600);

     throw new ErrorResponse('Email hoặc mật khẩu không chính xác', 400);
        
    }
    await redisClient.del(`login_fail:${req.ip}`);
    // tạo token 
    const tokens = generateTokens({
        id: user.id, 
        email: user.email,
        username: user.username
    });

    // Save refresh token to DB
    await prisma.keyToken.upsert({
        where: { userId: user.id },
        update: { refreshToken: tokens.refreshToken },
        create: {
            userId: user.id,
            refreshToken: tokens.refreshToken
        }
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


const forgotPasswordSendOTP = async (req, res ) => {
    const { email } = req.body;

    if(!email){
        throw new ErrorResponse('Email là require', 400)
    }
    const userCheck = await prisma.user.findUnique({
        where: {
            email: email
        }
    });
    if(!userCheck){
        throw new ErrorResponse('Email không tồn tại', 400);
    }

    // tạo opt
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otp.create({
        data: {
            email: email,
            otpCode: otpCode,
            otpType: 'FORGOT_PASSWORD',
            expiresAt: expiresAt
        }
    });

    // gửi email
    await sendEmailToQueue({
        to: email,
        subject: 'Mã xác thực quên mật khẩu',
        html: `
        <h1>Mã OTP của bạn là : <b>${otpCode}</b></h1>
        <p>Mã có hiệu lực trong vòng 5 phút.</p>
        <p>Vui lòng không chia sẻ mã này cho ai khác.</p>
        `
    });

    return res.status(200).json({
        status: 'success',
        message: 'OTP đã gửi thành công. Vui lòng kiểm tra email'
    });
}

const resetPassword = async(req, res) => {
    const {email, otp, newPassword} = req.body;

    if(!email || !otp || !newPassword){
        throw new ErrorResponse('Vui lòng nhập đủ thông tin', 400);
    }

    const otpRecord = await prisma.otp.findFirst({
        where: {
            email: email,
            otpCode: otp,
            otpType: 'FORGOT_PASSWORD',
            isUsed: false,
            expiresAt: {
                gte: new Date(Date.now())
            }
        }
    });
    if(!otpRecord){
        throw new ErrorResponse('OTP không chính xác hoặc đã hết hạn', 400);
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // update password
    await prisma.user.update({
        where: {email: email},
        data: {password: hashedPassword}
    });

    // đánh dấu otp đã dùng
    await prisma.otp.update({
        where: {id: otpRecord.id},
        data: {isUsed: true}
    });

    return res.status(200).json({
        status: 'success',
        message: 'Đặt lại mật khẩu thành công'
    });
}

const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new ErrorResponse('Refresh Token is required', 400);

    try {
        const decoded = require('jsonwebtoken').verify(refreshToken, process.env.JWT_REFRESH_KEY);
        
        const keyStore = await prisma.keyToken.findUnique({
             where: { userId: decoded.id }
        });

        if (!keyStore || keyStore.refreshToken !== refreshToken) {
            throw new ErrorResponse('Refresh Token không hợp lệ or đã bị dùng', 401);
        }

        const user = { id: decoded.id, email: decoded.email, username: decoded.username };
        const newTokens = generateTokens(user);

        await prisma.keyToken.update({
            where: { userId: decoded.id },
            data: { refreshToken: newTokens.refreshToken }
        });

        return res.status(200).json({
            status: 'success',
            data: newTokens
        });

    } catch (err) {
        throw new ErrorResponse('Refresh Token hết hạn hoặc không hợp lệ', 403);
    }
}

const logout = async (req, res) => {
    // req.user has been attached by verifyToken
    const userId = req.user.id;
    await prisma.keyToken.delete({
        where: { userId: userId }
    });
    
    const getAccessToken = req.headers.authorization.split(' ')[1];
    const decoded = require('jsonwebtoken').verify(getAccessToken, process.env.JWT_ACCESS_KEY);
    
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
        await redisClient.set(`blacklist:${getAccessToken}`, 1, 'EX', ttl);
    }

    return res.status(200).json({
        status: 'success',
        message: 'Đăng xuất thành công'
    });
}

const changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new ErrorResponse('Vui lòng nhập mật khẩu cũ và mới', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
         throw new ErrorResponse('Mật khẩu cũ không đúng', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    return res.status(200).json({
        status: 'success',
        message: 'Đổi mật khẩu thành công'
    });
}

module.exports = {
    registerSendOTP,
    registerVerifyOTP,
    login,
    getMe,
    forgotPasswordSendOTP,
    resetPassword,
    refreshToken,
    logout,
    changePassword
}
