import rateLimit from 'express-rate-limit';

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes window
    max: process.env.NODE_ENV === 'production' ? 30 : 300, // Strict in production, comfortable in dev
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
    standardHeaders: true, // Return rate limit info in standard headers
    legacyHeaders: false, // Disable legacy headers
});

export { authRateLimiter };
