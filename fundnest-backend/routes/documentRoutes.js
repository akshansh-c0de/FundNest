import express from 'express';
import {
    uploadDocument,
    getStartupDocuments,
    getDocument,
    deleteDocument,
    updateDocumentAnalysis,
} from '../controllers/documentController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All document routes require authentication
router.use(protect);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/startup/:startupId', getStartupDocuments);
router.get('/:id', getDocument);
router.delete('/:id', deleteDocument);
router.put('/:id/analysis', updateDocumentAnalysis);

export default router;
