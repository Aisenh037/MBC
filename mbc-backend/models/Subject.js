import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a subject name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add a subject code'],
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: [10, 'Code cannot be more than 10 characters']
  },
  credits: {
    type: Number,
    required: [true, 'Please add credits'],
    min: [1, 'Credits must be at least 1'],
    max: [10, 'Credits cannot be more than 10']
  },
  semester: {
    type: Number,
    required: [true, 'Please specify the semester'],
    min: [1, 'Semester must be at least 1'],
    max: [10, 'Semester cannot be more than 10']
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'Please specify the branch'],
    validate: {
      validator: async function (id) {
        const branch = await mongoose.model('Branch').findById(id);
        return !!branch;
      },
      message: 'Invalid branch ID'
    }
  }
}, {
  timestamps: true
});

export default mongoose.model('Subject', subjectSchema);