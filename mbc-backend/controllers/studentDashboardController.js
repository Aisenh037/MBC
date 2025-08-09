import Student from "../models/student.js";
import Mark from "../models/Marks.js";
import Assignment from "../models/Assignment.js";
import Notice from "../models/Notice.js";

export const getStudentDashboard = async (req, res) => {
  const userId = req.user.id;

  // 1. Student Profile (by logged in user)
  const student = await Student.findOne({ user: userId })
    .populate("user", "name email")
    .populate("class")
    .populate("subjects");

  if (!student) return res.status(404).json({ error: "Student not found" });

  // 2. Marks
  const marks = await Mark.find({ student: student._id }).populate("subject");

  // 3. Assignments (only those for their class, sorted by dueDate)
  const assignments = await Assignment.find({ class: student.class })
    .populate("subject")
    .populate("teacher", "user")
    .sort({ dueDate: -1 });

  // 4. Notices (target: "all", "students", or their class)
  const notices = await Notice.find({
    $or: [
      { target: "all" },
      { target: "students" },
      { target: "class", class: student.class }
    ]
  }).sort({ createdAt: -1 });

  res.json({
    student,
    marks,
    assignments,
    notices
    // You can also add attendance, events, etc.
  });
};
