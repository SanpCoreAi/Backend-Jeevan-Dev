const DoctorService = require("../../services/doctor/createdoctorService");
const {  updateDoctorSchema  } = require("../../validation/doctor/doctorValidation");
const safeParse = require("../../utils/safeJson");


async function getDoctorProfile(req, res) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const result = await DoctorService.getProfile(userId);

    return res
      .status(result.statusCode)
      .json({
        success: result.statusCode < 400,
        message: result.message,
        data: result.data || null
      });

  } catch (error) {
    console.error("Get Doctor Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

async function getDoctorPublicProfileById(req, res) {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  const result = await DoctorService.getDoctorPublicProfileById(userId);

  return res
    .status(result.statusCode || 200)
    .json(result);
}

async function updateDoctorProfile(req, res) {
  try {
    const { error, value } = updateDoctorSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result = await DoctorService.updateProfile(
      req.user.id,
      value
    );

    return res
      .status(result.statusCode || (result.success ? 200 : 400))
      .json(result);

  } catch (err) {
    console.error("Update Doctor Error:", err);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

async function getAllDoctors(req, res) {
  try {

    const result = await DoctorService.getAllDoctors();

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (error) {

    console.error("Get All Doctors Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
}

module.exports = {
  getDoctorProfile,
  getDoctorPublicProfileById,
  updateDoctorProfile,
  getAllDoctors,
};