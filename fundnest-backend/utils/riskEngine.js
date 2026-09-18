/**
 * FundNest Hybrid Risk Scoring Engine
 * Computes the deterministic numerical risk score from structured startup metrics:
 *  - Stage Risk (25%)
 *  - Traction & Funding Progress Risk (30%)
 *  - Team Size & Execution Risk (25%)
 *  - Financial & Revenue Sustainability Risk (20%)
 * 
 * This score is combined with the OpenAI qualitative risk narrative in the AI layer.
 */

export function calculateNumericalRisk(startup) {
    const stage = (startup.stage || '').toLowerCase();
    const targetAmount = Number(startup.targetAmount) || 0;
    const raisedAmount = Number(startup.raisedAmount) || 0;
    const teamSize = Number(startup.teamSize) || 1;
    const annualRevenue = Number(startup.annualRevenue) || 0;

    // 1. Stage Risk (25%)
    let stageScore = 65;
    let stageFactor = 'Early Stage';
    let stageDesc = 'Moderate stage risk based on startup lifecycle maturity';

    if (stage.includes('pre-seed')) {
        stageScore = 85;
        stageFactor = 'Pre-Seed';
        stageDesc = 'Concept/prototype stage carries higher execution uncertainty';
    } else if (stage.includes('seed')) {
        stageScore = 70;
        stageFactor = 'Seed Stage';
        stageDesc = 'Product validation phase with initial market testing';
    } else if (stage.includes('series a')) {
        stageScore = 40;
        stageFactor = 'Series A';
        stageDesc = 'Demonstrated product-market fit with scaling potential';
    } else if (stage.includes('series b') || stage.includes('growth')) {
        stageScore = 25;
        stageFactor = 'Growth / Series B+';
        stageDesc = 'Mature operational model with proven unit economics';
    }

    // 2. Traction & Funding Progress Risk (30%)
    let tractionScore = 80;
    let tractionFactor = 'Low Funding Progress';
    let tractionDesc = 'Limited committed capital relative to funding target';

    const fundingProgress = targetAmount > 0 ? (raisedAmount / targetAmount) * 100 : 0;

    if (fundingProgress >= 100) {
        tractionScore = 15;
        tractionFactor = 'Fully Funded';
        tractionDesc = '100%+ funding goal reached; high investor validation';
    } else if (fundingProgress >= 70) {
        tractionScore = 25;
        tractionFactor = 'High Traction';
        tractionDesc = `${fundingProgress.toFixed(1)}% raised; strong market momentum`;
    } else if (fundingProgress >= 40) {
        tractionScore = 45;
        tractionFactor = 'Steady Momentum';
        tractionDesc = `${fundingProgress.toFixed(1)}% raised; good investor backing`;
    } else if (fundingProgress >= 15) {
        tractionScore = 65;
        tractionFactor = 'Initial Traction';
        tractionDesc = `${fundingProgress.toFixed(1)}% raised; early fundraising progress`;
    }

    // 3. Team Size & Execution Capacity Risk (25%)
    let teamScore = 85;
    let teamFactor = 'Solo / Minimal Team';
    let teamDesc = 'Key-person dependency; single point of failure risk';

    if (teamSize >= 10) {
        teamScore = 20;
        teamFactor = 'Established Organization (10+)';
        teamDesc = 'Robust departmental bandwidth across engineering and ops';
    } else if (teamSize >= 5) {
        teamScore = 35;
        teamFactor = 'Core Cross-Functional Team (5-9)';
        teamDesc = 'Well-rounded team with dedicated roles';
    } else if (teamSize >= 3) {
        teamScore = 50;
        teamFactor = 'Small Team (3-4)';
        teamDesc = 'Sufficient founding cohort covering product and commercial';
    } else if (teamSize === 2) {
        teamScore = 68;
        teamFactor = 'Co-Founders (2)';
        teamDesc = 'Co-founder partnership; capacity bottlenecks during rapid growth';
    }

    // 4. Financial & Revenue Sustainability Risk (20%)
    let financialScore = 80;
    let financialFactor = 'Pre-Revenue';
    let financialDesc = 'Relies entirely on external equity financing';

    if (annualRevenue >= 500000) {
        financialScore = 15;
        financialFactor = 'Strong Revenue ($500k+)';
        financialDesc = 'Substantial paying customer base validates demand';
    } else if (annualRevenue >= 100000) {
        financialScore = 30;
        financialFactor = 'Commercialized ($100k+)';
        financialDesc = 'Consistent commercial revenue stream established';
    } else if (annualRevenue > 0) {
        financialScore = 55;
        financialFactor = 'Early Revenue (<$100k)';
        financialDesc = 'Initial monetization started; working toward break-even';
    }

    // Calculate weighted aggregate risk score
    const weightedScore = (stageScore * 0.25) + (tractionScore * 0.30) + (teamScore * 0.25) + (financialScore * 0.20);
    const overallRiskScore = Math.round(weightedScore * 10) / 10;

    // Risk category mapping
    let riskCategory = 'Medium';
    if (overallRiskScore < 35) riskCategory = 'Low';
    else if (overallRiskScore < 55) riskCategory = 'Medium';
    else if (overallRiskScore < 75) riskCategory = 'High';
    else riskCategory = 'Very High';

    // Confidence score based on data availability
    let dataPoints = 0;
    if (startup.stage) dataPoints++;
    if (startup.targetAmount) dataPoints++;
    if (startup.teamSize) dataPoints++;
    if (startup.annualRevenue !== undefined) dataPoints++;
    const confidenceScore = Math.min(0.95, 0.70 + (dataPoints * 0.06));

    return {
        overallRiskScore,
        riskCategory,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
        metricsBreakdown: {
            stageRisk: { score: stageScore, weight: '25%', factor: stageFactor, description: stageDesc },
            tractionRisk: { score: tractionScore, weight: '30%', factor: tractionFactor, description: tractionDesc },
            teamRisk: { score: teamScore, weight: '25%', factor: teamFactor, description: teamDesc },
            financialRisk: { score: financialScore, weight: '20%', factor: financialFactor, description: financialDesc },
        },
    };
}
