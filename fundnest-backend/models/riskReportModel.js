import mongoose from 'mongoose';

const riskReportSchema = new mongoose.Schema(
    {
        startup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Startup',
            required: [true, 'Startup ID is required'],
        },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Generator ID is required'],
        },
        // Risk Scores
        overallRiskScore: {
            type: Number,
            required: [true, 'Overall risk score is required'],
            min: [0, 'Risk score cannot be negative'],
            max: [100, 'Risk score cannot exceed 100'],
        },
        riskCategory: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Very High'],
            required: [true, 'Risk category is required'],
        },
        confidenceScore: {
            type: Number,
            required: [true, 'Confidence score is required'],
            min: [0, 'Confidence score cannot be negative'],
            max: [1, 'Confidence score cannot exceed 1'],
        },
        // Risk Factors
        riskFactors: [{
            factor: { type: String, required: true },
            impact: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
            description: { type: String, required: true },
        }],
        // Mitigation Strategies
        mitigationStrategies: [{ type: String }],
        // Additional Analysis
        marketRisk: { type: Number, min: 0, max: 100 },
        technologyRisk: { type: Number, min: 0, max: 100 },
        teamRisk: { type: Number, min: 0, max: 100 },
        financialRisk: { type: Number, min: 0, max: 100 },
        regulatoryRisk: { type: Number, min: 0, max: 100 },
        // AI Service Reference
        aiServiceVersion: { type: String },
    },
    { timestamps: true }
);

const RiskReport = mongoose.model('RiskReport', riskReportSchema);

export default RiskReport;
