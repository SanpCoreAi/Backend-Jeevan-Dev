const db = require("../../config/db");
const model = require("../../models/prescriptionModel");

exports.save = async (appointmentId, meds) => {
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await model.deleteByAppointment(appointmentId, conn);

    for (const med of meds) {
      await model.insert(appointmentId, med, conn);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};