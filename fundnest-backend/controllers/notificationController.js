import Notification from '../models/notificationModel.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all notifications for the current user (latest first)
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
        success: true,
        unreadCount,
        notifications,
    });
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    await Notification.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { isRead: true }
    );

    res.status(200).json({ success: true, message: 'Notification marked as read' });
});

// @desc    Mark all notifications as read for the current user
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// Utility: create a notification (used internally by other controllers)
const createNotification = async ({ userId, type, title, message, refModel, refId }) => {
    try {
        await Notification.create({ user: userId, type, title, message, refModel, refId });
    } catch (err) {
        console.error('Failed to create notification:', err.message);
    }
};

export { getNotifications, markAsRead, markAllAsRead, createNotification };
