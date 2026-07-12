const cron = require("node-cron");
const AppointmentModel = require("../models/appointment");

console.log("✅ Appointment Cron Loaded");
cron.schedule("0 0 * * *", async () => {
  try {

    console.log("Running Appointment Auto Cancel Cron");

    await AppointmentModel.autoCancelPendingAppointments();

    console.log("Pending appointments cancelled successfully");

  } catch (err) {

    console.error("Cron Error:", err);

  }
});