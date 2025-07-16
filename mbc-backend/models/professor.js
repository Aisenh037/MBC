import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: String, unique: true, required: true },
  department: { type: String },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }]
});

export default mongoose.model('Teacher', teacherSchema);
