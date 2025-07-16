import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  dueDate: { type: Date, required: true },
  file: String, // Path to assignment file if needed
  submissions: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      file: String,
      submittedAt: Date,
      marks: Number,
      remarks: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Assignment', assignmentSchema);
