const prisma = require('@/dbs/init.prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redisClient = require('@/dbs/init.redis');
const { generateTokens } = require('@/helpers/jwt.helper');
const generateOTP = require('@/helpers/generateOTP');
const { sendEmailToQueue } = require('@/services/queue.service');
const {
    BadRequestError,
    UnauthorizedError,
    ConflictError,
} = require('@/responses');
const { OtpType, OtpConfig, RedisKey, UserStatus } = require('@/constants');

class AuthService {

    // ==================== REGISTER ====================

    /**
     * Bước 1: Gửi OTP đăng ký
     */
    static async registerSendOTP({ email }) {
        // Check email đã tồn tại chưa
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new ConflictError('Email đã được đăng ký');
        }

        // Invalidate tất cả OTP cũ cùng email + type
        await prisma.otp.updateMany({
            where: { email, otpType: OtpType.REGISTER, isUsed: false },
            data: { isUsed: true },
        });

        // Tạo OTP mới
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OtpConfig.EXPIRY_MINUTES * 60 * 1000);

        await prisma.otp.create({
            data: {
                email,
                otpCode,
                otpType: OtpType.REGISTER,
                expiresAt,
            },
        });

        // Gửi email qua queue
        await sendEmailToQueue({
            to: email,
            subject: 'Mã xác thực đăng ký tài khoản',
            html: `
                <h1>Mã OTP của bạn là: <b>${otpCode}</b></h1>
                <p>Mã có hiệu lực trong vòng ${OtpConfig.EXPIRY_MINUTES} phút.</p>
                <p>Vui lòng không chia sẻ mã này cho ai khác.</p>
            `,
        });
    }

    /**
     * Bước 2: Xác thực OTP và tạo tài khoản
     */
    static async registerVerifyOTP({ email, otp, password, username }) {
        // Verify OTP
        const otpRecord = await this._verifyOTP(email, otp, OtpType.REGISTER);

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo user
        const newUser = await prisma.user.create({
            data: {
                email,
                username,
                password: hashedPassword,
                status: UserStatus.ACTIVE,
                isVerified: true,
            },
        });

        // Đánh dấu OTP đã dùng
        await prisma.otp.update({
            where: { id: otpRecord.id },
            data: { isUsed: true },
        });

        return {
            id: newUser.id,
            email: newUser.email,
            username: newUser.username,
        };
    }

    // ==================== LOGIN ====================

    /**
     * Login — nếu user bật 2FA sẽ trả về tempToken thay vì tokens
     */
    static async login({ email, password, ip }) {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || user.authType !== 'local') {
            throw new BadRequestError('Email hoặc mật khẩu không chính xác');
        }

        // Check trạng thái tài khoản
        if (user.status === UserStatus.BANNED) {
            throw new BadRequestError('Tài khoản đã bị khóa. Vui lòng liên hệ admin');
        }
        if (user.status === UserStatus.INACTIVE) {
            throw new BadRequestError('Tài khoản đã bị vô hiệu hóa');
        }
        if (!user.isVerified) {
            throw new BadRequestError('Tài khoản chưa được xác thực. Vui lòng đăng ký lại');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Tăng counter login fail
            const key = `${RedisKey.LOGIN_FAIL}:${ip}`;
            await redisClient.incr(key);
            await redisClient.expire(key, 600);
            throw new BadRequestError('Email hoặc mật khẩu không chính xác');
        }

        // Xóa counter login fail
        await redisClient.del(`${RedisKey.LOGIN_FAIL}:${ip}`);

        // Nếu user bật 2FA → trả tempToken, chờ verify 2FA
        if (user.isTwoFactorEnabled) {
            return this._handleLogin2FAPending(user);
        }

        // Login bình thường → trả tokens
        return this._issueTokens(user);
    }

    /**
     * Login bước 2: Xác thực 2FA
     */
    static async login2FA({ tempToken, token }) {
        // Verify tempToken từ Redis
        const userId = await redisClient.get(`${RedisKey.LOGIN_2FA_PENDING}:${tempToken}`);
        if (!userId) {
            throw new UnauthorizedError('Phiên đăng nhập 2FA đã hết hạn. Vui lòng đăng nhập lại');
        }

        const user = await prisma.user.findUnique({ where: { id: parseInt(userId) } });
        if (!user) {
            throw new UnauthorizedError('User không tồn tại');
        }

        // Verify TOTP code
        const { authenticator } = require('otplib');
        const isValid = authenticator.check(token, user.twoFactorSecret);
        if (!isValid) {
            throw new BadRequestError('Mã 2FA không chính xác');
        }

        // Xóa tempToken khỏi Redis
        await redisClient.del(`${RedisKey.LOGIN_2FA_PENDING}:${tempToken}`);

        // Cấp tokens
        return this._issueTokens(user);
    }

    // ==================== GOOGLE OAUTH ====================

    /**
     * Xử lý sau khi Google OAuth callback thành công
     */
    static async googleOAuthLogin(user) {
        return this._issueTokens(user);
    }

    // ==================== FORGOT PASSWORD ====================

    static async forgotPasswordSendOTP({ email }) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new BadRequestError('Email không tồn tại trong hệ thống');
        }

        // Invalidate OTP cũ
        await prisma.otp.updateMany({
            where: { email, otpType: OtpType.FORGOT_PASSWORD, isUsed: false },
            data: { isUsed: true },
        });

        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + OtpConfig.EXPIRY_MINUTES * 60 * 1000);

        await prisma.otp.create({
            data: { email, otpCode, otpType: OtpType.FORGOT_PASSWORD, expiresAt },
        });

        await sendEmailToQueue({
            to: email,
            subject: 'Mã xác thực quên mật khẩu',
            html: `
                <h1>Mã OTP của bạn là: <b>${otpCode}</b></h1>
                <p>Mã có hiệu lực trong vòng ${OtpConfig.EXPIRY_MINUTES} phút.</p>
                <p>Vui lòng không chia sẻ mã này cho ai khác.</p>
            `,
        });
    }

    static async resetPassword({ email, otp, newPassword }) {
        const otpRecord = await this._verifyOTP(email, otp, OtpType.FORGOT_PASSWORD);

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
        });

        // Đánh dấu OTP đã dùng
        await prisma.otp.update({
            where: { id: otpRecord.id },
            data: { isUsed: true },
        });

        // Invalidate tất cả session (quan trọng bảo mật!)
        const user = await prisma.user.findUnique({ where: { email } });
        await this._invalidateAllSessions(user.id);
    }

    // ==================== CHANGE PASSWORD ====================

    static async changePassword({ userId, oldPassword, newPassword }) {
        const user = await prisma.user.findUnique({ where: { id: userId } });

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            throw new BadRequestError('Mật khẩu cũ không đúng');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        // Invalidate tất cả session sau khi đổi mật khẩu
        await this._invalidateAllSessions(userId);
    }

    // ==================== REFRESH TOKEN ====================

    static async refreshToken({ refreshToken }) {
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);
        } catch {
            throw new UnauthorizedError('Refresh Token hết hạn hoặc không hợp lệ');
        }

        const keyStore = await prisma.keyToken.findUnique({
            where: { userId: decoded.id },
        });

        if (!keyStore || keyStore.refreshToken !== refreshToken) {
            throw new UnauthorizedError('Refresh Token không hợp lệ hoặc đã bị thu hồi');
        }

        // Tạo token mới
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            throw new UnauthorizedError('User không tồn tại');
        }

        const newTokens = generateTokens({ id: user.id, role: user.role });

        await prisma.keyToken.update({
            where: { userId: decoded.id },
            data: { refreshToken: newTokens.refreshToken },
        });

        return newTokens;
    }

    // ==================== LOGOUT ====================

    static async logout({ userId, accessToken }) {
        // Xóa refresh token khỏi DB
        await prisma.keyToken.deleteMany({
            where: { userId },
        });

        // Blacklist access token hiện tại
        try {
            const decoded = jwt.decode(accessToken);
            if (decoded && decoded.exp) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) {
                    await redisClient.set(`${RedisKey.BLACKLIST}:${accessToken}`, '1', 'EX', ttl);
                }
            }
        } catch {
            // Token decode fail thì bỏ qua, đã xóa refresh token rồi
        }
    }

    // ==================== GET ME ====================

    static async getMe(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            throw new UnauthorizedError('User không tồn tại');
        }
        return user;
    }

    // ==================== PRIVATE HELPERS ====================

    /**
     * Verify OTP — dùng chung cho register, forgot password
     */
    static async _verifyOTP(email, otpCode, otpType) {
        const otpRecord = await prisma.otp.findFirst({
            where: {
                email,
                otpCode,
                otpType,
                isUsed: false,
                expiresAt: { gte: new Date() },
            },
        });

        if (!otpRecord) {
            throw new BadRequestError('OTP không chính xác hoặc đã hết hạn');
        }

        return otpRecord;
    }

    /**
     * Tạo và lưu tokens (access + refresh)
     */
    static async _issueTokens(user) {
        const tokens = generateTokens({ id: user.id, role: user.role });

        // Lưu refresh token vào DB
        await prisma.keyToken.upsert({
            where: { userId: user.id },
            update: { refreshToken: tokens.refreshToken },
            create: { userId: user.id, refreshToken: tokens.refreshToken },
        });

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                role: user.role,
            },
            tokens,
        };
    }

    /**
     * Tạo tempToken cho 2FA pending login
     */
    static async _handleLogin2FAPending(user) {
        const crypto = require('crypto');
        const tempToken = crypto.randomBytes(32).toString('hex');

        // Lưu vào Redis, TTL 5 phút
        await redisClient.set(
            `${RedisKey.LOGIN_2FA_PENDING}:${tempToken}`,
            user.id.toString(),
            'EX',
            300
        );

        return {
            requiresTwoFactor: true,
            tempToken,
            message: 'Vui lòng nhập mã 2FA để hoàn tất đăng nhập',
        };
    }

    /**
     * Invalidate tất cả session của 1 user
     * Dùng khi: đổi mật khẩu, reset mật khẩu, bị ban
     */
    static async _invalidateAllSessions(userId) {
        // Xóa refresh token
        await prisma.keyToken.deleteMany({ where: { userId } });

        // Note: Access token vẫn valid cho đến khi hết hạn
        // Trong production nên dùng thêm cơ chế token version hoặc iat check
    }
}

module.exports = AuthService;
