import StartupDocument from '../models/startupDocumentModel.js';
import Startup from '../models/startupModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import upload from '../middleware/uploadMiddleware.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Upload a document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(400, 'No file uploaded');
    }

    const { startupId, documentType } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Check ownership
    if (startup.founder.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to upload documents for this startup');
    }

    const document = await StartupDocument.create({
        startup: startupId,
        documentType,
        fileName: req.file.originalname,
        fileUrl: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: req.user._id,
    });

    res.status(201).json({
        success: true,
        document,
    });
});

// @desc    Get documents for a startup
// @route   GET /api/documents/startup/:startupId
// @access  Private
const getStartupDocuments = asyncHandler(async (req, res) => {
    const documents = await StartupDocument.find({ startup: req.params.startupId })
        .populate('uploadedBy', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        documents,
    });
});

// @desc    Get a single document
// @route   GET /api/documents/:id
// @access  Private
const getDocument = asyncHandler(async (req, res) => {
    const document = await StartupDocument.findById(req.params.id)
        .populate('startup', 'name')
        .populate('uploadedBy', 'name email');

    if (!document) {
        throw new ApiError(404, 'Document not found');
    }

    res.status(200).json({
        success: true,
        document,
    });
});

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private
const deleteDocument = asyncHandler(async (req, res) => {
    const document = await StartupDocument.findById(req.params.id);

    if (!document) {
        throw new ApiError(404, 'Document not found');
    }

    // Check ownership or admin
    const startup = await Startup.findById(document.startup);
    if (
        document.uploadedBy.toString() !== req.user._id.toString() &&
        startup.founder.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
    ) {
        throw new ApiError(403, 'Not authorized to delete this document');
    }

    // Delete file from filesystem
    if (fs.existsSync(document.fileUrl)) {
        fs.unlinkSync(document.fileUrl);
    }

    await document.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
    });
});

// @desc    Update document analysis results
// @route   PUT /api/documents/:id/analysis
// @access  Private
const updateDocumentAnalysis = asyncHandler(async (req, res) => {
    const { completenessScore, qualityScore, keyFindings, recommendations, extractedData } = req.body;

    const document = await StartupDocument.findById(req.params.id);

    if (!document) {
        throw new ApiError(404, 'Document not found');
    }

    document.analysisResults = {
        completenessScore,
        qualityScore,
        keyFindings,
        recommendations,
        extractedData,
    };

    const updatedDocument = await document.save();

    res.status(200).json({
        success: true,
        document: updatedDocument,
    });
});

export {
    uploadDocument,
    getStartupDocuments,
    getDocument,
    deleteDocument,
    updateDocumentAnalysis,
};
