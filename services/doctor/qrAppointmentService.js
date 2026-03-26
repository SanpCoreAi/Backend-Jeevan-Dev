const db = require("../../config/db");
const SlotModel = require("../../models/slot");

async function scanBook({ user, doctorId, hospitalName }) {

  // next available slot
  const slot = await SlotModel.getNextAvailableSlot(doctorId);
  if (!slot) throw new Error("No slot available");

  // user details
  const [users] = await db.query(
    "SELECT full_name, phone_number, email FROM users WHERE id = ?",
    [user.id]
  );
  const patient = users[0];
  if (!patient || !patient.full_name) throw new Error("Patient name is required for booking");

  // token number
  const [rows] = await db.query(
    `SELECT MAX(token_number) AS lastToken
     FROM appointments
     WHERE doctor_id = ? AND DATE(slot_date) = DATE(?)`,
    [doctorId, slot.start_date]
  );
  let token = rows[0].lastToken ? rows[0].lastToken + 1 : 1;

  // insert appointment (store hospital name here)
  const [appointmentResult] = await db.query(
    `INSERT INTO appointments
      (schedule_id, doctor_id, slot_date, start_time, end_time, token_number, appointment_type, hospital_name)
     VALUES (?,?,?,?,?,?, 'offline', ?)`,
    [
      slot.schedule_id,
      doctorId,
      slot.start_date,
      slot.start_time,
      slot.end_time,
      token,
      hospitalName 
    ]
  );
  const appointmentId = appointmentResult.insertId;

  // deactivate slot
  await SlotModel.deactivateSlot(slot.id);

  // insert patient
  await db.query(
    `INSERT INTO appointment_patients
      (appointment_id, user_id, patient_name, patient_phone, patient_email)
     VALUES (?,?,?,?,?)`,
    [
      appointmentId,
      user.id,
      patient.full_name,
      patient.phone_number,
      patient.email
    ]
  );

  return {
    id: user.id,
    appointment_id: appointmentId,
    token_number: token,
    patient: patient.full_name,
    date: slot.start_date,
    time: slot.start_time,
    hospital_name: hospitalName
  };
}

module.exports = {
  scanBook
};