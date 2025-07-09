import Branch from '../models/Branch.js';
import Student from '../models/Student.js';
import Semester from '../models/Semester.js';
import Subject from '../models/Subject.js'; // Add this import
import Hostel from '../models/Hostel.js';
import Papa from 'papaparse';

// @desc    Get all branches
// @route   GET /api/v1/branches
export const getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find()
      .select('name code coordinator type establishmentYear intakeCapacity numberOfSemesters _id')
      .sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: branches.length,
      data: branches
    });
  } catch (err) {
    console.error('Error fetching branches:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branches'
    });
    next(err);
  }
};

// @desc    Create new branch
// @route   POST /api/v1/branches
export const createBranch = async (req, res, next) => {
  try {
    const branch = await Branch.create(req.body);
    res.status(201).json({
      success: true,
      data: branch
    });
  } catch (err) {
    console.error('Error creating branch:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
    next(err);
  }
};

// @desc    Update branch
// @route   PUT /api/v1/branches/:id
export const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (err) {
    console.error('Error updating branch:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
    next(err);
  }
};

// @desc    Delete branch
// @route   DELETE /api/v1/branches/:id
export const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Error deleting branch:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch'
    });
    next(err);
  }
};

// @desc    Get branch details
// @route   GET /api/v1/branches/:id
export const getBranchDetails = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }
    res.status(200).json({
      success: true,
      data: branch
    });
  } catch (err) {
    console.error('Error fetching branch details:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch details'
    });
    next(err);
  }
};

// @desc    Get branch semesters
// @route   GET /api/v1/branches/:id/semesters
export const getBranchSemesters = async (req, res, next) => {
  try {
    const semesters = await Semester.find({ branch: req.params.id })
      .populate('students');
    res.status(200).json({
      success: true,
      count: semesters.length,
      data: semesters
    });
  } catch (err) {
    console.error('Error fetching semesters:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch semesters'
    });
    next(err);
  }
};

// @desc    Get branch subjects
// @route   GET /api/v1/branches/:id/subjects
export const getBranchSubjects = async (req, res, next) => {
  try {
    const { semester } = req.query;
    const query = { branch: req.params.id };
    if (semester) query.semester = parseInt(semester);

    const subjects = await Subject.find(query);
    res.status(200).json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (err) {
    console.error('Error fetching subjects:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subjects'
    });
    next(err);
  }
};

// @desc    Get branch students
// @route   GET /api/v1/branches/:id/students
export const getBranchStudents = async (req, res, next) => {
  try {
    const { semester } = req.query;
    const query = { branch: req.params.id };
    if (semester) query.currentSemester = parseInt(semester);

    const students = await Student.find(query)
      .populate('branch')
      .populate('hostel');
    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch students'
    });
    next(err);
  }
};

// @desc    Import students to branch
// @route   POST /api/v1/branches/:id/students/import
export const importStudents = async (req, res, next) => {
  try {
    if (!req.body || !req.body.students) {
      return res.status(400).json({
        success: false,
        message: 'No student data provided'
      });
    }

    const results = {
      success: 0,
      errors: []
    };

    const { semester, students: studentData } = req.body;

    for (const row of studentData) {
      try {
        // Skip empty rows
        if (!row.scholarNumber || !row.name) continue;

        const studentDataToSave = {
          scholarNumber: row.scholarNumber,
          name: row.name,
          email: row.email,
          mobile: row.mobile,
          currentSemester: parseInt(row.currentSemester) || parseInt(semester),
          branch: req.params.id
        };

        // Handle hostel information if provided
        if (row.hostelBlock && row.hostelRoom) {
          let hostel = await Hostel.findOne({
            block: row.hostelBlock,
            room: row.hostelRoom
          });

          if (!hostel) {
            hostel = await Hostel.create({
              block: row.hostelBlock,
              room: row.hostelRoom
            });
          }

          studentDataToSave.hostel = hostel._id;
        }

        // Check if student already exists
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

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (err) {
    console.error('Error importing students:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to import students'
    });
    next(err);
  }
};