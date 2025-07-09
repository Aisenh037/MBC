import mongoose from 'mongoose';

const HostelSchema = new mongoose.Schema({
  block: { type: String, required: true },
  room: { type: String, required: true },
  capacity: { type: Number, required: true, default: 2 }
}, { timestamps: true });

export default mongoose.model('Hostel', HostelSchema);