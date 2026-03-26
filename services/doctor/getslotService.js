const db = require("../../config/db");

async function getAvailableSlots({ doctor, appointment_date }) {
  if (!doctor || !appointment_date) {
    throw new Error("Doctor and appointment_date are required");
  }

  const [allSlots] = await db.execute(
    "SELECT id, slot_time FROM slots WHERE doctor = ? AND appointment_date = ?",
    [doctor, appointment_date]
  );
  const [bookedSlots] = await db.execute(
    "SELECT time_slot FROM appointments WHERE doctor = ? AND appointment_date = ?",
    [doctor, appointment_date]
  );

  const bookedTimes = bookedSlots.map(b => b.time_slot);

  // 3️⃣ Filter available slots
  const availableSlots = allSlots.filter(slot => !bookedTimes.includes(slot.slot_time));

  return availableSlots;
}

module.exports = { getAvailableSlots };
