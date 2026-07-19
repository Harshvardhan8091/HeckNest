const mongoose = require('mongoose');
const { Schema } = mongoose;

const registrationSchema = new Schema(
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
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Registration', registrationSchema);
