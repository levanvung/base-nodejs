const { SuccessResponse, OkResponse, CreatedResponse } = require('./success.response');
const {
    ErrorResponse,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    TooManyRequestsError,
} = require('./error.response');

module.exports = {
    // Success
    SuccessResponse,
    OkResponse,
    CreatedResponse,
    // Error
    ErrorResponse,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    TooManyRequestsError,
};
