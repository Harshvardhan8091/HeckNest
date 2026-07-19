const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    submission: {
      type: Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
    },
    judge: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scores: {
      innovation: {
        type: Number,
        default: 0,
      },
      technicalComplexity: {
        type: Number,
        default: 0,
      },
      userInterface: {
        type: Number,
        default: 0,
      },
      functionality: {
        type: Number,
        default: 0,
      },
      scalability: {
        type: Number,
        default: 0,
      },
      documentation: {
        type: Number,
        default: 0,
      },
      presentation: {
        type: Number,
        default: 0,
      },
    },
    totalScore: {
      type: Number,
      default: 0,
    },
    comments: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Review', reviewSchema);
