const { getDoctorsService } = require("../../services/doctor/getdoctorService");
const { getDoctorsSchema } = require("../../validation/doctor/getDoctorsValidation");

exports.getDoctors = async (req, res) => {
  try {

    const { error, value } = getDoctorsSchema.validate(req.query, {
      abortEarly: true,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: error.details[0].message
      });
    }

    const result = await getDoctorsService(value);

    return res.status(result.statusCode).json(result);

  } catch (error) {

    console.error("GET DOCTORS ERROR:", error);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    });

  }
};