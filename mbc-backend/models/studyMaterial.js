import mongoose from 'mongoose';

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
  },
  description: {
    type: String,
  },
  file: {
    type: String,
    required: true,
  },
  fileType: {
    type: String,
    enum: ['pdf', 'doc', 'ppt', 'video', 'other'],
  },
  department: {
    type: String,
    enum: ['MDS', 'Agile', 'Bioinformatics', 'PhD', 'MCA'],
    required: true,
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const StudyMaterial = mongoose.model('StudyMaterial', studyMaterialSchema);

export default StudyMaterial;
