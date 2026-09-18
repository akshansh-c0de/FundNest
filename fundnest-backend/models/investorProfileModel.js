import mongoose from 'mongoose';

const investorProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        // Personal & Professional Info
        bio: {
            type: String,
            trim: true,
            maxlength: [1000, 'Bio cannot exceed 1000 characters'],
        },
        location: {
            type: String,
            trim: true,
        },
        linkedinUrl: {
            type: String,
            trim: true,
        },
        websiteUrl: {
            type: String,
            trim: true,
        },
        // Investment Preferences
        preferredSectors: {
            type: [String],
            default: [],
        },
        preferredStages: {
            type: [String],
            enum: ['Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Growth'],
            default: [],
        },
        riskAppetite: {
            type: String,
            enum: ['Conservative', 'Moderate', 'Aggressive'],
            default: 'Moderate',
        },
        minInvestmentAmount: {
            type: Number,
            default: 100,
            min: [1, 'Minimum investment must be at least 1'],
        },
        maxInvestmentAmount: {
            type: Number,
            default: 50000,
        },
        // Watchlist — startups saved by this investor
        watchlist: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Startup',
            },
        ],
        // Cached OpenAI text-embedding-3-small (1536 dims)
        preferenceEmbedding: {
            type: [Number],
            default: undefined,
            select: false,
        },
    },
    { timestamps: true }
);

const InvestorProfile = mongoose.model('InvestorProfile', investorProfileSchema);

export default InvestorProfile;
