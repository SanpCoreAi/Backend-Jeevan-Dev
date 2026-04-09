const DoctorService = require("../../services/doctor/createdoctorService");
const { createDoctorSchema, updateDoctorSchema} = require("../../validation/doctor/doctorValidation");

async function createDoctorProfile(req, res) {
  try {

    const { error, value } = createDoctorSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

const result = await DoctorService.createProfile(req.user.id, value);

return res.status(201).json({
  success: true,
  message: "Doctor profile created successfully",
  userId: req.user.id,
  qrCode: result.qrCode
});

  } catch (err) {

    return res.status(400).json({
      success: false,
      message: err.message
    });

  }
}

async function getDoctorProfile(req, res) {
  const userId = req.user?.id;

  const result = await DoctorService.getProfile(userId);

  if (!result.success) {
    return res.status(404).json(result);
  }

  return res.status(200).json(result);
}


async function getDoctorPublicProfileById(req, res) {
  const doctorId = req.params.doctorId;

  const result = await DoctorService.getDoctorPublicProfileById(doctorId);

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

    await DoctorService.updateProfile(req.user.id, value);

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully"
    });

  } catch (err) {

    return res.status(400).json({
      success: false,
      message: err.message
    });

  }
}

async function getAllDoctors(req, res) {
  try {
    const data = await DoctorService.getAllDoctors();

    return res.status(200).json({
      success: true,
      count: data.length,
      data
    });

  } catch (err) {
    console.error("getAllDoctors ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
}


module.exports = {
  createDoctorProfile,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorPublicProfileById,
  getAllDoctors,
};