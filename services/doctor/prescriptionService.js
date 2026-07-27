const db = require("../../config/db");
const model = require("../../models/prescriptionModel");
const appointmentModel = require("../../models/appointModels");
const AppError = require("../../utils/appError");
const notificationService = require("../notification/notificationService");

exports.save = async (
  appointmentId,
  meds,
  remark,
  followUpDate,
  diagnosis
) => {
  if (!appointmentId) {
    throw new AppError("Appointment ID is required", 400);
  }

  if (!Array.isArray(meds) || meds.length === 0) {
    throw new AppError("Medicines are required", 400);
  }

  const appointment = await appointmentModel.getById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  // Appointment already completed
  if (appointment.status === "COMPLETED") {
    throw new AppError("Appointment already completed", 400);
  }

  // Prescription sirf IN_PROGRESS appointment par hi save hogi
  if (appointment.status !== "IN_PROGRESS") {
    throw new AppError(
      "Appointment must be in progress before saving prescription",
      400
    );
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Old prescription delete
    await model.deleteByAppointment(appointmentId, conn);

    // Insert medicines
    for (const med of meds) {
      await model.insert(
        appointmentId,
        med,
        remark,
        followUpDate,
        diagnosis,
        conn
      );
    }

    // Appointment Complete
    const [result] = await conn.execute(
      `
      UPDATE appointments
      SET
        status = 'COMPLETED',
        updated_at = NOW()
      WHERE id = ?
      `,
      [appointmentId]
    );

    if (result.affectedRows === 0) {
      throw new AppError(
        "Failed to complete appointment",
        500
      );
    }

    await conn.commit();

await notificationService.createNotification({
  userId: appointment.patient_id,
  title: "Prescription Uploaded",
  message: "Your prescription has been uploaded successfully.",
  type: "SUCCESS",
  createdBy: appointment.doctor_id,
});

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.update = async (appointmentId, medicines, remark, followUpDate, diagnosis) =>{
  const appointment = await appointmentModel.getById(appointmentId);

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // Old medicines delete
    await model.deleteByAppointment(appointmentId, conn);

    // New medicines insert
    for (const med of medicines) {
      await model.insert(
        appointmentId,
        med,
        remark,
        followUpDate,
        diagnosis,
        conn
      );
    }

    await conn.commit();

  await notificationService.createNotification({
  userId: appointment.patient_id,
  title: "Prescription Updated",
  message: "Your prescription has been updated successfully.",
  type: "INFO",
  createdBy: appointment.doctor_id,
  
});
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};