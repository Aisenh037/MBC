// models/professor.js
import mongoose from 'mongoose';

const professorSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  employeeId: { 
    type: String, 
    unique: true, 
    required: [true, 'Employee ID is required'],
    trim: true,
  },
  department: { 
    type: String,
    enum: ['MBC BTech', 'MBC MTech', 'MBC PhD', ' MBC MCA'],
  },
  subjects: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Subject' 
  }],
  classes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class' 
  }]
});

export default mongoose.model('Professor', professorSchema);