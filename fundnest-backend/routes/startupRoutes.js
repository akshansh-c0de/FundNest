import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    getStartups,
    getStartupById,
    createStartup,
    updateStartup,
    getFounderAnalytics,
    getStartupAnalytics,
    addMilestone,
    updateMilestone,
    deleteMilestone,
} from '../controllers/startupController.js';

const router = express.Router();

// Public routes
router.get('/', getStartups);
router.get('/:id', getStartupById);

// Protected routes
router.post('/', authenticate, createStartup);
router.put('/:id', authenticate, updateStartup);
router.get('/analytics/founder', authenticate, getFounderAnalytics);
router.get('/:id/analytics', authenticate, getStartupAnalytics);

// Milestone routes (Protected, Founder-only verified inside controller)
router.post('/:id/milestones', authenticate, addMilestone);
router.put('/:id/milestones/:milestoneId', authenticate, updateMilestone);
router.delete('/:id/milestones/:milestoneId', authenticate, deleteMilestone);

export default router;
