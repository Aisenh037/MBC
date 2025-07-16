import mongoose from 'mongoose';
const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scholarNo: { type: String, unique: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
});
export default mongoose.model('Student', studentSchema);
