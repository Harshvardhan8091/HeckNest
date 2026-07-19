const express = require('express');
const router = express.Router();
const {
  createTeam,
  getMyTeams,
  getTeamById,
  addMember,
  removeMember,
  leaveTeam,
  transferLeadership,
  deleteTeam,
} = require('../controllers/teamController');
const { protect } = require('../middleware/authMiddleware');

// Base routes
router.route('/')
  .post(protect, createTeam);

router.route('/my')
  .get(protect, getMyTeams);

// Team-specific routes
router.route('/:id')
  .get(protect, getTeamById)
  .delete(protect, deleteTeam);

// Member management
router.route('/:id/members')
  .post(protect, addMember);

router.route('/:id/members/:userId')
  .delete(protect, removeMember);

// Team actions
router.route('/:id/leave')
  .post(protect, leaveTeam);

router.route('/:id/transfer-leadership')
  .put(protect, transferLeadership);

module.exports = router;
