import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Mapping legacy roles for seamless backward compatibility
const mapRole = (role) => {
    if (role === 'user') return 'investor';
    return role;
};

const authenticate = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        throw new ApiError(401, 'Not authorized — no token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        throw new ApiError(401, 'Not authorized — invalid token format');
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, 'Session expired — please refresh token or login again');
        }
        throw new ApiError(401, 'Not authorized — invalid token');
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
        throw new ApiError(401, 'User no longer exists');
    }

    if (!user.isActive) {
        throw new ApiError(403, 'Account has been deactivated');
    }

    req.user = user;
    next();
});

// Alias protect to authenticate for backward compatibility with existing route imports
const protect = authenticate;

const authorize = (...roles) =>
    asyncHandler(async (req, res, next) => {
        const userRole = mapRole(req.user.role);
        
        // Normalize role values to lowercase for case-insensitivity
        const normalizedRoles = roles.map(r => r.toLowerCase());
        const normalizedUserRole = userRole.toLowerCase();

        if (!normalizedRoles.includes(normalizedUserRole)) {
            throw new ApiError(
                403,
                `Role '${req.user.role}' is not authorized to access this resource`
            );
        }
        next();
    });

export { authenticate, protect, authorize };
