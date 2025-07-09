import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'app'],
    required: true,
  },
  department: {
    type: String,
    enum: ['MDS', 'Agile', 'Bioinformatics', 'PhD', 'MCA', 'all'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
