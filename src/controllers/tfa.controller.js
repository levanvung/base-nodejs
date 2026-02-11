const TfaService = require('@/services/tfa.service');
const { OkResponse } = require('@/responses');

class TfaController {

    /**
     * POST /auth/2fa/generate
     */
    static generate2FA = async (req, res) => {
        const data = await TfaService.generate2FA(req.user.id);

        new OkResponse({
            message: 'Tạo 2FA thành công. Quét QR code bằng app xác thực',
            data,
        }).send(res);
    };

    /**
     * POST /auth/2fa/verify
     */
    static verify2FA = async (req, res) => {
        await TfaService.verify2FA(req.user.id, req.body.token);

        new OkResponse({
            message: 'Bật xác thực 2 bước thành công',
        }).send(res);
    };

    /**
     * POST /auth/2fa/disable
     */
    static disable2FA = async (req, res) => {
        await TfaService.disable2FA(req.user.id, req.body.token);

        new OkResponse({
            message: 'Tắt xác thực 2 bước thành công',
        }).send(res);
    };
}

module.exports = TfaController;
