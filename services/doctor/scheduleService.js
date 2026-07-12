const ScheduleModel = require("../../models/schedule");
const SlotModel = require("../../models/slot");
const User = require("../../models/usermodel");
const db = require("../../config/db");
const {parse12to24,generateSlots12,time24To12} = require("../../utils/timeHelper");

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

    const slots = generateSlots12(
      start24,
      end24,
      body.slot_duration,
      body.break_minutes || 0
    );

    if (!slots.length) {
      return {
        success: false,
        statusCode: 400,
        message: "No slots generated"
      };
    }

    const startDate = new Date(body.start_date);
    const endDate = new Date(body.end_date);
    const activeDays = body.active_days || [];

    const slotRows = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][currentDate.getDay()];

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

    await SlotModel.insertSlots(slotRows);

    return {
      success: true,
      message: "Schedule created successfully",
      data: {
        scheduleId,
        totalSlots: slotRows.length
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

    // determine overall schedule status based on slots stored in DB
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

    const oldSchedules = await ScheduleModel.getScheduleByDoctor(doctorId);
    const existing = oldSchedules.find(s => s.id == scheduleId);

    if (!existing) {
      return {
        success: false,
        statusCode: 404,
        message: "Schedule not found"
      };
    }

    if (
      body.hospital_name &&
      body.hospital_name !== existing.hospital_name
    ) {
      return await createSchedule(doctorId, body);
    }

    if (body.start_time) body.start_time = parse12to24(body.start_time);
    if (body.end_time) body.end_time = parse12to24(body.end_time);

    const updated = await ScheduleModel.update(
      doctorId,
      scheduleId,
      body
    );

    if (!updated) {
      return {
        success: false,
        statusCode: 400,
        message: "Update failed"
      };
    }

    return getAllSchedules(doctorId);

  } catch (err) {
    return {
      success: false,
      statusCode: 500,
      message: err.message || "Update failed"
    };
  }
}


async function deleteSchedule(id, doctorId) {

const [rows] = await db.query(
  `SELECT COUNT(*) AS cnt
   FROM appointments
   WHERE schedule_id = ?
   AND status = 'ACTIVE'`,
  [id]
);

if (rows[0].cnt > 0) {
  return {
    success: false,
    statusCode: 400,
    message: "Cannot delete schedule because there are active appointments."
  };
}

  const deleted = await ScheduleModel.remove(id, doctorId);

  if (!deleted) {
    return {
      success: false,
      statusCode: 404,
      message: "Schedule not found."
    };
  }

  return {
    success: true,
    message: "Schedule deleted successfully."
  };
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