const jwt = require("jsonwebtoken");
const db = require("../../config/db");

exports.refreshTokenController = async (req, res) => {
  const { refreshToken } = req.body;
  

  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_SECRET || "REFRESH_SECRET"
    );

    const [rows] = await db.query(
      "SELECT * FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.id, refreshToken]
    );

    if (!rows.length) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      process.env.ACCESS_SECRET || "ACCESS_SECRET",
      { expiresIn: "15m" }
    );

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};