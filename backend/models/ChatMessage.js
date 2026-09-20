const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatSession',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  sender: {
    type: String,
    enum: ['student', 'ai'],
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  advice: {
    keep: [String],
    change: [String],
    add: [String],
    reduce: [String],
    avoid: [String],
    revisedTimetable: [{
      time: String,
      activity: String,
      category: String,
      duration: Number,
    }],
    explanation: String,
  },
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

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
