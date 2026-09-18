import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        targetAmount: { type: Number, default: 0, min: 0 },
        deliverableDescription: { type: String, trim: true },
        proofUrl: { type: String, trim: true },
        targetDate: { type: Date },
        completedAt: { type: Date },
        status: {
            type: String,
            enum: ['Pending', 'InProgress', 'Submitted', 'Verified', 'Rejected'],
            default: 'Pending',
        },
        submissionNotes: { type: String, trim: true },
        verifiedAt: { type: Date },
        verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        verificationNotes: { type: String, trim: true },
        releasedAmount: { type: Number, default: 0, min: 0 },
    },
    { _id: true, timestamps: true }
);

const startupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Startup name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        sector: {
            type: String,
            required: [true, 'Sector is required'],
            trim: true,
        },
        stage: {
            type: String,
            required: [true, 'Funding stage is required'],
            trim: true,
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
        },
        targetAmount: {
            type: Number,
            required: [true, 'Target funding amount is required'],
            min: [1, 'Target amount must be at least 1'],
        },
        raisedAmount: {
            type: Number,
            default: 0,
            min: [0, 'Raised amount cannot be negative'],
        },
        investorsCount: {
            type: Number,
            default: 0,
            min: [0, 'Investors count cannot be negative'],
        },
        logo: {
            type: String,
            default: '🧠',
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected', 'Closed'],
            default: 'Pending',
        },
        founder: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Founder ID is required'],
        },
        // --- Extended Fields ---
        location: {
            type: String,
            trim: true,
        },
        website: {
            type: String,
            trim: true,
        },
        teamSize: {
            type: Number,
            min: [1, 'Team size must be at least 1'],
        },
        // Annual Revenue in USD
        annualRevenue: {
            type: Number,
            default: 0,
        },
        equity: {
            type: Number, // Percentage equity offered (e.g. 10 = 10%)
            min: [0, 'Equity cannot be negative'],
            max: [100, 'Equity cannot exceed 100%'],
        },
        minInvestment: {
            type: Number,
            default: 100,
            min: [1, 'Minimum investment must be at least 1'],
        },
        // Document URLs (uploaded via Multer/cloud storage)
        pitchDeckUrl: { type: String, trim: true },
        businessPlanUrl: { type: String, trim: true },
        financialStatementUrl: { type: String, trim: true },
        // Tags for search/filtering
        tags: {
            type: [String],
            default: [],
        },
        // Admin rejection reason
        rejectionReason: {
            type: String,
            trim: true,
        },
        // Milestone tracker
        milestones: {
            type: [milestoneSchema],
            default: [],
        },
        // Escrow funds tracking
        escrowBalance: {
            type: Number,
            default: 0,
            min: [0, 'Escrow balance cannot be negative'],
        },
        releasedFunds: {
            type: Number,
            default: 0,
            min: [0, 'Released funds cannot be negative'],
        },
        // Cached OpenAI text-embedding-3-small (1536 dims)
        embedding: {
            type: [Number],
            default: undefined,
            select: false,
        },
    },
    { timestamps: true }
);

// Text search index
startupSchema.index({ name: 'text', sector: 'text', description: 'text', tags: 'text' });

const Startup = mongoose.model('Startup', startupSchema);

export default Startup;

