const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');

// Public route — no auth required
router.get('/:hackathonId', getLeaderboard);

module.exports = router;
