import mongoose from 'mongoose';

const SemesterSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  current: { type: Boolean, default: false },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

// Prevent model overwrite in development
const Semester = mongoose.models.Semester || mongoose.model('Semester', SemesterSchema);

export default Semester;