import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const professorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  department: {
    type: String,
    default: 'MBC',
    trim: true
  },
  contact: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  firstLogin: {
    type: Boolean,
    default: true
  },
  assignedBranches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    validate: {
      validator: async function (id) {
        const branch = await mongoose.model('Branch').findById(id);
        return !!branch;
      },
      message: 'Invalid branch ID'
    }
  }],
  assignedSubjects: [{
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      validate: {
        validator: async function (id) {
          const subject = await mongoose.model('Subject').findById(id);
          return !!subject;
        },
        message: 'Invalid subject ID'
      }
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 10
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      validate: {
        validator: async function (id) {
          const branch = await mongoose.model('Branch').findById(id);
          return !!branch;
        },
        message: 'Invalid branch ID'
      }
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
professorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

export default mongoose.model('Professor', professorSchema);