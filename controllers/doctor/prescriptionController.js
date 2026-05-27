const AppError = require("../../utils/appError");
const service = require("../../services/doctor/prescriptionService");

exports.save = async (req, res, next) => {
  try {
    const appointmentId =
      req.body.appointmentId || req.body.appointment_id;

    const medicines = req.body.medicines;

    const remark = req.body.remark;
    const followUpDate = req.body.follow_up_date;
    const diagnosis = req.body.diagnosis;

    if (!appointmentId) {
      throw new AppError("Appointment ID is required", 400);
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      throw new AppError("Medicines are required", 400);
    }

    await service.save(
      appointmentId,
      medicines,
      remark,
      followUpDate,
      diagnosis
    );

    res.json({
      success: true,
      message: "Prescription saved successfully",
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const appointmentId = req.params.appointmentId;

    const medicines = req.body.medicines;
    const remark = req.body.remark;
    const followUpDate = req.body.follow_up_date;
    const diagnosis = req.body.diagnosis;

    if (!appointmentId) {
      throw new AppError("Appointment ID is required", 400);
    }

    if (!Array.isArray(medicines) || medicines.length === 0) {
      throw new AppError("Medicines are required", 400);
    }

    await service.update(
      appointmentId,
      medicines,
      remark,
      followUpDate,
      diagnosis
    );

    res.status(200).json({
      success: true,
      message: "Prescription updated successfully",
    });
  } catch (err) {
    next(err);
  }
};