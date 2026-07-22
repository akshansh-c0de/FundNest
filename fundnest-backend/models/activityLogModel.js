import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
        },
        action: {
            type: String,
            required: [true, 'Action is required'],
            trim: true,
        },
        entityType: {
            type: String,
            enum: ['User', 'Startup', 'Transaction', 'Message', 'Meeting', 'Bookmark', 'Review', 'Document'],
            required: [true, 'Entity type is required'],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Entity ID is required'],
        },
        description: {
            type: String,
            trim: true,
        },
        ipAddress: {
            type: String,
            trim: true,
        },
        userAgent: {
            type: String,
            trim: true,
        },
        // Additional metadata
        metadata: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
