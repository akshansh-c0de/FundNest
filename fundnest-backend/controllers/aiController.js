import Startup from '../models/startupModel.js';
import AIReport from '../models/aiReportModel.js';
import RiskReport from '../models/riskReportModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Helper function to call AI service
async function callAIService(endpoint, data) {
    try {
        const response = await fetch(`${AI_SERVICE_URL}/api${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error(`AI service error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('AI Service Error:', error);
        throw new ApiError(500, `Failed to get AI analysis: ${error.message}`);
    }
}

// @desc    Analyze startup pitch
// @route   POST /api/ai/analyze-pitch
// @access  Private
const analyzePitch = asyncHandler(async (req, res) => {
    const { startupId, pitchText } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const startupData = {
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        description: startup.description,
        target_amount: startup.targetAmount,
        raised_amount: startup.raisedAmount,
        location: startup.location,
        team_size: startup.teamSize,
        annual_revenue: startup.annualRevenue,
        equity: startup.equity,
        tags: startup.tags,
    };

    const result = await callAIService('/analyze-pitch', {
        startup: startupData,
        pitch_text: pitchText,
    });

    // Save AI report
    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'pitch_analysis',
        generatedBy: req.user._id,
        summary: result.summary,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        recommendations: result.recommendations,
        clarityScore: result.clarity_score,
        persuasivenessScore: result.persuasiveness_score,
        overallScore: result.overall_score,
        aiServiceVersion: '1.0.0',
        confidenceScore: 0.85,
    });

    res.status(200).json({
        success: true,
        analysis: result,
        reportId: aiReport._id,
    });
});

// @desc    Generate executive summary
// @route   POST /api/ai/generate-summary
// @access  Private
const generateSummary = asyncHandler(async (req, res) => {
    const { startupId } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const startupData = {
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        description: startup.description,
        target_amount: startup.targetAmount,
        raised_amount: startup.raisedAmount,
        location: startup.location,
        team_size: startup.teamSize,
        annual_revenue: startup.annualRevenue,
        equity: startup.equity,
        tags: startup.tags,
    };

    const result = await callAIService('/generate-summary', {
        startup: startupData,
    });

    // Save AI report
    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'executive_summary',
        generatedBy: req.user._id,
        summary: result.executive_summary,
        keyHighlights: result.key_highlights,
        marketOpportunity: result.market_opportunity,
        businessOverview: result.business_overview,
        aiServiceVersion: '1.0.0',
        confidenceScore: 0.85,
    });

    res.status(200).json({
        success: true,
        summary: result,
        reportId: aiReport._id,
    });
});

// @desc    Perform SWOT analysis
// @route   POST /api/ai/swot-analysis
// @access  Private
const swotAnalysis = asyncHandler(async (req, res) => {
    const { startupId, pitchText } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const startupData = {
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        description: startup.description,
        target_amount: startup.targetAmount,
        raised_amount: startup.raisedAmount,
        location: startup.location,
        team_size: startup.teamSize,
        annual_revenue: startup.annualRevenue,
        equity: startup.equity,
        tags: startup.tags,
    };

    const result = await callAIService('/swot-analysis', {
        startup: startupData,
        pitch_text: pitchText,
    });

    // Save AI report
    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'swot_analysis',
        generatedBy: req.user._id,
        strengths: result.strengths,
        weaknesses: result.weaknesses,
        opportunities: result.opportunities,
        threats: result.threats,
        summary: result.analysis,
        aiServiceVersion: '1.0.0',
        confidenceScore: 0.85,
    });

    res.status(200).json({
        success: true,
        swot: result,
        reportId: aiReport._id,
    });
});

// @desc    Calculate risk score
// @route   POST /api/ai/risk-score
// @access  Private
const riskScore = asyncHandler(async (req, res) => {
    const { startupId, financialData } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const startupData = {
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        description: startup.description,
        target_amount: startup.targetAmount,
        raised_amount: startup.raisedAmount,
        location: startup.location,
        team_size: startup.teamSize,
        annual_revenue: startup.annualRevenue,
        equity: startup.equity,
        tags: startup.tags,
    };

    const result = await callAIService('/risk-score', {
        startup: startupData,
        financial_data: financialData,
    });

    // Save risk report
    const riskReport = await RiskReport.create({
        startup: startupId,
        generatedBy: req.user._id,
        overallRiskScore: result.overall_risk_score,
        riskCategory: result.risk_category,
        confidenceScore: result.confidence_score,
        riskFactors: result.risk_factors,
        mitigationStrategies: result.mitigation_strategies,
        aiServiceVersion: '1.0.0',
    });

    res.status(200).json({
        success: true,
        risk: result,
        reportId: riskReport._id,
    });
});

// @desc    Assess funding readiness
// @route   POST /api/ai/funding-readiness
// @access  Private
const fundingReadiness = asyncHandler(async (req, res) => {
    const { startupId } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const startupData = {
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        description: startup.description,
        target_amount: startup.targetAmount,
        raised_amount: startup.raisedAmount,
        location: startup.location,
        team_size: startup.teamSize,
        annual_revenue: startup.annualRevenue,
        equity: startup.equity,
        tags: startup.tags,
    };

    const result = await callAIService('/funding-readiness', {
        startup: startupData,
    });

    // Save AI report
    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'funding_readiness',
        generatedBy: req.user._id,
        readinessScore: result.readiness_score,
        readinessLevel: result.readiness_level,
        gaps: result.gaps,
        strengths: result.strengths,
        recommendations: result.recommendations,
        aiServiceVersion: '1.0.0',
        confidenceScore: 0.85,
    });

    res.status(200).json({
        success: true,
        readiness: result,
        reportId: aiReport._id,
    });
});

// @desc    Analyze business model
// @route   POST /api/ai/business-model-analysis
// @access  Private
const businessModelAnalysis = asyncHandler(async (req, res) => {
    const { startupId, businessPlan } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const startupData = {
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        description: startup.description,
        target_amount: startup.targetAmount,
        raised_amount: startup.raisedAmount,
        location: startup.location,
        team_size: startup.teamSize,
        annual_revenue: startup.annualRevenue,
        equity: startup.equity,
        tags: startup.tags,
    };

    const result = await callAIService('/business-model-analysis', {
        startup: startupData,
        business_plan: businessPlan,
    });

    // Save AI report
    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'business_model_analysis',
        generatedBy: req.user._id,
        businessModelType: result.business_model_type,
        revenueStreams: result.revenue_streams,
        costStructure: result.cost_structure,
        valueProposition: result.value_proposition,
        competitiveAdvantage: result.competitive_advantage,
        scalabilityAssessment: result.scalability_assessment,
        sustainabilityScore: result.sustainability_score,
        aiServiceVersion: '1.0.0',
        confidenceScore: 0.85,
    });

    res.status(200).json({
        success: true,
        businessModel: result,
        reportId: aiReport._id,
    });
});

// @desc    Analyze document
// @route   POST /api/ai/document-analysis
// @access  Private
const documentAnalysis = asyncHandler(async (req, res) => {
    const { documentType, textContent } = req.body;

    const result = await callAIService('/document-analysis', {
        document_type: documentType,
        text_content: textContent,
    });

    res.status(200).json({
        success: true,
        analysis: result,
    });
});

// @desc    Match investors
// @route   POST /api/ai/match-investors
// @access  Private
const matchInvestors = asyncHandler(async (req, res) => {
    const { startupId, investorProfiles } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const startupData = {
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        description: startup.description,
        target_amount: startup.targetAmount,
        raised_amount: startup.raisedAmount,
        location: startup.location,
        team_size: startup.teamSize,
        annual_revenue: startup.annualRevenue,
        equity: startup.equity,
        tags: startup.tags,
    };

    const result = await callAIService('/match-investors', {
        startup: startupData,
        investor_profiles: investorProfiles,
    });

    res.status(200).json({
        success: true,
        matches: result,
    });
});

// @desc    Get investment recommendation
// @route   POST /api/ai/investment-recommendation
// @access  Private
const investmentRecommendation = asyncHandler(async (req, res) => {
    const { startupId, investorProfile, marketData } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const startupData = {
        name: startup.name,
        sector: startup.sector,
        stage: startup.stage,
        description: startup.description,
        target_amount: startup.targetAmount,
        raised_amount: startup.raisedAmount,
        location: startup.location,
        team_size: startup.teamSize,
        annual_revenue: startup.annualRevenue,
        equity: startup.equity,
        tags: startup.tags,
    };

    const result = await callAIService('/investment-recommendation', {
        startup: startupData,
        investor_profile: investorProfile,
        market_data: marketData,
    });

    res.status(200).json({
        success: true,
        recommendation: result,
    });
});

// @desc    AI Chat
// @route   POST /api/ai/chat
// @access  Private
const chat = asyncHandler(async (req, res) => {
    const { query, context, conversationHistory } = req.body;

    const result = await callAIService('/chat', {
        query,
        context,
        conversation_history: conversationHistory,
    });

    res.status(200).json({
        success: true,
        response: result,
    });
});

// @desc    Get AI reports for a startup
// @route   GET /api/ai/reports/:startupId
// @access  Private
const getAIReports = asyncHandler(async (req, res) => {
    const reports = await AIReport.find({ startup: req.params.startupId })
        .populate('generatedBy', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        reports,
    });
});

// @desc    Get risk reports for a startup
// @route   GET /api/ai/risk-reports/:startupId
// @access  Private
const getRiskReports = asyncHandler(async (req, res) => {
    const reports = await RiskReport.find({ startup: req.params.startupId })
        .populate('generatedBy', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        reports,
    });
});

export {
    analyzePitch,
    generateSummary,
    swotAnalysis,
    riskScore,
    fundingReadiness,
    businessModelAnalysis,
    documentAnalysis,
    matchInvestors,
    investmentRecommendation,
    chat,
    getAIReports,
    getRiskReports,
};
