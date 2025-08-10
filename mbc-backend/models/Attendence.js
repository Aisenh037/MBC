// models/Attendance.js
import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  subject: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Present', 'Absent'], 
    required: true 
  },
  faculty: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher' 
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }  
});

// This index preventing duplicate records.  
attendanceSchema.index({ student: 1, subject: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);