import Mark from "../models/Marks.js";

// Get all marks (with filter & pagination)
export const getMarks = async (req, res) => {
  const { studentId, subjectId, examType, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (studentId) filter.student = studentId;
  if (subjectId) filter.subject = subjectId;
  if (examType) filter.examType = examType;
  const marks = await Mark.find(filter)
    .populate("student")
    .populate("subject")
    .populate("teacher")
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })
    .lean();
  res.json(marks);
};

// Add marks (teacher/admin)
export const addMark = async (req, res) => {
  const { student, subject, examType, marksObtained, maxMarks, remarks } = req.body;
  const teacher = req.user.id; // from JWT
  try {
    const mark = await Mark.create({ student, subject, examType, marksObtained, maxMarks, teacher, remarks });
    res.status(201).json({ message: "Mark added", mark });
  } catch (err) {
    if (err.code === 11000) { // duplicate
      return res.status(409).json({ error: "Mark for this student/subject/examType already exists" });
    }
    throw err;
  }
};

// Update mark
export const updateMark = async (req, res) => {
  const { id } = req.params;
  const mark = await Mark.findByIdAndUpdate(id, req.body, { new: true });
  if (!mark) return res.status(404).json({ error: "Mark not found" });
  res.json({ message: "Mark updated", mark });
};

// Delete mark
export const deleteMark = async (req, res) => {
  const { id } = req.params;
  const deleted = await Mark.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Mark not found" });
  res.json({ message: "Mark deleted" });
};
