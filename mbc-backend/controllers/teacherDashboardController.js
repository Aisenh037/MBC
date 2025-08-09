import Teacher from "../models/professor.js";
import Assignment from "../models/Assignment.js";
import Class from "../models/Course.js";
import Student from "../models/student.js";

export const getTeacherDashboard = async (req, res) => {
  const userId = req.user.id;

  // 1. Teacher Profile
  const teacher = await Teacher.findOne({ user: userId })
    .populate("user", "name email")
    .populate("subjects")
    .populate("classes");

  if (!teacher) return res.status(404).json({ error: "Teacher not found" });

  // 2. Classes and Subjects handled
  const classes = teacher.classes;
  const subjects = teacher.subjects;

  // 3. Students taught (unique, in their classes)
  const classIds = classes.map(c => c._id);
  const students = await Student.find({ class: { $in: classIds } }).countDocuments();

  // 4. Assignments given by this teacher
  const assignments = await Assignment.find({ teacher: teacher._id }).sort({ dueDate: -1 });

  // 5. Pending grading: submissions in assignments where marks/remarks missing
  let pendingToGrade = 0;
  for (const assignment of assignments) {
    pendingToGrade += assignment.submissions.filter(s => s.marks == null).length;
  }

  // 6. Upcoming assignments
  const now = new Date();
  const upcomingAssignments = assignments.filter(a => a.dueDate > now);

  res.json({
    teacher,
    totalClasses: classes.length,
    totalSubjects: subjects.length,
    totalStudents: students,
    totalAssignments: assignments.length,
    pendingToGrade,
    upcomingAssignments
    // add more as needed!
  });
};
