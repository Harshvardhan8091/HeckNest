const mongoose = require('mongoose');
const Submission = require('../models/Submission');
const Review = require('../models/Review');
const Hackathon = require('../models/Hackathon');

// Helper: validate MongoDB ObjectId and send 400 if invalid
const isValidId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ message: 'Invalid ID format' });
    return false;
  }
  return true;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get leaderboard for a hackathon
// @route   GET /api/leaderboard/:hackathonId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getLeaderboard = async (req, res) => {
  try {
    const { hackathonId } = req.params;
    if (!isValidId(hackathonId, res)) return;

    // Verify hackathon exists
    const hackathon = await Hackathon.findById(hackathonId).select('title');
    if (!hackathon) {
      return res.status(404).json({ message: 'Hackathon not found' });
    }

    // Fetch all submissions for this hackathon with team name populated
    const submissions = await Submission.find({ hackathon: hackathonId })
      .populate('team', 'name')
      .select('_id projectName team status')
      .lean();

    if (submissions.length === 0) {
      return res.status(200).json({
        hackathon: hackathon.title,
        leaderboard: [],
      });
    }

    // For each submission, calculate average totalScore across all its reviews
    const submissionIds = submissions.map((s) => s._id);

    // Aggregate average scores per submission in one DB round-trip
    const scoreAggregates = await Review.aggregate([
      { $match: { submission: { $in: submissionIds } } },
      {
        $group: {
          _id: '$submission',
          averageScore: { $avg: '$totalScore' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    // Build a map: submissionId (string) -> { averageScore, reviewCount }
    const scoreMap = {};
    for (const agg of scoreAggregates) {
      scoreMap[agg._id.toString()] = {
        averageScore: agg.averageScore,
        reviewCount: agg.reviewCount,
      };
    }

    // Assemble leaderboard entries (include all submissions; score 0 if unreviewed)
    const entries = submissions.map((sub) => {
      const aggData = scoreMap[sub._id.toString()];
      return {
        submissionId: sub._id,
        projectName: sub.projectName,
        teamName: sub.team ? sub.team.name : 'Unknown Team',
        averageScore: aggData ? parseFloat(aggData.averageScore.toFixed(2)) : 0,
        reviewCount: aggData ? aggData.reviewCount : 0,
        submissionStatus: sub.status,
      };
    });

    // Sort descending by averageScore, then alphabetically by projectName for ties
    entries.sort((a, b) => {
      if (b.averageScore !== a.averageScore) return b.averageScore - a.averageScore;
      return a.projectName.localeCompare(b.projectName);
    });

    // Assign 1-indexed ranks (shared rank on exact tie)
    let currentRank = 1;
    for (let i = 0; i < entries.length; i++) {
      if (i > 0 && entries[i].averageScore !== entries[i - 1].averageScore) {
        currentRank = i + 1;
      }
      entries[i].rank = currentRank;
    }

    return res.status(200).json({
      hackathon: hackathon.title,
      hackathonId,
      leaderboard: entries,
    });
  } catch (error) {
    console.error('Get Leaderboard Error:', error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = { getLeaderboard };
