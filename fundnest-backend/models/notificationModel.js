import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: [
                'startup_approved',
                'startup_rejected',
                'investment_received',
                'investment_completed',
                'kyc_approved',
                'kyc_rejected',
                'milestone_updated',
                'system',
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        // Optional reference to related entity
        refModel: {
            type: String,
            enum: ['Startup', 'Transaction', 'User'],
        },
        refId: {
            type: mongoose.Schema.Types.ObjectId,
        },
    },
    { timestamps: true }
);

// TTL index: auto-delete notifications older than 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
