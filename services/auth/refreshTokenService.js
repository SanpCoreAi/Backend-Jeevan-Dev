const jwt = require("jsonwebtoken");
const db = require("../../config/db");

exports.refreshToken = async (refreshToken) => {
  try {
    let decoded;

    try {
      decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET || "refresh_secret"
      );
    } catch (err) {
      return {
        statusCode: 403,
        body: { message: "Invalid or expired refresh token" },
      };
    }

    const [rows] = await db.query(
      "SELECT id, role_id FROM users WHERE id = ? AND refresh_token = ?",
      [decoded.id, refreshToken]
    );

    if (!rows.length) {
      return {
        statusCode: 403,
        body: { message: "Refresh token not valid" },
      };
    }

    const user = rows[0];

    const newAccessToken = jwt.sign(
      { id: user.id, role_id: user.role_id },
      process.env.ACCESS_SECRET || "access_secret",
      { expiresIn: "24h" }
    );

    return {
      statusCode: 200,
      body: {
        message: "Access token refreshed successfully",
        accessToken: newAccessToken,
      },
    };

  } catch (error) {
    console.error("Refresh Service Error:", error.message);

    return {
      statusCode: 500,
      body: { message: "Failed to refresh token" },
    };
  }
};