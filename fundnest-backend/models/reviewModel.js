import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
    {
        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Startup',
            required: [true, 'Startup ID is required'],
        },
        reviewer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reviewer ID is required'],
        },
        rating: {
            type: Number,
            required: [true, 'Rating is required'],
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5'],
        },
        title: {
            type: String,
            required: [true, 'Review title is required'],
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'Review content is required'],
            trim: true,
        },
        // Review categories
        categoryScores: {
            businessModel: { type: Number, min: 1, max: 5 },
            team: { type: Number, min: 1, max: 5 },
            marketPotential: { type: Number, min: 1, max: 5 },
            innovation: { type: Number, min: 1, max: 5 },
        },
        // For investor reviews only
        investmentStatus: {
            type: String,
            enum: ['Not Invested', 'Considering', 'Invested'],
            default: 'Not Invested',
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        helpfulCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

// Compound index to ensure a user can only review a startup once
reviewSchema.index({ startup: 1, reviewer: 1 }, { unique: true });
reviewSchema.index({ startup: 1, rating: -1 });
reviewSchema.index({ reviewer: 1, createdAt: -1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
