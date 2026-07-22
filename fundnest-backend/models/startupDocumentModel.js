import mongoose from 'mongoose';

const startupDocumentSchema = new mongoose.Schema(
    {
        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Startup',
            required: [true, 'Startup ID is required'],
        },
        documentType: {
            type: String,
            enum: ['pitch_deck', 'business_plan', 'financial_statement', 'legal_document', 'other'],
            required: [true, 'Document type is required'],
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        fileUrl: {
            type: String,
            required: [true, 'File URL is required'],
            trim: true,
        },
        fileSize: {
            type: Number,
            required: [true, 'File size is required'],
        },
        mimeType: {
            type: String,
            required: [true, 'MIME type is required'],
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Uploader ID is required'],
        },
        // AI Analysis Results
        analysisResults: {
            completenessScore: { type: Number },
            qualityScore: { type: Number },
            keyFindings: [{ type: String }],
            recommendations: [{ type: String }],
            extractedData: { type: mongoose.Schema.Types.Mixed },
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        verifiedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

const StartupDocument = mongoose.model('StartupDocument', startupDocumentSchema);

export default StartupDocument;
