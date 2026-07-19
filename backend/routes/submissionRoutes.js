const express = require('express');
const router = express.Router();
const {
  createSubmission,
  updateSubmission,
  getSubmissionById,
  getSubmissionsForHackathon,
  getMySubmissions,
  updateSubmissionStatus,
} = require('../controllers/submissionController');
const { protect } = require('../middleware/authMiddleware');

// Create a submission (team leader only)
router.route('/')
  .post(protect, createSubmission);

// Get submissions for the current user's teams
router.route('/my')
  .get(protect, getMySubmissions);

// Get all submissions for a specific hackathon (organizer/admin)
router.route('/hackathon/:hackathonId')
  .get(protect, getSubmissionsForHackathon);

// Get or update a specific submission
router.route('/:id')
  .get(protect, getSubmissionById)
  .put(protect, updateSubmission);

// Update submission status (organizer/admin)
router.route('/:id/status')
  .put(protect, updateSubmissionStatus);

module.exports = router;
