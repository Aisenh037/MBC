// models/Hostel.js
import mongoose from 'mongoose';

const hostelSchema = new mongoose.Schema(
  {
    block: { type: String, required: true },
    room: { type: String, required: true },
  },
  { timestamps: true }
);

hostelSchema.index({ block: 1, room: 1 }, { unique: true });

export default mongoose.model('Hostel', hostelSchema);