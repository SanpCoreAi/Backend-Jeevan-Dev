const model = require("../../models/appointModels");
const prescriptionModel = require("../../models/prescriptionModel");
const db = require("../../config/db");

exports.verifyToken = async (token) => {
  const data = await model.getByToken(token);
  if (!data) throw new Error("Invalid token");
  return data;
};

exports.start = async (id) => {
  const appt = await model.getById(id);
  if (!appt) throw new Error("Appointment not found");

  await model.start(id);

  return { message: "Appointment started successfully" }; 
};

exports.getDetails = async (id) => {
  const appt = await model.getById(id);
  if (!appt) throw new Error("Appointment not found");

  const prescriptions = await prescriptionModel.getByAppointment(id, db);

  return { appt, prescriptions };
};

exports.complete = async (id) => {
  const appt = await model.getById(id);

  if (!appt) {
    throw new Error("Appointment not found");
  }

  if (appt.status === "COMPLETED") {
    return { message: "Appointment already completed" };
  }

  await model.complete(id);

  return { message: "Appointment completed successfully" }; // ✅ return
};

exports.revisit = async (patientId, doctorId) => {
  return await model.revisit(patientId, doctorId);
};