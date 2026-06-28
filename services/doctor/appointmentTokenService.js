const model = require("../../models/appointModels");
const prescriptionModel = require("../../models/prescriptionModel");
const db = require("../../config/db");


exports.verifyToken = async ({
  doctorId,
  appointmentId,
  token,
}) => {

  const data = await model.getByToken({
    doctorId,
    appointmentId,
    token,
  });

  if (!data) {
    throw new Error("Invalid appointment or token");
  }

  if (data.status !== "PENDING") {
    throw new Error(
      "Appointment already started or completed"
    );
  }

  const result = await model.start(
    appointmentId
  );

  if (result.affectedRows === 0) {
    throw new Error(
      "Failed to start appointment"
    );
  }

  data.status = "IN_PROGRESS";

  return data;
};

// START APPOINTMENT
exports.start = async (id) => {

  const appt = await model.getById(id);

  if (!appt) {
    throw new Error("Appointment not found");
  }

  if (appt.status === "COMPLETED") {
    throw new Error("Appointment already completed");
  }

  // already running
  if (appt.status === "IN_PROGRESS") {
    return {
      message: "Appointment already in progress"
    };
  }

  await model.start(id);

  return {
    message: "Appointment started successfully"
  };
};


exports.complete = async (id) => {

  // appointment fetch
  const appt = await model.getById(id);

  if (!appt) {
    throw new Error("Appointment not found");
  }

  // already completed
  if (appt.status === "COMPLETED") {
    return {
      message: "Appointment already completed"
    };
  }

  // pending check
  if (appt.status === "PENDING") {
    throw new Error("Start appointment first");
  }

  // update status
  const result = await model.complete(id);

  // check affected rows
  if (result.affectedRows === 0) {
    throw new Error("Failed to complete appointment");
  }

  return {
    message: "Appointment completed successfully"
  };
};

exports.completeByToken = async (token) => {
  const data = await model.getByToken(token);

  if (!data) {
    throw new Error("Invalid token");
  }

  if (data.status === "COMPLETED") {
    return {
      message: "Appointment already completed"
    };
  }

  if (data.status === "PENDING") {
    throw new Error("Start appointment first");
  }

  const result = await model.complete(data.appointment_id);

  if (result.affectedRows === 0) {
    throw new Error("Failed to complete appointment");
  }

  return {
    message: "Appointment completed successfully"
  };
};


// EDIT PRESCRIPTION
exports.editPrescription = async (appointment_id, medicines) => {

  const appt = await model.getById(appointment_id);

  if (!appt) {
    throw new Error("Appointment not found");
  }

  if (appt.status !== "COMPLETED") {
    throw new Error("Only completed appointments can be edited");
  }

  if (!appt.completed_at) {
    throw new Error("Completion time missing");
  }

  const now = new Date();
  const completedTime = new Date(appt.completed_at);

  const diffInMinutes = (now - completedTime) / (1000 * 60);

  if (diffInMinutes > 15) {
    throw new Error("Edit allowed only within 15 minutes after completion");
  }

  const conn = await db.getConnection();

  try {

    await conn.beginTransaction();

    await prescriptionModel.deleteByAppointment(
      appointment_id,
      conn
    );

    for (const med of medicines) {

      await prescriptionModel.insert(
        appointment_id,
        med,
        null,
        null,
        null,
        conn
      );
    }

    await conn.commit();

    return {
      message: "Prescription updated successfully"
    };

  } catch (err) {

    await conn.rollback();
    throw err;

  } finally {

    conn.release();
  }
};


// GET DETAILS
exports.getDetails = async (id) => {

  const appt = await model.getById(id);

  if (!appt) {
    throw new Error("Appointment not found");
  }

  const prescriptions =
    await prescriptionModel.getByAppointment(id, db);

  return {
    appt,
    prescriptions
  };
};


// GET FULL PRESCRIPTION
exports.getFullPrescription = async (appointment_id) => {

  const appointment =
    await prescriptionModel.getAppointmentFullDataById(
      appointment_id
    );

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const medicines =
    await prescriptionModel.getPrescriptionMedicines(
      appointment.appointment_id
    );

  return {

    doctor: {
      id: appointment.doctor_id,
      name: appointment.doctor_name,
      mobile: appointment.doctor_mobile,
      qualification: appointment.qualification,
      specialization: appointment.specialization,
      medical_license_no: appointment.medical_license_no,
      qr_code: appointment.qr_code,

      hospital_detail: appointment.hospital_detail
        ? JSON.parse(appointment.hospital_detail)
        : [],

      availability: appointment.availability
        ? JSON.parse(appointment.availability)
        : []
    },

    patient: {
      id: appointment.patient_id,
      name: appointment.patient_name,
      age: appointment.age,
      gender: appointment.gender,
      height: appointment.height,
      weight: appointment.weight
    },

    appointment: {
      id: appointment.appointment_id,
      token_number: appointment.token_number,
      date: appointment.slot_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      hospital_name: appointment.hospital_name
    },

    prescription: medicines.length > 0
      ? {
          follow_up_date: medicines[0].follow_up_date,
          remark: medicines[0].remark,
          diagnosis: medicines[0].diagnosis,

          medicines: medicines.map(m => ({
            id: m.id,
            medicine_name: m.medicine_name,
            dose: m.dose,
            frequency: m.frequency,
            duration: m.duration,
            instructions: m.instructions
          }))
        }
      : null
  };
};


// REVISIT
exports.revisit = async (patientId, doctorId) => {

  return await model.revisit(
    patientId,
    doctorId
  );
};