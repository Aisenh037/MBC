// models/Assignment.js
import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: true },
  dueDate: { type: Date, required: true },
  file: String,  
  submissions: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      file: String,  
      submittedAt: { type: Date, default: Date.now },
      marks: { type: Number, min: 0 },
      remarks: String
    }
  ],
}, {
  timestamps: true
});

export default mongoose.model('Assignment', assignmentSchema);