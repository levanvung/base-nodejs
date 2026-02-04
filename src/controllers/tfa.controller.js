const qrcode = require('qrcode')
const { authenticator } = require('otplib');
const prisma = require('@/dbs/init.prisma')
const ErrorResponse = require('@/utils/error.response');


// bật 2fa tạo secret & qr code
const generate2FA = async (req, res) => {
    const user = req.user;

    // taoj secret ngaaux nhien

    const secret = authenticator.generateSecret();

    await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            twoFactorSecret: secret
        }
    })

    // tao ma QR (otpauth: //...)
    // const otpauth = authenticartor.keyuri(user.email, 'NodeJs app;)
    const otpauth = authenticator.keyuri(user.email, 'NodeJS app', secret)

    const imageUrl = await qrcode.toDataURL(otpauth);

    return res.status(200).json({
        status:'success',
        data: {
            qrcode: imageUrl,
            secret: secret
        }
    })

};

const verify2FA = async (req, res) => {
    const { token } = req.body;
    const user = req.user;

    // lay secret tu db

    const userRecord = await prisma.user.findUnique({
        where: {
            id: user.id
        }
    });

    // kiem tra ma
    const isValid = authenticator.check(token, userRecord.twoFactorSecret);

    if (!isValid) {
        throw new ErrorResponse('Ma 2FA khong chinh xac', 400);
    }
    // neu dung -> bat chinh thuc tinh nang 2fa

    await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            isTwoFactorEnabled: true
        }
    });
    return res.status(200).json({
        status: 'success',
        message: 'Bat xac thuc 2 buoc thanh cong'
    });
}
module.exports = {
    generate2FA,
    verify2FA
}