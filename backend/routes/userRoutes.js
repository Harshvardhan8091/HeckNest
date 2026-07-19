const express = require('express');
const router  = express.Router();
const {
  searchUsers,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  getPlatformStats,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// IMPORTANT: /search and /stats must be declared BEFORE /:id routes so Express
// does not treat the literal strings "search"/"stats" as ObjectId params.

// Search users by name / email (any authenticated user — used by pickers)
router.get('/search', protect, searchUsers);

// Platform-wide stats (admin only)
router.get('/stats', protect, authorize('admin'), getPlatformStats);

// Get all users with optional role filter (admin only)
router.get('/', protect, authorize('admin'), getAllUsers);

// Block / unblock a user (admin only)
router.put('/:id/block', protect, authorize('admin'), toggleBlockUser);

// Delete a user (admin only)
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
