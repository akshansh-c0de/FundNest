import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
    {
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Performer ID is required'],
        },
        action: {
            type: String,
            required: [true, 'Action is required'],
            enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'VERIFY'],
        },
        entityType: {
            type: String,
            enum: ['User', 'Startup', 'Transaction', 'Message', 'Meeting', 'Bookmark', 'Review', 'Document', 'Notification', 'Settings'],
            required: [true, 'Entity type is required'],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
        },
        changes: {
            type: mongoose.Schema.Types.Mixed,
            // Stores before/after values for UPDATE actions
        },
        reason: {
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
        // For sensitive operations
        requiresApproval: {
            type: Boolean,
            default: false,
        },
        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    { timestamps: true }
);

// Index for efficient queries
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
