import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import {
    getStartups,
    getStartupById,
    createStartup,
    updateStartup,
    getFounderAnalytics,
    getStartupAnalytics,
    getStartupMatches,
    submitMilestone,
    verifyMilestone,
    rejectMilestone,
    addMilestone,
    updateMilestone,
    deleteMilestone,
} from '../controllers/startupController.js';
import {
    validateCreateStartup,
    validateMilestone,
    validateMilestoneSubmission,
} from '../validators/platformValidators.js';

const router = express.Router();

// Semantic Investor-Startup Matching (OpenAI Embeddings + Cosine Similarity)
router.get('/matches', authenticate, getStartupMatches);
router.get('/matches/:investorId', authenticate, getStartupMatches);

// Public routes
router.get('/', getStartups);
router.get('/:id', getStartupById);

// Protected routes
router.post('/', authenticate, validateCreateStartup, createStartup);
router.put('/:id', authenticate, updateStartup);
router.get('/analytics/founder', authenticate, getFounderAnalytics);
router.get('/:id/analytics', authenticate, getStartupAnalytics);

// Milestone & Escrow Release Routes
router.post('/:id/milestones', authenticate, validateMilestone, addMilestone);
router.put('/:id/milestones/:milestoneId', authenticate, validateMilestone, updateMilestone);
router.delete('/:id/milestones/:milestoneId', authenticate, deleteMilestone);
router.post('/:id/milestones/:milestoneId/submit', authenticate, validateMilestoneSubmission, submitMilestone);
router.put('/:id/milestones/:milestoneId/verify', authenticate, verifyMilestone);
router.put('/:id/milestones/:milestoneId/reject', authenticate, rejectMilestone);

export default router;
