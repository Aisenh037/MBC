import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'professor', 'student'], required: true },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
