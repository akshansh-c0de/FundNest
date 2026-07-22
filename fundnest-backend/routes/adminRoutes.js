import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
    getAdminStats,
    getAllUsers,
    updateUserKyc,
    updateUserStatus,
    approveStartup,
    rejectStartup,
    getAdminStartups,
    getAdminTransactions,
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorize('admin'));

// Platform Statistics
router.get('/stats', getAdminStats);

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/kyc', updateUserKyc);
router.put('/users/:id/status', updateUserStatus);

// Startup Management
router.get('/startups', getAdminStartups);
router.put('/startups/:id/approve', approveStartup);
router.put('/startups/:id/reject', rejectStartup);

// Transaction Management
router.get('/transactions', getAdminTransactions);

export default router;
