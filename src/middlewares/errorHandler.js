const errorHandler = (err, req, res, next) => {

    const statusCode = err.status || 500;

    const message = err.message  || 'Interal Server Error'

    if(statusCode === 500) {
        console.error('SERVER ERROR: ', err);

    }

    res.status(statusCode).json({
        status: 'error',
        code: statusCode,
        message: message, 
        // chỉ hiện stack trace khi ở môi trường dev để debug
        stack: process.env.NODE_ENV === 'development' ?  err.stack : undefined
    });
};

module.exports = errorHandler;