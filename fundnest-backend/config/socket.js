import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.id}`);

        // Join user's personal room for notifications
        socket.on('join_user', (userId) => {
            socket.join(`user_${userId}`);
            console.log(`User ${userId} joined their room`);
        });

        // Join startup room for real-time updates
        socket.on('join_startup', (startupId) => {
            socket.join(`startup_${startupId}`);
            console.log(`User joined startup room: ${startupId}`);
        });

        // Leave startup room
        socket.on('leave_startup', (startupId) => {
            socket.leave(`startup_${startupId}`);
            console.log(`User left startup room: ${startupId}`);
        });

        // Handle real-time messaging
        socket.on('send_message', (data) => {
            const { recipientId, message } = data;
            io.to(`user_${recipientId}`).emit('receive_message', message);
        });

        // Handle typing indicators
        socket.on('typing', (data) => {
            const { recipientId, isTyping, senderId } = data;
            io.to(`user_${recipientId}`).emit('user_typing', { senderId, isTyping });
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
};

// Helper functions for emitting events
export const emitNotification = (userId, notification) => {
    const io = getIO();
    io.to(`user_${userId}`).emit('notification', notification);
};

export const emitStartupUpdate = (startupId, update) => {
    const io = getIO();
    io.to(`startup_${startupId}`).emit('startup_update', update);
};

export const emitMessage = (recipientId, message) => {
    const io = getIO();
    io.to(`user_${recipientId}`).emit('new_message', message);
};
