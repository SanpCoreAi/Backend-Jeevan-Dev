const ScheduleModel = require("../../models/schedule");
const SlotModel = require("../../models/slot");
const User = require("../../models/usermodel");
const db = require("../../config/db");
const {parse12to24,generateSlots12,time24To12} = require("../../utils/timeHelper");

async function generateScheduleSlots(scheduleId, payload) {
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

  const startDate = payload.start_date ? new Date(payload.start_date) : null;
  const endDate = payload.end_date ? new Date(payload.end_date) : null;
  const activeDays = Array.isArray(payload.active_days) ? payload.active_days : [];

  if (!startDate || !endDate || Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  const slotRows = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][currentDate.getDay()];

    if (activeDays.includes(dayName)) {
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

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (!slotRows.length) {
    return 0;
  }

  await SlotModel.insertSlots(slotRows);
  return slotRows.length;
}

async function createSchedule(doctorId, body) {
  try {

    if (!body.start_time || !body.end_time) {
      return {
        success: false,
        statusCode: 400,
        message: "start_time and end_time are required"
      };
    }

    if (!body.slot_duration || body.slot_duration <= 0) {
      return {
        success: false,
        statusCode: 400,
        message: "slot_duration must be greater than 0"
      };
    }

    const start24 = parse12to24(body.start_time);
    const end24 = parse12to24(body.end_time);

    if (!start24 || !end24) {
      return {
        success: false,
        statusCode: 400,
        message: "Invalid time format"
      };
    }

    if (start24 >= end24) {
      const s = body.start_date ? new Date(body.start_date) : null;
      const e = body.end_date ? new Date(body.end_date) : null;

      if (!(s && e && s < e)) {
        return {
          success: false,
          statusCode: 400,
          message: "End time must be greater than start time"
        };
      }
    }

    const isDuplicate = await ScheduleModel.findOverlappingSchedule({
      doctor_id: doctorId,
      hospital_name: body.hospital_name ?? null,
      start_time: start24,
      end_time: end24,
      start_date: body.start_date,
      end_date: body.end_date
    });

    if (isDuplicate) {
      return {
        success: false,
        statusCode: 409,
        message: "Schedule already exists for this hospital & time"
      };
    }

    const scheduleId = await ScheduleModel.createSchedule({
      doctor_id: doctorId,
      location_id: body.location_id ?? null,
      hospital_name: body.hospital_name ?? null,
      start_time: start24,
      end_time: end24,
      slot_duration: body.slot_duration,
      break_minutes: body.break_minutes ?? 0,
      active_days: body.active_days || [],
      start_date: body.start_date,
      end_date: body.end_date,
      note: body.note ?? null,
      offlinepatient_number: body.offlinepatient_number ?? null
    });

    const totalSlots = await generateScheduleSlots(scheduleId, {
      doctor_id: doctorId,
      start_time: start24,
      end_time: end24,
      slot_duration: body.slot_duration,
      break_minutes: body.break_minutes || 0,
      start_date: body.start_date,
      end_date: body.end_date,
      active_days: body.active_days || []
    });

    if (!totalSlots) {
      return {
        success: false,
        statusCode: 400,
        message: "No slots generated"
      };
    }

    return {
      success: true,
      message: "Schedule created successfully",
      data: {
        scheduleId,
        totalSlots
      }
    };

  } catch (err) {
    return {
      success: false,
      statusCode: 500,
      message: err.message || "Schedule creation failed"
    };
  }
}


async function getAllSchedules(doctorId) {
  const schedules = await ScheduleModel.getAllByDoctor(doctorId);

  return {
    success: true,
    data: schedules.map(s => ({
      ...s,
      start_time: time24To12(s.start_time),
      end_time: time24To12(s.end_time),
      slots: generateSlots12(
        s.start_time,
        s.end_time,
        s.slot_duration,
        s.break_minutes
      )
    }))
  };
}


async function getScheduleByDoctorId(doctorId) {
  const schedules = await ScheduleModel.getScheduleByDoctor(doctorId);

  if (!schedules.length) {
    return {
      success: false,
      message: "No schedules found"
    };
  }

  const finalData = [];

  for (const s of schedules) {
    const slotsFromDB = await ScheduleModel.getSlotsByScheduleId(s.id);

    const formattedSlots = slotsFromDB.map(slot => ({
      start: time24To12(slot.start_time),
      end: time24To12(slot.end_time),
      status: slot.status,
      date: slot.start_date
    }));

    const scheduleStatus = formattedSlots.some(slot => slot.status === 'active') ? 'active' : 'inactive';

    finalData.push({
      scheduleId: s.id,
      doctorId: s.doctor_id,
      hospitalName: s.hospital_name,
      offlinepatient_number: s.offlinepatient_number,

      timing: {
        start: time24To12(s.start_time),
        end: time24To12(s.end_time),
        slotDuration: s.slot_duration,
        breakMinutes: s.break_minutes
      },

      availability: {
        activeDays: s.active_days,
        startDate: s.start_date,
        endDate: s.end_date,
        status: scheduleStatus
      },

      slots: formattedSlots
    });
  }

  return {
    success: true,
    count: finalData.length,
    data: finalData
  };
}


async function getSchedulePublicByDoctorId(doctorId) {
  return getScheduleByDoctorId(doctorId);
}

async function updateSchedule(doctorId, scheduleId, body) {
  try {

    if (!scheduleId) {
      return {
        success: false,
        statusCode: 400,
        message: "Schedule ID is required."
      };
    }

    const schedules = await ScheduleModel.getScheduleByDoctor(doctorId);

    const existing = schedules.find(
      schedule => Number(schedule.id) === Number(scheduleId)
    );

    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        message: "Schedule not found."
      };
    }

    const [inactiveSlots] = await db.query(
      `
      SELECT id
      FROM schedule_slots
      WHERE doctor_id = ?
        AND schedule_id = ?
        AND LOWER(status) = 'inactive'
      LIMIT 1
      `,
      [
        doctorId,
        scheduleId
      ]
    );

    if (inactiveSlots.length > 0) {
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

    const isOverlap =
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

    if (isOverlap) {
      return {
        success: false,
        statusCode: 409,
        message:
          "Another schedule already exists for the selected time."
      };
    }

    const updated = await ScheduleModel.update(
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
          body.note ?? existing.note
      }
    );

    if (!updated) {
      return {
        success: false,
        statusCode: 400,
        message: "Schedule update failed."
      };
    }

    await ScheduleModel.deleteActiveSlots(
      doctorId,
      scheduleId
    );

    const totalSlots = await generateScheduleSlots(
      scheduleId,
      {
        ...existing,
        ...body
      }
    );


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

    console.error("Update Schedule Service Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: error.message || "Internal Server Error"
    };
  }
}


async function deleteSchedule(scheduleId, body, doctorId) {
  try {
    if (!scheduleId) {
      return {
        success: false,
        statusCode: 400,
        message: "Schedule ID is required."
      };
    }

    const { date, slotId } = body || {};

    const [schedule] = await db.query(
      `
      SELECT id
      FROM schedules
      WHERE id = ?
        AND doctor_id = ?
      LIMIT 1
      `,
      [scheduleId, doctorId]
    );

    if (schedule.length === 0) {
      return {
        success: false,
        statusCode: 404,
        message: "Schedule not found."
      };
    }

    if (!date && !slotId) {

      const [inactiveSlots] = await db.query(
        `
        SELECT id
        FROM schedule_slots
        WHERE doctor_id = ?
          AND schedule_id = ?
          AND LOWER(status) = 'inactive'
        LIMIT 1
        `,
        [doctorId, scheduleId]
      );

      if (inactiveSlots.length > 0) {
        return {
          success: false,
          statusCode: 400,
          message:
            "Schedule cannot be deleted because it contains inactive slots."
        };
      }

      const result = await SlotModel.deleteCompleteSchedule({
        doctorId,
        scheduleId
      });

      if (result.affectedRows === 0) {
        return {
          success: false,
          statusCode: 400,
          message: "Schedule deletion failed."
        };
      }

      return {
        success: true,
        statusCode: 200,
        message: "Schedule deleted successfully.",
        deleted: result.affectedRows
      };
    }

    if (date && !slotId) {

      const targetDate = new Date(date);

      if (isNaN(targetDate.getTime())) {
        return {
          success: false,
          statusCode: 400,
          message: "Invalid date."
        };
      }

      const dateStr = targetDate.toISOString().slice(0, 10);

      const [activeSlots] = await db.query(
        `
        SELECT id
        FROM schedule_slots
        WHERE doctor_id = ?
          AND schedule_id = ?
          AND DATE(start_date) = ?
          AND LOWER(status) = 'active'
        `,
        [doctorId, scheduleId, dateStr]
      );

      if (activeSlots.length === 0) {
        return {
          success: false,
          statusCode: 404,
          message: "No active slots found for selected date."
        };
      }

    const [inactive] = await db.query(
  `
    SELECT COUNT(*) AS total
  FROM schedule_slots
  WHERE doctor_id = ?
    AND schedule_id = ?
    AND DATE(start_date) = ?
    AND LOWER(status) = 'inactive'
  `,
  [doctorId, scheduleId, dateStr]
);

const skippedInactiveSlots = inactive[0].total;

    const result = await SlotModel.deleteSlotsByDate({
      doctorId,
     scheduleId,
    date: dateStr
  });

return {
  success: true,
  statusCode: 200,
  message: "Date slots deleted successfully.",
  deletedSlots: result.affectedRows,
  skippedInactiveSlots
};
    }

if (slotId) {

  const [slot] = await db.query(
    `
    SELECT id, status
    FROM schedule_slots
    WHERE id = ?
      AND doctor_id = ?
      AND schedule_id = ?
    LIMIT 1
    `,
    [slotId, doctorId, scheduleId]
  );

  if (slot.length === 0) {
    return {
      success: false,
      statusCode: 404,
      message: "Slot not found."
    };
  }

  if (slot[0].status.toLowerCase() === "inactive") {
    return {
      success: false,
      statusCode: 400,
      message: "Inactive slot cannot be deleted."
    };
  }

  const result = await SlotModel.deleteSingleSlot({
    doctorId,
    scheduleId,
    slotId
  });

  if (result.affectedRows === 0) {
    return {
      success: false,
      statusCode: 400,
      message: "Slot deletion failed."
    };
  }

  return {
    success: true,
    statusCode: 200,
    message: "Slot deleted successfully.",
    deletedSlots: result.affectedRows
  };
}

    return {
      success: false,
      statusCode: 400,
      message: "Invalid request."
    };

  } catch (error) {
    console.error("Delete Schedule Service Error:", error);

    return {
      success: false,
      statusCode: 500,
      message: "Internal Server Error"
    };
  }
}


async function getUserById(id){

  const user =
    await User.findById(id);

  return user;

}


async function getHospitalNamesByDoctor(doctorId) {

  const [rows] = await db.query(
    `
    SELECT hospital_detail 
    FROM doctors 
    WHERE user_id = ?
    `,
    [doctorId]
  );


  if (!rows.length || !rows[0].hospital_detail) {

    return {
      success:true,
      data:[]
    };

  }


  let hospitals;

  try {

    hospitals =
      JSON.parse(
        rows[0].hospital_detail
      );

  } catch {

    return {
      success:true,
      data:[]
    };

  }



  return {

    success:true,

    data:
      hospitals.map(h => ({

        hospitalName:
          h.hospitalName || "",

        landmark:
          h.landmark || "",

        city:
          h.city || "",

        state:
          h.state || ""

      }))

  };

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