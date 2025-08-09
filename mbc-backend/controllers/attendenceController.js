import Attendance from '../models/Attendence.js';

export const getAttendance = async (req, res) => {
  const { studentId, subjectId } = req.query;
  let query = {};
  if (studentId) query.student = studentId;
  if (subjectId) query.subject = subjectId;
  const attendance = await Attendance.find(query).populate('student').populate('subject').populate('faculty');
  res.json(attendance);
};

export const markAttendance = async (req, res) => {
  const { student, subject, date, status, faculty } = req.body;
  // Upsert: if record exists for (student, subject, date), update, else create
  const attendance = await Attendance.findOneAndUpdate(
    { student, subject, date },
    { status, faculty },
    { new: true, upsert: true }
  );
  res.json(attendance);
};
