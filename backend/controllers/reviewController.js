const mongoose = require('mongoose');
const Review = require('../models/Review');
const Submission = require('../models/Submission');
const Hackathon = require('../models/Hackathon');
const User = require('../models/User');

// Helper: validate MongoDB ObjectId and send 400 if invalid
const isValidId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return false;
  }
  return true;
};

// Score fields used across create and update
const SCORE_FIELDS = [
  'innovation',
  'technicalComplexity',
  'userInterface',
  'functionality',
  'scalability',
  'documentation',
  'presentation',
];

/**
 * Calculate totalScore from a scores object.
 * Only sums defined numeric values; missing fields count as 0.
 */
const calcTotal = (scores = {}) =>
  SCORE_FIELDS.reduce((sum, key) => sum + (Number(scores[key]) || 0), 0);

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Assign a judge to a hackathon
// @route   POST /api/reviews/assign
// @access  Private (organizer or admin)
// ─────────────────────────────────────────────────────────────────────────────
const assignJudgeToHackathon = async (req, res) => {
  try {
    const { judgeId, hackathonId } = req.body;

    if (!judgeId || !hackathonId) {
      return res
        .status(400)
        .json({ message: 'judgeId and hackathonId are required' });
    }

    if (!isValidId(judgeId, res)) return;
    if (!isValidId(hackathonId, res)) return;

    // Verify the target user exists and has role "judge"
    const judgeUser = await User.findById(judgeId).select('name role');
    if (!judgeUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (judgeUser.role !== 'judge') {
      return res.status(400).json({
        message: `User "${judgeUser.name}" does not have the "judge" role`,
      });
    }

    // Verify hackathon exists and requester is organizer or admin
    const hackathon = await Hackathon.findById(hackathonId);
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }
    if (
      hackathon.organizer.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Forbidden, only the hackathon organizer or admin can assign judges',
      });
    }

    // Avoid duplicate assignment
    const alreadyAssigned = hackathon.assignedJudges.some(
      (j) => j.toString() === judgeId
    );
    if (alreadyAssigned) {
      return res.status(409).json({
        message: `Judge "${judgeUser.name}" is already assigned to this hackathon`,
      });
    }

    hackathon.assignedJudges.push(judgeId);
    await hackathon.save();

    return res.status(200).json({
      message: `Judge "${judgeUser.name}" successfully assigned to hackathon "${hackathon.title}"`,
    });
  } catch (error) {
    console.error('Assign Judge Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get submissions assigned/available for the requesting judge
// @route   GET /api/reviews/assigned
// @access  Private (judge only)
// ─────────────────────────────────────────────────────────────────────────────
const getAssignedSubmissions = async (req, res) => {
  try {
    // Find all hackathons this judge is assigned to
    const assignedHackathons = await Hackathon.find({
      assignedJudges: req.user._id,
    }).select('_id');

    const hackathonIds = assignedHackathons.map((h) => h._id);

    // Find submissions for those hackathons that are pending/under_review/approved
    // (i.e. ready for judging) and not yet reviewed by this judge
    const reviewedByMe = await Review.find({ judge: req.user._id }).select(
      'submission'
    );
    const reviewedIds = reviewedByMe.map((r) => r.submission.toString());

    const submissions = await Submission.find({
      hackathon: { $in: hackathonIds },
      status: { $in: ['pending', 'under_review', 'approved'] },
    })
      .populate('team', 'name')
      .populate('hackathon', 'title endDate')
      .sort({ createdAt: -1 });

    // Annotate each submission with whether this judge has already reviewed it
    const annotated = submissions.map((sub) => ({
      ...sub.toObject(),
      reviewedByMe: reviewedIds.includes(sub._id.toString()),
    }));

    return res.status(200).json(annotated);
  } catch (error) {
    console.error('Get Assigned Submissions Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Submit a review for a submission
// @route   POST /api/reviews
// @access  Private (judge only)
// ─────────────────────────────────────────────────────────────────────────────
const submitReview = async (req, res) => {
  try {
    const { submissionId, scores, comments } = req.body;

    if (!submissionId) {
      return res.status(400).json({ message: 'submissionId is required' });
    }
    if (!isValidId(submissionId, res)) return;

    // Verify submission exists
    const submission = await Submission.findById(submissionId).populate(
      'hackathon',
      'organizer assignedJudges'
    );
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify this judge is assigned to that hackathon
    const isAssigned = submission.hackathon.assignedJudges.some(
      (j) => j.toString() === req.user._id.toString()
    );
    if (!isAssigned && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'You are not assigned as a judge for this hackathon',
      });
    }

    // Prevent duplicate review
    const existing = await Review.findOne({
      submission: submissionId,
      judge: req.user._id,
    });
    if (existing) {
      return res.status(409).json({
        message: 'You have already submitted a review for this submission',
      });
    }

    // Build scores object (default missing fields to 0)
    const normalizedScores = {};
    for (const field of SCORE_FIELDS) {
      normalizedScores[field] =
        scores && scores[field] !== undefined ? Number(scores[field]) : 0;
    }

    const totalScore = calcTotal(normalizedScores);

    const review = await Review.create({
      submission: submissionId,
      judge: req.user._id,
      scores: normalizedScores,
      totalScore,
      comments,
    });

    // Bump submission to "under_review" if it was still "pending"
    if (submission.status === 'pending') {
      await Submission.findByIdAndUpdate(submissionId, {
        status: 'under_review',
      });
    }

    const populated = await Review.findById(review._id).populate(
      'judge',
      'name email'
    );

    return res.status(201).json(populated);
  } catch (error) {
    console.error('Submit Review Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update an existing review
// @route   PUT /api/reviews/:id
// @access  Private (only the judge who created it)
// ─────────────────────────────────────────────────────────────────────────────
const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id, res)) return;

    const review = await Review.findById(id).populate({
      path: 'submission',
      populate: { path: 'hackathon', select: 'endDate title' },
    });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Only the judge who created this review can edit it
    if (review.judge.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: 'Forbidden, you did not author this review' });
    }

    // Grace period: allow edits up to 3 days after hackathon endDate
    const hackathon = review.submission.hackathon;
    if (hackathon && hackathon.endDate) {
      const graceCutoff = new Date(hackathon.endDate);
      graceCutoff.setDate(graceCutoff.getDate() + 3);
      if (new Date() > graceCutoff) {
        return res.status(400).json({
          message: `The review period for "${hackathon.title}" has closed (endDate + 3 days grace period).`,
        });
      }
    }

    const { scores, comments } = req.body;

    if (scores) {
      for (const field of SCORE_FIELDS) {
        if (scores[field] !== undefined) {
          review.scores[field] = Number(scores[field]);
        }
      }
      review.totalScore = calcTotal(review.scores);
    }

    if (comments !== undefined) {
      review.comments = comments;
    }

    await review.save();

    const updated = await Review.findById(id).populate('judge', 'name email');
    return res.status(200).json(updated);
  } catch (error) {
    console.error('Update Review Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all reviews for a given submission
// @route   GET /api/reviews/submission/:submissionId
// @access  Private (hackathon organizer, admin, or the judge who wrote a review)
// ─────────────────────────────────────────────────────────────────────────────
const getReviewsForSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    if (!isValidId(submissionId, res)) return;

    const submission = await Submission.findById(submissionId).populate(
      'hackathon',
      'organizer title'
    );
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const isOrganizer =
      submission.hackathon.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      // Judges can only see their own review on this submission
      if (req.user.role === 'judge') {
        const myReview = await Review.findOne({
          submission: submissionId,
          judge: req.user._id,
        }).populate('judge', 'name email');

        if (!myReview) {
          return res.status(404).json({
            message: 'You have not reviewed this submission yet',
          });
        }
        return res.status(200).json([myReview]);
      }

      return res.status(403).json({
        message:
          'Forbidden, only the hackathon organizer, admin, or the authoring judge can view reviews',
      });
    }

    const reviews = await Review.find({ submission: submissionId })
      .populate('judge', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json(reviews);
  } catch (error) {
    console.error('Get Reviews For Submission Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  assignJudgeToHackathon,
  getAssignedSubmissions,
  submitReview,
  updateReview,
  getReviewsForSubmission,
};
