// services/likeService.js
const {
  createLike,
  findLike,
  deleteLike,
  getLikedDoctors,
  countLikedDoctors
} = require("../../models/likeModel");

// 🔥 LIKE / UNLIKE (TOGGLE)
const toggleLike = async (userId, doctorId) => {
  const existing = await findLike(userId, doctorId);

  if (existing.length > 0) {
    await deleteLike(userId, doctorId);

    // cache clear
    try {
      await redis.del(`liked:${userId}:*`);
    } catch (e) {
      // Redis not available, ignore
    }

    return {
      success: true,
      message: "Doctor unliked",
      isLiked: false
    };
  }

  try {
    await createLike(userId, doctorId);

    try {
      await redis.del(`liked:${userId}:*`);
    } catch (e) {
      // Redis not available, ignore
    }

    return {
      success: true,
      message: "Doctor liked",
      isLiked: true
    };

  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return { success: false, message: "Already liked" };
    }
    throw err;
  }
};

// 🔥 GET LIKED DOCTORS (PAGINATION + CACHE)
const getLikedDoctorsService = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const cacheKey = `liked:${userId}:page:${page}:limit:${limit}`;

  // cache check
  try {
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (e) {
   
  }

  const doctors = await getLikedDoctors(userId, limit, offset);
  const total = await countLikedDoctors(userId);

  const result = {
    success: true,
    page,
    limit,
    total,
    data: doctors
  };

  try {
    await redis.set(cacheKey, JSON.stringify(result), "EX", 60);
  } catch (e) {
    
  }

  return result;
};

const getUserByToken = async (token) => {
  try {
    const user = await likeModel.findUserByToken(token);
    return user;
  } catch (error) {
    console.error("Service Error:", error);
    throw error;
  }
};

module.exports = {
  toggleLike,
  getUserByToken,
  getLikedDoctorsService
};