const express = require('express');
const router = express.Router();
const {
  registerTeam,
  getRegistrationsForHackathon,
  updateRegistrationStatus,
  getMyRegistrations,
} = require('../controllers/registrationController');
const { protect } = require('../middleware/authMiddleware');

// Register a team for a hackathon (leader only)
router.route('/')
  .post(protect, registerTeam);

// Get registrations for the current user's teams
router.route('/my')
  .get(protect, getMyRegistrations);

// Get all registrations for a specific hackathon (organizer/admin)
router.route('/hackathon/:hackathonId')
  .get(protect, getRegistrationsForHackathon);

// Update registration status (organizer/admin)
router.route('/:id/status')
  .put(protect, updateRegistrationStatus);

module.exports = router;
