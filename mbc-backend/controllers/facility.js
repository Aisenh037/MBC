import Facility from '../models/facility.js';
import ErrorResponse from '../utils/errorResponse.js';
import asyncHandler from '../middleware/asyncHandler.js';

// @desc    Get all facilities
// @route   GET /api/v1/facilities
// @access  Public
export const getFacilities = asyncHandler(async (req, res, next) => {
  const facilities = await Facility.find();

  res.status(200).json({
    success: true,
    count: facilities.length,
    data: facilities,
  });
});

// @desc    Get single facility
// @route   GET /api/v1/facilities/:id
// @access  Public
export const getFacility = asyncHandler(async (req, res, next) => {
  const facility = await Facility.findById(req.params.id);

  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: facility,
  });
});

// @desc    Create new facility
// @route   POST /api/v1/facilities
// @access  Private/Admin
export const createFacility = asyncHandler(async (req, res, next) => {
  const facility = await Facility.create(req.body);

  res.status(201).json({
    success: true,
    data: facility,
  });
});

// @desc    Update facility
// @route   PUT /api/v1/facilities/:id
// @access  Private/Admin
export const updateFacility = asyncHandler(async (req, res, next) => {
  const facility = await Facility.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: facility,
  });
});

// @desc    Delete facility
// @route   DELETE /api/v1/facilities/:id
// @access  Private/Admin
export const deleteFacility = asyncHandler(async (req, res, next) => {
  const facility = await Facility.findByIdAndDelete(req.params.id);

  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Book facility
// @route   POST /api/v1/facilities/:id/book
// @access  Private
export const bookFacility = asyncHandler(async (req, res, next) => {
  const { date, startTime, endTime, purpose } = req.body;

  const facility = await Facility.findById(req.params.id);

  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.params.id}`, 404));
  }

  // Check if facility is available
  if (!facility.available) {
    return next(new ErrorResponse('Facility is not available', 400));
  }

  // Check for conflicting bookings
  const conflictingBooking = facility.bookings.find(booking => {
    return (
      booking.date.toISOString() === new Date(date).toISOString() &&
      ((startTime >= booking.startTime && startTime < booking.endTime) ||
        (endTime > booking.startTime && endTime <= booking.endTime) ||
        (startTime <= booking.startTime && endTime >= booking.endTime))
    );
  });

  if (conflictingBooking) {
    return next(new ErrorResponse('Facility is already booked for this time slot', 400));
  }

  facility.bookings.push({
    user: req.user.id,
    date,
    startTime,
    endTime,
    purpose,
  });

  await facility.save();

  res.status(200).json({
    success: true,
    data: facility,
  });
});

// @desc    Approve/Reject booking
// @route   PUT /api/v1/facilities/:id/bookings/:bookingId
// @access  Private/Admin
export const updateBookingStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  const facility = await Facility.findById(req.params.id);

  if (!facility) {
    return next(new ErrorResponse(`Facility not found with id of ${req.params.id}`, 404));
  }

  const bookingIndex = facility.bookings.findIndex(
    booking => booking._id.toString() === req.params.bookingId
  );

  if (bookingIndex === -1) {
    return next(new ErrorResponse(`Booking not found with id of ${req.params.bookingId}`, 404));
  }

  facility.bookings[bookingIndex].status = status;
  await facility.save();

  res.status(200).json({
    success: true,
    data: facility,
  });
});
