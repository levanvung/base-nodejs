const Joi = require('joi');

// ==================== Reusable Fields ====================

const emailField = Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
});

const passwordField = Joi.string()
    .min(8)
    .max(64)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
        'string.min': 'Mật khẩu phải có ít nhất 8 ký tự',
        'string.max': 'Mật khẩu không được quá 64 ký tự',
        'string.pattern.base': 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (@$!%*?&#)',
        'any.required': 'Mật khẩu là bắt buộc',
    });

const usernameField = Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
        'string.alphanum': 'Username chỉ chứa chữ cái và số',
        'string.min': 'Username phải có ít nhất 3 ký tự',
        'string.max': 'Username không được quá 30 ký tự',
        'any.required': 'Username là bắt buộc',
    });

const otpField = Joi.string()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
        'string.length': 'OTP phải có đúng 6 chữ số',
        'string.pattern.base': 'OTP phải là 6 chữ số',
        'any.required': 'OTP là bắt buộc',
    });

// ==================== Auth Schemas ====================

const registerSendOtpSchema = Joi.object({
    email: emailField,
});

const registerVerifyOtpSchema = Joi.object({
    email: emailField,
    otp: otpField,
    password: passwordField,
    username: usernameField,
});

const loginSchema = Joi.object({
    email: emailField,
    password: Joi.string().required().messages({
        'any.required': 'Mật khẩu là bắt buộc',
    }),
});

const forgotPasswordSchema = Joi.object({
    email: emailField,
});

const resetPasswordSchema = Joi.object({
    email: emailField,
    otp: otpField,
    newPassword: passwordField,
});

const changePasswordSchema = Joi.object({
    oldPassword: Joi.string().required().messages({
        'any.required': 'Mật khẩu cũ là bắt buộc',
    }),
    newPassword: passwordField,
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string().required().messages({
        'any.required': 'Refresh Token là bắt buộc',
    }),
});

// ==================== 2FA Schemas ====================

const verify2faSchema = Joi.object({
    token: Joi.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'string.length': 'Mã 2FA phải có đúng 6 chữ số',
            'string.pattern.base': 'Mã 2FA phải là 6 chữ số',
            'any.required': 'Mã 2FA là bắt buộc',
        }),
});

const login2faSchema = Joi.object({
    token: Joi.string()
        .length(6)
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            'any.required': 'Mã 2FA là bắt buộc',
        }),
    tempToken: Joi.string().required().messages({
        'any.required': 'Temp token là bắt buộc',
    }),
});

// ==================== User Schemas ====================

const updateUserSchema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).optional(),
    email: Joi.string().email().optional(),
    status: Joi.string().valid('active', 'inactive', 'banned').optional(),
}).min(1).messages({
    'object.min': 'Cần ít nhất 1 trường để cập nhật',
});

const updateUserRoleSchema = Joi.object({
    role: Joi.string()
        .valid('user', 'admin', 'moderator')
        .required()
        .messages({
            'any.only': 'Role không hợp lệ. Chỉ chấp nhận: user, admin, moderator',
            'any.required': 'Role là bắt buộc',
        }),
});

const getUserByIdSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID phải là số',
        'number.positive': 'ID phải là số dương',
    }),
});

module.exports = {
    registerSendOtpSchema,
    registerVerifyOtpSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    changePasswordSchema,
    refreshTokenSchema,
    verify2faSchema,
    login2faSchema,
    updateUserSchema,
    updateUserRoleSchema,
    getUserByIdSchema,
};
