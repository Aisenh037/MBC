// services/facilityService.js
import Facility from '../models/Facility.js';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Retrieves all facilities.
 * @returns {Promise<Facility[]>}
 */
export const getAllFacilities = async () => {
  return Facility.find();
};

/**
 * Books a facility after checking for availability.
 * @param {string} facilityId - The ID of the facility.
 * @param {string} userId - The ID of the user making the booking.
 * @param {object} bookingDetails - { date, startTime, endTime, purpose }.
 * @returns {Promise<Facility>}
 */
export const bookFacility = async (facilityId, userId, bookingDetails) => {
  const { date, startTime, endTime, purpose } = bookingDetails;
  
  const facility = await Facility.findById(facilityId);
  if (!facility) {
    throw new ErrorResponse(`Facility not found with id of ${facilityId}`, 404);
  }
  if (!facility.available) {
    throw new ErrorResponse('This facility is currently unavailable for booking.', 400);
  }
  
  // Basic conflict check (can be made more robust)
  const isConflict = facility.bookings.some(booking => {
    return (
      booking.status === 'approved' &&
      new Date(booking.date).toDateString() === new Date(date).toDateString() &&
      startTime < booking.endTime &&
      endTime > booking.startTime
    );
  });

  if (isConflict) {
    throw new ErrorResponse('This time slot is already booked and approved.', 409);
  }
  
  facility.bookings.push({ user: userId, date, startTime, endTime, purpose });
  await facility.save();
  return facility;
};

/**
 * Updates the status of a booking (pending, approved, rejected).
 * @param {string} facilityId - The ID of the facility.
 * @param {string} bookingId - The ID of the booking to update.
 * @param {string} status - The new status.
 * @returns {Promise<Facility>}
 */
export const updateBookingStatus = async (facilityId, bookingId, status) => {
  const facility = await Facility.findById(facilityId);
  if (!facility) {
    throw new ErrorResponse(`Facility not found with id of ${facilityId}`, 404);
  }
  
  const booking = facility.bookings.id(bookingId);
  if (!booking) {
    throw new ErrorResponse(`Booking not found with id of ${bookingId}`, 404);
  }
  
  booking.status = status;
  await facility.save();
  return facility;
};