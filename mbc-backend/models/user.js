// models/user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false, minlength: 6 },
  role: { type: String, enum: ['admin', 'professor', 'student'], required: true },
  // for password reset flow
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// get signed JWT (you may have another helper; keep whichever you used)
userSchema.methods.getSignedJwtToken = function (secret, expiresIn) {
  // accepts optional secret/expires, or use process.env externally
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: this._id, role: this.role }, secret, { expiresIn });
};

// Generate reset token, store hashed version on user doc and expiry
userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
module.exports = User;
