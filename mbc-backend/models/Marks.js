// models/Marks.js
import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  examType: { 
    type: String, 
    enum: ["Midterm", "Endterm", "Assignment", "Quiz", "Other"], 
    required: true 
  },
  marksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }, // Who uploaded
  remarks: { type: String, trim: true },
}, {
  timestamps: true
});

// This index is perfect for data integrity.
markSchema.index({ student: 1, subject: 1, examType: 1 }, { unique: true });

export default mongoose.model("Mark", markSchema);