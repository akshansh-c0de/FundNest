import dotenv from 'dotenv';
dotenv.config();

import { calculateNumericalRisk } from './utils/riskEngine.js';
import { cosineSimilarity, formatSimilarityPercentage } from './utils/vectorMath.js';
import openaiClient from './services/openaiClient.js';

console.log('====================================================');
console.log('   FUNDNEST PLATFORM CORE LOGIC & AI VERIFICATION   ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ PASS: ${message}`);
    } else {
        console.error(`  ❌ FAIL: ${message}`);
    }
}

// ----------------------------------------------------
// TEST SUITE 1: Deterministic Numerical Risk Engine
// ----------------------------------------------------
console.log('[Suite 1: Hybrid Risk Engine - Numerical Component]');

const highRiskStartup = {
    name: 'Stealth Prototype',
    stage: 'Pre-Seed',
    targetAmount: 500000,
    raisedAmount: 25000, // 5% raised
    teamSize: 1, // Solo founder
    annualRevenue: 0, // Pre-revenue
};

const highRiskResult = calculateNumericalRisk(highRiskStartup);
console.log('High Risk Startup Score:', highRiskResult.overallRiskScore, 'Category:', highRiskResult.riskCategory);
assert(highRiskResult.overallRiskScore >= 70, `High-risk startup score is >= 70 (Actual: ${highRiskResult.overallRiskScore})`);
assert(highRiskResult.riskCategory === 'High' || highRiskResult.riskCategory === 'Very High', `High-risk category is correct (Actual: ${highRiskResult.riskCategory})`);
assert(highRiskResult.metricsBreakdown.stageRisk.score === 85, 'Pre-seed stage risk is 85/100');
assert(highRiskResult.metricsBreakdown.teamRisk.score === 85, 'Solo founder team risk is 85/100');

const lowRiskStartup = {
    name: 'ScaleUp Cloud',
    stage: 'Series A',
    targetAmount: 2000000,
    raisedAmount: 1600000, // 80% raised
    teamSize: 14,
    annualRevenue: 650000, // $650k revenue
};

const lowRiskResult = calculateNumericalRisk(lowRiskStartup);
console.log('Low Risk Startup Score:', lowRiskResult.overallRiskScore, 'Category:', lowRiskResult.riskCategory);
assert(lowRiskResult.overallRiskScore < 40, `Low-risk startup score is < 40 (Actual: ${lowRiskResult.overallRiskScore})`);
assert(lowRiskResult.riskCategory === 'Low', `Low-risk category is Low (Actual: ${lowRiskResult.riskCategory})`);
assert(lowRiskResult.metricsBreakdown.financialRisk.score === 15, 'Strong revenue financial risk is 15/100');

// ----------------------------------------------------
// TEST SUITE 2: Vector Math & Cosine Similarity
// ----------------------------------------------------
console.log('\n[Suite 2: Semantic Vector Math & Cosine Similarity]');

// Identical vectors should have similarity = 1.0 (100%)
const vecA = [0.5, 0.5, 0.5, 0.5];
const vecIdentical = [0.5, 0.5, 0.5, 0.5];
const simIdentical = cosineSimilarity(vecA, vecIdentical);
assert(Math.abs(simIdentical - 1.0) < 0.0001, `Identical vector cosine similarity is 1.0 (Actual: ${simIdentical.toFixed(4)})`);
assert(formatSimilarityPercentage(simIdentical) === 100, `Formatted match is 100% (Actual: ${formatSimilarityPercentage(simIdentical)}%)`);

// Orthogonal vectors should have similarity = 0.0 (0%)
const vecOrthogonal = [-0.5, 0.5, -0.5, 0.5];
const simOrthogonal = cosineSimilarity(vecA, vecOrthogonal);
assert(Math.abs(simOrthogonal - 0.0) < 0.0001, `Orthogonal vector cosine similarity is 0.0 (Actual: ${simOrthogonal.toFixed(4)})`);

// Partially aligned vectors
const vecPartial = [0.5, 0.5, 0.0, 0.0];
const simPartial = cosineSimilarity(vecA, vecPartial);
assert(simPartial > 0.6 && simPartial < 0.8, `Partial vector cosine similarity in range 0.6-0.8 (Actual: ${simPartial.toFixed(4)})`);

// ----------------------------------------------------
// TEST SUITE 3: OpenAI Client Fail-Safe Fallbacks
// ----------------------------------------------------
console.log('\n[Suite 3: Centralized OpenAI Client & Fail-Safes]');

async function testOpenAIClient() {
    const isConfigured = openaiClient.isConfigured();
    console.log(`OpenAI API Key configured: ${isConfigured}`);

    // Test Embedding Generation (1536 dimensions)
    const testText = 'FinTech startup developing autonomous cross-border treasury routing and liquidity pools.';
    const embedding = await openaiClient.generateEmbedding(testText);
    assert(Array.isArray(embedding), 'Embedding returned is an array');
    assert(embedding.length === 1536, `Embedding has exactly 1536 dimensions (Actual: ${embedding.length})`);

    // Verify embedding normalization: ||v|| ~ 1.0
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    assert(Math.abs(norm - 1.0) < 0.05, `Embedding vector is unit normalized (Norm: ${norm.toFixed(4)})`);

    // Test Structured JSON Generation
    const swotFallback = {
        strengths: ['Strong unit economics'],
        weaknesses: ['Limited brand recognition'],
        opportunities: ['Global market expansion'],
        threats: ['Fast follower competition'],
        analysis: 'Solid fundamentals for early investment.',
    };

    const structuredResult = await openaiClient.generateStructuredJson({
        systemPrompt: 'Return a SWOT analysis JSON.',
        userPrompt: testText,
        fallbackData: swotFallback,
    });

    assert(Array.isArray(structuredResult.strengths), 'SWOT contains strengths array');
    assert(Array.isArray(structuredResult.weaknesses), 'SWOT contains weaknesses array');
    assert(Array.isArray(structuredResult.opportunities), 'SWOT contains opportunities array');
    assert(Array.isArray(structuredResult.threats), 'SWOT contains threats array');
    assert(typeof (structuredResult.analysis || structuredResult.summary) === 'string', 'SWOT contains strategic analysis text');

    // Test Chat Completion
    const chatResult = await openaiClient.generateChatCompletion({
        systemPrompt: 'You are a helpful investment assistant.',
        messages: [{ role: 'user', content: 'What is FundNest?' }],
        fallbackText: 'FundNest is a GenAI-Powered Investor–Startup Intelligence Platform.',
    });
    assert(typeof chatResult === 'string' && chatResult.length > 10, 'Chat completion returns valid text response');

    console.log('\n====================================================');
    console.log(`  TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
    console.log('====================================================\n');

    if (passedTests === totalTests) {
        console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!\n');
    } else {
        console.error('⚠️ SOME TESTS FAILED. CHECK LOGS ABOVE.\n');
        process.exit(1);
    }
}

testOpenAIClient().catch(err => {
    console.error('Fatal test error:', err);
    process.exit(1);
});
