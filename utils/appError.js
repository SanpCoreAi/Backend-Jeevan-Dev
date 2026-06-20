function AppError(message, statusCode = 500) {

  const error = new Error(message);


  error.statusCode = statusCode;


  error.status =
    String(statusCode).startsWith("4")
      ? "fail"
      : "error";


  error.isOperational = true;


  return error;

}


module.exports = AppError;