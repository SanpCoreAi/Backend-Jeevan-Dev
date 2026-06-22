const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  // Check header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token missing",
    });
  }

  // Extract token
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token missing",
    });
  }

  try {
    // IMPORTANT: same secret jo login me use kiya
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_SECRET || "access_secret"
    );

    req.user = {
      ...decoded,
      role: decoded.role || decoded.role_id,
      role_id: decoded.role_id || decoded.role,
    };
    next();

  } catch (error) {
    return res.status(403).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = {verifyToken};