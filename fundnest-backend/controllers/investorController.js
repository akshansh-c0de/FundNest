import Startup from '../models/startupModel.js';
import InvestorProfile from '../models/investorProfileModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get or create investor profile for the logged-in investor
// @route   GET /api/investor/profile
// @access  Private (Investor only)
const getInvestorProfile = asyncHandler(async (req, res) => {
    // Find or initialise profile — investors get an empty profile on first request
    let profile = await InvestorProfile.findOne({ user: req.user._id }).populate('watchlist', 'name sector stage logo raisedAmount targetAmount status');

    if (!profile) {
        profile = await InvestorProfile.create({ user: req.user._id });
    }

    res.status(200).json({
        success: true,
        profile,
    });
});

// @desc    Update investor profile preferences
// @route   PUT /api/investor/profile
// @access  Private (Investor only)
const updateInvestorProfile = asyncHandler(async (req, res) => {
    const {
        bio,
        location,
        linkedinUrl,
        websiteUrl,
        preferredSectors,
        preferredStages,
        riskAppetite,
        minInvestmentAmount,
        maxInvestmentAmount,
    } = req.body;

    const profile = await InvestorProfile.findOneAndUpdate(
        { user: req.user._id },
        {
            bio,
            location,
            linkedinUrl,
            websiteUrl,
            preferredSectors,
            preferredStages,
            riskAppetite,
            minInvestmentAmount,
            maxInvestmentAmount,
        },
        { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
        success: true,
        message: 'Investor profile updated successfully',
        profile,
    });
});

// @desc    Get recommended startups based on investor preferences
// @route   GET /api/investor/recommendations
// @access  Private (Investor only)
const getRecommendations = asyncHandler(async (req, res) => {
    const profile = await InvestorProfile.findOne({ user: req.user._id });

    const query = { status: 'Approved' };

    // Filter by preferred sectors if set
    if (profile?.preferredSectors?.length) {
        query.sector = { $in: profile.preferredSectors };
    }

    // Filter by preferred stages if set
    if (profile?.preferredStages?.length) {
        query.stage = { $in: profile.preferredStages };
    }

    // Filter by investment size compatibility
    if (profile?.minInvestmentAmount) {
        // Show startups whose minimum investment fits the investor profile
        query.minInvestment = { $lte: profile.maxInvestmentAmount || 1000000 };
    }

    const startups = await Startup.find(query)
        .populate('founder', 'name email')
        .sort({ raisedAmount: -1 }) // Sort by most traction first
        .limit(12);

    // If no matching startups, fall back to all approved startups
    const results =
        startups.length > 0
            ? startups
            : await Startup.find({ status: 'Approved' }).populate('founder', 'name email').sort({ createdAt: -1 }).limit(12);

    res.status(200).json({
        success: true,
        count: results.length,
        hasPreferences: !!profile?.preferredSectors?.length,
        startups: results,
    });
});

// @desc    Add a startup to the investor watchlist
// @route   POST /api/investor/watchlist/:startupId
// @access  Private (Investor only)
const addToWatchlist = asyncHandler(async (req, res) => {
    const { startupId } = req.params;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const profile = await InvestorProfile.findOneAndUpdate(
        { user: req.user._id },
        { $addToSet: { watchlist: startupId } }, // addToSet prevents duplicates
        { new: true, upsert: true }
    );

    res.status(200).json({
        success: true,
        message: `${startup.name} added to your watchlist`,
        watchlistCount: profile.watchlist.length,
    });
});

// @desc    Remove a startup from the investor watchlist
// @route   DELETE /api/investor/watchlist/:startupId
// @access  Private (Investor only)
const removeFromWatchlist = asyncHandler(async (req, res) => {
    const { startupId } = req.params;

    const profile = await InvestorProfile.findOneAndUpdate(
        { user: req.user._id },
        { $pull: { watchlist: startupId } },
        { new: true, upsert: true }
    );

    res.status(200).json({
        success: true,
        message: 'Startup removed from watchlist',
        watchlistCount: profile.watchlist.length,
    });
});

// @desc    Get full watchlist with startup details
// @route   GET /api/investor/watchlist
// @access  Private (Investor only)
const getWatchlist = asyncHandler(async (req, res) => {
    const profile = await InvestorProfile.findOne({ user: req.user._id }).populate(
        'watchlist',
        'name sector stage logo raisedAmount targetAmount investorsCount status founder'
    );

    const watchlist = profile?.watchlist ?? [];

    res.status(200).json({
        success: true,
        count: watchlist.length,
        watchlist,
    });
});

export {
    getInvestorProfile,
    updateInvestorProfile,
    getRecommendations,
    addToWatchlist,
    removeFromWatchlist,
    getWatchlist,
};
