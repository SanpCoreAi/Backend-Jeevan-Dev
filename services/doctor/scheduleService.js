const ScheduleModel = require("../../models/schedule");
const AppointmentModel = require("../../models/appointModels");
const SlotModel = require("../../models/slot");
const User = require("../../models/usermodel");
const db = require("../../config/db");
const { parse12to24, generateSlots12, time24To12 } = require("../../utils/timeHelper");
const {
  sendAppointmentCancelledEmail
} = require("../../utils/sendEmail");

function normalizeDateValue(value) {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString().slice(0, 10);
  }

  const valueString = String(value).trim();
  if (!valueString) return null;

  const dateOnly = valueString.split("T")[0].split(" ")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return dateOnly;
  }

  const parsed = new Date(valueString);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

async function generateScheduleSlots(scheduleId, payload, connection = db) {
  const doctorId = payload.doctor_id;
  const start24 = payload.start_time;
  const end24 = payload.end_time;
  const slotDuration = Number(payload.slot_duration);
  const breakMinutes = Number(payload.break_minutes || 0);

  if (!doctorId || !start24 || !end24 || !slotDuration || slotDuration <= 0) {
    return 0;
  }

  const slots = generateSlots12(start24, end24, slotDuration, breakMinutes);

  if (!slots.length) {
    return 0;
  }

  const startDateStr = normalizeDateValue(payload.start_date);
  const endDateStr = normalizeDateValue(payload.end_date);

  let activeDays = [];
  if (Array.isArray(payload.active_days)) {
    activeDays = payload.active_days;
  } else if (typeof payload.active_days === "string") {
    try {
      const parsedDays = JSON.parse(payload.active_days);
      if (Array.isArray(parsedDays)) {
        activeDays = parsedDays;
      }
    } catch {
      activeDays = payload.active_days
        .split(",")
        .map((day) => String(day).trim())
        .filter(Boolean);
    }
  }

  if (!startDateStr || !endDateStr) return 0;

  const normalizedDays = activeDays
    .map((day) => String(day).trim())
    .filter(Boolean)
    .map((day) => {
      const normalized = String(day).slice(0, 3).toLowerCase();
      switch (normalized) {
        case "sun":
          return "Sun";
        case "mon":
          return "Mon";
        case "tue":
          return "Tue";
        case "wed":
          return "Wed";
        case "thu":
          return "Thu";
        case "fri":
          return "Fri";
        case "sat":
          return "Sat";
        default:
          return null;
      }
    })
    .filter(Boolean);

  if (!normalizedDays.length) return 0;

  const endDayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(endDateStr + "T00:00:00Z").getUTCDay()];
  if (endDayName && !normalizedDays.includes(endDayName)) {
    normalizedDays.push(endDayName);
  }

  const startDate = new Date(startDateStr + "T00:00:00Z");
  const endDate = new Date(endDateStr + "T00:00:00Z");

  // Use UTC midnight to avoid timezone shifts when iterating dates
  const slotRows = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][currentDate.getUTCDay()];

    if (normalizedDays.includes(dayName)) {
      const dateStr = currentDate.toISOString().slice(0, 10);

      for (const slot of slots) {
        slotRows.push({
          schedule_id: scheduleId,
          doctor_id: doctorId,
          start_date: dateStr,
          end_date: dateStr,
          start_time: parse12to24(slot.start),
          end_time: parse12to24(slot.end),
          status: "active"
        });
      }
    }

    // advance by one day in UTC
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  if (!slotRows.length) {
    return 0;
  }

  await SlotModel.insertSlots(slotRows, connection);
  return slotRows.length;
}

async function createSchedule(doctorId, body) {
  let connection;

  try {
    connection = await db.getConnection();

    await connection.beginTransaction();

    if (!doctorId) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 401,
        message: "Unauthorized"
      };
    }

    if (!body.start_time || !body.end_time) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "start_time and end_time are required."
      };
    }

    if (!body.slot_duration || Number(body.slot_duration) <= 0) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "slot_duration must be greater than zero."
      };
    }

    const start24 = parse12to24(body.start_time);
    const end24 = parse12to24(body.end_time);

    if (!start24 || !end24) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "Invalid time format."
      };
    }

    if (start24 >= end24) {
      const startDate = body.start_date ? new Date(body.start_date) : null;
      const endDate = body.end_date ? new Date(body.end_date) : null;

      if (!(startDate && endDate && startDate < endDate)) {
        await connection.rollback();

        return {
          success: false,
          statusCode: 400,
          message: "End time must be greater than start time."
        };
      }
    }

    const duplicate = await ScheduleModel.findOverlappingSchedule(
      {
        doctor_id: doctorId,
        hospital_name: body.hospital_name ?? null,
        start_time: start24,
        end_time: end24,
        start_date: body.start_date,
        end_date: body.end_date
      },
      connection
    );

    if (duplicate) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message: "Schedule already exists for selected hospital and timing."
      };
    }

    const scheduleId = await ScheduleModel.createSchedule(
      {
        doctor_id: doctorId,
        location_id: body.location_id ?? null,
        hospital_name: body.hospital_name ?? null,
        start_time: start24,
        end_time: end24,
        slot_duration: Number(body.slot_duration),
        break_minutes: Number(body.break_minutes || 0),
        active_days: body.active_days || [],
        start_date: body.start_date,
        end_date: body.end_date,
        note: body.note ?? null,
        offlinepatient_number: body.offlinepatient_number ?? null
      },
      connection
    );

    const totalSlots = await generateScheduleSlots(
      scheduleId,
      {
        doctor_id: doctorId,
        start_time: start24,
        end_time: end24,
        slot_duration: Number(body.slot_duration),
        break_minutes: Number(body.break_minutes || 0),
        start_date: body.start_date,
        end_date: body.end_date,
        active_days: body.active_days || []
      },
      connection
    );

    if (!totalSlots) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "Unable to generate schedule slots."
      };
    }

    await connection.commit();

    return {
      success: true,
      statusCode: 201,
      message: "Schedule created successfully.",
      data: {
        scheduleId,
        totalSlots
      }
    };

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error("Create Schedule Service Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };

  } finally {

    if (connection) {
      connection.release();
    }

  }
}

async function getAllSchedules(
  doctorId,
  page = 1,
  limit = 10
) {
  try {

    if (!doctorId) {
      return {
        success: false,
        statusCode: 401,
        message: "Unauthorized"
      };
    }

    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(100, Number(limit) || 10));

    const offset = (page - 1) * limit;

    const totalRecords =
      await ScheduleModel.getAllCountByDoctor(doctorId);

    if (totalRecords === 0) {
      return {
        success: true,
        statusCode: 200,
        message: "No schedules found.",
        pagination: {
          totalRecords: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          hasNextPage: false,
          hasPreviousPage: false
        },
        count: 0,
        data: []
      };
    }

    const schedules =
      await ScheduleModel.getAllByDoctor(
        doctorId,
        limit,
        offset
      );

    const data = [];

    for (const schedule of schedules) {

      const dbSlots =
        await SlotModel.getSlotsBySchedule(schedule.id);

      const slots = dbSlots.map(slot => ({
        date: formatDate(slot.start_date),
        start: time24To12(slot.start_time),
        end: time24To12(slot.end_time),
        status: slot.status
      }));

      data.push({

        scheduleId: schedule.id,

        doctorId: schedule.doctor_id,

        locationId: schedule.location_id,

        hospitalName: schedule.hospital_name,

        offlinepatient_number:
          schedule.offlinepatient_number,

        booking_length:
          Number(schedule.booking_length),

        timing: {
          start: time24To12(schedule.start_time),
          end: time24To12(schedule.end_time),
          slotDuration: Number(schedule.slot_duration),
          breakMinutes: Number(schedule.break_minutes)
        },

        availability: {
          activeDays: Array.isArray(schedule.active_days)
            ? schedule.active_days
            : [],
          startDate: formatDate(schedule.start_date),
          endDate: formatDate(schedule.end_date)
        },

        note: schedule.note || null,

        slots,

        createdAt: schedule.created_at || null,

        updatedAt: schedule.updated_at || null

      });

    }

    return {

      success: true,

      statusCode: 200,

      message: "Schedules fetched successfully.",

      pagination: {
        totalRecords,
        totalPages: Math.ceil(totalRecords / limit),
        currentPage: page,
        limit,
        hasNextPage:
          page < Math.ceil(totalRecords / limit),
        hasPreviousPage:
          page > 1
      },

      count: data.length,

      data

    };

  } catch (error) {

    console.error(
      "Get All Schedules Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };

  }
}

function formatDate(date) {
  if (!date) return null;

  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function getScheduleByDoctorId(
  doctorId,
  page = 1,
  limit = 10
) {
  try {

    if (!doctorId) {
      return {
        success: false,
        statusCode: 401,
        message: "Unauthorized"
      };
    }

    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(100, Number(limit) || 10));

    const offset = (page - 1) * limit;

    const totalRecords =
      await ScheduleModel.getScheduleCountByDoctor(
        doctorId
      );

    if (totalRecords === 0) {
      return {
        success: true,
        statusCode: 200,
        message: "No schedules found.",
        pagination: {
          totalRecords: 0,
          totalPages: 0,
          currentPage: page,
          limit,
          hasNextPage: false,
          hasPreviousPage: false
        },
        count: 0,
        data: []
      };
    }

    const schedules =
      await ScheduleModel.getScheduleByDoctor(
        doctorId,
        limit,
        offset
      );

    const today = new Date().toLocaleDateString(
      "en-CA",
      {
        timeZone: "Asia/Kolkata"
      }
    );

    const response = [];

    for (const schedule of schedules) {

      response.push({

        scheduleId: schedule.id,

        doctorId: schedule.doctor_id,

        locationId: schedule.location_id,

        hospitalName: schedule.hospital_name,

        offlinepatient_number: schedule.offlinepatient_number,

        booking_length: Number(schedule.booking_length),

        timing: {
          start: time24To12(schedule.start_time),
          end: time24To12(schedule.end_time),
          slotDuration: Number(schedule.slot_duration),
          breakMinutes: Number(schedule.break_minutes)
        },

        availability: {
          activeDays: Array.isArray(schedule.active_days)
            ? schedule.active_days
            : [],
          startDate: formatDate(schedule.start_date),
          endDate: formatDate(schedule.end_date),
          status: schedule.status
        },

        note: schedule.note || null,

        createdAt: schedule.created_at || null,

        updatedAt: schedule.updated_at || null

      });
    }

    return {

      success: true,

      statusCode: 200,

      message: "Schedules fetched successfully.",

      pagination: {

        totalRecords,

        totalPages: Math.ceil(
          totalRecords / limit
        ),

        currentPage: page,

        limit,

        hasNextPage:
          page <
          Math.ceil(totalRecords / limit),

        hasPreviousPage:
          page > 1
      },

      count: response.length,

      data: response

    };

  } catch (error) {

    console.error(
      "Get Schedule By Doctor Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };

  }
}


async function getSchedulePublicByDoctorId(
  doctorId,
  page = 1,
  limit = 10
) {
  try {

    if (!doctorId || isNaN(Number(doctorId))) {
      return {
        success: false,
        statusCode: 400,
        message: "Valid doctorId is required."
      };
    }

    page = Math.max(1, Number(page) || 1);
    limit = Math.max(1, Math.min(100, Number(limit) || 10));

    const result = await getScheduleByDoctorId(
      Number(doctorId),
      page,
      limit
    );

    if (!result.success) {
      return result;
    }

    const publicSchedules = result.data
      .map((schedule) => {

        const activeSlots = (schedule.slots || []).filter(
          (slot) =>
            String(slot.status).toLowerCase() === "active"
        );

        return {
          scheduleId: schedule.scheduleId,

          hospitalName: schedule.hospitalName,

          offlinepatient_number:
            schedule.offlinepatient_number,

          timing: schedule.timing,

          availability: {
            activeDays: schedule.availability.activeDays,
            startDate: schedule.availability.startDate,
            endDate: schedule.availability.endDate,
            status: schedule.availability.status
          },

          totalSlots: activeSlots.length,

          slots: activeSlots
        };
      })
      .filter(
        (schedule) =>
          schedule.availability.status === "active"
      );

    return {
      success: true,
      statusCode: 200,
      message: "Public schedules fetched successfully.",
      pagination: result.pagination,
      count: publicSchedules.length,
      data: publicSchedules
    };

  } catch (error) {

    console.error(
      "Get Public Schedule Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };

  }
}

async function updateSchedule(doctorId, scheduleId, body) {
  let connection;

  try {
    if (!doctorId) {
      return {
        success: false,
        statusCode: 400,
        message: "Doctor ID is required."
      };
    }

    if (!scheduleId || isNaN(Number(scheduleId))) {
      return {
        success: false,
        statusCode: 400,
        message: "Valid schedule ID is required."
      };
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const schedules = await ScheduleModel.getScheduleByDoctor(
      doctorId,
      1000,
      0
    );

    const existing = schedules.find(
      s => Number(s.id) === Number(scheduleId)
    );

    if (!existing) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 404,
        message: "Schedule not found."
      };
    }

    const [inactiveSlots] = await connection.query(
      `
      SELECT id
      FROM schedule_slots
      WHERE doctor_id = ?
        AND schedule_id = ?
        AND LOWER(status)='inactive'
      LIMIT 1
      `,
      [doctorId, scheduleId]
    );

    if (inactiveSlots.length) {
      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message:
          "Schedule cannot be updated because it contains inactive slots."
      };
    }

    if (body.start_time) {
      body.start_time = parse12to24(body.start_time);
    }

    if (body.end_time) {
      body.end_time = parse12to24(body.end_time);
    }

    const overlap =
      await ScheduleModel.findOverlappingScheduleForUpdate({

        doctor_id: doctorId,

        schedule_id: scheduleId,

        hospital_name:
          body.hospital_name ?? existing.hospital_name,

        start_time:
          body.start_time ?? existing.start_time,

        end_time:
          body.end_time ?? existing.end_time,

        start_date:
          body.start_date ?? existing.start_date,

        end_date:
          body.end_date ?? existing.end_date
      });

    if (overlap) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 409,
        message:
          "Another schedule already exists for selected time."
      };
    }

    const updated =
      await ScheduleModel.update(
        doctorId,
        scheduleId,
        {
          location_id:
            body.location_id ?? existing.location_id,

          hospital_name:
            body.hospital_name ?? existing.hospital_name,

          start_time:
            body.start_time ?? existing.start_time,

          end_time:
            body.end_time ?? existing.end_time,

          slot_duration:
            body.slot_duration ?? existing.slot_duration,

          break_minutes:
            body.break_minutes ?? existing.break_minutes,

          active_days:
            body.active_days ?? existing.active_days,

          start_date:
            body.start_date ?? existing.start_date,

          end_date:
            body.end_date ?? existing.end_date,

          note:
            body.note ?? existing.note,

          offlinepatient_number:
            body.offlinepatient_number ??
            existing.offlinepatient_number
        }
      );

    if (!updated) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "Schedule update failed."
      };
    }

    await ScheduleModel.deleteActiveSlots(
      doctorId,
      scheduleId,
      connection
    );

    const totalSlots =
      await generateScheduleSlots(
        scheduleId,
        {
          ...existing,
          ...body,
          doctor_id: doctorId
        },
        connection
      );

    if (!totalSlots) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "No slots generated."
      };
    }

    await connection.commit();

    return {
      success: true,
      statusCode: 200,
      message: "Schedule updated successfully.",
      data: {
        scheduleId: Number(scheduleId),
        totalSlots
      }
    };

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Update Schedule Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };

  } finally {

    if (connection) {
      connection.release();
    }

  }
}


async function deleteSchedule(scheduleId, body, doctorId) {

  let connection;

  try {

    if (!doctorId) {
      return {
        success: false,
        statusCode: 400,
        message: "Doctor ID is required."
      };
    }

    if (!scheduleId || isNaN(scheduleId)) {
      return {
        success: false,
        statusCode: 400,
        message: "Valid schedule ID is required."
      };
    }

    const {
      date,
      slotId,
      reason
    } = body || {};

    connection = await db.getConnection();

    await connection.beginTransaction();

    const [schedule] = await connection.query(
      `
      SELECT id
      FROM schedules
      WHERE id = ?
        AND doctor_id = ?
      LIMIT 1
      `,
      [
        scheduleId,
        doctorId
      ]
    );

    if (!schedule.length) {

      await connection.rollback();

      return {
        success: false,
        statusCode: 404,
        message: "Schedule not found."
      };

    }

    let patients = [];

    /* =====================================================
       COMPLETE SCHEDULE DELETE
    ====================================================== */

    if (!date && !slotId) {

      const slots =
        await SlotModel.getSlotsBySchedule(
          scheduleId,
          connection
        );

      const hasBookedSlots =
        slots.some(
          slot =>
            String(slot.status).toLowerCase() === "inactive"
        );

      if (
        hasBookedSlots &&
        (!reason || !reason.trim())
      ) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 400,
          message:
            "Reason is required because booked slots exist."
        };

      }

      patients =
        await AppointmentModel.getAppointmentsBySchedule(
          scheduleId,
          connection
        );

      for (const item of patients) {

        await AppointmentModel.cancelAppointment(
          item.id,
          reason || null,
          connection
        );

      }

      await SlotModel.deleteCompleteSchedule(
        {
          doctorId,
          scheduleId
        },
        connection
      );

      await connection.commit();

      for (const patient of patients) {

        if (!patient.email) continue;

        await sendAppointmentCancelledEmail({

          email: patient.email,

          patientName: patient.patient_name,

          reason: reason || "Schedule removed",

          date: patient.slot_date,

          startTime: patient.start_time,

          endTime: patient.end_time

        });

      }

      return {

        success: true,

        statusCode: 200,

        message: "Schedule deleted successfully."

      };

    }

    /* =====================================================
       ONE DAY DELETE
    ====================================================== */

    if (date && !slotId) {

      const formattedDate =
        normalizeDateValue(date);

      const slots =
        await SlotModel.getSlotsByDate(
          scheduleId,
          formattedDate,
          connection
        );

      const hasBookedSlots =
        slots.some(
          slot =>
            String(slot.status).toLowerCase() === "inactive"
        );

      if (
        hasBookedSlots &&
        (!reason || !reason.trim())
      ) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 400,
          message:
            "Reason is required because booked slots exist."
        };

      }

      patients =
        await AppointmentModel.getAppointmentsByDate(
          scheduleId,
          formattedDate,
          connection
        );

      for (const item of patients) {

        await AppointmentModel.cancelAppointment(
          item.id,
          reason || null,
          connection
        );

      }

      await SlotModel.deleteSlotsByDate(
        {
          doctorId,
          scheduleId,
          date: formattedDate
        },
        connection
      );

      await connection.commit();

      for (const patient of patients) {

        if (!patient.email) continue;

        await sendAppointmentCancelledEmail({

          email: patient.email,

          patientName: patient.patient_name,

          reason: reason || "Schedule removed",

          date: patient.slot_date,

          startTime: patient.start_time,

          endTime: patient.end_time

        });

      }

      return {

        success: true,

        statusCode: 200,

        message: "Schedule date deleted successfully."

      };

    }

    /* =====================================================
       SINGLE SLOT DELETE
    ====================================================== */

    if (slotId) {

      const [slot] = await connection.query(
        `
        SELECT
          id,
          status,
          start_date,
          start_time,
          end_time
        FROM schedule_slots
        WHERE id = ?
          AND doctor_id = ?
          AND schedule_id = ?
        LIMIT 1
        `,
        [
          slotId,
          doctorId,
          scheduleId
        ]
      );

      if (!slot.length) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 404,
          message: "Slot not found."
        };

      }

      const isBooked =
        String(slot[0].status).toLowerCase() === "inactive";

      if (
        isBooked &&
        (!reason || !reason.trim())
      ) {

        await connection.rollback();

        return {
          success: false,
          statusCode: 400,
          message:
            "Reason is required because this slot is booked."
        };

      }

      let patient = null;

      if (isBooked) {

        patient =
          await AppointmentModel.getAppointmentBySlot(
            scheduleId,
            slot[0].start_date,
            slot[0].start_time,
            connection
          );

        if (patient) {

          await AppointmentModel.cancelAppointment(
            patient.id,
            reason,
            connection
          );

        }

      }

      await SlotModel.deleteSingleSlot(
        {
          doctorId,
          scheduleId,
          slotId
        },
        connection
      );

      await connection.commit();

      if (patient?.email) {

        await sendAppointmentCancelledEmail({

          email: patient.email,

          patientName: patient.patient_name,

          reason,

          date: patient.slot_date,

          startTime: patient.start_time,

          endTime: patient.end_time

        });

      }

      return {

        success: true,

        statusCode: 200,

        message: "Slot deleted successfully."

      };

    }

    await connection.rollback();

    return {

      success: false,

      statusCode: 400,

      message: "Invalid request."

    };

  } catch (error) {

    if (connection) {

      await connection.rollback();

    }

    console.error(
      "Delete Schedule Service Error:",
      error
    );

    return {

      success: false,

      statusCode: 500,

      message: "Internal Server Error"

    };

  } finally {

    if (connection) {

      connection.release();

    }

  }

}

async function getUserById(id) {

  const user =
    await User.findById(id);

  return user;

}


async function getHospitalNamesByDoctor(doctorId) {
  try {

    if (!doctorId) {
      return {
        success: false,
        statusCode: 400,
        message: "Doctor ID is required."
      };
    }

    const [rows] = await db.query(
      `
      SELECT hospital_detail
      FROM doctors
      WHERE user_id = ?
      LIMIT 1
      `,
      [doctorId]
    );

    if (!rows.length) {
      return {
        success: false,
        statusCode: 404,
        message: "Doctor not found."
      };
    }

    if (!rows[0].hospital_detail) {
      return {
        success: true,
        statusCode: 200,
        message: "No hospitals found.",
        count: 0,
        data: []
      };
    }

    let hospitals = [];

    try {
      hospitals =
        typeof rows[0].hospital_detail === "string"
          ? JSON.parse(rows[0].hospital_detail)
          : rows[0].hospital_detail;
    } catch (error) {
      return {
        success: false,
        statusCode: 500,
        message: "Invalid hospital detail format."
      };
    }

    if (!Array.isArray(hospitals)) {
      hospitals = [];
    }

    const uniqueHospitals = [];
    const seen = new Set();

    for (const hospital of hospitals) {

      const item = {
        hospitalName: hospital?.hospitalName || "",
        landmark: hospital?.landmark || "",
        areaLocality: hospital?.areaLocality || "",
        streetName: hospital?.streetName || "",
        city: hospital?.city || "",
        district: hospital?.district || "",
        state: hospital?.state || "",
        pinCode: hospital?.pinCode || ""
      };

      const key = JSON.stringify(item).toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        uniqueHospitals.push(item);
      }
    }

    uniqueHospitals.sort((a, b) =>
      a.hospitalName.localeCompare(b.hospitalName)
    );

    return {
      success: true,
      statusCode: 200,
      message: "Hospital list fetched successfully.",
      count: uniqueHospitals.length,
      data: uniqueHospitals
    };

  } catch (error) {

    console.error(
      "Get Hospital Names Service Error:",
      error
    );

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };

  }
}

module.exports = {
  createSchedule,
  getAllSchedules,
  getScheduleByDoctorId,
  getSchedulePublicByDoctorId,
  updateSchedule,
  deleteSchedule,
  getUserById,
  getHospitalNamesByDoctor
};