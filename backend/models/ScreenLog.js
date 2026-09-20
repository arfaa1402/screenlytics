const mongoose = require('mongoose');

const screenLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  logDate: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true,
  },
  totalMins: {
    type: Number,
    required: true,
    min: 0,
  },
  studyMins: {
    type: Number,
    default: 0,
    min: 0,
  },
  socialMins: {
    type: Number,
    default: 0,
    min: 0,
  },
  entMins: {
    type: Number,
    default: 0,
    min: 0,
  },
  otherMins: {
    type: Number,
    default: 0,
    min: 0,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  category: {
    type: String,
    enum: ['Normal', 'Mid', 'Excess'],
    default: 'Normal',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      ret.isoDate = ret.logDate;
      ret.study = ret.studyMins;
      ret.social = ret.socialMins;
      ret.ent = ret.entMins;
      ret.other = ret.otherMins;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
});

screenLogSchema.index({ user: 1, logDate: 1 }, { unique: true });

module.exports = mongoose.model('ScreenLog', screenLogSchema);
