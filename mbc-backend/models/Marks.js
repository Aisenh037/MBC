import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  examType: { type: String, enum: ["Midterm", "Endterm", "Assignment", "Quiz", "Other"], required: true },
  marksObtained: { type: Number, required: true },
  maxMarks: { type: Number, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }, // Who uploaded
  remarks: String,
  createdAt: { type: Date, default: Date.now }
});
markSchema.index({ student: 1, subject: 1, examType: 1 }, { unique: true }); // Prevent duplicate entries

export default mongoose.model("Mark", markSchema);
