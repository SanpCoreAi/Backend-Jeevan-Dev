const jwt = require("jsonwebtoken");
const AppError = require("../utils/appError");

const protect = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Authorization token missing", 401));
    }

    const token = authHeader.split(" ")[1];

    if (!token) return next(new AppError("Token missing", 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "MY_SUPER_SECRET_KEY");
    req.user = decoded;
    next();
  } catch (err) {
    return next(new AppError("Invalid or expired token", 401));
  }
};

const restrictToRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return next(new AppError("Forbidden: insufficient permissions", 403));
  }
  next();
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Authorization header missing",
    });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      statusCode: 401,
      message: "Token missing from header",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "MY_SUPER_SECRET_KEY");
    req.user = decoded; 
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { protect, restrictToRole, verifyToken };
