import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        refreshToken: {
            type: String,
            required: true,
            index: true,
        },
        device: {
            type: String,
            default: 'Unknown Device',
        },
        browser: {
            type: String,
            default: 'Unknown Browser',
        },
        ipAddress: {
            type: String,
            default: 'Unknown IP',
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
