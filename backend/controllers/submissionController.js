const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Team = require('../models/Team');
const Hackathon = require('../models/Hackathon');
const Registration = require('../models/Registration');

// Helper: validate MongoDB ObjectId and send 400 if invalid
const isValidId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return false;
  }
  return true;
};

// Editable fields allowed on update
const EDITABLE_FIELDS = [
  'projectName',
  'problemStatement',
  'solutionDescription',
  'githubRepo',
  'liveDemoUrl',
  'techStack',
  'screenshots',
  'presentationPdf',
  'demoVideoLink',
];

// @desc    Create a new submission
// @route   POST /api/submissions
// @access  Private (team leader only)
const createSubmission = async (req, res) => {
  try {
    const { team, hackathon, projectName, githubRepo, ...rest } = req.body;

    // Required field checks
    if (!team || !hackathon || !projectName || !githubRepo) {
      return res.status(400).json({
        message: 'team, hackathon, projectName, and githubRepo are required',
      });
    }

    if (!isValidId(team, res)) return;
    if (!isValidId(hackathon, res)) return;

    // Verify the team exists and requester is the leader
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (teamDoc.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only the team leader can submit for this team',
      });
    }

    // Verify the hackathon exists
    const hackathonDoc = await Hackathon.findById(hackathon);
    if (!hackathonDoc) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Verify the team has an approved registration for this hackathon
    const registration = await Registration.findOne({
      team,
      hackathon,
      status: 'approved',
    });

    if (!registration) {
      return res.status(403).json({
        message:
          'Team must have an approved registration for this hackathon before submitting',
      });
    }

    // Prevent duplicate submission for same team + hackathon
    const duplicate = await Submission.findOne({ team, hackathon });
    if (duplicate) {
      return res.status(409).json({
        message: 'This team has already submitted a project for this hackathon',
      });
    }

    const submission = await Submission.create({
      team,
      hackathon,
      projectName,
      githubRepo,
      ...rest,
      status: 'pending',
    });

    return res.status(201).json(submission);
  } catch (error) {
    console.error('Create Submission Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update a submission
// @route   PUT /api/submissions/:id
// @access  Private (team leader only, before hackathon endDate)
const updateSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id, res)) return;

    const submission = await Submission.findById(id).populate('hackathon', 'endDate');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify requester is the team leader
    const teamDoc = await Team.findById(submission.team);
    if (!teamDoc) {
      return res.status(404).json({ message: 'Associated team not found' });
    }

    if (teamDoc.leader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Only the team leader can edit this submission',
      });
    }

    // Reject edits after hackathon endDate
    if (new Date() > new Date(submission.hackathon.endDate)) {
      return res.status(400).json({
        message: 'The hackathon has ended. Submissions can no longer be edited.',
      });
    }

    // Only allow whitelisted fields to be updated
    const updates = {};
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('team', 'name members')
      .populate('hackathon', 'title');

    return res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error('Update Submission Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get a single submission by ID
// @route   GET /api/submissions/:id
// @access  Private
const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id, res)) return;

    const submission = await Submission.findById(id)
      .populate({
        path: 'team',
        select: 'name members',
        populate: { path: 'members', select: 'name email' },
      })
      .populate('hackathon', 'title');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    return res.status(200).json(submission);
  } catch (error) {
    console.error('Get Submission By ID Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get all submissions for a hackathon
// @route   GET /api/submissions/hackathon/:hackathonId
// @access  Private (hackathon organizer or admin)
const getSubmissionsForHackathon = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    if (!isValidId(hackathonId, res)) return;

    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Only organizer or admin can view all submissions
    if (
      hackathon.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Forbidden, only the hackathon organizer or admin can view all submissions',
      });
    }

    const filter = { hackathon: hackathonId };

    // Optional status filter from query param
    const { status } = req.query;
    if (status) {
      const validStatuses = ['pending', 'under_review', 'approved', 'rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          message: `status must be one of: ${validStatuses.join(', ')}`,
        });
      }
      filter.status = status;
    }

    const submissions = await Submission.find(filter)
      .populate({
        path: 'team',
        select: 'name members',
        populate: { path: 'members', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Get Submissions For Hackathon Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Get submissions for the current user's teams
// @route   GET /api/submissions/my
// @access  Private
const getMySubmissions = async (req, res) => {
  try {
    // Find all teams the user is a member of
    const userTeams = await Team.find({ members: req.user._id }).select('_id');
    const teamIds = userTeams.map((t) => t._id);

    const submissions = await Submission.find({ team: { $in: teamIds } })
      .populate('hackathon', 'title startDate endDate status')
      .populate({
        path: 'team',
        select: 'name leader members',
        populate: { path: 'members', select: 'name email' },
      })
      .sort({ createdAt: -1 });

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Get My Submissions Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// @desc    Update submission status (under_review / approved / rejected)
// @route   PUT /api/submissions/:id/status
// @access  Private (hackathon organizer or admin)
const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidId(id, res)) return;

    const validStatuses = ['under_review', 'approved', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const submission = await Submission.findById(id).populate('hackathon', 'organizer');
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Only the hackathon organizer or admin can change status
    if (
      submission.hackathon.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message:
          'Forbidden, only the hackathon organizer or admin can update submission status',
      });
    }

    submission.status = status;
    await submission.save();

    return res.status(200).json(submission);
  } catch (error) {
    console.error('Update Submission Status Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  createSubmission,
  updateSubmission,
  getSubmissionById,
  getSubmissionsForHackathon,
  getMySubmissions,
  updateSubmissionStatus,
};
