const mongoose = require('mongoose');
const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    hackathon: {
      type: Schema.Types.ObjectId,
      ref: 'Hackathon',
      required: true,
    },
    projectName: {
      type: String,
      required: true,
    },
    problemStatement: {
      type: String,
    },
    solutionDescription: {
      type: String,
    },
    githubRepo: {
      type: String,
      required: true,
    },
    liveDemoUrl: {
      type: String,
    },
    techStack: {
      type: [String],
    },
    screenshots: {
      type: [String],
    },
    presentationPdf: {
      type: String,
    },
    demoVideoLink: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Submission', submissionSchema);
