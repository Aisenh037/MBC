import mongoose from 'mongoose';

const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['MDS', 'Agile', 'Bioinformatics', 'PhD', 'MCA'],
    required: [true, 'Please add a Branch name'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
  },
  capacity: {
    type: Number,
    required: true,
  },
  department: {
    type: String,
    enum: ['MBC BTech', 'MBC MTech', 'MBC PhD', ' MBC MCA'],
    required: true,
  },
  available: {
    type: Boolean,
    default: true,
  },
  bookings: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      purpose: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Branch = mongoose.model('Branch', branchSchema);

export default Branch;
