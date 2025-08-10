// models/Semester.js
import mongoose from 'mongoose';

const SemesterSchema = new mongoose.Schema({
  number: { 
    type: Number, 
    required: true,
    min: 1,
    max: 8  
  },
  branch: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Branch', 
    required: true 
  },
  // You might not need to store students in the semester model
  // as you can query students by branch and currentSemester.
  // This avoids data duplication.
  // students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, { timestamps: true });

export default mongoose.models.Semester || mongoose.model('Semester', SemesterSchema);