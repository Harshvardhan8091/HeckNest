const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');

// Helper: validate MongoDB ObjectId and send 400 if invalid
const isValidId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return false;
  }
  return true;
};

// @desc    Register a team for a hackathon
// @route   POST /api/registrations
// @access  Private (team leader only)
const registerTeam = async (req, res) => {
  try {
    const { teamId, hackathonId } = req.body;

    if (!teamId || !hackathonId) {
      return res.status(400).json({ message: 'teamId and hackathonId are required' });
    }

    if (!isValidId(teamId, res)) return;
    if (!isValidId(hackathonId, res)) return;

    // Load team and verify requester is the leader
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only the team leader can register the team for a hackathon',
      });
    }

    // Ensure the hackathon exists
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Check registration deadline
    if (new Date() > new Date(hackathon.registrationDeadline)) {
      return res.status(400).json({
        message: 'Registration deadline has passed for this hackathon',
      });
    }

    // Prevent duplicate registration
    const duplicate = await Registration.findOne({
      team: teamId,
      hackathon: hackathonId,
    });

    if (duplicate) {
      return res.status(409).json({
        message: 'This team is already registered for this hackathon',
      });
    }

    const registration = await Registration.create({
      team: teamId,
      hackathon: hackathonId,
      status: 'pending',
    });

    return res.status(201).json(registration);
  } catch (error) {
    console.error('Register Team Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all registrations for a hackathon
// @route   GET /api/registrations/hackathon/:hackathonId
// @access  Private (hackathon organizer or admin)
const getRegistrationsForHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    if (!isValidId(hackathonId, res)) return;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Only the organizer who created it, or an admin, can view
    if (
      hackathon.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Forbidden, only the hackathon organizer or admin can view registrations',
      });
    }

    const registrations = await Registration.find({ hackathon: hackathonId })
      .populate({
        path: 'team',
        select: 'name members',
        populate: { path: 'members', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(registrations);
  } catch (error) {
    console.error('Get Registrations For Hackathon Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update a registration status (approve/reject)
// @route   PUT /api/registrations/:id/status
// @access  Private (hackathon organizer or admin)
const updateRegistrationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id, res)) return;

    const validStatuses = ['approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const registration = await Registration.findById(id).populate('hackathon');
    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const hackathon = registration.hackathon;

    if (
      hackathon.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Forbidden, only the hackathon organizer or admin can update registration status',
      });
    }

    registration.status = status;
    await registration.save();

    return res.status(200).json(registration);
  } catch (error) {
    console.error('Update Registration Status Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get registrations for teams the current user is a member of
// @route   GET /api/registrations/my
// @access  Private
const getMyRegistrations = async (req, res) => {
  try {
    // Find all teams the user is a member of
    const userTeams = await Team.find({ members: req.user._id }).select('_id');
    const teamIds = userTeams.map((t) => t._id);

    const registrations = await Registration.find({ team: { $in: teamIds } })
      .populate('hackathon', 'title startDate endDate status')
      .populate({
        path: 'team',
        select: 'name leader members',
        populate: { path: 'members', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(registrations);
  } catch (error) {
    console.error('Get My Registrations Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  registerTeam,
  getRegistrationsForHackathon,
  updateRegistrationStatus,
  getMyRegistrations,
};
