import Bookmark from '../models/bookmarkModel.js';
import Startup from '../models/startupModel.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all bookmarks for a user
// @route   GET /api/bookmarks
// @access  Private
const getBookmarks = asyncHandler(async (req, res) => {
    const bookmarks = await Bookmark.find({ user: req.user._id })
        .populate('startup', 'name sector stage targetAmount raisedAmount logo')
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        bookmarks,
    });
});

// @desc    Add a bookmark
// @route   POST /api/bookmarks
// @access  Private
const addBookmark = asyncHandler(async (req, res) => {
    const { startupId, notes, tags, interestLevel } = req.body;

    const startup = await Startup.findById(startupId);
    if (!startup) {
        throw new ApiError(404, 'Startup not found');
    }

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
        user: req.user._id,
        startup: startupId,
    });

    if (existingBookmark) {
        throw new ApiError(400, 'Startup already bookmarked');
    }

    const bookmark = await Bookmark.create({
        user: req.user._id,
        startup: startupId,
        notes,
        tags,
        interestLevel: interestLevel || 'Medium',
    });

    const populatedBookmark = await Bookmark.findById(bookmark._id).populate(
        'startup',
        'name sector stage targetAmount raisedAmount logo'
    );

    res.status(201).json({
        success: true,
        bookmark: populatedBookmark,
    });
});

// @desc    Remove a bookmark
// @route   DELETE /api/bookmarks/:id
// @access  Private
const removeBookmark = asyncHandler(async (req, res) => {
    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
        throw new ApiError(404, 'Bookmark not found');
    }

    // Check ownership
    if (bookmark.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to remove this bookmark');
    }

    await bookmark.deleteOne();

    res.status(200).json({
        success: true,
        message: 'Bookmark removed successfully',
    });
});

// @desc    Update a bookmark
// @route   PUT /api/bookmarks/:id
// @access  Private
const updateBookmark = asyncHandler(async (req, res) => {
    const { notes, tags, interestLevel } = req.body;

    const bookmark = await Bookmark.findById(req.params.id);

    if (!bookmark) {
        throw new ApiError(404, 'Bookmark not found');
    }

    // Check ownership
    if (bookmark.user.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'Not authorized to update this bookmark');
    }

    if (notes !== undefined) bookmark.notes = notes;
    if (tags !== undefined) bookmark.tags = tags;
    if (interestLevel !== undefined) bookmark.interestLevel = interestLevel;

    const updatedBookmark = await bookmark.save();

    const populatedBookmark = await Bookmark.findById(updatedBookmark._id).populate(
        'startup',
        'name sector stage targetAmount raisedAmount logo'
    );

    res.status(200).json({
        success: true,
        bookmark: populatedBookmark,
    });
});

export {
    getBookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
};
