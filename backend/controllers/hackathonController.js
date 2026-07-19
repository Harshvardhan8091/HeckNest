const mongoose = require('mongoose');
const Hackathon = require('../models/Hackathon');

// @desc    Create a new hackathon
// @route   POST /api/hackathons
// @access  Private (Organizer/Admin only)
const createHackathon = async (req, res) => {
  try {
    const hackathonData = {
      ...req.body,
      organizer: req.user._id,
    };

    const hackathon = await Hackathon.create(hackathonData);
    return res.status(201).json(hackathon);
  } catch (error) {
    console.error('Create Hackathon Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all hackathons
// @route   GET /api/hackathons
// @access  Public
const getAllHackathons = async (req, res) => {
  try {
    const { mode, status, search } = req.query;
    const filter = {};

    if (mode) {
      filter.mode = mode;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const hackathons = await Hackathon.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(hackathons);
  } catch (error) {
    console.error('Get All Hackathons Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get a single hackathon by ID
// @route   GET /api/hackathons/:id
// @access  Public
const getHackathonById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const hackathon = await Hackathon.findById(id).populate('organizer', 'name email');

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    return res.status(200).json(hackathon);
  } catch (error) {
    console.error('Get Hackathon By ID Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update a hackathon
// @route   PUT /api/hackathons/:id
// @access  Private (Owner/Admin only)
const updateHackathon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const hackathon = await Hackathon.findById(id);

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Check ownership: only the creating organizer or an admin can update
    if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden, not authorized to update this hackathon' });
    }

    const updatedHackathon = await Hackathon.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(updatedHackathon);
  } catch (error) {
    console.error('Update Hackathon Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Delete a hackathon
// @route   DELETE /api/hackathons/:id
// @access  Private (Owner/Admin only)
const deleteHackathon = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const hackathon = await Hackathon.findById(id);

    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Check ownership: only the creating organizer or an admin can delete
    if (hackathon.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden, not authorized to delete this hackathon' });
    }

    await Hackathon.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Hackathon deleted successfully' });
  } catch (error) {
    console.error('Delete Hackathon Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  createHackathon,
  getAllHackathons,
  getHackathonById,
  updateHackathon,
  deleteHackathon,
};
