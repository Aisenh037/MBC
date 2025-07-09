import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  description: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  file: {
    type: String,
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  submissions: [
    {
      student: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      file: {
        type: String,
        required: true,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      grade: {
        type: Number,
        min: 0,
        max: 100,
      },
      feedback: {
        type: String,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

export default Assignment;
