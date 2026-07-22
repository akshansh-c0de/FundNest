import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
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
} from '../controllers/userController.js';
import {
    validateRegister,
    validateLogin,
    validateChangePassword,
} from '../validators/authValidators.js';

const router = express.Router();

// Public Authentication Routes
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);
router.post('/verify-2fa-login', verify2faLogin);
router.post('/refresh-token', refreshAccessToken);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected Routes (Require Authentication)
router.get('/profile', authenticate, getUserProfile);
router.get('/dashboard', authenticate, getDashboard);
router.put('/change-password', authenticate, validateChangePassword, changePassword);
router.post('/logout', authenticate, logoutUser);
router.post('/logout-all', authenticate, logoutAllDevices);

// Two-Factor Authentication Management
router.post('/enable-2fa', authenticate, enable2FA);
router.post('/confirm-2fa', authenticate, confirm2FA);
router.post('/disable-2fa', authenticate, disable2FA);

// Session Tracking & Auditing Routes
router.get('/sessions', authenticate, getActiveSessions);
router.delete('/sessions/:id', authenticate, revokeSession);

export default router;
