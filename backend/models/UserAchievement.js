const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  achievementKey: {
    type: String,
    required: true,
    enum: [
      'streak_7',
      'first_goal',
      'digital_detox',
      'under_4_hours',
      'early_wind_down',
      'streak_30',
      'goal_crusher',
      'screen_reducer',
      'focus_master',
      'weekend_detox'
    ],
  },
  unlocked: {
    type: Boolean,
    default: false,
  },
  unlockedAt: {
    type: Date,
    default: null,
  },
  currentValue: {
    type: Number,
    default: 0,
  },
  targetValue: {
    type: Number,
    required: true,
  },
  progress: {
    type: Number, // Percentage 0 - 100
    default: 0,
  },
  updatedAt: {
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

userAchievementSchema.index({ user: 1, achievementKey: 1 }, { unique: true });

module.exports = mongoose.model('UserAchievement', userAchievementSchema);
