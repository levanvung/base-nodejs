const { BadRequestError } = require('@/responses');

/**
 * Middleware factory: validate request body với Joi schema
 * Dùng: validate(loginSchema) → sẽ validate req.body theo schema đó
 */
const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = source === 'params' ? req.params : req.body;

        const { error, value } = schema.validate(dataToValidate, {
            abortEarly: false,      // trả về TẤT CẢ lỗi, không dừng ở lỗi đầu tiên
            stripUnknown: true,     // loại bỏ fields không khai báo trong schema
        });

        if (error) {
            const messages = error.details.map((detail) => detail.message).join(', ');
            throw new BadRequestError(messages);
        }

        // Gán lại giá trị đã validate (đã strip unknown fields)
        if (source === 'params') {
            req.params = value;
        } else {
            req.body = value;
        }

        next();
    };
};

module.exports = validate;
