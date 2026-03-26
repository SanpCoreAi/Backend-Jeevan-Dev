function parse12to24(time12) {
  if (!time12 || typeof time12 !== "string") return null;
  // allow ranges like "11:30 AM - 11:50 AM"
  if (time12.includes("-")) {
    time12 = time12.split("-")[0].trim();
  }

  const t = time12.trim();

  // accept 24-hour formats: HH:MM or HH:MM:SS
  const match24 = t.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hour = String(Number(match24[1])).padStart(2, '0');
    const minute = match24[2];
    const second = match24[3] ? match24[3] : '00';
    return `${hour}:${minute}:${second}`;
  }

  // accept 12-hour formats with AM/PM
  const match12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match12) return null;

  let hour12 = parseInt(match12[1], 10);
  const minute12 = match12[2];
  const period = match12[3].toUpperCase();

  if (hour12 < 1 || hour12 > 12) return null;

  if (period === "AM") {
    if (hour12 === 12) hour12 = 0;
  } else {
    if (hour12 !== 12) hour12 += 12;
  }

  return `${String(hour12).padStart(2, "0")}:${minute12}:00`;
}




function toMinutes(time24) {
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

function to12Hour(minutes) {
  // support minutes beyond 24*60 (for overnight slots)
  const totalMinutes = minutes;
  let h = Math.floor(totalMinutes / 60) % 24; // normalize to 0-23
  let m = totalMinutes % 60;

  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;

  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function time24To12(time24) {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

function generateSlots12(start24, end24, duration, breakMin = 0) {
  let start = toMinutes(start24);
  let end = toMinutes(end24);

  // If end is earlier or equal to start we treat end as next day
  if (end <= start) {
    end += 24 * 60; // wrap to next day
  }

  if (start === end) return [];

  const slots = [];

  while (start + duration <= end) {
    slots.push({
      start: to12Hour(start),
      end: to12Hour(start + duration)
    });

    start += duration + breakMin;
  }

  return slots;
}

module.exports = {
  parse12to24,
  generateSlots12,
  time24To12
};
