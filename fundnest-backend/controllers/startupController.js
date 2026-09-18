import Startup from '../models/startupModel.js';
import User from '../models/userModel.js';
import Transaction from '../models/transactionModel.js';
import InvestorProfile from '../models/investorProfileModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { createNotification } from './notificationController.js';
import openaiClient from '../services/openaiClient.js';
import { cosineSimilarity, formatSimilarityPercentage } from '../utils/vectorMath.js';

// Helper to format startup profile text for OpenAI text-embedding-3-small
function generateStartupEmbeddingText(startup) {
    const tags = Array.isArray(startup.tags) ? startup.tags.join(', ') : '';
    return `Startup Name: ${startup.name}. Sector: ${startup.sector}. Funding Stage: ${startup.stage}. Target Funding: $${startup.targetAmount || 0}. Annual Revenue: $${startup.annualRevenue || 0}. Team Size: ${startup.teamSize || 1}. Location: ${startup.location || 'Global'}. Tags: ${tags}. Description: ${startup.description || ''}`.trim();
}

// Helper to format investor preferences for OpenAI text-embedding-3-small
function generateInvestorPreferenceText(profile) {
    const sectors = Array.isArray(profile.preferredSectors) ? profile.preferredSectors.join(', ') : 'All sectors';
    const stages = Array.isArray(profile.preferredStages) ? profile.preferredStages.join(', ') : 'All stages';
    return `Investor Investment Preferences: Sectors: ${sectors}. Stages: ${stages}. Risk Appetite: ${profile.riskAppetite || 'Moderate'}. Investment Range: $${profile.minInvestmentAmount || 100} - $${profile.maxInvestmentAmount || 100000}. Bio: ${profile.bio || 'Active investor seeking scalable ventures'}.`.trim();
}

// @desc    Get all approved startups
// @route   GET /api/startups
// @access  Public
const getStartups = asyncHandler(async (req, res) => {
    const { q, sector, stage } = req.query;
    let query = { status: 'Approved' };

    if (q) {
        query.$or = [
            { name: { $regex: q, $options: 'i' } },
            { sector: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { tags: { $regex: q, $options: 'i' } },
        ];
    }

    if (sector && sector !== 'all') {
        query.sector = sector;
    }

    if (stage && stage !== 'all') {
        query.stage = stage;
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

// @desc    Create a new startup campaign with write-time OpenAI embedding caching
// @route   POST /api/startups
// @access  Private (Founder only)
const createStartup = asyncHandler(async (req, res) => {
    const {
        name,
        sector,
        stage,
        description,
        targetAmount,
        logo,
        location,
        website,
        teamSize,
        annualRevenue,
        equity,
        minInvestment,
        tags,
        milestones,
    } = req.body;

    // Check if user is a founder
    if (req.user.role !== 'founder') {
        throw new ApiError(403, 'Only founders can create startup campaigns');
    }

    // Check if startup name already exists
    const existingStartup = await Startup.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existingStartup) {
        throw new ApiError(400, 'A startup with this name already exists');
    }

    // Format milestones if provided
    let formattedMilestones = [];
    if (Array.isArray(milestones) && milestones.length > 0) {
        formattedMilestones = milestones.map(m => ({
            title: m.title,
            description: m.description,
            targetAmount: Number(m.targetAmount) || 0,
            deliverableDescription: m.deliverableDescription || '',
            targetDate: m.targetDate ? new Date(m.targetDate) : undefined,
            status: 'Pending',
        }));
    }

    // Compute write-time OpenAI embedding (text-embedding-3-small)
    const embeddingText = generateStartupEmbeddingText({
        name,
        sector,
        stage,
        description,
        targetAmount,
        annualRevenue,
        teamSize,
        location,
        tags,
    });

    const embedding = await openaiClient.generateEmbedding(embeddingText);

    const startup = await Startup.create({
        name,
        sector,
        stage,
        description,
        targetAmount,
        logo: logo || '🧠',
        location,
        website,
        teamSize: teamSize || 1,
        annualRevenue: annualRevenue || 0,
        equity: equity || 10,
        minInvestment: minInvestment || 100,
        tags: Array.isArray(tags) ? tags : [],
        milestones: formattedMilestones,
        founder: req.user._id,
        status: (process.env.NODE_ENV === 'development' || req.body.status === 'Approved') ? 'Approved' : 'Pending',
        escrowBalance: 0,
        releasedFunds: 0,
        embedding, // Cached at write-time!
    });

    res.status(201).json({
        success: true,
        message: startup.status === 'Approved'
            ? 'Startup campaign published and live on the marketplace!'
            : 'Startup campaign submitted successfully. Pending admin review.',
        startup,
    });
});

// @desc    Update startup details (recomputes embedding if pitch changes)
// @route   PUT /api/startups/:id
// @access  Private (Founder of startup or Admin)
const updateStartup = asyncHandler(async (req, res) => {
    const {
        name,
        sector,
        stage,
        description,
        targetAmount,
        logo,
        location,
        website,
        teamSize,
        annualRevenue,
        equity,
        minInvestment,
        tags,
    } = req.body;

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
    startup.targetAmount = targetAmount !== undefined ? targetAmount : startup.targetAmount;
    startup.logo = logo || startup.logo;
    startup.location = location || startup.location;
    startup.website = website || startup.website;
    startup.teamSize = teamSize !== undefined ? teamSize : startup.teamSize;
    startup.annualRevenue = annualRevenue !== undefined ? annualRevenue : startup.annualRevenue;
    startup.equity = equity !== undefined ? equity : startup.equity;
    startup.minInvestment = minInvestment !== undefined ? minInvestment : startup.minInvestment;
    if (Array.isArray(tags)) startup.tags = tags;

    // Refresh embedding on profile updates
    const embeddingText = generateStartupEmbeddingText(startup);
    startup.embedding = await openaiClient.generateEmbedding(embeddingText);

    const updatedStartup = await startup.save();

    res.status(200).json({
        success: true,
        message: 'Startup details updated successfully',
        startup: updatedStartup,
    });
});

// @desc    Semantic Investor-Startup Matching (Vector Cosine Similarity using OpenAI Embeddings)
// @route   GET /api/startups/matches/:investorId
// @route   GET /api/startups/matches
// @access  Private
const getStartupMatches = asyncHandler(async (req, res) => {
    const targetUserId = req.params.investorId || req.user._id;

    // Load or create investor profile
    let profile = await InvestorProfile.findOne({ user: targetUserId }).select('+preferenceEmbedding');
    if (!profile) {
        profile = await InvestorProfile.create({ user: targetUserId });
    }

    // Ensure investor preference embedding exists
    let preferenceEmbedding = profile.preferenceEmbedding;
    if (!preferenceEmbedding || preferenceEmbedding.length === 0) {
        const prefText = generateInvestorPreferenceText(profile);
        preferenceEmbedding = await openaiClient.generateEmbedding(prefText);
        profile.preferenceEmbedding = preferenceEmbedding;
        await profile.save();
    }

    // Fetch all approved startups with their embeddings
    const startups = await Startup.find({ status: 'Approved' })
        .select('+embedding')
        .populate('founder', 'name email');

    const rankedMatches = [];

    for (const startup of startups) {
        // Fallback: If startup lacks embedding, generate and cache now
        let startupEmbedding = startup.embedding;
        if (!startupEmbedding || startupEmbedding.length === 0) {
            const embeddingText = generateStartupEmbeddingText(startup);
            startupEmbedding = await openaiClient.generateEmbedding(embeddingText);
            startup.embedding = startupEmbedding;
            await startup.save();
        }

        // Compute cosine similarity between investor preference vector and startup vector
        const similarity = cosineSimilarity(preferenceEmbedding, startupEmbedding);
        const matchPercentage = formatSimilarityPercentage(similarity);

        // Generate explainable match reasons
        const reasons = [];
        if (profile.preferredSectors?.includes(startup.sector)) {
            reasons.push(`Direct sector match in ${startup.sector}`);
        }
        if (profile.preferredStages?.includes(startup.stage)) {
            reasons.push(`Stage alignment for ${startup.stage}`);
        }
        if (profile.minInvestmentAmount <= (startup.minInvestment || 100)) {
            reasons.push(`Accessible minimum ticket ($${startup.minInvestment || 100})`);
        }
        if (startup.annualRevenue > 0) {
            reasons.push(`Commercial traction validated ($${startup.annualRevenue.toLocaleString()} revenue)`);
        }
        if (reasons.length === 0) {
            reasons.push(`High semantic alignment with your stated investment goals`);
        }

        // Strip raw embedding vector before returning to client
        const startupObj = startup.toObject();
        delete startupObj.embedding;

        rankedMatches.push({
            startup: startupObj,
            similarityScore: Number(similarity.toFixed(4)),
            matchPercentage,
            matchReasons: reasons,
        });
    }

    // Sort descending by highest similarity score
    rankedMatches.sort((a, b) => b.similarityScore - a.similarityScore);

    res.status(200).json({
        success: true,
        count: rankedMatches.length,
        embeddingModel: 'text-embedding-3-small (1536-dim)',
        matches: rankedMatches.slice(0, 15), // Return top 15 matches
    });
});

// @desc    Submit Milestone Completion Deliverable (Founder)
// @route   POST /api/startups/:id/milestones/:milestoneId/submit
// @access  Private (Founder of startup)
const submitMilestone = asyncHandler(async (req, res) => {
    const { deliverableDescription, proofUrl, submissionNotes } = req.body;

    const startup = await Startup.findById(req.params.id);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Verify ownership
    if (startup.founder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to submit milestones for this startup');
    }

    const milestone = startup.milestones.id(req.params.milestoneId);
    if (!milestone) {
        throw new ApiError(404, 'Milestone not found');
    }

    if (milestone.status === 'Verified') {
        throw new ApiError(400, 'This milestone has already been verified and released');
    }

    // Update milestone state to Submitted
    milestone.status = 'Submitted';
    milestone.deliverableDescription = deliverableDescription || milestone.deliverableDescription;
    milestone.proofUrl = proofUrl || milestone.proofUrl;
    milestone.submissionNotes = submissionNotes || milestone.submissionNotes;

    await startup.save();

    // Notify all active investors that milestone proof has been submitted for review
    const transactions = await Transaction.find({
        startup: startup._id,
        status: { $in: ['InEscrow', 'Completed'] },
    });
    const investorIds = [...new Set(transactions.map(t => t.investor.toString()))];

    for (const investorId of investorIds) {
        await createNotification({
            userId: investorId,
            type: 'milestone_updated',
            title: `Milestone Deliverable Submitted: ${startup.name}`,
            message: `${startup.name} submitted completion deliverables for milestone "${milestone.title}". Currently under verification.`,
            refModel: 'Startup',
            refId: startup._id,
        });
    }

    res.status(200).json({
        success: true,
        message: 'Milestone completion submitted successfully. Under verification.',
        milestone,
    });
});

// @desc    Verify Milestone & Trigger Escrow Fund Release (Admin / Verification Quorum)
// @route   PUT /api/startups/:id/milestones/:milestoneId/verify
// @access  Private (Admin only)
const verifyMilestone = asyncHandler(async (req, res) => {
    const { verificationNotes, customReleaseAmount } = req.body;

    // Only platform admin can verify milestones and trigger escrow fund releases
    if (req.user.role !== 'admin') {
        throw new ApiError(403, 'Only administrators can verify milestones and authorize fund release');
    }

    const startup = await Startup.findById(req.params.id);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const milestone = startup.milestones.id(req.params.milestoneId);
    if (!milestone) {
        throw new ApiError(404, 'Milestone not found');
    }

    if (milestone.status === 'Verified') {
        throw new ApiError(400, 'Milestone has already been verified and funded');
    }

    // Calculate release amount
    let releaseAmount = 0;
    if (customReleaseAmount && Number(customReleaseAmount) > 0) {
        releaseAmount = Math.min(Number(customReleaseAmount), startup.escrowBalance || 0);
    } else if (milestone.targetAmount && milestone.targetAmount > 0) {
        releaseAmount = Math.min(milestone.targetAmount, startup.escrowBalance || 0);
    } else {
        // Equal share of remaining escrow balance across unverified milestones
        const pendingCount = startup.milestones.filter(m => m.status !== 'Verified').length || 1;
        releaseAmount = Math.floor((startup.escrowBalance || 0) / pendingCount);
    }

    // State machine transition: Submitted/Pending -> Verified
    milestone.status = 'Verified';
    milestone.completedAt = new Date();
    milestone.verifiedAt = new Date();
    milestone.verifiedBy = req.user._id;
    milestone.verificationNotes = verificationNotes || 'Deliverables reviewed and verified by platform audit.';
    milestone.releasedAmount = releaseAmount;

    // Atomic fund release from escrowBalance to releasedFunds
    startup.escrowBalance = Math.max(0, (startup.escrowBalance || 0) - releaseAmount);
    startup.releasedFunds = (startup.releasedFunds || 0) + releaseAmount;

    await startup.save();

    // Update associated transactions ledger
    if (releaseAmount > 0) {
        const escrowTransactions = await Transaction.find({
            startup: startup._id,
            status: { $in: ['InEscrow', 'Completed'] },
        });

        // Distribute released amount proportionally
        const totalEscrowInTxs = escrowTransactions.reduce((sum, t) => sum + (t.escrowHoldAmount || t.amount), 0) || 1;

        for (const tx of escrowTransactions) {
            const txShare = Math.round((((tx.escrowHoldAmount || tx.amount) / totalEscrowInTxs) * releaseAmount) * 100) / 100;

            tx.releasedAmount = (tx.releasedAmount || 0) + txShare;
            tx.escrowHoldAmount = Math.max(0, (tx.escrowHoldAmount || tx.amount) - txShare);

            tx.releaseHistory.push({
                milestoneId: milestone._id,
                milestoneTitle: milestone.title,
                amount: txShare,
                releasedAt: new Date(),
                releasedBy: req.user._id,
            });

            if (tx.escrowHoldAmount <= 0) {
                tx.status = 'Released';
            }

            await tx.save();
        }
    }

    // Notify founder of fund release
    await createNotification({
        userId: startup.founder,
        type: 'milestone_updated',
        title: 'Milestone Verified — Funds Released!',
        message: `Milestone "${milestone.title}" was verified! $${releaseAmount.toLocaleString()} has been released from Escrow to your operational balance.`,
        refModel: 'Startup',
        refId: startup._id,
    });

    res.status(200).json({
        success: true,
        message: `Milestone verified successfully. $${releaseAmount.toLocaleString()} released from Escrow.`,
        milestone,
        escrowBalance: startup.escrowBalance,
        releasedFunds: startup.releasedFunds,
    });
});

// @desc    Reject Milestone Deliverable (Admin)
// @route   PUT /api/startups/:id/milestones/:milestoneId/reject
// @access  Private (Admin only)
const rejectMilestone = asyncHandler(async (req, res) => {
    const { reason } = req.body;

    if (req.user.role !== 'admin') {
        throw new ApiError(403, 'Only administrators can reject milestone submissions');
    }

    const startup = await Startup.findById(req.params.id);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const milestone = startup.milestones.id(req.params.milestoneId);
    if (!milestone) {
        throw new ApiError(404, 'Milestone not found');
    }

    milestone.status = 'Rejected';
    milestone.verificationNotes = reason || 'Deliverable did not meet verification criteria.';

    await startup.save();

    // Notify founder
    await createNotification({
        userId: startup.founder,
        type: 'milestone_updated',
        title: `Milestone Rejected: ${milestone.title}`,
        message: `Your milestone deliverable was rejected. Reason: ${reason || 'Please review deliverable criteria and resubmit.'}`,
        refModel: 'Startup',
        refId: startup._id,
    });

    res.status(200).json({
        success: true,
        message: 'Milestone marked as rejected.',
        milestone,
    });
});

// @desc    Add a milestone to a startup
// @route   POST /api/startups/:id/milestones
// @access  Private (Founder of startup only)
const addMilestone = asyncHandler(async (req, res) => {
    const { title, description, targetAmount, deliverableDescription, targetDate } = req.body;

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
        targetAmount: Number(targetAmount) || 0,
        deliverableDescription: deliverableDescription || '',
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
    const { title, description, targetAmount, deliverableDescription, targetDate, status } = req.body;

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
    if (targetAmount !== undefined) milestone.targetAmount = Number(targetAmount);
    if (deliverableDescription !== undefined) milestone.deliverableDescription = deliverableDescription;
    if (targetDate) milestone.targetDate = new Date(targetDate);
    if (status) milestone.status = status;

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

// @desc    Get founder analytics
// @route   GET /api/startups/analytics/founder
// @access  Private (Founder only)
const getFounderAnalytics = asyncHandler(async (req, res) => {
    const startups = await Startup.find({ founder: req.user._id });
    const startupIds = startups.map(s => s._id);

    const transactions = await Transaction.find({
        startup: { $in: startupIds },
        status: { $in: ['InEscrow', 'Completed', 'Released'] },
    }).populate('investor', 'name email');

    const totalTargetAmount = startups.reduce((sum, s) => sum + s.targetAmount, 0);
    const totalRaisedAmount = startups.reduce((sum, s) => sum + s.raisedAmount, 0);
    const totalEscrowBalance = startups.reduce((sum, s) => sum + (s.escrowBalance || 0), 0);
    const totalReleasedFunds = startups.reduce((sum, s) => sum + (s.releasedFunds || 0), 0);
    const uniqueInvestors = new Set(transactions.map(t => t.investor?._id?.toString()).filter(Boolean));

    const startupsByStatus = {
        Pending: 0,
        Approved: 0,
        Rejected: 0,
        Closed: 0,
    };
    startups.forEach(s => {
        if (startupsByStatus[s.status] !== undefined) {
            startupsByStatus[s.status]++;
        } else {
            startupsByStatus[s.status] = 1;
        }
    });

    res.status(200).json({
        success: true,
        analytics: {
            totalStartups: startups.length,
            totalTargetAmount,
            totalRaisedAmount,
            totalEscrowBalance,
            totalReleasedFunds,
            totalInvestors: uniqueInvestors.size,
            averageFundingProgress: totalTargetAmount > 0 ? Math.round((totalRaisedAmount / totalTargetAmount) * 100) : 0,
            startupsByStatus,
            startupBreakdown: startups.map(s => ({
                id: s._id,
                name: s.name,
                sector: s.sector,
                stage: s.stage,
                targetAmount: s.targetAmount,
                raisedAmount: s.raisedAmount,
                escrowBalance: s.escrowBalance || 0,
                releasedFunds: s.releasedFunds || 0,
                status: s.status,
            })),
            recentActivity: transactions.slice(0, 10).map(t => ({
                investorName: t.investor?.name,
                amount: t.amount,
                date: t.transactionDate,
            })),
        },
    });
});

// @desc    Get analytics for a specific startup
// @route   GET /api/startups/:id/analytics
// @access  Private
const getStartupAnalytics = asyncHandler(async (req, res) => {
    const startup = await Startup.findById(req.params.id);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const transactions = await Transaction.find({
        startup: startup._id,
        status: { $in: ['InEscrow', 'Completed', 'Released'] },
    }).populate('investor', 'name email');

    res.status(200).json({
        success: true,
        analytics: {
            startup,
            totalTransactions: transactions.length,
            totalRaised: startup.raisedAmount,
            escrowBalance: startup.escrowBalance || 0,
            releasedFunds: startup.releasedFunds || 0,
            transactions,
        },
    });
});

// Auto-seed function to initialize default startups if database is empty
const seedStartups = async () => {
    try {
        const count = await Startup.countDocuments();
        if (count > 0) return;

        console.log('Seeding initial startups with cached embeddings...');

        let founder = await User.findOne({ role: 'founder' });
        if (!founder) {
            founder = await User.create({
                name: 'Elena Rostova',
                email: 'founder@fundnest.com',
                password: 'password123',
                role: 'founder',
                isEmailVerified: true,
                accountStatus: 'Verified',
                kycStatus: 'Verified',
            });
        }

        let investor = await User.findOne({ role: 'investor' });
        if (!investor) {
            investor = await User.create({
                name: 'Marcus Vance',
                email: 'investor@fundnest.com',
                password: 'password123',
                role: 'investor',
                isEmailVerified: true,
                accountStatus: 'Verified',
                kycStatus: 'Verified',
            });
        }

        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            admin = await User.create({
                name: 'Platform Admin',
                email: 'admin@fundnest.com',
                password: 'password123',
                role: 'admin',
                isEmailVerified: true,
                accountStatus: 'Verified',
                kycStatus: 'Verified',
            });
        }

        const mockStartups = [
            {
                name: 'NeuroFlow Health',
                sector: 'Healthcare',
                stage: 'Series A',
                description: 'NeuroFlow develops real-time biometric neural telemetry tools for non-invasive early detection of Parkinson and Alzheimers progression.',
                targetAmount: 2500000,
                raisedAmount: 1250000,
                investorsCount: 42,
                teamSize: 12,
                annualRevenue: 450000,
                equity: 8,
                location: 'Boston, MA',
                tags: ['Healthcare', 'Neurotech', 'AI Diagnostics'],
                status: 'Approved',
                founder: founder._id,
                escrowBalance: 1250000,
                releasedFunds: 0,
                milestones: [
                    { title: 'Clinical Trial Phase 1', targetAmount: 600000, deliverableDescription: 'Complete 100-patient pilot cohort validation', status: 'Pending' },
                    { title: 'FDA 510(k) Filing', targetAmount: 650000, deliverableDescription: 'Submit regulatory clearance dossier', status: 'Pending' },
                ],
            },
            {
                name: 'FinPulse Core',
                sector: 'FinTech',
                stage: 'Seed',
                description: 'Autonomous cross-border treasury routing using real-time liquidity pools and instant algorithmic hedging for multinational startups.',
                targetAmount: 1200000,
                raisedAmount: 720000,
                investorsCount: 28,
                teamSize: 6,
                annualRevenue: 120000,
                equity: 12,
                location: 'New York, NY',
                tags: ['FinTech', 'Treasury', 'Liquidity Engine'],
                status: 'Approved',
                founder: founder._id,
                escrowBalance: 720000,
                releasedFunds: 0,
                milestones: [
                    { title: 'SWIFT & FedNow API Integration', targetAmount: 360000, deliverableDescription: 'Sub-second rail connectivity', status: 'Pending' },
                    { title: 'SOC 2 Type II Certification', targetAmount: 360000, deliverableDescription: 'Independent security audit approval', status: 'Pending' },
                ],
            },
            {
                name: 'Aether Grid CleanTech',
                sector: 'CleanTech',
                stage: 'Pre-Seed',
                description: 'Solid-state sodium thermal storage batteries designed for off-grid industrial microgrids and renewable solar peak shaving.',
                targetAmount: 800000,
                raisedAmount: 240000,
                investorsCount: 14,
                teamSize: 4,
                annualRevenue: 0,
                equity: 15,
                location: 'Austin, TX',
                tags: ['CleanTech', 'Energy Storage', 'Battery Tech'],
                status: 'Approved',
                founder: founder._id,
                escrowBalance: 240000,
                releasedFunds: 0,
                milestones: [
                    { title: 'Lab Bench Proof-of-Concept', targetAmount: 120000, deliverableDescription: '500-cycle battery efficiency verification', status: 'Pending' },
                ],
            },
        ];

        for (const item of mockStartups) {
            const embeddingText = generateStartupEmbeddingText(item);
            item.embedding = await openaiClient.generateEmbedding(embeddingText);
            await Startup.create(item);
        }

        console.log('Seeded startups with cached embeddings successfully.');
    } catch (err) {
        console.error('Seeding startups failed:', err.message);
    }
};

export {
    getStartups,
    getStartupById,
    createStartup,
    updateStartup,
    getStartupMatches,
    submitMilestone,
    verifyMilestone,
    rejectMilestone,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getFounderAnalytics,
    getStartupAnalytics,
    seedStartups,
};
