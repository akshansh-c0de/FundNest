import mongoose from 'mongoose';
import Transaction from '../models/transactionModel.js';
import Startup from '../models/startupModel.js';
import User from '../models/userModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notificationController.js';


// @desc    Create a new investment transaction
// @route   POST /api/transactions
// @access  Private (Investor only)
const createTransaction = asyncHandler(async (req, res) => {
    const { startupId, amount, paymentMethod, notes } = req.body;

    // Check if user is an investor
    if (req.user.role !== 'investor') {
        throw new ApiError(403, 'Only investors can make investments');
    }

    // Validate startup exists and is approved
    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    if (startup.status !== 'Approved') {
        throw new ApiError(400, 'Can only invest in approved startups');
    }

    // Check if campaign is closed
    if (startup.status === 'Closed') {
        throw new ApiError(400, 'This campaign is closed for investments');
    }

    // Check if target is already reached
    if (startup.raisedAmount >= startup.targetAmount) {
        throw new ApiError(400, 'This campaign has already reached its target');
    }

    // Validate investment amount
    if (amount <= 0) {
        throw new ApiError(400, 'Investment amount must be greater than 0');
    }

    const remainingAmount = startup.targetAmount - startup.raisedAmount;
    if (amount > remainingAmount) {
        throw new ApiError(400, `Investment amount exceeds remaining target. Maximum allowed: ${remainingAmount}`);
    }

    // Create transaction
    const transaction = await Transaction.create({
        investor: req.user._id,
        startup: startupId,
        amount,
        paymentMethod,
        notes,
        status: 'Pending',
    });

    res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        transaction,
    });
});

// @desc    Complete a transaction (funds moved into protected Escrow)
// @route   PUT /api/transactions/:id/complete
// @access  Private
const completeTransaction = asyncHandler(async (req, res) => {
    const { paymentId } = req.body;

    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        throw new ApiError(404, 'Transaction not found');
    }

    // Check ownership or admin
    if (transaction.investor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to complete this transaction');
    }

    if (transaction.status !== 'Pending') {
        throw new ApiError(400, `Transaction cannot be completed from '${transaction.status}' state`);
    }

    // Optional MongoDB ACID session for atomicity (supports Atlas replica sets and standalone local Mongo)
    let session = null;
    try {
        session = await mongoose.startSession();
        session.startTransaction();
    } catch {
        session = null;
    }

    try {
        const sessionOpt = session ? { session } : {};

        // 1. Move funds into InEscrow state
        transaction.status = 'InEscrow';
        transaction.paymentId = paymentId || `sim_${Date.now()}`;
        transaction.escrowHoldAmount = transaction.amount;
        await transaction.save(sessionOpt);

        // 2. Atomically update startup funds and escrow balance
        const startup = await Startup.findById(transaction.startup).session(session || null);
        if (!startup) {
            throw new ApiError(404, 'Associated startup not found');
        }

        // Check if this is a first-time backer
        const priorTx = await Transaction.findOne({
            startup: startup._id,
            investor: transaction.investor,
            status: { $in: ['InEscrow', 'Completed', 'Released'] },
            _id: { $ne: transaction._id },
        }).session(session || null);

        if (!priorTx) {
            startup.investorsCount = (startup.investorsCount || 0) + 1;
        }

        startup.raisedAmount = (startup.raisedAmount || 0) + transaction.amount;
        startup.escrowBalance = (startup.escrowBalance || 0) + transaction.amount;

        if (startup.raisedAmount >= startup.targetAmount) {
            startup.status = 'Closed';
        }

        await startup.save(sessionOpt);

        if (session) {
            await session.commitTransaction();
        }

        // Notify founder
        await createNotification({
            userId: startup.founder,
            type: 'investment_received',
            title: 'New Investment in Escrow!',
            message: `Congratulations! An investment of $${transaction.amount.toLocaleString()} was completed for "${startup.name}" and is securely held in Escrow pending milestone delivery.`,
            refModel: 'Startup',
            refId: startup._id,
        });

        // Notify investor
        await createNotification({
            userId: transaction.investor,
            type: 'investment_completed',
            title: 'Investment Placed in Escrow',
            message: `Your investment of $${transaction.amount.toLocaleString()} in "${startup.name}" is confirmed and safely held in Escrow.`,
            refModel: 'Transaction',
            refId: transaction._id,
        });

        res.status(200).json({
            success: true,
            message: 'Transaction completed and funds moved to protected Escrow',
            transaction,
        });
    } catch (err) {
        if (session) {
            await session.abortTransaction();
        }
        throw err;
    } finally {
        if (session) {
            session.endSession();
        }
    }
});

// @desc    Get all transactions for current user
// @route   GET /api/transactions
// @access  Private
const getUserTransactions = asyncHandler(async (req, res) => {
    const { status, startupId } = req.query;
    
    let query = { investor: req.user._id };
    
    if (status) {
        query.status = status;
    }
    
    if (startupId) {
        query.startup = startupId;
    }

    const transactions = await Transaction.find(query)
        .populate('startup', 'name sector stage logo targetAmount raisedAmount')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: transactions.length,
        transactions,
    });
});

// @desc    Get single transaction details
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id)
        .populate('investor', 'name email')
        .populate('startup', 'name sector stage logo targetAmount raisedAmount');

    if (!transaction) {
        throw new ApiError(404, 'Transaction not found');
    }

    // Check ownership or admin
    if (transaction.investor._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to view this transaction');
    }

    res.status(200).json({
        success: true,
        transaction,
    });
});

// @desc    Get all transactions (Admin only)
// @route   GET /api/transactions/all
// @access  Private (Admin only)
const getAllTransactions = asyncHandler(async (req, res) => {
    const { status, investorId, startupId } = req.query;
    
    let query = {};
    
    if (status) {
        query.status = status;
    }
    
    if (investorId) {
        query.investor = investorId;
    }
    
    if (startupId) {
        query.startup = startupId;
    }

    const transactions = await Transaction.find(query)
        .populate('investor', 'name email')
        .populate('startup', 'name sector stage')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: transactions.length,
        transactions,
    });
});

// @desc    Get transactions for a specific startup (Founder/Admin)
// @route   GET /api/transactions/startup/:startupId
// @access  Private (Founder/Admin)
const getStartupTransactions = asyncHandler(async (req, res) => {
    const { startupId } = req.params;
    const { status } = req.query;

    // Verify startup exists
    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Check if user is founder of this startup or admin
    if (startup.founder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to view these transactions');
    }

    let query = { startup: startupId };
    if (status) {
        query.status = status;
    }

    const transactions = await Transaction.find(query)
        .populate('investor', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: transactions.length,
        transactions,
    });
});

// @desc    Cancel a pending transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const cancelTransaction = asyncHandler(async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
        throw new ApiError(404, 'Transaction not found');
    }

    // Check ownership or admin
    if (transaction.investor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to cancel this transaction');
    }

    if (transaction.status !== 'Pending') {
        throw new ApiError(400, 'Can only cancel pending transactions');
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.status(200).json({
        success: true,
        message: 'Transaction cancelled successfully',
    });
});

// @desc    Get investment portfolio for investor
// @route   GET /api/transactions/portfolio
// @access  Private (Investor only)
const getPortfolio = asyncHandler(async (req, res) => {
    if (req.user.role !== 'investor') {
        throw new ApiError(403, 'Only investors can view portfolio');
    }

    const completedTransactions = await Transaction.find({
        investor: req.user._id,
        status: 'Completed',
    })
        .populate('startup', 'name sector stage logo targetAmount raisedAmount status')
        .sort({ createdAt: -1 });

    // Calculate portfolio statistics
    const totalInvested = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalInvestments = completedTransactions.length;
    
    // Group by startup
    const investmentsByStartup = {};
    completedTransactions.forEach(t => {
        const startupId = t.startup._id.toString();
        if (!investmentsByStartup[startupId]) {
            investmentsByStartup[startupId] = {
                startup: t.startup,
                totalInvested: 0,
                transactionCount: 0,
            };
        }
        investmentsByStartup[startupId].totalInvested += t.amount;
        investmentsByStartup[startupId].transactionCount += 1;
    });

    const portfolio = Object.values(investmentsByStartup);

    res.status(200).json({
        success: true,
        portfolio,
        statistics: {
            totalInvested,
            totalInvestments,
            uniqueStartups: portfolio.length,
        },
    });
});

// @desc    Get escrow ledger breakdown for a startup
// @route   GET /api/transactions/escrow-ledger/:startupId
// @access  Private
const getEscrowLedger = asyncHandler(async (req, res) => {
    const { startupId } = req.params;

    const startup = await Startup.findById(startupId).select('name sector stage targetAmount raisedAmount escrowBalance releasedFunds milestones founder');
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const transactions = await Transaction.find({
        startup: startupId,
        status: { $in: ['InEscrow', 'Completed', 'Released'] },
    })
        .populate('investor', 'name email')
        .sort({ createdAt: -1 });

    const totalInEscrow = startup.escrowBalance || 0;
    const totalReleased = startup.releasedFunds || 0;

    res.status(200).json({
        success: true,
        ledger: {
            startup: {
                id: startup._id,
                name: startup.name,
                sector: startup.sector,
                stage: startup.stage,
                targetAmount: startup.targetAmount,
                raisedAmount: startup.raisedAmount,
                escrowBalance: totalInEscrow,
                releasedFunds: totalReleased,
            },
            totalInEscrow,
            totalReleased,
            milestones: startup.milestones,
            transactions: transactions.map(t => ({
                id: t._id,
                investor: t.investor?.name,
                amount: t.amount,
                status: t.status,
                escrowHold: t.escrowHoldAmount || t.amount,
                releasedAmount: t.releasedAmount || 0,
                releaseHistory: t.releaseHistory,
                date: t.transactionDate,
            })),
        },
    });
});

export {
    createTransaction,
    completeTransaction,
    getUserTransactions,
    getTransactionById,
    getAllTransactions,
    getStartupTransactions,
    cancelTransaction,
    getPortfolio,
    getEscrowLedger,
};
