// models/student.js
import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  scholarNo: { type: String, unique: true, required: true, trim: true },
  mobile: { type: String, trim: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  currentSemester: { type: Number, min: 1, max: 8, required: true },
  department: { type: String, default: 'MBC', required: true },

  // For future password reset support (admin-triggered)
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },

  // For OTP verification if used later
  otp: { type: String },
  otpExpire: { type: Date },
}, { timestamps: true });

// Guard to avoid OverwriteModelError during nodemon / hot-reloads
const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);
export default Student;
