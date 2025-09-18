// Error handling middleware for DebtWise AI

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error occurred:', err);

  // Default error response
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.statusCode || 500,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Joi validation errors
    error.status = 400;
    error.message = 'Validation failed';
    error.details = err.details?.map(detail => ({
      field: detail.context?.key || detail.path?.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
  }

  if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    error.status = 409;
    error.message = 'Resource already exists';
    error.constraint = err.constraint;
  }

  if (err.code === '23503') {
    // PostgreSQL foreign key constraint violation
    error.status = 400;
    error.message = 'Invalid reference to related resource';
    error.constraint = err.constraint;
  }

  if (err.code === '23502') {
    // PostgreSQL not null constraint violation
    error.status = 400;
    error.message = 'Required field is missing';
    error.column = err.column;
  }

  if (err.name === 'CastError') {
    // Invalid ID format
    error.status = 400;
    error.message = 'Invalid ID format';
  }

  if (err.name === 'JsonWebTokenError') {
    // JWT errors
    error.status = 401;
    error.message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    // JWT expired
    error.status = 401;
    error.message = 'Authentication token has expired';
  }

  // Rate limiting errors
  if (err.status === 429) {
    error.message = 'Too many requests, please try again later';
  }

  // Log error details (but not for client errors)
  if (error.status >= 500) {
    console.error('🔥 Server Error Details:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      user: req.user?.id,
      timestamp: error.timestamp
    });
  }

  // Send error response
  res.status(error.status).json({
    error: {
      message: error.message,
      status: error.status,
      timestamp: error.timestamp,
      path: error.path,
      method: error.method,
      ...(error.details && { details: error.details }),
      ...(error.constraint && { constraint: error.constraint }),
      ...(error.column && { column: error.column }),
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
export class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
export class ValidationError extends APIError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends APIError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends APIError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends APIError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends APIError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}