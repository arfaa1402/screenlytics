const mongoose = require('mongoose');

const burnoutScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  recordedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

burnoutScoreSchema.index({ user: 1, recordedAt: -1 });

module.exports = mongoose.model('BurnoutScore', burnoutScoreSchema);
