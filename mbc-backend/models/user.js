import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: { type: String, required: true, select: false }, // select false = secure
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student'],
    default: 'student'
  }
});

const User = mongoose.model('User', userSchema);

export default User;
