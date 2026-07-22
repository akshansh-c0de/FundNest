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
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All AI routes require authentication
router.use(protect);

// AI Analysis Endpoints
router.post('/analyze-pitch', analyzePitch);
router.post('/generate-summary', generateSummary);
router.post('/swot-analysis', swotAnalysis);
router.post('/risk-score', riskScore);
router.post('/funding-readiness', fundingReadiness);
router.post('/business-model-analysis', businessModelAnalysis);
router.post('/document-analysis', documentAnalysis);
router.post('/match-investors', matchInvestors);
router.post('/investment-recommendation', investmentRecommendation);
router.post('/chat', chat);

// Report Retrieval
router.get('/reports/:startupId', getAIReports);
router.get('/risk-reports/:startupId', getRiskReports);

export default router;
