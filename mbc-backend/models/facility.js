import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add facility name'],
    unique: true,
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
    enum: ['MDS', 'Agile', 'Bioinformatics', 'PhD', 'MCA', 'common'],
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

const Facility = mongoose.model('Facility', facilitySchema);

export default Facility;
