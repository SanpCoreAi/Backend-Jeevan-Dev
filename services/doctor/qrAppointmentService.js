const db = require("../../config/db");

async function scanBook({ user, doctorId, hospitalName, date }) {

  if (typeof hospitalName === "string") {
    hospitalName = hospitalName.trim().toLowerCase();
  }

  if (!hospitalName) {
    return { 
      success: false, 
      message: "hospital_name is required" 
    };
  }

  if (!date) {
    return { 
      success: false, 
      message: "date is required" 
    };
  }

  const [users] = await db.query(
    "SELECT full_name FROM users WHERE id = ?",
    [user.id]
  );

  const patient = users[0];
  if (!patient || !patient.full_name) {
    return { 
      success: false, 
      message: "Patient name is required for booking" 
    };
  }

  const [scheduleRows] = await db.query(
    `SELECT offlinepatient_number AS totalSlots
     FROM schedules
     WHERE doctor_id = ?
       AND LOWER(TRIM(hospital_name)) LIKE ?
       AND status = 'active'
     ORDER BY id DESC
     LIMIT 1`,
    [doctorId, `%${hospitalName}%`]
  );

  if (!scheduleRows.length) {
    return { 
      success: false, 
      message: "Schedule not found" 
    };
  }

  const totalSlots = Number(scheduleRows[0].totalSlots);

  if (!totalSlots || totalSlots <= 0) {
    return { 
      success: false, 
      message: "Offline slots not configured" 
    };
  }

  const [appointmentCount] = await db.query(
    `SELECT COUNT(*) AS booked 
     FROM appointments 
     WHERE doctor_id = ?  
       AND LOWER(TRIM(hospital_name)) LIKE ?
       AND DATE(slot_date) = ?
       AND appointment_type = 'offline'`,
    [doctorId, `%${hospitalName}%`, date]
  );

  const booked = appointmentCount[0].booked;

  if (booked >= totalSlots) {
    return { 
      success: false, 
      message: "All offline slots are booked for today" 
    };
  }

  const token = booked + 1;

  const [appointmentResult] = await db.query(
    `INSERT INTO appointments
      (doctor_id, patient_id, slot_date, token_number, appointment_type, hospital_name)
     VALUES (?, ?, ?, ?, 'offline', ?)`,
    [
      doctorId,
      user.id,
      date,
      token,
      hospitalName
    ]
  );

  return {
    success: true,
    message: "Appointment booked successfully",
    data: {
      patient_id: user.id,
      doctor_id: doctorId,
      appointment_id: appointmentResult.insertId,
      token,
      date,
      hospital_name: hospitalName
    }
  };
}

module.exports = {
  scanBook
};