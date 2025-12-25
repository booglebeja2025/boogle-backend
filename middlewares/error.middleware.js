const { errorResponse } = require('../utils/response');

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  // Development mode: send full error
  if (process.env.NODE_ENV === 'development') {
    return errorResponse(res, err.message, err.statusCode, {
      error: err,
      stack: err.stack
    });
  }
  
  // Production mode: send generic messages
  let message = err.message;
  
  // Handle Mongoose errors
  if (err.name === 'CastError') {
    message = `Invalid ${err.path}: ${err.value}`;
    return errorResponse(res, message, 400);
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists. Please use a different ${field}`;
    return errorResponse(res, message, 400);
  }
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(el => el.message);
    message = `Invalid input data: ${errors.join('. ')}`;
    return errorResponse(res, message, 400);
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid token. Please log in again.';
    return errorResponse(res, message, 401);
  }
  
  if (err.name === 'TokenExpiredError') {
    message = 'Your token has expired. Please log in again.';
    return errorResponse(res, message, 401);
  }
  
  // Default error
  return errorResponse(res, message, err.statusCode);
};

module.exports = errorHandler;