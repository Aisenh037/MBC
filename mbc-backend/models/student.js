import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  scholarNumber: {
    type: String,
    required: [true, 'Please add a scholar number'],
    unique: true,
    trim: true,
    maxlength: [20, 'Scholar number cannot be more than 20 characters']
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+\@.+\..+/, 'Please add a valid email']
  },
  mobile: {
    type: String,
    trim: true,
    maxlength: [15, 'Mobile number cannot be more than 15 characters']
  },
  currentSemester: {
    type: Number,
    required: [true, 'Please specify the current semester'],
    min: [1, 'Semester must be at least 1'],
    max: [10, 'Semester cannot be more than 10']
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Please specify the branch']
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel'
  }
}, {
  timestamps: true
});

export default mongoose.models.Student || mongoose.model('Student', studentSchema);