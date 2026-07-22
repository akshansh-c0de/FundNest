import express from 'express';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
    getInvestorProfile,
    updateInvestorProfile,
    getRecommendations,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
} from '../controllers/investorController.js';

const router = express.Router();

// All investor routes require authentication and investor role
router.use(authenticate, authorize('investor'));

// Profile Management
router.get('/profile', getInvestorProfile);
router.put('/profile', updateInvestorProfile);

// Recommendations (preference-based startup matching)
router.get('/recommendations', getRecommendations);

// Watchlist Management
router.get('/watchlist', getWatchlist);
router.post('/watchlist/:startupId', addToWatchlist);
router.delete('/watchlist/:startupId', removeFromWatchlist);

export default router;
