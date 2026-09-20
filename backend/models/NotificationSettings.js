const mongoose = require('mongoose');

const notificationSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  dailyReminders: {
    type: Boolean,
    default: true,
  },
  burnoutAlerts: {
    type: Boolean,
    default: true,
  },
  weeklyReport: {
    type: Boolean,
    default: false,
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

module.exports = mongoose.model('NotificationSettings', notificationSettingsSchema);
