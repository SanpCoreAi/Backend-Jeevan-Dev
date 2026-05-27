const ScheduleService = require("../../services/doctor/scheduleService");

exports.create = async (req, res) => {
  const result = await ScheduleService.createSchedule(
    req.user.id,
    req.body
  );

  if (!result.success) {
    return res
      .status(result.statusCode || 400)
      .json(result);
  }

  res.status(201).json(result);
};

exports.getAll = async (req, res) => {
  const result = await ScheduleService.getAllSchedules(req.user.id);
  res.json(result);
};

exports.getByDoctorId = async (req, res) => {
  try {
    const result = await ScheduleService.getScheduleByDoctorId(req.user.id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Schedule Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

exports.getSchedulePublicByDoctorId = async (req, res) => {
  const result =
    await ScheduleService.getSchedulePublicByDoctorId(
      Number(req.params.doctorId)
    );

  if (!result.success) {
    return res
      .status(result.statusCode || 404)
      .json(result);
  }

  res.json(result);
};

exports.getHospitals = async (req, res) => {
  const result =
    await ScheduleService.getHospitalNamesByDoctor(req.user.id);

  res.json(result);
};

exports.update = async (req, res) => {
  const result = await ScheduleService.updateSchedule(
    req.user.id,
    req.params.id,
    req.body
  );

  if (!result.success) {
    return res
      .status(result.statusCode || 400)
      .json(result);
  }

  res.json(result);
};

exports.remove = async (req, res) => {
  const result = await ScheduleService.deleteSchedule(
    req.params.id,
    req.user.id
  );

  if (!result.success) {
    return res
      .status(result.statusCode || 400)
      .json(result);
  }

  res.json(result);
};
