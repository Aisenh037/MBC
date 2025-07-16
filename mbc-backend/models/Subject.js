import mongoose from 'mongoose';
const subjectSchema = new mongoose.Schema({
  name: String,
  code: String,
  teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' }],
});
export default mongoose.model('Subject', subjectSchema);
