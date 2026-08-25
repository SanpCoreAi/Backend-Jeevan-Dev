const DoctorService = require("../../services/doctor/createdoctorService");
const { updateDoctorSchema } = require("../../validation/doctor/doctorValidation");

exports.getDoctorProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
        data: null,
      });
    }

    const result =
      await DoctorService.getProfile(userId);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data || null,
    });

  } catch (error) {

    console.error(
      "GET DOCTOR PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};


exports.getDoctorPublicProfileById = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid user id is required.",
        data: null,
      });
    }

    const result =
      await DoctorService.getDoctorPublicProfileById(userId);

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data || null,
    });

  } catch (error) {
    console.error(
      "GET PUBLIC DOCTOR PROFILE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: null,
    });
  }
};

exports.updateDoctorProfile = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized user.",
      });
    }

    const { error, value } = updateDoctorSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const result = await DoctorService.updateProfile(
      userId,
      value
    );

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
    });

  } catch (error) {
    console.error("UPDATE DOCTOR PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    const result =
      await DoctorService.getAllDoctors({
        page,
        limit,
        search,
      });

    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully.",

      count: result.data.length,

      total: result.pagination.total,

      page: result.pagination.page,

      limit: result.pagination.limit,

      totalPages:
        result.pagination.totalPages,

      data: result.data,
    });

  } catch (error) {

    console.error(
      "GET ALL DOCTORS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      count: 0,
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      data: [],
    });
  }
};