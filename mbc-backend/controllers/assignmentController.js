import Assignment from '../models/Assignment.js';

// Get all assignments (pagination/filter by class/subject)
export const getAssignments = async (req, res) => {
  const { classId, subjectId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (classId) filter.class = classId;
  if (subjectId) filter.subject = subjectId;
  const assignments = await Assignment.find(filter)
    .populate('subject')
    .populate('class')
    .populate('teacher')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ dueDate: -1 })
    .lean();
  res.json(assignments);
};

// Add new assignment (teacher only)
export const addAssignment = async (req, res) => {
  const { title, description, subject, class: classId, dueDate } = req.body;
  const teacherId = req.user.id; // Must be set from JWT!
  const assignment = await Assignment.create({
    title,
    description,
    subject,
    class: classId,
    dueDate,
    teacher: teacherId
  });
  res.status(201).json({ message: "Assignment created", assignment });
};

// Update assignment
export const updateAssignment = async (req, res) => {
  const { id } = req.params;
  const updated = await Assignment.findByIdAndUpdate(id, req.body, { new: true });
  if (!updated) return res.status(404).json({ error: "Assignment not found" });
  res.json({ message: "Assignment updated", assignment: updated });
};

// Delete assignment
export const deleteAssignment = async (req, res) => {
  const { id } = req.params;
  const deleted = await Assignment.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ error: "Assignment not found" });
  res.json({ message: "Assignment deleted" });
};

// Student submission
export const submitAssignment = async (req, res) => {
  const { id } = req.params; // assignment ID
  const { file } = req.body; // file should be the path or filename
  const studentId = req.user.id; // Must be set from JWT!
  const assignment = await Assignment.findById(id);
  if (!assignment) return res.status(404).json({ error: "Assignment not found" });

  assignment.submissions.push({
    student: studentId,
    file,
    submittedAt: new Date()
  });
  await assignment.save();
  res.json({ message: "Assignment submitted" });
};

// Grade submission
export const gradeSubmission = async (req, res) => {
  const { id, submissionId } = req.params; // assignment ID, submission ID
  const { marks, remarks } = req.body;
  const assignment = await Assignment.findById(id);
  if (!assignment) return res.status(404).json({ error: "Assignment not found" });

  const submission = assignment.submissions.id(submissionId);
  if (!submission) return res.status(404).json({ error: "Submission not found" });

  submission.marks = marks;
  submission.remarks = remarks;
  await assignment.save();
  res.json({ message: "Submission graded" });
};
