import express from 'express';
import {
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
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validateAIChat, validateStartupIdBody } from '../validators/platformValidators.js';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// AI Engine Status & Configuration
router.get('/status', getAIStatus);
router.post('/configure-key', configureApiKey);

// AI Analysis Endpoints
router.post('/analyze-pitch', validateStartupIdBody, analyzePitch);
router.post('/generate-summary', validateStartupIdBody, generateSummary);
router.post('/swot-analysis', validateStartupIdBody, swotAnalysis);
router.post('/risk-score', validateStartupIdBody, riskScore);
router.post('/funding-readiness', validateStartupIdBody, fundingReadiness);
router.post('/business-model-analysis', validateStartupIdBody, businessModelAnalysis);
router.post('/document-analysis', documentAnalysis);
router.post('/match-investors', validateStartupIdBody, matchInvestors);
router.post('/investment-recommendation', validateStartupIdBody, investmentRecommendation);
router.post('/chat', validateAIChat, chat);

// Report Retrieval
router.get('/reports/:startupId', getAIReports);
router.get('/risk-reports/:startupId', getRiskReports);

export default router;
