const { HttpStatus } = require('@/constants');

/**
 * Base Error Response
 * Tất cả error đều extends từ class này
 */
class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.status = statusCode;
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message = 'Bad Request') {
        super(message, HttpStatus.BAD_REQUEST);
    }
}

class UnauthorizedError extends ErrorResponse {
    constructor(message = 'Unauthorized') {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}

class ForbiddenError extends ErrorResponse {
    constructor(message = 'Forbidden') {
        super(message, HttpStatus.FORBIDDEN);
    }
}

class NotFoundError extends ErrorResponse {
    constructor(message = 'Not Found') {
        super(message, HttpStatus.NOT_FOUND);
    }
}

class ConflictError extends ErrorResponse {
    constructor(message = 'Conflict') {
        super(message, HttpStatus.CONFLICT);
    }
}

class TooManyRequestsError extends ErrorResponse {
    constructor(message = 'Too Many Requests') {
        super(message, HttpStatus.TOO_MANY_REQUESTS);
    }
}

module.exports = {
    ErrorResponse,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    TooManyRequestsError,
};
