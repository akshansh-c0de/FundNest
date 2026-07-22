import Startup from '../models/startupModel.js';
import User from '../models/userModel.js';
import Transaction from '../models/transactionModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notificationController.js';


// @desc    Get all approved startups
// @route   GET /api/startups
// @access  Public
const getStartups = asyncHandler(async (req, res) => {
    const { q } = req.query;
    let query = { status: 'Approved' };

    if (q) {
        query.$or = [
            { name: { $regex: q, $options: 'i' } },
            { sector: { $regex: q, $options: 'i' } }
        ];
    }

    const startups = await Startup.find(query)
        .populate('founder', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: startups.length,
        startups,
    });
});

// @desc    Get single startup details
// @route   GET /api/startups/:id
// @access  Public
const getStartupById = asyncHandler(async (req, res) => {
    const startup = await Startup.findById(req.params.id).populate('founder', 'name email');

    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    res.status(200).json({
        success: true,
        startup,
    });
});

// @desc    Create a new startup campaign
// @route   POST /api/startups
// @access  Private (Founder only)
const createStartup = asyncHandler(async (req, res) => {
    const { name, sector, stage, description, targetAmount, logo } = req.body;

    // Check if user is a founder
    if (req.user.role !== 'founder') {
        throw new ApiError(403, 'Only founders can create startup campaigns');
    }

    // Check if startup name already exists
    const existingStartup = await Startup.findOne({ name });
    if (existingStartup) {
        throw new ApiError(400, 'A startup with this name already exists');
    }

    const startup = await Startup.create({
        name,
        sector,
        stage,
        description,
        targetAmount,
        logo: logo || '🧠',
        founder: req.user._id,
        status: 'Pending', // New campaigns start as Pending and require Admin approval
    });

    res.status(201).json({
        success: true,
        message: 'Startup campaign submitted successfully. Pending admin review.',
        startup,
    });
});

// @desc    Update startup details
// @route   PUT /api/startups/:id
// @access  Private (Founder only)
const updateStartup = asyncHandler(async (req, res) => {
    const { name, sector, stage, description, targetAmount, logo } = req.body;

    const startup = await Startup.findById(req.params.id);

    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Check ownership
    if (startup.founder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to update this startup');
    }

    startup.name = name || startup.name;
    startup.sector = sector || startup.sector;
    startup.stage = stage || startup.stage;
    startup.description = description || startup.description;
    startup.targetAmount = targetAmount || startup.targetAmount;
    startup.logo = logo || startup.logo;

    const updatedStartup = await startup.save();

    res.status(200).json({
        success: true,
        message: 'Startup details updated successfully',
        startup: updatedStartup,
    });
});

// Auto-seed function to initialize default startups if database is empty
const seedStartups = async () => {
    try {
        const count = await Startup.countDocuments();
        if (count > 0) return;

        console.log('Seeding startups...');

        // Find or create a default founder user
        let founder = await User.findOne({ role: 'founder' });
        if (!founder) {
            founder = await User.create({
                name: 'Default Founder',
                email: 'founder@fundnest.com',
                password: 'password123', // Will be hashed by userSchema pre-save
                role: 'founder',
                isEmailVerified: true,
                accountStatus: 'Verified',
                kycStatus: 'Verified',
            });
        }

        const mockStartups = [
            { name: "Nimbus AI", sector: "AI / ML", stage: "Seed", targetAmount: 500000, raisedAmount: 312000, investorsCount: 142, logo: "🧠", description: "Advanced NLP interfaces for business automation and insights.", founder: founder._id, status: 'Approved' },
            { name: "GreenGrid", sector: "CleanTech", stage: "Series A", targetAmount: 2000000, raisedAmount: 1450000, investorsCount: 318, logo: "🌱", description: "Smart grid management systems powered by clean energy solutions.", founder: founder._id, status: 'Approved' },
            { name: "MediSync", sector: "HealthTech", stage: "Seed", targetAmount: 750000, raisedAmount: 240000, investorsCount: 86, logo: "🩺", description: "Connected medical record sharing platform with secure blockchain access.", founder: founder._id, status: 'Approved' },
            { name: "FinPulse", sector: "FinTech", stage: "Pre-Seed", targetAmount: 300000, raisedAmount: 95000, investorsCount: 41, logo: "💳", description: "Next-gen banking alternatives for modern digital creators.", founder: founder._id, status: 'Approved' },
            { name: "RoboLogix", sector: "Robotics", stage: "Series A", targetAmount: 3500000, raisedAmount: 2890000, investorsCount: 502, logo: "🤖", description: "Fully autonomous fulfillment robot swarms for mid-size warehouses.", founder: founder._id, status: 'Approved' },
            { name: "EduSpark", sector: "EdTech", stage: "Seed", targetAmount: 600000, raisedAmount: 410000, investorsCount: 173, logo: "📚", description: "Gamified learning platforms for children with special education needs.", founder: founder._id, status: 'Approved' }
        ];

        await Startup.insertMany(mockStartups);
        console.log('Startups successfully seeded!');
    } catch (err) {
        console.error('Error seeding startups:', err.message);
    }
};

// @desc    Get analytics data for founder's startups
// @route   GET /api/startups/analytics
// @access  Private (Founder only)
const getFounderAnalytics = asyncHandler(async (req, res) => {
    // Check if user is a founder
    if (req.user.role !== 'founder') {
        throw new ApiError(403, 'Only founders can view analytics');
    }

    // Get all startups by this founder
    const startups = await Startup.find({ founder: req.user._id });

    if (startups.length === 0) {
        return res.status(200).json({
            success: true,
            analytics: {
                totalStartups: 0,
                totalTargetAmount: 0,
                totalRaisedAmount: 0,
                totalInvestors: 0,
                averageFundingProgress: 0,
                startupsByStatus: {
                    Pending: 0,
                    Approved: 0,
                    Rejected: 0,
                    Closed: 0,
                },
                recentActivity: [],
            },
        });
    }

    // Get all transactions for these startups
    const startupIds = startups.map(s => s._id);
    const transactions = await Transaction.find({
        startup: { $in: startupIds },
        status: 'Completed',
    }).sort({ createdAt: -1 });

    // Calculate aggregate statistics
    const totalTargetAmount = startups.reduce((sum, s) => sum + s.targetAmount, 0);
    const totalRaisedAmount = startups.reduce((sum, s) => sum + s.raisedAmount, 0);
    const totalInvestors = startups.reduce((sum, s) => sum + s.investorsCount, 0);
    const averageFundingProgress = totalTargetAmount > 0 
        ? (totalRaisedAmount / totalTargetAmount) * 100 
        : 0;

    // Count startups by status
    const startupsByStatus = startups.reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
    }, { Pending: 0, Approved: 0, Rejected: 0, Closed: 0 });

    // Recent activity (last 10 transactions)
    const recentActivity = transactions.slice(0, 10).map(t => ({
        amount: t.amount,
        date: t.createdAt,
        startupName: startups.find(s => s._id.toString() === t.startup.toString())?.name || 'Unknown',
    }));

    // Per-startup breakdown
    const startupBreakdown = startups.map(s => ({
        id: s._id,
        name: s.name,
        sector: s.sector,
        stage: s.stage,
        targetAmount: s.targetAmount,
        raisedAmount: s.raisedAmount,
        investorsCount: s.investorsCount,
        status: s.status,
        fundingProgress: s.targetAmount > 0 ? (s.raisedAmount / s.targetAmount) * 100 : 0,
        createdAt: s.createdAt,
    }));

    res.status(200).json({
        success: true,
        analytics: {
            totalStartups: startups.length,
            totalTargetAmount,
            totalRaisedAmount,
            totalInvestors,
            averageFundingProgress: Math.round(averageFundingProgress),
            startupsByStatus,
            recentActivity,
            startupBreakdown,
        },
    });
});

// @desc    Get detailed analytics for a specific startup
// @route   GET /api/startups/:id/analytics
// @access  Private (Founder of startup or Admin)
const getStartupAnalytics = asyncHandler(async (req, res) => {
    const startup = await Startup.findById(req.params.id);

    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Check ownership or admin
    if (startup.founder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to view this startup analytics');
    }

    // Get all transactions for this startup
    const transactions = await Transaction.find({
        startup: req.params.id,
        status: 'Completed',
    }).populate('investor', 'name email').sort({ createdAt: -1 });

    // Calculate funding over time (grouped by day)
    const fundingOverTime = transactions.reduce((acc, t) => {
        const date = new Date(t.createdAt).toISOString().split('T')[0];
        if (!acc[date]) {
            acc[date] = 0;
        }
        acc[date] += t.amount;
        return acc;
    }, {});

    const fundingTimeline = Object.entries(fundingOverTime)
        .map(([date, amount]) => ({ date, amount }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Investment distribution (by amount ranges)
    const investmentRanges = {
        '0-100': 0,
        '100-500': 0,
        '500-1000': 0,
        '1000-5000': 0,
        '5000+': 0,
    };

    transactions.forEach(t => {
        if (t.amount < 100) investmentRanges['0-100']++;
        else if (t.amount < 500) investmentRanges['100-500']++;
        else if (t.amount < 1000) investmentRanges['500-1000']++;
        else if (t.amount < 5000) investmentRanges['1000-5000']++;
        else investmentRanges['5000+']++;
    });

    // Top investors
    const investorContributions = transactions.reduce((acc, t) => {
        const investorId = t.investor._id.toString();
        if (!acc[investorId]) {
            acc[investorId] = {
                investor: t.investor,
                totalInvested: 0,
                investmentCount: 0,
            };
        }
        acc[investorId].totalInvested += t.amount;
        acc[investorId].investmentCount += 1;
        return acc;
    }, {});

    const topInvestors = Object.values(investorContributions)
        .sort((a, b) => b.totalInvested - a.totalInvested)
        .slice(0, 10);

    res.status(200).json({
        success: true,
        analytics: {
            startup: {
                id: startup._id,
                name: startup.name,
                sector: startup.sector,
                stage: startup.stage,
                targetAmount: startup.targetAmount,
                raisedAmount: startup.raisedAmount,
                investorsCount: startup.investorsCount,
                status: startup.status,
                fundingProgress: startup.targetAmount > 0 
                    ? (startup.raisedAmount / startup.targetAmount) * 100 
                    : 0,
            },
            totalTransactions: transactions.length,
            averageInvestment: transactions.length > 0 
                ? startup.raisedAmount / transactions.length 
                : 0,
            fundingTimeline,
            investmentRanges,
            topInvestors,
            recentTransactions: transactions.slice(0, 20),
        },
    });
});

// @desc    Add a milestone to a startup
// @route   POST /api/startups/:id/milestones
// @access  Private (Founder of startup only)
const addMilestone = asyncHandler(async (req, res) => {
    const { title, description, targetDate } = req.body;

    const startup = await Startup.findById(req.params.id);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Verify ownership
    if (startup.founder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to add milestones to this startup');
    }

    if (!title) {
        throw new ApiError(400, 'Milestone title is required');
    }

    startup.milestones.push({
        title,
        description,
        targetDate: targetDate ? new Date(targetDate) : undefined,
        status: 'Pending',
    });

    await startup.save();

    res.status(201).json({
        success: true,
        message: 'Milestone added successfully',
        milestones: startup.milestones,
    });
});

// @desc    Update a milestone
// @route   PUT /api/startups/:id/milestones/:milestoneId
// @access  Private (Founder of startup only)
const updateMilestone = asyncHandler(async (req, res) => {
    const { title, description, targetDate, status } = req.body;

    const startup = await Startup.findById(req.params.id);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Verify ownership
    if (startup.founder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to update milestones for this startup');
    }

    const milestone = startup.milestones.id(req.params.milestoneId);
    if (!milestone) {
        throw new ApiError(404, 'Milestone not found');
    }

    if (title) milestone.title = title;
    if (description !== undefined) milestone.description = description;
    if (targetDate) milestone.targetDate = new Date(targetDate);
    
    const oldStatus = milestone.status;
    if (status) {
        milestone.status = status;
        if (status === 'Completed' && oldStatus !== 'Completed') {
            milestone.completedAt = new Date();

            // Notify investors of this startup about milestone completion
            const transactions = await Transaction.find({ startup: startup._id, status: 'Completed' });
            const investorIds = [...new Set(transactions.map(t => t.investor.toString()))];

            for (const investorId of investorIds) {
                await createNotification({
                    userId: investorId,
                    type: 'milestone_updated',
                    title: `Milestone Completed: ${startup.name}`,
                    message: `Good news! ${startup.name} has marked their milestone "${milestone.title}" as Completed.`,
                    refModel: 'Startup',
                    refId: startup._id,
                });
            }
        } else if (status !== 'Completed') {
            milestone.completedAt = undefined;
        }
    }

    await startup.save();

    res.status(200).json({
        success: true,
        message: 'Milestone updated successfully',
        milestones: startup.milestones,
    });
});

// @desc    Delete a milestone
// @route   DELETE /api/startups/:id/milestones/:milestoneId
// @access  Private (Founder of startup only)
const deleteMilestone = asyncHandler(async (req, res) => {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Verify ownership
    if (startup.founder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to delete milestones from this startup');
    }

    const milestone = startup.milestones.id(req.params.milestoneId);
    if (!milestone) {
        throw new ApiError(404, 'Milestone not found');
    }

    milestone.deleteOne();
    await startup.save();

    res.status(200).json({
        success: true,
        message: 'Milestone deleted successfully',
        milestones: startup.milestones,
    });
});

export {
    getStartups,
    getStartupById,
    createStartup,
    updateStartup,
    seedStartups,
    getFounderAnalytics,
    getStartupAnalytics,
    addMilestone,
    updateMilestone,
    deleteMilestone,
};
