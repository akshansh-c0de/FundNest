import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Session from '../models/sessionModel.js';
import { sendTokenResponse, generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendEmail } from '../utils/emailService.js';
import {
    generate2faSecret,
    generateQrCodeUri,
    verify2faCode,
    generateRecoveryCodes,
} from '../utils/twoFactorHelper.js';

const formatUser = (user) => ({
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
});

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(400, 'An account with this email already exists');
    }

    // Role check: prevent registration as admin
    const targetRole = role && ['investor', 'founder'].includes(role) ? role : 'investor';

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
        name,
        email,
        password,
        role: targetRole,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
    });

    // Send email verification link
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    const emailText = `Welcome to FundNest, ${name}!\n\nPlease verify your email by clicking the link below:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.`;
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #4f46e5;">Welcome to FundNest!</h2>
            <p>Hi ${name},</p>
            <p>Thank you for registering. Please click the button below to verify your email address:</p>
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0;">Verify Email</a>
            <p>If the button doesn't work, copy and paste this link in your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This verification link will expire in 24 hours.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
        </div>
    `;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Verify your email address - FundNest',
            text: emailText,
            html: emailHtml,
        });
    } catch (err) {
        console.error('Email verification sending failed: ', err.message);
    }

    res.status(201).json({
        success: true,
        message: 'Account created successfully. Please check your email to verify your account.',
        user: formatUser(user),
    });
});

// @desc    Verify email token
// @route   GET /api/users/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
        throw new ApiError(400, 'Verification token is required');
    }

    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired email verification token');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now login.',
    });
});

// @desc    Resend email verification link
// @route   POST /api/users/resend-verification
// @access  Public
const resendVerificationEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'No account found with this email');
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, 'This account is already verified');
    }

    // Generate new email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verificationToken}`;
    
    try {
        await sendEmail({
            to: user.email,
            subject: 'Verify your email address - FundNest',
            text: `Please verify your email using this link: ${verificationUrl}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2>Verify Your Email</h2>
                    <p>Click the button below to verify your email address:</p>
                    <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0;">Verify Email</a>
                </div>
            `,
        });
    } catch (err) {
        console.error('Email verification sending failed: ', err.message);
    }

    res.status(200).json({
        success: true,
        message: 'Verification link resent successfully.',
    });
});

// @desc    Login user & get access token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +twoFactorSecret +twoFactorRecoveryCodes');

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Check account locking status
    if (user.lockUntil && user.lockUntil > Date.now()) {
        const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
        throw new ApiError(401, `Account locked due to consecutive failed attempts. Try again in ${remainingMinutes} minutes.`);
    }

    // Verify password
    if (!(await user.matchPassword(password))) {
        await user.incLoginAttempts();
        throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Account has been deactivated');
    }

    // Check email verification (skip in development mode)
    if (process.env.NODE_ENV !== 'development' && !user.isEmailVerified) {
        throw new ApiError(403, 'Please verify your email address before logging in. Check your inbox for the verification link.');
    }

    // Reset login attempts on successful credentials match
    await user.resetLoginAttempts();

    // Check 2FA requirement
    if (user.twoFactorEnabled) {
        // Return a temporary token for 2FA validation
        const tempToken = jwt.sign({ tempId: user._id }, process.env.JWT_SECRET, { expiresIn: '5m' });
        return res.status(200).json({
            success: true,
            require2FA: true,
            tempToken,
        });
    }

    // Handle session creation and set secure cookie
    await sendTokenResponse(user, 200, req, res);
});

// @desc    Verify 2FA TOTP code for Login
// @route   POST /api/users/verify-2fa-login
// @access  Public
const verify2faLogin = asyncHandler(async (req, res) => {
    const { tempToken, code } = req.body;

    if (!tempToken || !code) {
        throw new ApiError(400, 'Temporary token and verification code are required');
    }

    let decoded;
    try {
        decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (err) {
        throw new ApiError(401, 'Invalid or expired temporary session token');
    }

    const user = await User.findById(decoded.tempId).select('+password +twoFactorSecret +twoFactorRecoveryCodes');
    if (!user) {
        throw new ApiError(404, 'User no longer exists');
    }

    // Verify TOTP token OR recovery codes
    const isTotpValid = await verify2faCode(code, user.twoFactorSecret);
    const recoveryCodeIndex = user.twoFactorRecoveryCodes.indexOf(code);

    if (isTotpValid) {
        // Successful TOTP login
        await sendTokenResponse(user, 200, req, res);
    } else if (recoveryCodeIndex !== -1) {
        // Consume the recovery code (remove from user array)
        user.twoFactorRecoveryCodes.splice(recoveryCodeIndex, 1);
        await user.save();
        await sendTokenResponse(user, 200, req, res);
    } else {
        throw new ApiError(401, 'Invalid 2FA code or recovery code');
    }
});

// @desc    Refresh access token (Refresh Token Rotation)
// @route   POST /api/users/refresh-token
// @access  Public
const refreshAccessToken = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new ApiError(401, 'No refresh token provided');
    }

    // Find token in session database
    const session = await Session.findOne({ refreshToken });

    if (!session) {
        // Reuse detection: token might be stolen
        try {
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
            // Revoke all sessions for this compromised user
            await Session.deleteMany({ userId: decoded.id });
        } catch (err) {
            // Token was invalid/expired anyway
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        throw new ApiError(401, 'Session has expired or token reuse detected. All sessions revoked.');
    }

    // Verify current refresh token
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
        // Token verification failed (expired or tampered)
        await session.deleteOne();
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
        await session.deleteOne();
        throw new ApiError(401, 'User no longer exists or is deactivated');
    }

    // Generate new Access and Refresh tokens
    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    // Rotate token in database
    session.refreshToken = newRefreshToken;
    session.lastActive = new Date();
    await session.save();

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
        success: true,
        accessToken: newAccessToken,
    });
});

// @desc    Logout user & remove session
// @route   POST /api/users/logout
// @access  Private
const logoutUser = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        await Session.deleteOne({ refreshToken });
    }

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: 'strict',
    });

    res.status(200).json({
        success: true,
        message: 'Logged out successfully',
    });
});

// @desc    Logout from all devices (revoke all sessions)
// @route   POST /api/users/logout-all
// @access  Private
const logoutAllDevices = asyncHandler(async (req, res) => {
    await Session.deleteMany({ userId: req.user._id });

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: 'strict',
    });

    res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully',
    });
});

// @desc    Request forgot password link
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Anti-enumeration: always return success status even if user does not exist
    if (!user) {
        return res.status(200).json({
            success: true,
            message: 'If a matching account exists, a password reset link has been sent.',
        });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    const emailText = `You requested a password reset. Please use the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.`;
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2>Password Reset Request</h2>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0;">Reset Password</a>
            <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
        </div>
    `;

    try {
        await sendEmail({
            to: user.email,
            subject: 'Password Reset - FundNest',
            text: emailText,
            html: emailHtml,
        });
    } catch (err) {
        console.error('Password reset email failed: ', err.message);
    }

    res.status(200).json({
        success: true,
        message: 'If a matching account exists, a password reset link has been sent.',
    });
});

// @desc    Reset password using token
// @route   POST /api/users/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        throw new ApiError(400, 'Token and new password are required');
    }

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired password reset token');
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    // Invalidate all active sessions for security when password is reset
    await Session.deleteMany({ userId: user._id });
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.',
    });
});

// @desc    Change Password (for logged in users)
// @route   PUT /api/users/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.matchPassword(currentPassword))) {
        throw new ApiError(401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    // Revoke all other sessions, keeping the current session or generating fresh ones
    await Session.deleteMany({ userId: user._id });
    
    // Send new tokens
    await sendTokenResponse(user, 200, req, res);
});

// @desc    Get user profile details
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        user: formatUser(req.user),
    });
});

// @desc    Get investment dashboard
// @route   GET /api/users/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to your investment dashboard',
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
    });
});

// @desc    Enable Two-Factor Authentication
// @route   POST /api/users/enable-2fa
// @access  Private
const enable2FA = asyncHandler(async (req, res) => {
    if (req.user.twoFactorEnabled) {
        throw new ApiError(400, 'Two-Factor Authentication is already enabled');
    }

    const { secret, otpauthUrl } = generate2faSecret(req.user.email);
    const qrCodeUri = await generateQrCodeUri(otpauthUrl);

    // Save secret temporarily on user model but do not enable 2FA yet
    const user = await User.findById(req.user._id);
    user.twoFactorSecret = secret;
    await user.save();

    res.status(200).json({
        success: true,
        secret,
        qrCodeUri,
    });
});

// @desc    Confirm and verify 2FA enablement
// @route   POST /api/users/confirm-2fa
// @access  Private
const confirm2FA = asyncHandler(async (req, res) => {
    const { code } = req.body;

    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user.twoFactorSecret) {
        throw new ApiError(400, '2FA setup was not initiated');
    }

    const isValid = await verify2faCode(code, user.twoFactorSecret);
    if (!isValid) {
        throw new ApiError(400, 'Invalid verification code. 2FA not enabled.');
    }

    const recoveryCodes = generateRecoveryCodes(8);
    user.twoFactorEnabled = true;
    user.twoFactorRecoveryCodes = recoveryCodes;
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Two-Factor Authentication enabled successfully',
        recoveryCodes,
    });
});

// @desc    Disable Two-Factor Authentication
// @route   POST /api/users/disable-2fa
// @access  Private
const disable2FA = asyncHandler(async (req, res) => {
    const { code } = req.body;

    const user = await User.findById(req.user._id).select('+twoFactorSecret');
    if (!user.twoFactorEnabled) {
        throw new ApiError(400, 'Two-Factor Authentication is not enabled');
    }

    const isValid = await verify2faCode(code, user.twoFactorSecret);
    if (!isValid) {
        throw new ApiError(400, 'Invalid verification code. 2FA remains enabled.');
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = undefined;
    user.twoFactorRecoveryCodes = [];
    await user.save();

    res.status(200).json({
        success: true,
        message: 'Two-Factor Authentication disabled successfully',
    });
});

// @desc    Get active login sessions
// @route   GET /api/users/sessions
// @access  Private
const getActiveSessions = asyncHandler(async (req, res) => {
    const sessions = await Session.find({ userId: req.user._id }).sort({ lastActive: -1 });

    const currentToken = req.cookies.refreshToken;

    const formattedSessions = sessions.map((s) => ({
        id: s._id,
        device: s.device,
        browser: s.browser,
        ipAddress: s.ipAddress,
        lastActive: s.lastActive,
        isCurrent: s.refreshToken === currentToken,
    }));

    res.status(200).json({
        success: true,
        sessions: formattedSessions,
    });
});

// @desc    Revoke specific user session
// @route   DELETE /api/users/sessions/:id
// @access  Private
const revokeSession = asyncHandler(async (req, res) => {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });

    if (!session) {
        throw new ApiError(404, 'Session not found');
    }

    const currentToken = req.cookies.refreshToken;
    const isCurrentSession = session.refreshToken === currentToken;

    await session.deleteOne();

    if (isCurrentSession) {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });
    }

    res.status(200).json({
        success: true,
        message: 'Session revoked successfully',
        loggedOutCurrent: isCurrentSession,
    });
});

export {
    registerUser,
    verifyEmail,
    resendVerificationEmail,
    loginUser,
    verify2faLogin,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices,
    forgotPassword,
    resetPassword,
    changePassword,
    getUserProfile,
    getDashboard,
    enable2FA,
    confirm2FA,
    disable2FA,
    getActiveSessions,
    revokeSession,
};
