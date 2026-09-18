import express from 'express';
import {
    createTransaction,
    completeTransaction,
    getUserTransactions,
    getTransactionById,
    getAllTransactions,
    getStartupTransactions,
    cancelTransaction,
    getPortfolio,
    getEscrowLedger,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateCreateTransaction } from '../validators/platformValidators.js';

const router = express.Router();

// All transaction routes require authentication
router.use(protect);

// @route   GET /api/transactions/escrow-ledger/:startupId
// @desc    Get transparent escrow balance and release ledger for a startup
// @access  Private
router.get('/escrow-ledger/:startupId', getEscrowLedger);

// @route   POST /api/transactions
// @desc    Create a new investment transaction
// @access  Private (Investor only)
router.post('/', validateCreateTransaction, createTransaction);

// @route   GET /api/transactions
// @desc    Get all transactions for current user
// @access  Private
router.get('/', getUserTransactions);

// @route   GET /api/transactions/portfolio
// @desc    Get investment portfolio for investor
// @access  Private (Investor only)
router.get('/portfolio', getPortfolio);

// @route   GET /api/transactions/all
// @desc    Get all transactions (Admin only)
// @access  Private (Admin only)
router.get('/all', getAllTransactions);

// @route   GET /api/transactions/startup/:startupId
// @desc    Get transactions for a specific startup (Founder/Admin)
// @access  Private (Founder/Admin)
router.get('/startup/:startupId', getStartupTransactions);

// @route   GET /api/transactions/:id
// @desc    Get single transaction details
// @access  Private
router.get('/:id', getTransactionById);

// @route   PUT /api/transactions/:id/complete
// @desc    Complete a transaction (after payment confirmation)
// @access  Private
router.put('/:id/complete', completeTransaction);

// @route   DELETE /api/transactions/:id
// @desc    Cancel a pending transaction
// @access  Private
router.delete('/:id', cancelTransaction);

export default router;
