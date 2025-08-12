// models/Course.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, trim: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  department: { type: String, required: true },
  semester: { type: Number, required: true, min: 1, max: 12 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Professor', required: true },
}, { timestamps: true });

export default mongoose.model('Course', courseSchema);