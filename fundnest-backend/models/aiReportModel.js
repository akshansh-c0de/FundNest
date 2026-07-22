import mongoose from 'mongoose';

const aiReportSchema = new mongoose.Schema(
    {
        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Startup',
            required: [true, 'Startup ID is required'],
        },
        reportType: {
            type: String,
            enum: ['pitch_analysis', 'executive_summary', 'swot_analysis', 'funding_readiness', 'business_model_analysis'],
            required: [true, 'Report type is required'],
        },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Generator ID is required'],
        },
        // Report Content
        summary: { type: String },
        strengths: [{ type: String }],
        weaknesses: [{ type: String }],
        opportunities: [{ type: String }],
        threats: [{ type: String }],
        keyHighlights: [{ type: String }],
        marketOpportunity: { type: String },
        businessOverview: { type: String },
        readinessScore: { type: Number, min: 0, max: 100 },
        readinessLevel: { type: String },
        gaps: [{ type: String }],
        recommendations: [{ type: String }],
        // Scores
        clarityScore: { type: Number, min: 0, max: 10 },
        persuasivenessScore: { type: Number, min: 0, max: 10 },
        overallScore: { type: Number, min: 0, max: 10 },
        sustainabilityScore: { type: Number, min: 0, max: 10 },
        // Business Model Analysis
        businessModelType: { type: String },
        revenueStreams: [{ type: String }],
        costStructure: [{ type: String }],
        valueProposition: { type: String },
        competitiveAdvantage: { type: String },
        scalabilityAssessment: { type: String },
        // AI Service Reference
        aiServiceVersion: { type: String },
        confidenceScore: { type: Number, min: 0, max: 1 },
    },
    { timestamps: true }
);

const AIReport = mongoose.model('AIReport', aiReportSchema);

export default AIReport;
