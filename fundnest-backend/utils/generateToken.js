import jwt from 'jsonwebtoken';
import Session from '../models/sessionModel.js';
import { parseSessionDetails } from './sessionHelper.js';

const generateAccessToken = (userId, role) => {
    return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    });
};

const generateRefreshToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
};

const getRefreshCookieOptions = (req, includeMaxAge = true) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isHttps = Boolean(
        isProduction ||
        req?.secure ||
        req?.headers?.['x-forwarded-proto'] === 'https'
    );

    const options = {
        httpOnly: true,
        secure: isHttps,
        // Cross-origin deployments (e.g. Vercel -> Render/Railway) require SameSite=None over HTTPS.
        sameSite: isHttps ? 'none' : 'lax',
    };

    if (includeMaxAge) {
        options.maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days matches refresh token expiry
    }

    return options;
};

const sendTokenResponse = async (user, statusCode, req, res) => {
    const accessToken = generateAccessToken(user._id, user.role);
    const refreshToken = generateRefreshToken(user._id);

    const { device, browser, ipAddress } = parseSessionDetails(req);

    // Create session in the database
    await Session.create({
        userId: user._id,
        refreshToken,
        device,
        browser,
        ipAddress,
    });

    res.cookie('refreshToken', refreshToken, getRefreshCookieOptions(req, true));

    res.status(statusCode).json({
        success: true,
        accessToken,
        token: accessToken, // Backward compatibility for legacy frontend
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            twoFactorEnabled: user.twoFactorEnabled,
            kycStatus: user.kycStatus,
            verificationStatus: user.verificationStatus,
            accountStatus: user.accountStatus,
            createdAt: user.createdAt,
        },
    });
};

export { generateAccessToken, generateRefreshToken, sendTokenResponse, getRefreshCookieOptions };
export default generateAccessToken; // For backward compatibility
