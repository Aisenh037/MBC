// services/userService.js
import User from '../models/user.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Retrieves a paginated and filtered list of users.
 * @param {object} query - The query parameters from the request.
 * @returns {Promise<User[]>}
 */
export const findUsers = async (query) => {
  // This service would interact with your advancedResults middleware logic
  // For simplicity, we'll implement a basic find here.
  return User.find(query);
};

/**
 * Finds a single user by their ID.
 * @param {string} id - The user's ID.
 * @returns {Promise<User>}
 */
export const findUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ErrorResponse(`User not found with id of ${id}`, 404);
  }
  return user;
};

/**
 * Updates a user's details.
 * @param {string} id - The ID of the user to update.
 * @param {object} updateData - The data to update.
 * @returns {Promise<User>}
 */
export const updateUserById = async (id, updateData) => {
  const user = await User.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new ErrorResponse(`User not found with id of ${id}`, 404);
  }
  return user;
};

/**
 * Deletes a user and their associated profiles.
 * @param {string} id - The ID of the user to delete.
 */
export const deleteUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    throw new ErrorResponse(`User not found with id of ${id}`, 404);
  }
  // This is where you would also delete related Student/Teacher profiles
  // For example:
  // if (user.role === 'student') await Student.deleteOne({ user: id });
  // if (user.role === 'teacher') await Teacher.deleteOne({ user: id });
  await user.remove();
  return;
};