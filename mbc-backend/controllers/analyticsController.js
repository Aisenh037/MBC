import Student from "../models/student.js";
import Teacher from "../models/professor.js";
import Assignment from "../models/Assignment.js";
import Mark from "../models/Marks.js";
import Class from "../models/Course.js";

export const getAnalytics = async (req, res) => {
  // Quick stats (use .countDocuments() for performance)
  const totalStudents = await Student.countDocuments();
  const totalTeachers = await Teacher.countDocuments();
  const totalAssignments = await Assignment.countDocuments();
  const totalClasses = await Class.countDocuments();

  // Pass/fail rate, average marks, etc.
  const marks = await Mark.aggregate([
    { $group: { _id: null, avg: { $avg: "$marksObtained" }, max: { $max: "$marksObtained" }, min: { $min: "$marksObtained" }, count: { $sum: 1 } } }
  ]);
  const avgMark = marks[0]?.avg || 0;
  const maxMark = marks[0]?.max || 0;
  const minMark = marks[0]?.min || 0;
  const totalMarksRecords = marks[0]?.count || 0;

  res.json({
    totalStudents,
    totalTeachers,
    totalAssignments,
    totalClasses,
    avgMark,
    maxMark,
    minMark,
    totalMarksRecords
    // Add more stats: attendance %, toppers, trends, etc.
  });
};
