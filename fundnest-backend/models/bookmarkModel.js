import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Startup',
            required: [true, 'Startup ID is required'],
        },
        notes: {
            type: String,
            trim: true,
        },
        tags: [{
            type: String,
            trim: true,
        }],
        // For tracking interest level
        interestLevel: {
            type: String,
            enum: ['Low', 'Medium', 'High'],
            default: 'Medium',
        },
    },
    { timestamps: true }
);

// Compound index to ensure a user can only bookmark a startup once
bookmarkSchema.index({ user: 1, startup: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

export default Bookmark;
