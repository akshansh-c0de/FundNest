import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
    {
        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Startup',
            required: [true, 'Startup ID is required'],
        },
        organizer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Organizer ID is required'],
        },
        participant: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Participant ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Meeting title is required'],
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        scheduledDate: {
            type: Date,
            required: [true, 'Scheduled date is required'],
        },
        duration: {
            type: Number,
            required: [true, 'Duration is required'],
            default: 30, // in minutes
        },
        status: {
            type: String,
            enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'Rescheduled'],
            default: 'Scheduled',
        },
        meetingLink: {
            type: String,
            trim: true,
        },
        location: {
            type: String,
            trim: true,
        },
        agenda: [{ type: String }],
        notes: {
            type: String,
            trim: true,
        },
        outcome: {
            type: String,
            trim: true,
        },
        reminderSent: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for efficient queries
meetingSchema.index({ startup: 1, scheduledDate: -1 });
meetingSchema.index({ organizer: 1, scheduledDate: -1 });
meetingSchema.index({ participant: 1, scheduledDate: -1 });

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
