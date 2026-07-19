const mongoose = require('mongoose');
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

// @desc    Create a new team for a hackathon
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { name, hackathon } = req.body;

    if (!name || !hackathon) {
      return res.status(400).json({ message: 'name and hackathon are required' });
    }

    if (!isValidId(hackathon, res)) return;

    // Prevent duplicate: user already in a team for this hackathon
    const existingTeam = await Team.findOne({
      hackathon,
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    });

    if (existingTeam) {
      return res.status(409).json({
        message: 'You already belong to a team for this hackathon',
      });
    }

    const team = await Team.create({
      name,
      hackathon,
      leader: req.user._id,
      members: [req.user._id],
    });

    return res.status(201).json(team);
  } catch (error) {
    console.error('Create Team Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all teams the current user belongs to
// @route   GET /api/teams/my
// @access  Private
const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [{ leader: req.user._id }, { members: req.user._id }],
    })
      .populate('hackathon', 'title')
      .populate('members', 'name email')
      .populate('leader', 'name email');

    return res.status(200).json(teams);
  } catch (error) {
    console.error('Get My Teams Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get a single team by ID
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id, res)) return;

    const team = await Team.findById(id)
      .populate('hackathon')
      .populate('leader', 'name email')
      .populate('members', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    return res.status(200).json(team);
  } catch (error) {
    console.error('Get Team By ID Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Add a member to the team
// @route   POST /api/teams/:id/members
// @access  Private (leader only)
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!isValidId(id, res)) return;
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (!isValidId(userId, res)) return;

    const team = await Team.findById(id).populate('hackathon', 'maxTeamSize');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the team leader can add members' });
    }

    // Check if already a member
    const alreadyMember = team.members.some((m) => m.toString() === userId);
    if (alreadyMember) {
      return res.status(409).json({ message: 'User is already a member of this team' });
    }

    // Respect hackathon's maxTeamSize
    const maxTeamSize = team.hackathon?.maxTeamSize ?? 4;
    if (team.members.length >= maxTeamSize) {
      return res.status(400).json({
        message: `Team is full. Maximum team size is ${maxTeamSize}`,
      });
    }

    team.members.push(userId);
    await team.save();

    return res.status(200).json(team);
  } catch (error) {
    console.error('Add Member Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Remove a member from the team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (leader only, cannot remove self)
const removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    if (!isValidId(id, res)) return;
    if (!isValidId(userId, res)) return;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the team leader can remove members' });
    }

    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        message: 'Leader cannot remove themselves this way. Use leaveTeam or transferLeadership.',
      });
    }

    const memberExists = team.members.some((m) => m.toString() === userId);
    if (!memberExists) {
      return res.status(404).json({ message: 'User is not a member of this team' });
    }

    team.members = team.members.filter((m) => m.toString() !== userId);
    await team.save();

    return res.status(200).json({ message: 'Member removed successfully', team });
  } catch (error) {
    console.error('Remove Member Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Leave a team
// @route   POST /api/teams/:id/leave
// @access  Private
const leaveTeam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id, res)) return;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const isMember = team.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(400).json({ message: 'You are not a member of this team' });
    }

    const isLeader = team.leader.toString() === req.user._id.toString();

    if (isLeader) {
      // Other members exist — must transfer leadership first
      const otherMembers = team.members.filter(
        (m) => m.toString() !== req.user._id.toString()
      );

      if (otherMembers.length > 0) {
        return res.status(400).json({
          message:
            'You are the leader. Transfer leadership to another member before leaving.',
        });
      }

      // No other members — delete the team
      await Team.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Team disbanded and deleted successfully' });
    }

    // Regular member leaves
    team.members = team.members.filter((m) => m.toString() !== req.user._id.toString());
    await team.save();

    return res.status(200).json({ message: 'You have left the team', team });
  } catch (error) {
    console.error('Leave Team Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Transfer leadership to another member
// @route   PUT /api/teams/:id/transfer-leadership
// @access  Private (leader only)
const transferLeadership = async (req, res) => {
  try {
    const { id } = req.params;
    const { newLeaderId } = req.body;

    if (!isValidId(id, res)) return;
    if (!newLeaderId) return res.status(400).json({ message: 'newLeaderId is required' });
    if (!isValidId(newLeaderId, res)) return;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the current leader can transfer leadership' });
    }

    const isMember = team.members.some((m) => m.toString() === newLeaderId);
    if (!isMember) {
      return res.status(400).json({
        message: 'New leader must already be a member of the team',
      });
    }

    team.leader = newLeaderId;
    await team.save();

    return res.status(200).json({ message: 'Leadership transferred successfully', team });
  } catch (error) {
    console.error('Transfer Leadership Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete a team
// @route   DELETE /api/teams/:id
// @access  Private (leader only)
const deleteTeam = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id, res)) return;

    const team = await Team.findById(id);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (team.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the team leader can delete the team' });
    }

    await Team.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete Team Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  createTeam,
  getMyTeams,
  getTeamById,
  addMember,
  removeMember,
  leaveTeam,
  transferLeadership,
  deleteTeam,
};
