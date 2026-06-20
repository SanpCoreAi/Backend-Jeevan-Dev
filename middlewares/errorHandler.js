const AppError = require("../utils/appError");

const notFound = (req, res, next) => {

  const error = new AppError(
    `Route ${req.originalUrl} not found`,
    404
  );

  next(error);

};

const errorHandler = (
  err,
  req,
  res,
  next
) => {


  console.error("\n========== ERROR ==========");

  console.error(
    "TIME:",
    new Date().toISOString()
  );

  console.error(
    "METHOD:",
    req.method
  );

  console.error(
    "URL:",
    req.originalUrl
  );

  console.error(
    "MESSAGE:",
    err.message
  );

  console.error(
    "STACK:",
    err.stack
  );

  console.error(
    "===========================\n"
  );



  err.statusCode =
    err.statusCode || 500;



  err.status =
    err.status || "error";

  if(err.isOperational){


    return res
    .status(err.statusCode)
    .json({

      success:false,

      status:err.status,

      message:err.message

    });


  }




  // Unknown error

  return res
  .status(500)
  .json({

    success:false,

    status:"error",

    message:
    "Internal Server Error"

  });


};




module.exports = {
  notFound,
  errorHandler
};