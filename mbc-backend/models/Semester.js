import mongoose from 'mongoose';

const SemesterSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  current: { type: Boolean, default: false },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

export default mongoose.model('Semester', SemesterSchema);