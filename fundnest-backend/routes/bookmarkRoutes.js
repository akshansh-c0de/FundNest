import express from 'express';
import {
    getBookmarks,
    addBookmark,
    removeBookmark,
    updateBookmark,
} from '../controllers/bookmarkController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All bookmark routes require authentication
router.use(protect);

router.route('/').get(getBookmarks).post(addBookmark);
router.route('/:id').put(updateBookmark).delete(removeBookmark);

export default router;
