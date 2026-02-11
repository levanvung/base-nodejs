const { HttpStatus } = require('@/constants');

/**
 * Unified Success Response
 * Dùng cho tất cả response thành công trong toàn bộ ứng dụng
 */
class SuccessResponse {
    constructor({ message = 'Success', statusCode = HttpStatus.OK, data = null, metadata = null }) {
        this.status = 'success';
        this.message = message;
        this.statusCode = statusCode;
        this.data = data;
        this.metadata = metadata;
    }

    send(res) {
        const responseBody = {
            status: this.status,
            message: this.message,
            ...(this.data !== null && { data: this.data }),
            ...(this.metadata !== null && { metadata: this.metadata }),
        };
        return res.status(this.statusCode).json(responseBody);
    }
}

/**
 * 200 OK
 */
class OkResponse extends SuccessResponse {
    constructor({ message = 'Success', data = null, metadata = null }) {
        super({ message, statusCode: HttpStatus.OK, data, metadata });
    }
}

/**
 * 201 Created
 */
class CreatedResponse extends SuccessResponse {
    constructor({ message = 'Created successfully', data = null, metadata = null }) {
        super({ message, statusCode: HttpStatus.CREATED, data, metadata });
    }
}

module.exports = {
    SuccessResponse,
    OkResponse,
    CreatedResponse,
};
