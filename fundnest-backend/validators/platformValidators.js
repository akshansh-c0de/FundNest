import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';

const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim();
};

export const validateCreateStartup = (req, res, next) => {
    const { name, sector, stage, description, targetAmount } = req.body;
    const errors = [];

    if (!name?.trim()) errors.push('Startup name is required');
    if (!sector?.trim()) errors.push('Sector is required');
    if (!stage?.trim()) errors.push('Funding stage is required');
    if (!description?.trim() || description.trim().length < 20) {
        errors.push('Description is required and must be at least 20 characters');
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
        errors.push('Target amount must be a positive number');
    }

    if (errors.length > 0) {
        return next(new ApiError(400, errors[0]));
    }

    req.body.name = sanitizeString(name);
    req.body.sector = sanitizeString(sector);
    req.body.stage = sanitizeString(stage);
    req.body.description = sanitizeString(description);
    next();
};

export const validateCreateTransaction = (req, res, next) => {
    const { startupId, amount, paymentMethod } = req.body;
    const errors = [];

    if (!startupId || !mongoose.Types.ObjectId.isValid(startupId)) {
        errors.push('Valid startup ID is required');
    }
    if (!amount || Number(amount) <= 0) {
        errors.push('Investment amount must be greater than zero');
    }
    if (!paymentMethod) {
        errors.push('Payment method is required');
    }

    if (errors.length > 0) {
        return next(new ApiError(400, errors[0]));
    }
    next();
};

export const validateMilestone = (req, res, next) => {
    const { title, targetAmount } = req.body;
    const errors = [];

    if (!title?.trim()) errors.push('Milestone title is required');
    if (targetAmount !== undefined && Number(targetAmount) < 0) {
        errors.push('Target amount cannot be negative');
    }

    if (errors.length > 0) {
        return next(new ApiError(400, errors[0]));
    }
    if (title) req.body.title = sanitizeString(title);
    next();
};

export const validateMilestoneSubmission = (req, res, next) => {
    const { deliverableDescription, proofUrl } = req.body;
    if (!deliverableDescription?.trim() && !proofUrl?.trim()) {
        return next(new ApiError(400, 'Deliverable description or proof URL is required for milestone verification'));
    }
    next();
};

export const validateAIChat = (req, res, next) => {
    const { query } = req.body;
    if (!query?.trim()) {
        return next(new ApiError(400, 'Query text is required'));
    }
    if (query.trim().length > 1000) {
        return next(new ApiError(400, 'Query exceeds maximum allowed length of 1000 characters'));
    }
    req.body.query = sanitizeString(query);
    next();
};

export const validateStartupIdBody = (req, res, next) => {
    const { startupId } = req.body;
    if (!startupId || !mongoose.Types.ObjectId.isValid(startupId)) {
        return next(new ApiError(400, 'Valid startupId is required'));
    }
    next();
};
