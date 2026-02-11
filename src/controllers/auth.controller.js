const AuthService = require('@/services/auth.service');
const { OkResponse, CreatedResponse } = require('@/responses');

class AuthController {

    /**
     * POST /auth/register/send-otp
     */
    static registerSendOTP = async (req, res) => {
        await AuthService.registerSendOTP(req.body);

        new OkResponse({
            message: 'OTP đã gửi thành công. Vui lòng kiểm tra email',
        }).send(res);
    };

    /**
     * POST /auth/register/verify-otp
     */
    static registerVerifyOTP = async (req, res) => {
        const user = await AuthService.registerVerifyOTP(req.body);

        new CreatedResponse({
            message: 'Đăng ký tài khoản thành công',
            data: user,
        }).send(res);
    };

    /**
     * POST /auth/login
     */
    static login = async (req, res) => {
        const result = await AuthService.login({
            ...req.body,
            ip: req.ip,
        });

        new OkResponse({
            message: result.requiresTwoFactor
                ? 'Vui lòng nhập mã 2FA'
                : 'Đăng nhập thành công',
            data: result,
        }).send(res);
    };

    /**
     * POST /auth/login/2fa
     */
    static login2FA = async (req, res) => {
        const result = await AuthService.login2FA(req.body);

        new OkResponse({
            message: 'Đăng nhập 2FA thành công',
            data: result,
        }).send(res);
    };

    /**
     * GET /auth/me
     */
    static getMe = async (req, res) => {
        const user = await AuthService.getMe(req.user.id);

        new OkResponse({
            data: { user },
        }).send(res);
    };

    /**
     * POST /auth/forgot-password/send-otp
     */
    static forgotPasswordSendOTP = async (req, res) => {
        await AuthService.forgotPasswordSendOTP(req.body);

        new OkResponse({
            message: 'OTP đã gửi thành công. Vui lòng kiểm tra email',
        }).send(res);
    };

    /**
     * POST /auth/forgot-password/reset-password
     */
    static resetPassword = async (req, res) => {
        await AuthService.resetPassword(req.body);

        new OkResponse({
            message: 'Đặt lại mật khẩu thành công',
        }).send(res);
    };

    /**
     * POST /auth/change-password
     */
    static changePassword = async (req, res) => {
        await AuthService.changePassword({
            userId: req.user.id,
            ...req.body,
        });

        new OkResponse({
            message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại',
        }).send(res);
    };

    /**
     * POST /auth/refresh-token
     */
    static refreshToken = async (req, res) => {
        const tokens = await AuthService.refreshToken(req.body);

        new OkResponse({
            data: tokens,
        }).send(res);
    };

    /**
     * POST /auth/logout
     */
    static logout = async (req, res) => {
        const accessToken = req.headers.authorization?.split(' ')[1];

        await AuthService.logout({
            userId: req.user.id,
            accessToken,
        });

        new OkResponse({
            message: 'Đăng xuất thành công',
        }).send(res);
    };
}

module.exports = AuthController;
