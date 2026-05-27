const AppError = require("../utils/appError");

// 404 Not Found Handler
const notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

module.exports = (err, req, res, next) => {
  console.log("⚠️ Error caught:", err.message);

  // Known operational error (e.g. validation, duplicate email)
  if (err.isOperational) {
    return res.status(err.statusCode || 400).json({
      status: err.status || "fail",
      message: err.message,
    });
  }

  // Unknown / unexpected error
  console.error("💥 Unexpected Error:", err);
  res.status(500).json({
    status: "error",
    message: "Internal Server Error",
  });
};

// Global Error Handler (for unexpected errors)
const errorHandler = (err, req, res, next) => {
  console.error("Unexpected Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong on the server!",
  });
};

function errorHandlerr(err, req, res, next) {
  console.error("Error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.isOperational ? err.message : "Something went wrong, please try again later",
  });
}

module.exports = { notFound, errorHandler, errorHandlerr};