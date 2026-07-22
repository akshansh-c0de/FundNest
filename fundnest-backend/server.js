import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import http from 'http';
import validateEnv from './config/env.js';
import connectDB from './config/db.js';
import { initializeSocket } from './config/socket.js';
import userRoutes from './routes/userRoutes.js';
import startupRoutes from './routes/startupRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import investorRoutes from './routes/investorRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import bookmarkRoutes from './routes/bookmarkRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

import { seedStartups } from './controllers/startupController.js';
import { authRateLimiter } from './middleware/rateLimitMiddleware.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

validateEnv();
connectDB().then(() => {
    // Seed startups if collection is empty
    seedStartups();
});

const app = express();

// Secure HTTP headers with Helmet
app.use(helmet());

// Hardened CORS Configuration
app.use(
    cors({
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);

// Payload & Cookie Parsing
app.use(express.json());
app.use(cookieParser());

// Trust proxy for rate limiting (essential when running behind Nginx, Heroku, AWS ELB, etc.)
app.set('trust proxy', 1);

app.get('/api/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Fundnest API is running' });
});

// Apply rate limiting specifically to authentication & user routes
app.use('/api/users', authRateLimiter, userRoutes);
app.use('/api/startups', startupRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/investor', investorRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/documents', documentRoutes);


app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
