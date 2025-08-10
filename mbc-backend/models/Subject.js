// models/Subject.js
import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
  teachers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher' 
  }],
});

export default mongoose.model('Subject', subjectSchema);