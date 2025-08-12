import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['MDS', 'Agile', 'Bioinformatics', 'PhD', 'MCA'],
    required: [true, 'Please add a Branch name'],
    unique: true,
    trim: true,
  },
  department: {
    type: String,
    enum: ['MBC', 'CSE', 'ECE', ' EE'],
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
    default: 0
  },
  description: {
    type: String,
  },
  establishmentYear: { 
    type: Number, 
    required: true
 }
});

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
