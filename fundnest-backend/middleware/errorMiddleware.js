import ApiError from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue || {})[0];
        message = field === 'email' ? 'An account with this email already exists' : 'Duplicate field value';
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(', ');
    }

    if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid resource identifier';
    }

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

const notFound = (req, res, next) => {
    next(new ApiError(404, `Not found — ${req.originalUrl}`));
};

export { errorHandler, notFound };
