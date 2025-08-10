// models/Notice.js
import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  target: { 
    type: String, 
    enum: ["all", "students", "teachers", "class"], 
    default: "all" 
  },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class" }, // Required only if target is 'class'
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, {
  timestamps: true
});

export default mongoose.model("Notice", noticeSchema);