class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.timestamp = new Date().toISOString();
  }
}

const successResponse = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

const errorResponse = (res, message = "Error", statusCode = 500, errors = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

const validationError = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    message: 'Validation failed',
    errors: errors.array().map(err => ({
      field: err.param,
      message: err.msg
    })),
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  ApiResponse,
  successResponse,
  errorResponse,
  validationError
};