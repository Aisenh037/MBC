import mongoose from "mongoose";
const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  target: { type: String, enum: ["all", "students", "teachers", "class"], default: "all" },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});
export default mongoose.model("Notice", noticeSchema);
