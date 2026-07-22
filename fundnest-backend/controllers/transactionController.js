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

// @desc    Complete a transaction (after payment confirmation)
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
        throw new ApiError(400, 'Transaction is not in pending state');
    }

    // Update transaction status
    transaction.status = 'Completed';
    transaction.paymentId = paymentId;
    await transaction.save();

    // Update startup raised amount and investor count
    const startup = await Startup.findById(transaction.startup);
    if (startup) {
        startup.raisedAmount += transaction.amount;
        startup.investorsCount += 1;
        
        // Check if target is reached
        if (startup.raisedAmount >= startup.targetAmount) {
            startup.status = 'Closed';
        }
        
        await startup.save();

        // Notify founder
        await createNotification({
            userId: startup.founder,
            type: 'investment_received',
            title: 'New Investment Received!',
            message: `Congratulations! An investor just completed an investment of $${transaction.amount.toLocaleString()} in your startup "${startup.name}".`,
            refModel: 'Startup',
            refId: startup._id,
        });

        // Notify investor
        await createNotification({
            userId: transaction.investor,
            type: 'investment_completed',
            title: 'Investment Confirmed',
            message: `Your investment of $${transaction.amount.toLocaleString()} in "${startup.name}" has been successfully completed.`,
            refModel: 'Transaction',
            refId: transaction._id,
        });
    }

    res.status(200).json({
        success: true,
        message: 'Transaction completed successfully',
        transaction,
    });
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

export {
    createTransaction,
    completeTransaction,
    getUserTransactions,
    getTransactionById,
    getAllTransactions,
    getStartupTransactions,
    cancelTransaction,
    getPortfolio,
};
