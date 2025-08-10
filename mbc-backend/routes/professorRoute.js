// routes/teachersRoute.js
import express from "express";
import {
  getTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher
} from "../controllers/professorController.js";
import protect from "../middleware/auth.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.use(protect);
router.use(requireRole('admin')); // Only admins can manage teacher records

router.route('/')
  .get(getTeachers)
  .post(addTeacher);
  
router.route('/:id')
  .put(updateTeacher)
  .delete(deleteTeacher);

export default router;