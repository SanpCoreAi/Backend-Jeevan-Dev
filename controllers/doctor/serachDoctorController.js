const {
  searchDoctorService
} = require("../../services/doctor/serachDoctorService");

const {searchDoctorSchema
} = require("../../validation/doctor/getDoctorsValidation");

exports.searchDoctors = async (req, res) => {
  try {

    const { error, value } = searchDoctorSchema.validate(
      req.query,
      {
        abortEarly: false,
        stripUnknown: true
      }
    );

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const result = await searchDoctorService({
      ...value,
      search:
        value.search ||
        value.q ||
        value.keyword
    });

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      count: result.total,
      page: result.page,
      limit: result.limit,
      data: result.data
    });

  } catch (error) {

    console.error(
      "SEARCH DOCTORS CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      count: 0,
      page: 1,
      limit: 10,
      data: []
    });
  }
};