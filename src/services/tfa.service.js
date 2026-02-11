const qrcode = require('qrcode');
const { authenticator } = require('otplib');
const prisma = require('@/dbs/init.prisma');
const { BadRequestError } = require('@/responses');

class TfaService {

    /**
     * Generate 2FA secret + QR code
     */
    static async generate2FA(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user.isTwoFactorEnabled) {
            throw new BadRequestError('2FA đã được bật. Vui lòng tắt trước khi tạo mới');
        }

        // Tạo secret ngẫu nhiên
        const secret = authenticator.generateSecret();

        await prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: secret },
        });

        // Tạo QR code URL
        const otpauth = authenticator.keyuri(user.email, 'NodeJS App', secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        return {
            qrcode: qrCodeUrl,
            secret,
        };
    }

    /**
     * Verify 2FA token và bật chính thức
     */
    static async verify2FA(userId, token) {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user.twoFactorSecret) {
            throw new BadRequestError('Chưa tạo 2FA secret. Vui lòng tạo trước');
        }

        if (user.isTwoFactorEnabled) {
            throw new BadRequestError('2FA đã được bật rồi');
        }

        const isValid = authenticator.check(token, user.twoFactorSecret);
        if (!isValid) {
            throw new BadRequestError('Mã 2FA không chính xác');
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isTwoFactorEnabled: true },
        });
    }

    /**
     * Disable 2FA
     */
    static async disable2FA(userId, token) {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user.isTwoFactorEnabled) {
            throw new BadRequestError('2FA chưa được bật');
        }

        // Yêu cầu xác thực lại bằng mã 2FA trước khi tắt
        const isValid = authenticator.check(token, user.twoFactorSecret);
        if (!isValid) {
            throw new BadRequestError('Mã 2FA không chính xác');
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                isTwoFactorEnabled: false,
                twoFactorSecret: null,
            },
        });
    }
}

module.exports = TfaService;
