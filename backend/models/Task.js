const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['study', 'exercise', 'break', 'nophone'],
    required: true,
  },
  isoDate: {
    type: String, // YYYY-MM-DD
    required: true,
    index: true,
  },
  displayDate: {
    type: String,
  },
  time: {
    type: String, // HH:mm
    required: true,
  },
  duration: {
    type: Number, // duration in minutes
    required: true,
    min: 1,
  },
  done: {
    type: Boolean,
    default: false,
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

taskSchema.index({ user: 1, isoDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
