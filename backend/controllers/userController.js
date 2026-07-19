const mongoose = require('mongoose');
const User       = require('../models/User');
const Hackathon  = require('../models/Hackathon');
const Team       = require('../models/Team');
const Submission = require('../models/Submission');

// Helper: validate ObjectId and send 400 if invalid
const isValidId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Search users by name or email (picker utility)
// @route   GET /api/users/search?search=<term>&role=<role>
// @access  Private (any authenticated user)
// ─────────────────────────────────────────────────────────────────────────────
const searchUsers = async (req, res) => {
  try {
    const { search = '', role } = req.query;

    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { name:  { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('_id name email role')
      .limit(10)
      .sort({ name: 1 });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Search Users Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all users (admin panel)
// @route   GET /api/users?role=<role>
// @access  Private (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = {};

    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter)
      .select('_id name email role isBlocked createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Get All Users Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle isBlocked on a user
// @route   PUT /api/users/:id/block
// @access  Private (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const toggleBlockUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id, res)) return;

    // Prevent admin from blocking themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot block your own account' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isBlocked = !user.isBlocked;
    await user.save();

    return res.status(200).json({
      message: `User "${user.name}" has been ${user.isBlocked ? 'blocked' : 'unblocked'}`,
      user,
    });
  } catch (error) {
    console.error('Toggle Block User Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a user by ID
// @route   DELETE /api/users/:id
// @access  Private (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id, res)) return;

    // Prevent admin from deleting themselves
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({ message: `User "${user.name}" deleted successfully` });
  } catch (error) {
    console.error('Delete User Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get platform-wide stats
// @route   GET /api/users/stats
// @access  Private (admin only)
// ─────────────────────────────────────────────────────────────────────────────
const getPlatformStats = async (req, res) => {
  try {
    const [totalUsers, totalHackathons, totalTeams, totalSubmissions] = await Promise.all([
      User.countDocuments(),
      Hackathon.countDocuments(),
      Team.countDocuments(),
      Submission.countDocuments(),
    ]);

    return res.status(200).json({
      totalUsers,
      totalHackathons,
      totalTeams,
      totalSubmissions,
    });
  } catch (error) {
    console.error('Get Platform Stats Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  searchUsers,
  getAllUsers,
  toggleBlockUser,
  deleteUser,
  getPlatformStats,
};
