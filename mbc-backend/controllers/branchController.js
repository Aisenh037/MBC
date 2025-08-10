// controllers/branchController.js
import Branch from '../models/Branch.js';
import Student from '../models/student.js'; // ✨ FIX: Enabled this import
import Semester from '../models/Semester.js';
import Subject from '../models/Subject.js';
import Hostel from '../models/Hostel.js';
import asyncHandler from '../middleware/asyncHandler.js';
import ErrorResponse from '../utils/errorResponse.js';

// ✨ FIX: All functions are now wrapped with asyncHandler for stability

export const getBranches = asyncHandler(async (req, res, next) => {
  const branches = await Branch.find().sort({ name: 1 });
  res.status(200).json({ success: true, count: branches.length, data: branches });
});

export const createBranch = asyncHandler(async (req, res, next) => {
  const branch = await Branch.create(req.body);
  res.status(201).json({ success: true, data: branch });
});

export const updateBranch = asyncHandler(async (req, res, next) => {
  const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!branch) {
    return next(new ErrorResponse(`Branch not found with id of ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: branch });
});

export const deleteBranch = asyncHandler(async (req, res, next) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) {
    return next(new ErrorResponse(`Branch not found with id of ${req.params.id}`, 404));
  }
  await branch.remove();
  res.status(200).json({ success: true, data: {} });
});

export const getBranchDetails = asyncHandler(async (req, res, next) => {
  const branch = await Branch.findById(req.params.id);
  if (!branch) {
    return next(new ErrorResponse(`Branch not found with id of ${req.params.id}`, 404));
  }
  res.status(200).json({ success: true, data: branch });
});

export const getBranchSemesters = asyncHandler(async (req, res, next) => {
  const semesters = await Semester.find({ branch: req.params.id }).populate('students');
  res.status(200).json({ success: true, count: semesters.length, data: semesters });
});

export const getBranchSubjects = asyncHandler(async (req, res, next) => {
  const { semester } = req.query;
  const query = { branch: req.params.id };
  if (semester) query.semester = parseInt(semester);
  const subjects = await Subject.find(query);
  res.status(200).json({ success: true, count: subjects.length, data: subjects });
});

export const getBranchStudents = asyncHandler(async (req, res, next) => {
  const { semester } = req.query;
  const query = { branch: req.params.id };
  if (semester) query.currentSemester = parseInt(semester);
  const students = await Student.find(query).populate('branch').populate('hostel');
  res.status(200).json({ success: true, count: students.length, data: students });
});

export const importStudents = asyncHandler(async (req, res, next) => {
  if (!req.body || !req.body.students) {
    return next(new ErrorResponse('No student data provided', 400));
  }
  const results = { success: 0, errors: [] };
  const { semester, students: studentData } = req.body;
  for (const row of studentData) {
    try {
      if (!row.scholarNumber || !row.name) continue;
      const studentDataToSave = {
        scholarNumber: row.scholarNumber,
        name: row.name,
        email: row.email,
        mobile: row.mobile,
        currentSemester: parseInt(row.currentSemester) || parseInt(semester),
        branch: req.params.id
      };
      if (row.hostelBlock && row.hostelRoom) {
        let hostel = await Hostel.findOne({ block: row.hostelBlock, room: row.hostelRoom });
        if (!hostel) {
          hostel = await Hostel.create({ block: row.hostelBlock, room: row.hostelRoom });
        }
        studentDataToSave.hostel = hostel._id;
      }
      const existingStudent = await Student.findOne({ scholarNumber: row.scholarNumber });
      if (existingStudent) {
        await Student.findByIdAndUpdate(existingStudent._id, studentDataToSave);
      } else {
        await Student.create(studentDataToSave);
      }
      results.success++;
    } catch (err) {
      results.errors.push(`Row ${row.scholarNumber || 'unknown'}: ${err.message}`);
    }
  }
  res.status(200).json({ success: true, data: results });
});