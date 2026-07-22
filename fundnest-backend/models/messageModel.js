import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender ID is required'],
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Recipient ID is required'],
        },
        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Startup',
        },
        subject: {
            type: String,
            trim: true,
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
        },
        // For threaded conversations
        parentMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
        // Attachments
        attachments: [{
            fileName: { type: String },
            fileUrl: { type: String },
            fileSize: { type: Number },
        }],
    },
    { timestamps: true }
);

// Index for efficient queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
