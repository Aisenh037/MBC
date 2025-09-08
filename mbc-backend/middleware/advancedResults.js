import mongoose from 'mongoose';
import ErrorResponse from '../utils/errorResponse.js';

/**
 * Attaches paginated query results to res.advancedResults
 * Supports: filtering, select, sort, page, limit, and population
 * @param {mongoose.Model} model
 * @param {string|Array} populate
 */
const advancedResults = (model, populate) => async (req, res, next) => {
  try {
    // Check MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      throw new ErrorResponse('MongoDB not connected', 500);
    }

    // Verify model
    if (!model || !mongoose.modelNames().includes(model.modelName)) {
      throw new ErrorResponse(`Model ${model.modelName} not found`, 500);
    }

    // Check collection existence
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);
    if (!collectionNames.includes(model.collection.name)) {
      console.warn(`Collection ${model.collection.name} not found`);
    }

    // Clone req.query and remove control fields
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach((param) => delete reqQuery[param]);

    // Build query
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, (match) => `$${match}`);
    let query = model.find(JSON.parse(queryStr));

    // Select fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 25;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await model.countDocuments(JSON.parse(queryStr)).catch((err) => {
      throw new ErrorResponse(`Count query failed: ${err.message}`, 500);
    });

    query = query.skip(startIndex).limit(limit);

    // Populate
    if (populate) {
      populate.forEach((pop) => {
        if (pop === 'user') {
          query = query.populate({ path: 'user', select: 'name email' });
        } else if (pop === 'branch') {
          query = query.populate({ path: 'branch', select: 'name' });
        } else {
          query = query.populate(pop);
        }
      });
    }

    const results = await query.lean().catch((err) => {
      throw new ErrorResponse(`Query failed: ${err.message}`, 500);
    });

    const pagination = {};
    if (endIndex < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (startIndex > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.advancedResults = {
      success: true,
      count: results.length,
      pagination,
      data: results || [],
    };

    next();
  } catch (error) {
    console.error('AdvancedResults error:', {
      message: error.message,
      stack: error.stack,
      model: model.modelName,
    });
    next(error);
  }
};

export default advancedResults;