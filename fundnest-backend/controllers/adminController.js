import User from '../models/userModel.js';
import Startup from '../models/startupModel.js';
import Transaction from '../models/transactionModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notificationController.js';


// @desc    Get platform-wide admin statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
const getAdminStats = asyncHandler(async (req, res) => {
    const [
        totalUsers,
        totalFounders,
        totalInvestors,
        totalStartups,
        pendingStartups,
        approvedStartups,
        totalTransactions,
        completedTransactions,
        pendingKyc,
    ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ role: 'founder' }),
        User.countDocuments({ role: 'investor' }),
        Startup.countDocuments(),
        Startup.countDocuments({ status: 'Pending' }),
        Startup.countDocuments({ status: 'Approved' }),
        Transaction.countDocuments(),
        Transaction.countDocuments({ status: 'Completed' }),
        User.countDocuments({ kycStatus: 'Pending' }),
    ]);

    // Calculate total platform revenue (2% fee on completed transactions)
    const revenueAgg = await Transaction.aggregate([
        { $match: { status: 'Completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalVolume = revenueAgg[0]?.total ?? 0;
    const platformRevenue = totalVolume * 0.02; // 2% platform fee

    // Monthly growth — new users per month for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyUsers = await User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        {
            $group: {
                _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                count: { $sum: 1 },
            },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthlyGrowth = monthlyUsers.map((m) => ({
        month: `${m._id.year}-${String(m._id.month).padStart(2, '0')}`,
        users: m.count,
    }));

    res.status(200).json({
        success: true,
        stats: {
            users: { total: totalUsers, founders: totalFounders, investors: totalInvestors, pendingKyc },
            startups: { total: totalStartups, pending: pendingStartups, approved: approvedStartups },
            transactions: { total: totalTransactions, completed: completedTransactions, totalVolume, platformRevenue },
            monthlyGrowth,
        },
    });
});

// @desc    Get all users with optional filters
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = asyncHandler(async (req, res) => {
    const { role, kycStatus, accountStatus, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;
    if (kycStatus) query.kycStatus = kycStatus;
    if (accountStatus) query.accountStatus = accountStatus;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
        User.find(query).select('-password -twoFactorSecret -twoFactorRecoveryCodes -emailVerificationToken -passwordResetToken').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
        User.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        users,
    });
});

// @desc    Update user KYC status (Admin approval/rejection)
// @route   PUT /api/admin/users/:id/kyc
// @access  Private (Admin only)
const updateUserKyc = asyncHandler(async (req, res) => {
    const { kycStatus } = req.body;
    const validStatuses = ['Pending', 'Verified', 'Rejected', 'Suspended'];

    if (!validStatuses.includes(kycStatus)) {
        throw new ApiError(400, `Invalid KYC status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    user.kycStatus = kycStatus;
    // Mirror to verificationStatus for consistency
    if (kycStatus === 'Verified') {
        user.verificationStatus = 'Verified';
        user.accountStatus = 'Verified';
    } else if (kycStatus === 'Rejected') {
        user.verificationStatus = 'Rejected';
    }
    await user.save();

    // Trigger notification
    await createNotification({
        userId: user._id,
        type: kycStatus === 'Verified' ? 'kyc_approved' : 'kyc_rejected',
        title: kycStatus === 'Verified' ? 'KYC Verification Approved' : 'KYC Verification Rejected',
        message: kycStatus === 'Verified'
            ? 'Congratulations! Your identity verification has been approved. You can now participate in fundraising and investments.'
            : 'Your identity verification was rejected. Please check your profile details and try again or contact support.',
        refModel: 'User',
        refId: user._id,
    });

    res.status(200).json({
        success: true,
        message: `KYC status updated to ${kycStatus}`,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            kycStatus: user.kycStatus,
            verificationStatus: user.verificationStatus,
            accountStatus: user.accountStatus,
        },
    });
});

// @desc    Activate or deactivate a user account
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin only)
const updateUserStatus = asyncHandler(async (req, res) => {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
        throw new ApiError(400, 'isActive must be a boolean');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Prevent deactivating other admins
    if (user.role === 'admin' && req.user._id.toString() !== user._id.toString()) {
        throw new ApiError(403, 'Cannot modify another admin account');
    }

    user.isActive = isActive;
    await user.save();

    res.status(200).json({
        success: true,
        message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`,
    });
});

// @desc    Approve a startup campaign
// @route   PUT /api/admin/startups/:id/approve
// @access  Private (Admin only)
const approveStartup = asyncHandler(async (req, res) => {
    const startup = await Startup.findById(req.params.id).populate('founder', 'name email');
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    if (startup.status !== 'Pending') {
        throw new ApiError(400, `Startup is already ${startup.status}`);
    }

    startup.status = 'Approved';
    await startup.save();

    // Trigger notification to the founder
    await createNotification({
        userId: startup.founder._id || startup.founder,
        type: 'startup_approved',
        title: 'Startup Campaign Approved!',
        message: `Your startup "${startup.name}" has been approved for fundraising on FundNest. Investors can now browse and invest in your startup.`,
        refModel: 'Startup',
        refId: startup._id,
    });

    res.status(200).json({
        success: true,
        message: `Startup "${startup.name}" has been approved`,
        startup,
    });
});

// @desc    Reject a startup campaign
// @route   PUT /api/admin/startups/:id/reject
// @access  Private (Admin only)
const rejectStartup = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    startup.status = 'Rejected';
    if (reason) startup.rejectionReason = reason;
    await startup.save();

    // Trigger notification to the founder
    await createNotification({
        userId: startup.founder,
        type: 'startup_rejected',
        title: 'Startup Campaign Rejected',
        message: `Unfortunately, your startup "${startup.name}" campaign request has been rejected. Reason: ${reason || 'Does not meet our current platform listing guidelines.'}`,
        refModel: 'Startup',
        refId: startup._id,
    });

    res.status(200).json({
        success: true,
        message: `Startup "${startup.name}" has been rejected`,
    });
});

// @desc    Get all startups for admin review (any status)
// @route   GET /api/admin/startups
// @access  Private (Admin only)
const getAdminStartups = asyncHandler(async (req, res) => {
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sector: { $regex: search, $options: 'i' } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [startups, total] = await Promise.all([
        Startup.find(query)
            .populate('founder', 'name email kycStatus')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Startup.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        startups,
    });
});

// @desc    Get all transactions for admin
// @route   GET /api/admin/transactions
// @access  Private (Admin only)
const getAdminTransactions = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [transactions, total] = await Promise.all([
        Transaction.find(query)
            .populate('investor', 'name email')
            .populate('startup', 'name sector stage')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Transaction.countDocuments(query),
    ]);

    res.status(200).json({
        success: true,
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        transactions,
    });
});

export {
    getAdminStats,
    getAllUsers,
    updateUserKyc,
    updateUserStatus,
    approveStartup,
    rejectStartup,
    getAdminStartups,
    getAdminTransactions,
};
