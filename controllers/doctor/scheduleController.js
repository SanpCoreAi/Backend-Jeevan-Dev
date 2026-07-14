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

  try {

    let doctorId;


    const userRole = req.user.role || req.user.role_id;

    // Doctor token
    if (Number(userRole) === 2) {

      doctorId = req.user.id;

    }


    // Assistant token
    else if (Number(userRole) === 3) {

      const user =
        await ScheduleService.getUserById(
          req.user.id
        );


      if (!user || !user.doctor_id) {

        return res.status(404).json({
          success:false,
          message:"Doctor not found"
        });

      }


      doctorId = user.doctor_id;

    }


    else {

      return res.status(403).json({
        success:false,
        message:"Unauthorized role"
      });

    }



    const result =
      await ScheduleService.getHospitalNamesByDoctor(
        doctorId
      );


    return res.json(result);



  } catch(error) {

    return res.status(500).json({
      success:false,
      message:error.message
    });

  }

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

exports.deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const result = await ScheduleService.deleteSchedule(
      scheduleId,
      req.body,
      req.user.id
    );

    return res
      .status(result.success ? 200 : 400)
      .json(result);

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
