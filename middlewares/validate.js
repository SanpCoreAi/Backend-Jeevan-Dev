const { validationResult } = require("express-validator");
const AppError = require("../utils/appError");

exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const msg = errors.array().map((err) => err.msg).join(", ");
    return next(new AppError(msg, 400));
  }
  next();
};
