const mongoose = require('mongoose');

const scheduleSuggestionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
  },
  originalScheduleSummary: {
    type: Object,
  },
  keep: [{ type: String }],
  change: [{ type: String }],
  add: [{ type: String }],
  reduce: [{ type: String }],
  avoid: [{ type: String }],
  revisedTimetable: [{
    time: String,
    activity: String,
    category: String,
    duration: Number,
  }],
  explanation: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
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

module.exports = mongoose.model('ScheduleSuggestion', scheduleSuggestionSchema);
