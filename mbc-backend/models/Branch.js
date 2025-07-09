// models/Branch.js
import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a branch name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  code: {
    type: String,
    required: [true, 'Please add a branch code'],
    unique: true,
    uppercase: true,
    maxlength: [10, 'Code cannot be more than 10 characters']
  },
  coordinator: {
    type: String,
    required: [true, 'Please add a coordinator name']
  },
  type: {
    type: String,
    required: true,
    enum: ['B.Tech', 'M.Tech', 'Dual Degree(B.Tech + M.Tech)', 'MCA', 'PhD'],
    default: 'B.Tech'
  },
  intakeCapacity: {
    type: Number,
    required: [true, 'Please add intake capacity'],
    min: [1, 'Intake capacity must be at least 1'],
    default: 30 // Added default value
  },
  establishmentYear: {
    type: Number,
    required: [true, 'Please add establishment year'], // Made required
    min: [1960, 'Year must be at least 1960'],
    max: [new Date().getFullYear(), `Year can't be in the future`],
    default: new Date().getFullYear() // Added default value
  },
  numberOfSemesters: {
    type: Number,
    required: [true, 'Please specify the number of semesters'],
    min: [1, 'There must be at least 1 semester'],
    max: [10, 'There cannot be more than 10 semesters'],
    default: 8 // Added default value
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Branch', BranchSchema);