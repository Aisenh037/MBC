// models/student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true,  
  },
  scholarNo: { 
    type: String, 
    unique: true,
    required: [true, 'Scholar Number is required'],
    trim: true,
  },
  class: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class' 
  },
  // Subjects are usually tied to a Class/Semester, so you might not need to store them here.
  // You can derive a student's subjects from their class.
  // subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
});

export default mongoose.model('Student', studentSchema);