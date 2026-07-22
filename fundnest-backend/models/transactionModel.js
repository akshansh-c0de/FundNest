import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
    {
        investor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Startup',
            required: true,
        },
        amount: {
            type: Number,
            required: [true, 'Investment amount is required'],
            min: [1, 'Amount must be at least 1'],
        },
        status: {
            type: String,
            enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
            default: 'Pending',
        },
        paymentMethod: {
            type: String,
            enum: ['Stripe', 'PayPal', 'Bank Transfer', 'Crypto'],
            required: true,
        },
        paymentId: {
            type: String,
            unique: true,
            sparse: true,
        },
        transactionDate: {
            type: Date,
            default: Date.now,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Notes cannot exceed 500 characters'],
        },
    },
    { timestamps: true }
);

// Index for efficient queries
transactionSchema.index({ investor: 1, startup: 1 });
transactionSchema.index({ startup: 1, status: 1 });
transactionSchema.index({ investor: 1, status: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
