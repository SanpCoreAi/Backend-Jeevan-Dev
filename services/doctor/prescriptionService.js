const db = require("../../config/db");
const model = require("../../models/prescriptionModel");
const appointmentModel = require("../../models/appointModels");
const AppError = require("../../utils/appError");

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

    await conn.commit();
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
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};