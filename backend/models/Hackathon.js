const mongoose = require('mongoose');
const { Schema } = mongoose;

const hackathonSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    theme: {
      type: String,
    },
    mode: {
      type: String,
      enum: ['online', 'offline'],
    },
    venue: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    bannerImage: {
      type: String,
    },
    prizePool: {
      type: String,
    },
    maxTeamSize: {
      type: Number,
      default: 4,
    },
    rules: {
      type: String,
    },
    judgingCriteria: {
      type: [String],
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'ongoing', 'completed'],
      default: 'upcoming',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hackathon', hackathonSchema);
