const express = require('express');
const router = express.Router();
const {
  assignJudgeToHackathon,
  getAssignedSubmissions,
  submitReview,
  updateReview,
  getReviewsForSubmission,
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Assign a judge to a hackathon (organizer or admin only)
router.post('/assign', protect, authorize('organizer', 'admin'), assignJudgeToHackathon);

// Get submissions available/assigned for the current judge
router.get('/assigned', protect, authorize('judge'), getAssignedSubmissions);

// Get all reviews for a specific submission (organizer/admin/authoring judge)
router.get('/submission/:submissionId', protect, getReviewsForSubmission);

// Create a new review (judge only)
router.post('/', protect, authorize('judge'), submitReview);

// Update an existing review (judge who authored it only)
router.put('/:id', protect, authorize('judge'), updateReview);

module.exports = router;
