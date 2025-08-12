import express from "express";
import {
  getTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher
} from "../controllers/professorController.js";
// --- THIS IS THE FIX ---
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// All routes in this file are protected and require a user to be logged in.
router.use(protect);
// All routes in this file are for admins only.
router.use(authorize('admin'));

router.route('/')
  .get(getTeachers)
  .post(addTeacher);
  
router.route('/:id')
  .put(updateTeacher)
  .delete(deleteTeacher);

export default router;