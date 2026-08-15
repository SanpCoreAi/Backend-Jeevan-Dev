const ScheduleService = require("../../services/doctor/scheduleService");

const {
  createScheduleValidation,
  updateScheduleValidation,
  deleteScheduleValidation
} = require("../../validation/doctor/scheduleValidation");

exports.create = async (req, res) => {
  try {
    const { error, value } = createScheduleValidation.validate(
      req.body,
      {
        abortEarly: false,
        stripUnknown: true
      }
    );

    if (error) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: error.details.map((err) => err.message)
      });
    }

    const result = await ScheduleService.createSchedule(
      req.user.id,
      value
    );

    return res
      .status(
        result.statusCode ||
        (result.success ? 201 : 400)
      )
      .json(result);

  } catch (error) {

    console.error(
      "CREATE SCHEDULE CONTROLLER ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    });
  }
};

exports.getAll = async (req, res) => {
  try {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await ScheduleService.getAllSchedules(
      req.user.id,
      page,
      limit
    );

    return res
      .status(result.statusCode || 200)
      .json(result);

  } catch (error) {

    console.error("GET ALL SCHEDULES ERROR:", error);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    });

  }
};

exports.getByDoctorId = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const result = await ScheduleService.getScheduleByDoctorId(
      req.user.id,
      page,
      limit
    );

    return res
      .status(result.statusCode || (result.success ? 200 : 404))
      .json(result);

  } catch (error) {
    console.error("GET SCHEDULE ERROR:", error);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    });
  }
};

exports.getSchedulePublicByDoctorId = async (req, res) => {
  try {
    const doctorId =
      Number(req.params.doctorId);

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message:
          "Valid doctorId is required"
      });
    }

    const result =
      await ScheduleService
        .getSchedulePublicByDoctorId(
          doctorId,
          page,
          limit
        );

    return res
      .status(
        result.statusCode ||
        (result.success ? 200 : 404)
      )
      .json(result);

  } catch (error) {
    console.error(
      "PUBLIC SCHEDULE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message:
        "Internal Server Error"
    });
  }
};

exports.getHospitals = async (req, res) => {
  try {

    let doctorId;
    const role = Number(req.user.role || req.user.role_id);

    if (role === 2) {

      doctorId = req.user.id;

    } else if (role === 3) {

      const user = await ScheduleService.getUserById(req.user.id);

      if (!user || !user.doctor_id) {
        return res.status(404).json({
          success: false,
          statusCode: 404,
          message: "Doctor not found"
        });
      }

      doctorId = user.doctor_id;

    } else {

      return res.status(403).json({
        success: false,
        statusCode: 403,
        message: "Unauthorized"
      });

    }

    const result =
      await ScheduleService.getHospitalNamesByDoctor(
        doctorId
      );

    return res
      .status(result.statusCode || 200)
      .json(result);

  } catch (error) {

    console.error("GET HOSPITALS ERROR:", error);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    });

  }
};

exports.update = async (req, res) => {
  try {

    const scheduleId = Number(req.params.id);

    if (!scheduleId) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Valid scheduleId is required"
      });
    }

    const { error } = updateScheduleValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed",
        errors: error.details.map(err => err.message)
      });
    }

    const result =
      await ScheduleService.updateSchedule(
        req.user.id,
        scheduleId,
        req.body
      );

    return res
      .status(result.statusCode || (result.success ? 200 : 400))
      .json(result);

  } catch (error) {

    console.error("UPDATE SCHEDULE ERROR:", error);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    });

  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const scheduleId = Number(req.params.scheduleId);

    if (!scheduleId || isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Valid scheduleId is required."
      });
    }

    const { error, value } = deleteScheduleValidation.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: "Validation failed.",
        errors: error.details.map((err) => err.message)
      });
    }

    const result = await ScheduleService.deleteSchedule(
      scheduleId,
      value,
      req.user.id
    );

    return res.status(result.statusCode).json(result);

  } catch (error) {
    console.error("DELETE SCHEDULE ERROR:", error);

    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: "Internal Server Error."
    });
  }
};