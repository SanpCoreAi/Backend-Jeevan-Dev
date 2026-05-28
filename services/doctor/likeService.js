const {
  createLike,
  findLike,
  deleteLike,
  getLikedDoctors,
  countLikedDoctors
} = require("../../models/likeModel");

const likeModel = require("../../models/likeModel");

const redis = require("../../config/redis");

const toggleLike = async (
  userId,
  doctorId
) => {

  const existing = await findLike(
    userId,
    doctorId
  );

  if (existing.length > 0) {

    await deleteLike(
      userId,
      doctorId
    );

    try {

      const pattern =
        `liked:${userId}:*`;

      const keys =
        await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(keys);
      }

    } catch (e) {
      console.log(
        "Redis Delete Error:",
        e.message
      );
    }

    return {
      success: true,
      message: "Doctor unliked",
      isLiked: false
    };
  }

  try {

    await createLike(
      userId,
      doctorId
    );

    try {

      const pattern =
        `liked:${userId}:*`;

      const keys =
        await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(keys);
      }

    } catch (e) {
      console.log(
        "Redis Delete Error:",
        e.message
      );
    }

    return {
      success: true,
      message: "Doctor liked",
      isLiked: true
    };

  } catch (err) {

    if (err.code === "ER_DUP_ENTRY") {

      return {
        success: false,
        message: "Already liked"
      };
    }

    throw err;
  }
};


const getLikedDoctorsService = async (
  userId,
  page = 1,
  limit = 10
) => {

  page = Number(page);
  limit = Number(limit);

  const offset =
    (page - 1) * limit;

  const cacheKey =
    `liked:${userId}:page:${page}:limit:${limit}`;


  try {

    const cached =
      await redis.get(cacheKey);

    if (cached) {

      return JSON.parse(cached);
    }

  } catch (e) {

    console.log(
      "Redis Get Error:",
      e.message
    );
  }

  const doctors =
    await getLikedDoctors(
      userId,
      limit,
      offset
    );

  const total =
    await countLikedDoctors(userId);

  const result = {
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(
      total / limit
    ),
    data: doctors
  };

  try {

    await redis.set(
      cacheKey,
      JSON.stringify(result),
      "EX",
      60
    );

  } catch (e) {

    console.log(
      "Redis Set Error:",
      e.message
    );
  }

  return result;
};

const getUserByToken = async (
  token
) => {

  try {

    const user =
      await likeModel.findUserByToken(
        token
      );

    return user;

  } catch (error) {

    console.error(
      "Service Error:",
      error
    );

    throw error;
  }
};


module.exports = {
  toggleLike,
  getUserByToken,
  getLikedDoctorsService
};