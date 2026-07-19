const express = require('express');
const router = express.Router();
const {
  createHackathon,
  getAllHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon,
} = require('../controllers/hackathonController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .post(protect, authorize('organizer', 'admin'), createHackathon)
  .get(getAllHackathons);

router
  .route('/:id')
  .get(getHackathonById)
  .put(protect, updateHackathon)
  .delete(protect, deleteHackathon);

module.exports = router;
