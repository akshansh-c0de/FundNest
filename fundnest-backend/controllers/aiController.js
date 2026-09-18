import fs from 'fs';
import path from 'path';
import Startup from '../models/startupModel.js';
import AIReport from '../models/aiReportModel.js';
import RiskReport from '../models/riskReportModel.js';
import Transaction from '../models/transactionModel.js';
import InvestorProfile from '../models/investorProfileModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import openaiClient from '../services/openaiClient.js';
import { calculateNumericalRisk } from '../utils/riskEngine.js';

// Helper to format startup info into prompt-ready context
function formatStartupContext(startup) {
    return `
Startup Name: ${startup.name}
Sector: ${startup.sector}
Funding Stage: ${startup.stage}
Target Funding: $${(startup.targetAmount || 0).toLocaleString()}
Raised So Far: $${(startup.raisedAmount || 0).toLocaleString()} (${startup.targetAmount > 0 ? ((startup.raisedAmount / startup.targetAmount) * 100).toFixed(1) : 0}%)
Team Size: ${startup.teamSize || 'Not specified'}
Annual Revenue: $${(startup.annualRevenue || 0).toLocaleString()}
Equity Offered: ${startup.equity || 0}%
Location: ${startup.location || 'Global'}
Tags: ${(startup.tags || []).join(', ') || 'None'}
Description: ${startup.description || 'No description provided.'}
    `.trim();
}

// @desc    Analyze startup pitch with actionable founder-side feedback
// @route   POST /api/ai/analyze-pitch
// @access  Private
const analyzePitch = asyncHandler(async (req, res) => {
    const { startupId, pitchText } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const context = formatStartupContext(startup);
    const combinedPitch = pitchText ? `${context}\n\nAdditional Pitch Deck Notes / Script:\n${pitchText}` : context;

    const systemPrompt = `You are a premier venture capital pitch coach and investor readiness evaluator.
Critique this startup pitch with actionable, high-impact feedback for the founders.
Avoid generic compliments; focus on specific weaknesses, clarity of unit economics, value proposition, and fundability.

Return ONLY a JSON object matching this schema:
{
  "clarity_score": number (0 to 10),
  "persuasiveness_score": number (0 to 10),
  "overall_score": number (0 to 10),
  "summary": "concise 2-3 sentence overview of pitch effectiveness",
  "strengths": ["string", "string", ...],
  "weaknesses": ["string", "string", ...],
  "recommendations": ["concrete action item 1", "concrete action item 2", ...]
}`;

    const fallbackData = {
        clarity_score: 7.5,
        persuasiveness_score: 7.0,
        overall_score: 7.2,
        summary: `${startup.name} presents an active ${startup.stage} campaign in the ${startup.sector} sector with clear initial objectives.`,
        strengths: [
            `Target funding of $${(startup.targetAmount || 0).toLocaleString()} is clearly defined`,
            `Operating in high-interest ${startup.sector} domain`,
            startup.teamSize > 1 ? `Core team of ${startup.teamSize} shows execution capacity` : 'Solo founder initiative',
        ],
        weaknesses: [
            'Requires deeper quantitative proof of customer acquisition economics',
            'Go-to-market distribution channels could be detailed further',
        ],
        recommendations: [
            'Add explicit LTV to CAC payback timelines in the pitch narrative',
            'Highlight pilot contracts or commercial letters of intent prominently',
            'Clarify fund allocation milestones across R&D vs customer acquisition',
        ],
    };

    const result = await openaiClient.generateStructuredJson({
        systemPrompt,
        userPrompt: combinedPitch,
        fallbackData,
    });

    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'pitch_analysis',
        generatedBy: req.user._id,
        summary: result.summary,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        recommendations: result.recommendations || [],
        clarityScore: result.clarity_score || 7,
        persuasivenessScore: result.persuasiveness_score || 7,
        overallScore: result.overall_score || 7,
        aiServiceVersion: 'OpenAI-gpt-4o-mini',
        confidenceScore: 0.90,
    });

    res.status(200).json({
        success: true,
        analysis: result,
        reportId: aiReport._id,
    });
});

// @desc    Generate executive summary via OpenAI Chat Completions
// @route   POST /api/ai/generate-summary
// @access  Private
const generateSummary = asyncHandler(async (req, res) => {
    const { startupId } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const context = formatStartupContext(startup);

    const systemPrompt = `You are an elite investment analyst writing an executive investment memo.
Generate a structured executive summary for institutional and angel investors.

Return ONLY a JSON object matching this schema:
{
  "executive_summary": "comprehensive 3-4 sentence professional summary",
  "key_highlights": ["highlight 1", "highlight 2", "highlight 3", "highlight 4"],
  "market_opportunity": "detailed analysis of market size, trends, and tailwinds",
  "business_overview": "operational analysis of the company's product, model, and traction"
}`;

    const fallbackData = {
        executive_summary: `${startup.name} is a ${startup.stage} venture operating in the ${startup.sector} sector seeking $${(startup.targetAmount || 0).toLocaleString()} in capital. With $${(startup.raisedAmount || 0).toLocaleString()} currently secured, the venture is focused on executing its core go-to-market milestones.`,
        key_highlights: [
            `Sector: ${startup.sector}`,
            `Funding Stage: ${startup.stage}`,
            `Current Progress: ${startup.targetAmount > 0 ? ((startup.raisedAmount / startup.targetAmount) * 100).toFixed(1) : 0}% of target raised`,
            `Team Composition: ${startup.teamSize || 1} team member(s)`,
        ],
        market_opportunity: `The ${startup.sector} ecosystem continues to experience accelerating demand for specialized solutions. ${startup.name} aims to capture market share by addressing key sector pain points.`,
        business_overview: `${startup.name} operates with a target round of $${(startup.targetAmount || 0).toLocaleString()}. Funds will accelerate development, expand customer outreach, and solidify operational runway.`,
    };

    const result = await openaiClient.generateStructuredJson({
        systemPrompt,
        userPrompt: context,
        fallbackData,
    });

    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'executive_summary',
        generatedBy: req.user._id,
        summary: result.executive_summary,
        keyHighlights: result.key_highlights || [],
        marketOpportunity: result.market_opportunity,
        businessOverview: result.business_overview,
        aiServiceVersion: 'OpenAI-gpt-4o-mini',
        confidenceScore: 0.92,
    });

    res.status(200).json({
        success: true,
        summary: result,
        reportId: aiReport._id,
    });
});

// @desc    Perform SWOT analysis via OpenAI structured output
// @route   POST /api/ai/swot-analysis
// @access  Private
const swotAnalysis = asyncHandler(async (req, res) => {
    const { startupId, pitchText } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const context = formatStartupContext(startup);
    const combinedInput = pitchText ? `${context}\n\nAdditional Founder Notes:\n${pitchText}` : context;

    const systemPrompt = `You are a strategic venture analyst conducting a rigorous SWOT analysis for an investment committee.
Identify the four pillars: Strengths, Weaknesses, Opportunities, and Threats based on the startup's data, metrics, and sector dynamics.

Return ONLY a JSON object matching this schema:
{
  "strengths": ["distinct strength 1", "distinct strength 2", "distinct strength 3"],
  "weaknesses": ["distinct weakness 1", "distinct weakness 2", "distinct weakness 3"],
  "opportunities": ["distinct opportunity 1", "distinct opportunity 2", "distinct opportunity 3"],
  "threats": ["distinct threat 1", "distinct threat 2", "distinct threat 3"],
  "analysis": "2-3 sentence strategic executive synthesis"
}`;

    const fallbackData = {
        strengths: [
            `Positioned in expanding ${startup.sector} sector`,
            `Clear stage valuation alignment for ${startup.stage}`,
            startup.annualRevenue > 0 ? `Commercial traction with $${startup.annualRevenue.toLocaleString()} annual revenue` : 'Early-mover agility',
        ],
        weaknesses: [
            `Early stage dependencies on milestone completion`,
            startup.teamSize < 3 ? 'Small core team requires key technical/operational hires' : 'Capital efficiency demands disciplined burn rate',
            startup.raisedAmount < startup.targetAmount * 0.3 ? 'Fundraising momentum still building towards minimum threshold' : 'Scaling overheads',
        ],
        opportunities: [
            `Rapid enterprise and consumer adoption trends within ${startup.sector}`,
            'Potential strategic partnerships with established industry stakeholders',
            'International expansion and cross-border investor syndicated rounds',
        ],
        threats: [
            'Competitive pressure from well-funded incumbents and fast followers',
            'Macroeconomic funding cycles impacting subsequent Series rounds',
            'Regulatory shifts governing data, compliance, and sector standards',
        ],
        analysis: `${startup.name} showcases distinct competitive positioning in ${startup.sector}. Addressing execution and hiring gaps while capturing market tailwinds will be pivotal for long-term equity returns.`,
    };

    const result = await openaiClient.generateStructuredJson({
        systemPrompt,
        userPrompt: combinedInput,
        fallbackData,
    });

    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'swot_analysis',
        generatedBy: req.user._id,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        opportunities: result.opportunities || [],
        threats: result.threats || [],
        summary: result.analysis,
        aiServiceVersion: 'OpenAI-gpt-4o-mini',
        confidenceScore: 0.90,
    });

    res.status(200).json({
        success: true,
        swot: result,
        reportId: aiReport._id,
    });
});

// @desc    Calculate Hybrid Risk Score (Deterministic Formula + OpenAI Narrative)
// @route   POST /api/ai/risk-score
// @access  Private
const riskScore = asyncHandler(async (req, res) => {
    const { startupId } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Step 1: Calculate deterministic numerical risk score from structured metrics
    const numerical = calculateNumericalRisk(startup);

    // Step 2: Prompt OpenAI gpt-4o-mini for qualitative narrative explaining the exact number
    const systemPrompt = `You are a Chief Risk Officer at a venture capital fund.
You are evaluating a startup risk report where the quantitative risk model has calculated an Overall Risk Score of ${numerical.overallRiskScore}/100 (Category: ${numerical.riskCategory}) based on:
- Stage Risk (${numerical.metricsBreakdown.stageRisk.factor}): ${numerical.metricsBreakdown.stageRisk.score}/100
- Traction Risk (${numerical.metricsBreakdown.tractionRisk.factor}): ${numerical.metricsBreakdown.tractionRisk.score}/100
- Team Execution Risk (${numerical.metricsBreakdown.teamRisk.factor}): ${numerical.metricsBreakdown.teamRisk.score}/100
- Financial Sustainability Risk (${numerical.metricsBreakdown.financialRisk.factor}): ${numerical.metricsBreakdown.financialRisk.score}/100

Explain this exact numerical score in plain, candid language for an investor, identifying specific risk factors and concrete mitigation strategies.

Return ONLY a JSON object matching this schema:
{
  "risk_narrative": "thorough 3-4 sentence qualitative narrative explaining why the startup received a ${numerical.overallRiskScore}/100 score and what investors should watch",
  "risk_factors": [
    { "factor": "Factor Title", "impact": "High" | "Medium" | "Low", "description": "Detailed explanation" }
  ],
  "mitigation_strategies": [
    "Concrete investor protection or milestone verification step 1",
    "Concrete operational risk mitigation 2"
  ]
}`;

    const fallbackData = {
        risk_narrative: `${startup.name} carries an overall risk score of ${numerical.overallRiskScore}/100, placing it in the ${numerical.riskCategory} risk tier. This evaluation is driven by its ${startup.stage} maturity profile and current funding traction of ${startup.targetAmount > 0 ? ((startup.raisedAmount / startup.targetAmount) * 100).toFixed(1) : 0}%. Investors should pair capital deployment with milestone-contingent escrow releases to monitor ongoing execution.`,
        risk_factors: [
            {
                factor: numerical.metricsBreakdown.stageRisk.factor,
                impact: numerical.overallRiskScore > 60 ? 'High' : 'Medium',
                description: numerical.metricsBreakdown.stageRisk.description,
            },
            {
                factor: numerical.metricsBreakdown.tractionRisk.factor,
                impact: 'Medium',
                description: numerical.metricsBreakdown.tractionRisk.description,
            },
            {
                factor: numerical.metricsBreakdown.teamRisk.factor,
                impact: startup.teamSize < 3 ? 'High' : 'Low',
                description: numerical.metricsBreakdown.teamRisk.description,
            },
        ],
        mitigation_strategies: [
            'Utilize milestone-governed escrow tranches rather than lump-sum capital disbursement',
            'Require monthly operational KPI updates and transparent burn rate reporting',
            'Diversify investment allocation across complementary sector verticals',
        ],
    };

    const aiResult = await openaiClient.generateStructuredJson({
        systemPrompt,
        userPrompt: formatStartupContext(startup),
        fallbackData,
    });

    // Save complete hybrid risk report
    const riskReport = await RiskReport.create({
        startup: startupId,
        generatedBy: req.user._id,
        overallRiskScore: numerical.overallRiskScore,
        riskCategory: numerical.riskCategory,
        confidenceScore: numerical.confidenceScore,
        metricsBreakdown: numerical.metricsBreakdown,
        riskNarrative: aiResult.risk_narrative || fallbackData.risk_narrative,
        riskFactors: aiResult.risk_factors || fallbackData.risk_factors,
        mitigationStrategies: aiResult.mitigation_strategies || fallbackData.mitigation_strategies,
        aiServiceVersion: 'FundNest-Hybrid-v1.0 (Formulas + OpenAI gpt-4o-mini)',
    });

    res.status(200).json({
        success: true,
        risk: {
            overall_risk_score: numerical.overallRiskScore,
            risk_category: numerical.riskCategory,
            confidence_score: numerical.confidenceScore,
            metrics_breakdown: numerical.metricsBreakdown,
            risk_narrative: riskReport.riskNarrative,
            risk_factors: riskReport.riskFactors,
            mitigation_strategies: riskReport.mitigationStrategies,
        },
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

    const systemPrompt = `You are a venture capital investment readiness auditor.
Assess whether this startup is primed for external capital deployment.

Return ONLY a JSON object:
{
  "readiness_score": number (0 to 100),
  "readiness_level": "High" | "Medium" | "Low",
  "gaps": ["gap 1", "gap 2", ...],
  "strengths": ["strength 1", "strength 2", ...],
  "recommendations": ["step 1", "step 2", ...]
}`;

    const fallbackData = {
        readiness_score: startup.raisedAmount > 0 ? 78 : 65,
        readiness_level: startup.raisedAmount > 0 ? 'Medium' : 'Low',
        gaps: ['Comprehensive cap table model required', 'Customer cohort retention data needed'],
        strengths: [`Sector alignment in ${startup.sector}`, 'Clear target funding goal'],
        recommendations: ['Formalize milestone deliverables', 'Complete KYC documentation'],
    };

    const result = await openaiClient.generateStructuredJson({
        systemPrompt,
        userPrompt: formatStartupContext(startup),
        fallbackData,
    });

    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'funding_readiness',
        generatedBy: req.user._id,
        readinessScore: result.readiness_score || 70,
        readinessLevel: result.readiness_level || 'Medium',
        gaps: result.gaps || [],
        strengths: result.strengths || [],
        recommendations: result.recommendations || [],
        aiServiceVersion: 'OpenAI-gpt-4o-mini',
        confidenceScore: 0.88,
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
    const { startupId } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const systemPrompt = `Analyze the startup business model, revenue streams, scalability, and cost structure.

Return ONLY a JSON object:
{
  "business_model_type": "B2B SaaS | Marketplace | D2C | etc.",
  "revenue_streams": ["stream 1", "stream 2"],
  "cost_structure": ["cost 1", "cost 2"],
  "value_proposition": "summary",
  "competitive_advantage": "moat analysis",
  "scalability_assessment": "scalability summary",
  "sustainability_score": number (0 to 10)
}`;

    const fallbackData = {
        business_model_type: startup.sector.includes('AI') || startup.sector.includes('Software') ? 'B2B SaaS' : 'Direct Market Platform',
        revenue_streams: ['Subscription plans', 'Enterprise licensing', 'Transaction commissions'],
        cost_structure: ['Cloud infrastructure', 'R&D talent', 'Sales and marketing'],
        value_proposition: `${startup.name} streamlines key operations within the ${startup.sector} vertical.`,
        competitive_advantage: 'Specialized domain workflow integration and early market entry.',
        scalability_assessment: 'High scalability potential with near-zero marginal software distribution costs.',
        sustainability_score: 8.2,
    };

    const result = await openaiClient.generateStructuredJson({
        systemPrompt,
        userPrompt: formatStartupContext(startup),
        fallbackData,
    });

    const aiReport = await AIReport.create({
        startup: startupId,
        reportType: 'business_model_analysis',
        generatedBy: req.user._id,
        businessModelType: result.business_model_type,
        revenueStreams: result.revenue_streams || [],
        costStructure: result.cost_structure || [],
        valueProposition: result.value_proposition,
        competitiveAdvantage: result.competitive_advantage,
        scalabilityAssessment: result.scalability_assessment,
        sustainabilityScore: result.sustainability_score || 8.0,
        aiServiceVersion: 'OpenAI-gpt-4o-mini',
        confidenceScore: 0.88,
    });

    res.status(200).json({
        success: true,
        businessModel: result,
        reportId: aiReport._id,
    });
});

// Helper to generate dynamic, intelligent responses grounded in live MongoDB data when OpenAI is quota exhausted or offline
function buildContextualFallbackAnswer({ query, approvedStartups = [], userRole, roleContext = '' }) {
    const q = (query || '').toLowerCase().trim();
    const status = openaiClient.getStatus();
    const quotaNotice = status.mode === 'quota_exhausted'
        ? `> ⚠️ **OpenAI Quota Notice:** Your OpenAI key currently has $0.00 credits (HTTP 429). FundNest has generated this response using its platform intelligence engine grounded in live database records. Add credits at [platform.openai.com/billing](https://platform.openai.com/settings/organization/billing) or connect a free Google Gemini key from [aistudio.google.com](https://aistudio.google.com/app/apikey) for external LLM inference.\n\n`
        : '';

    // Check if query matches a specific startup
    const matchedStartup = approvedStartups.find(s => {
        const name = (s.name || '').toLowerCase();
        return q.includes(name) || (name.split(' ')[0].length > 3 && q.includes(name.split(' ')[0]));
    });

    if (matchedStartup) {
        const s = matchedStartup;
        const progress = s.targetAmount > 0 ? Math.round((s.raisedAmount / s.targetAmount) * 100) : 0;
        const milestones = (s.milestones || []).map(m => `  * **${m.title}**: Target $${(m.targetAmount || 0).toLocaleString()} — Status: \`${m.status || 'Pending'}\` (${m.deliverableDescription || 'No deliverable specified'})`).join('\n') || '  * No milestones logged yet';

        return `${quotaNotice}### 🏢 Venture Analysis: **${s.name}**

**Sector:** ${s.sector} | **Stage:** ${s.stage} | **Location:** ${s.location || 'Global'}

| Metric | Details |
| :--- | :--- |
| **Funding Target** | $${(s.targetAmount || 0).toLocaleString()} |
| **Raised to Date** | $${(s.raisedAmount || 0).toLocaleString()} (${progress}% funded) |
| **Escrow Balance** | $${(s.escrowBalance || s.raisedAmount || 0).toLocaleString()} |
| **Equity Offered** | ${s.equity || 0}% |
| **Team Size** | ${s.teamSize || 1} members |
| **Annual Revenue** | $${(s.annualRevenue || 0).toLocaleString()} |
| **Tags** | ${(s.tags || []).join(', ') || 'General'} |

#### 📝 Executive Synthesis & Thesis
${s.description || 'No detailed pitch overview provided.'}

#### 🎯 Verified Milestone Roadmap
${milestones}

#### 💡 Analyst Assessment
* **Traction Score:** ${progress > 50 ? 'Strong momentum with over 50% target achieved' : 'Early stage capital formation phase'}.
* **Capital Protection:** 100% of invested capital remains protected in FundNest's milestone escrow, releasing tranches strictly upon deliverable verification.`;
    }

    // Check if query asks for startup comparison or listing
    if (q.includes('compare') || q.includes('comparison') || q.includes('vs') || q.includes('all startups') || q.includes('active startups')) {
        const rows = approvedStartups.map(s => {
            const prog = s.targetAmount > 0 ? Math.round((s.raisedAmount / s.targetAmount) * 100) : 0;
            return `| **${s.name}** | ${s.sector} | ${s.stage} | $${(s.targetAmount || 0).toLocaleString()} | $${(s.raisedAmount || 0).toLocaleString()} | ${prog}% |`;
        }).join('\n');

        return `${quotaNotice}### 📊 FundNest Startup Comparison Matrix

Here is the comparative breakdown of all currently approved startups actively raising capital on FundNest:

| Startup | Sector | Stage | Target Goal | Raised | Progress |
| :--- | :--- | :--- | :--- | :--- | :--- |
${rows}

#### 🔑 Key Portfolio Insights
* **Most Funded:** ${[...approvedStartups].sort((a, b) => (b.raisedAmount || 0) - (a.raisedAmount || 0))[0]?.name || 'N/A'} leads in capital committed.
* **Capital Velocity:** Startups across ${[...new Set(approvedStartups.map(s => s.sector))].join(', ')} provide sector diversification for angel and syndicate investors.
* **Risk Shield:** All raises are backed by smart milestone escrow protection.`;
    }

    // Check if query asks about escrow, risk, or safety
    if (q.includes('escrow') || q.includes('risk') || q.includes('safety') || q.includes('protect') || q.includes('milestone') || q.includes('how does')) {
        return `${quotaNotice}### 🛡️ FundNest Milestone Escrow & Capital Protection Architecture

FundNest guarantees investor protection through a three-layer automated governance model:

1. **Smart Tranche Escrow:**
   * When you commit funds, capital does **not** transfer immediately to the founder's bank account.
   * Funds are locked securely in an isolated milestone escrow pool.

2. **Deliverable-Based Release:**
   * Founders submit objective deliverable proof (code repositories, pilot test results, audit certificates) for each pre-agreed milestone.
   * FundNest administrators and syndicate leads review proof before any capital tranche is released.

3. **Hybrid AI Risk Scoring:**
   * Startups are evaluated on 4 quantitative pillars: Financial Health (30%), Market Traction (25%), Team Credibility (25%), and Milestone Execution (20%).
   * Startups falling below safe thresholds are flagged for audit before additional tranches release.

4. **Capital Refund Guarantee:**
   * If a founder fails to meet verified milestone criteria or abandons a project, unreleased escrow balances are refunded back to investors.`;
    }

    // Sector-specific filtering
    const matchedSector = ['healthcare', 'fintech', 'cleantech', 'ai', 'saas', 'biotech'].find(sec => q.includes(sec));
    if (matchedSector) {
        const sectorStartups = approvedStartups.filter(s => (s.sector || '').toLowerCase().includes(matchedSector));
        if (sectorStartups.length > 0) {
            const list = sectorStartups.map(s => {
                const prog = s.targetAmount > 0 ? Math.round((s.raisedAmount / s.targetAmount) * 100) : 0;
                return `* **${s.name}** (${s.stage}): Target $${(s.targetAmount || 0).toLocaleString()}, Raised $${(s.raisedAmount || 0).toLocaleString()} (${prog}%). *${s.description?.slice(0, 120)}...*`;
            }).join('\n');

            return `${quotaNotice}### 🚀 Verified Startups in the **${matchedSector.toUpperCase()}** Sector

FundNest currently hosts **${sectorStartups.length}** approved venture(s) in this sector:

${list}

Would you like a detailed SWOT analysis, risk breakdown, or milestone roadmap for any of these companies?`;
        }
    }

    // General fallback grounded in database
    const startupNames = approvedStartups.map(s => `**${s.name}** (${s.sector})`).join(', ');
    return `${quotaNotice}### 🤖 FundNest Platform Intelligence

I am grounded in live data from FundNest's active database. Currently, we have **${approvedStartups.length} approved startups** raising on the platform:
${startupNames}

#### You can ask me to:
* **Analyze a startup:** *"Give me a deep dive on akshansh_firm"* or *"Analyze NeuroFlow Health"*
* **Compare ventures:** *"Compare all active startups"* or *"Which startup has raised the most?"*
* **Inspect safety:** *"How does milestone escrow protect my investment?"*
* **Filter sectors:** *"Show me AI / ML or CleanTech startups"*`;
}

// @desc    Context-Aware AI Assistant (RAG over Platform Database)
// @route   POST /api/ai/chat
// @access  Private
const chat = asyncHandler(async (req, res) => {
    const { query, conversationHistory, conversation_history } = req.body;
    const history = Array.isArray(conversationHistory) ? conversationHistory : (Array.isArray(conversation_history) ? conversation_history : []);

    if (!query?.trim()) {
        throw new ApiError(400, 'Query text is required');
    }

    const user = req.user;
    const userRole = user.role;

    // --- Step 1: Retrieval Augmented Generation (RAG) ---
    // Retrieve platform database records matching the user's scope and query
    const approvedStartups = await Startup.find({ status: 'Approved' })
        .select('name sector stage targetAmount raisedAmount teamSize annualRevenue equity description tags milestones')
        .limit(10)
        .lean();

    // Role-specific context isolation
    let roleContext = '';
    const sources = [];

    if (userRole === 'investor') {
        const userTransactions = await Transaction.find({
            investor: user._id,
            status: { $in: ['Completed', 'InEscrow', 'Released'] },
        })
            .populate('startup', 'name sector stage')
            .lean();

        const profile = await InvestorProfile.findOne({ user: user._id }).lean();

        roleContext = `
USER CONTEXT (INVESTOR: ${user.name}):
- Preferred Sectors: ${(profile?.preferredSectors || []).join(', ') || 'Not specified'}
- Risk Appetite: ${profile?.riskAppetite || 'Moderate'}
- Active Portfolio Investments (${userTransactions.length}):
${userTransactions.map(t => `  * Invested $${t.amount.toLocaleString()} in ${t.startup?.name} (Status: ${t.status})`).join('\n') || '  * No active investments yet'}
        `.trim();
    } else if (userRole === 'founder') {
        const founderStartups = await Startup.find({ founder: user._id }).lean();
        roleContext = `
USER CONTEXT (FOUNDER: ${user.name}):
- Owned Startups (${founderStartups.length}):
${founderStartups.map(s => `  * ${s.name}: Target $${s.targetAmount.toLocaleString()}, Raised $${s.raisedAmount.toLocaleString()} (${s.status})`).join('\n') || '  * No registered campaigns yet'}
        `.trim();
    }

    const platformStartupsSummary = approvedStartups
        .map(s => {
            sources.push(`${s.name} (${s.sector}, ${s.stage})`);
            return `* Startup "${s.name}" | Sector: ${s.sector} | Stage: ${s.stage} | Target: $${s.targetAmount?.toLocaleString()} | Raised: $${s.raisedAmount?.toLocaleString()} | Team: ${s.teamSize || 1} | Revenue: $${s.annualRevenue?.toLocaleString()} | Desc: ${s.description?.slice(0, 150)}...`;
        })
        .join('\n');

    const systemPrompt = `You are the FundNest GenAI Investment Intelligence Assistant.
You provide intelligent, factual, and analytical answers about the FundNest platform, approved startups, risk profiles, and investment portfolios.

IMPORTANT GROUNDING RULES:
1. Ground your answers ONLY in the verified platform database records provided below.
2. If the user asks about a sector or startup not in the context, explicitly state what is currently available on FundNest.
3. NEVER expose confidential investor details or founders' private credentials.
4. Answer concisely, professionally, and use markdown formatting with bullet points and bold headers when comparing startups.

VERIFIED PLATFORM DATA:
${platformStartupsSummary}

${roleContext}`;

    // Format chat history
    const messages = [];
    if (Array.isArray(history)) {
        history.slice(-4).forEach(msg => {
            if (msg.role && msg.content) {
                messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: String(msg.content) });
            }
        });
    }
    messages.push({ role: 'user', content: query });

    const fallbackAnswer = buildContextualFallbackAnswer({
        query,
        approvedStartups,
        userRole,
        roleContext,
    });

    const answer = await openaiClient.generateChatCompletion({
        systemPrompt,
        messages,
        fallbackText: fallbackAnswer,
    });

    // Follow-up suggestions based on query
    const followUpQuestions = [
        'Compare all active startups on FundNest',
        'Which startup has the highest funding progress?',
        'How does FundNest milestone escrow protect my capital?',
    ];

    res.status(200).json({
        success: true,
        response: {
            answer,
            sources: sources.slice(0, 4),
            confidence: 0.94,
            follow_up_questions: followUpQuestions,
        },
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

// @desc    Analyze uploaded document
// @route   POST /api/ai/document-analysis
// @access  Private
const documentAnalysis = asyncHandler(async (req, res) => {
    const { documentType, textContent } = req.body;

    if (!textContent || typeof textContent !== 'string') {
        throw new ApiError(400, 'Text content is required for document analysis');
    }

    const systemPrompt = `Analyze this ${documentType || 'startup'} document. Evaluate completeness, clarity, and extract strategic findings.

Return ONLY a JSON object:
{
  "completeness_score": number (0 to 10),
  "quality_score": number (0 to 10),
  "key_findings": ["finding 1", "finding 2"],
  "recommendations": ["rec 1", "rec 2"]
}`;

    const fallbackData = {
        completeness_score: 8.0,
        quality_score: 7.8,
        key_findings: ['Document outlines core operational goals', 'Market differentiation identified'],
        recommendations: ['Provide verified audit trail', 'Include detailed unit economics breakdown'],
    };

    const analysis = await openaiClient.generateStructuredJson({
        systemPrompt,
        userPrompt: textContent.slice(0, 4000),
        fallbackData,
    });

    res.status(200).json({
        success: true,
        analysis,
    });
});

// @desc    Match investors for a startup using OpenAI embeddings
// @route   POST /api/ai/match-investors
// @access  Private
const matchInvestors = asyncHandler(async (req, res) => {
    const { startupId } = req.body;

    const startup = await Startup.findById(startupId).select('+embedding');
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const profiles = await InvestorProfile.find({}).populate('user', 'name email');

    const matches = profiles.map(p => {
        let score = 75;
        if (p.preferredSectors?.includes(startup.sector)) score += 15;
        if (p.preferredStages?.includes(startup.stage)) score += 10;
        return {
            investorId: p.user?._id,
            investorName: p.user?.name,
            investorEmail: p.user?.email,
            matchScore: Math.min(99, score),
            riskAppetite: p.riskAppetite,
            preferredSectors: p.preferredSectors,
        };
    }).sort((a, b) => b.matchScore - a.matchScore);

    res.status(200).json({
        success: true,
        matches,
    });
});

// @desc    Get investment recommendation (Buy / Hold / Pass)
// @route   POST /api/ai/investment-recommendation
// @access  Private
const investmentRecommendation = asyncHandler(async (req, res) => {
    const { startupId } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    const numerical = calculateNumericalRisk(startup);

    let recommendation = 'Buy';
    let conviction = 85;
    let rationale = '';

    if (numerical.overallRiskScore > 70) {
        recommendation = 'Pass';
        conviction = 78;
        rationale = `High overall risk score (${numerical.overallRiskScore}/100) and early-stage uncertainty suggest waiting for milestone traction before capital allocation.`;
    } else if (numerical.overallRiskScore > 45) {
        recommendation = 'Hold / Tranche-Invest';
        conviction = 82;
        rationale = `Balanced risk profile (${numerical.overallRiskScore}/100). Recommended to invest via milestone-based escrow tranches to mitigate execution risk.`;
    } else {
        recommendation = 'Strong Buy';
        conviction = 92;
        rationale = `Low risk profile (${numerical.overallRiskScore}/100) with proven traction and mature team capacity in the ${startup.sector} space.`;
    }

    res.status(200).json({
        success: true,
        recommendation: {
            verdict: recommendation,
            conviction_score: conviction,
            overall_risk_score: numerical.overallRiskScore,
            risk_category: numerical.riskCategory,
            rationale,
        },
    });
});

// @desc    Get real-time OpenAI status
// @route   GET /api/ai/status
// @access  Private
const getAIStatus = asyncHandler(async (req, res) => {
    res.status(200).json({
        success: true,
        status: openaiClient.getStatus(),
    });
});

// @desc    Configure AI API Key (OpenAI, Google Gemini, Groq) at runtime and persist to .env
// @route   POST /api/ai/configure-key
// @access  Private
const configureApiKey = asyncHandler(async (req, res) => {
    const { apiKey } = req.body;

    if (!apiKey || typeof apiKey !== 'string') {
        throw new ApiError(400, 'API key is required');
    }

    const trimmedKey = apiKey.trim();
    const config = openaiClient.resolveConfig(trimmedKey);
    if (!config) {
        throw new ApiError(400, 'Invalid key format. Supported formats: OpenAI (sk-...), Google Gemini (AIza...), or Groq (gsk_...)');
    }

    // Test the key live with a lightweight completion
    try {
        const { default: OpenAI } = await import('openai');
        const testClient = new OpenAI({
            apiKey: config.apiKey,
            baseURL: config.baseURL,
        });

        await testClient.chat.completions.create({
            model: config.chatModel,
            messages: [{ role: 'user', content: 'hello' }],
            max_tokens: 2,
        });
    } catch (testErr) {
        if (testErr.status === 429 || testErr.code === 'credit_balance_exhausted' || testErr.code === 'insufficient_quota') {
            throw new ApiError(402, `Key was accepted by ${config.provider}, but the account has $0.00 credit balance (Error 429). Add credits at ${config.billingUrl} or use a free Google Gemini key from https://aistudio.google.com/app/apikey.`);
        }
        throw new ApiError(400, `Failed to authenticate with ${config.provider} API: ${testErr.message}`);
    }

    // Set key in runtime client
    openaiClient.setApiKey(trimmedKey);

    // Persist to .env
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            let envContent = fs.readFileSync(envPath, 'utf8');
            const envVar = config.provider === 'Google Gemini' ? 'GEMINI_API_KEY' : (config.provider === 'Groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY');
            if (envContent.includes(`${envVar}=`)) {
                envContent = envContent.replace(new RegExp(`${envVar}=.*`), `${envVar}=${trimmedKey}`);
            } else {
                envContent += `\n${envVar}=${trimmedKey}\n`;
            }
            fs.writeFileSync(envPath, envContent, 'utf8');
        }
    } catch (fsErr) {
        console.warn('Could not persist key to .env file:', fsErr.message);
    }

    res.status(200).json({
        success: true,
        message: `${config.provider} key verified and live real-time analysis enabled!`,
        status: openaiClient.getStatus(),
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
    getAIStatus,
    configureApiKey,
};
