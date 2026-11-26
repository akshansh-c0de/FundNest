import ApiError from '../utils/ApiError.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number and one special character
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

// Custom lightweight sanitization to prevent basic XSS attacks
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

const validateRegister = (req, res, next) => {
    let { name, email, password, role } = req.body;
    const errors = [];

    if (!name?.trim()) {
        errors.push('Name is required');
    } else if (name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    }

    if (!email?.trim()) {
        errors.push('Email is required');
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.push('Please provide a valid email address');
    }

    if (!password) {
        errors.push('Password is required');
    } else if (!PASSWORD_REGEX.test(password)) {
        errors.push(
            'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        );
    }

    if (role && !['investor', 'founder'].includes(role.trim().toLowerCase())) {
        errors.push('Invalid signup role. Allowed roles are: investor, founder');
    }

    if (errors.length > 0) {
        return next(new ApiError(400, errors[0]));
    }

    // Sanitize inputs
    req.body.name = sanitizeString(name.trim());
    req.body.email = email.trim().toLowerCase();
    if (role) {
        req.body.role = role.trim().toLowerCase();
    }
    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    const errors = [];

    if (!email?.trim()) {
        errors.push('Email is required');
    } else if (!EMAIL_REGEX.test(email.trim())) {
        errors.push('Please provide a valid email address');
    }

    if (!password) {
        errors.push('Password is required');
    }

    if (errors.length > 0) {
        return next(new ApiError(400, errors[0]));
    }

    req.body.email = email.trim().toLowerCase();
    next();
};

const validateChangePassword = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const errors = [];

    if (!currentPassword) {
        errors.push('Current password is required');
    }

    if (!newPassword) {
        errors.push('New password is required');
    } else if (!PASSWORD_REGEX.test(newPassword)) {
        errors.push(
            'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
        );
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
        errors.push('New password must be different from current password');
    }

    if (errors.length > 0) {
        return next(new ApiError(400, errors[0]));
    }

    next();
};

export { validateRegister, validateLogin, validateChangePassword };
