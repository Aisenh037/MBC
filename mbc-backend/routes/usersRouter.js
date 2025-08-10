// routes/usersRoute.js
import express from 'express';
import {
  getMe,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  uploadUserPhoto
} from '../controllers/usersController.js';
import User from '../models/user.js';

// Import Middleware
import protect from '../middleware/auth.js';
import requireRole from '../middleware/requireRole.js';
import advancedResults from '../middleware/advancedResults.js'; // created this for filtering/pagination

const router = express.Router();

// All routes below are protected
router.use(protect);

// Current user profile
router.get('/me', getMe);

// Admin-only routes
router.use(requireRole('admin'));

router.route('/')
  .get(advancedResults(User), getUsers)
  .post(createUser);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);
  
router.route('/:id/photo')
    .put(uploadUserPhoto);

export default router;