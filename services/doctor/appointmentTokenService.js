const model = require("../../models/appointModels");
const prescriptionModel = require("../../models/prescriptionModel");
const db = require("../../config/db");


function parseJson(value, defaultValue = []) {

  if (!value) {
    return defaultValue;
  }

  if (typeof value === "object") {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return defaultValue;
  }
}


exports.verifyToken = async ({
  doctorId,
  appointmentId,
  code
}) => {

  try {

    const appointment =
      await model.getByAppointmentIdAndCode({
        doctorId,
        appointmentId,
        code
      });

    if (!appointment) {
      return {
        success: false,
        message: "Invalid appointment ID or code."
      };
    }

    if (appointment.status === "COMPLETED") {
      return {
        success: false,
        message: "Appointment already completed."
      };
    }

    if (appointment.status === "IN_PROGRESS") {
      return {
        success: false,
        message: "Appointment already in progress."
      };
    }

    if (appointment.status !== "PENDING") {
      return {
        success: false,
        message: `Appointment cannot be started because its status is ${appointment.status}.`
      };
    }

    const result =
      await model.start(
        appointment.appointment_id
      );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Failed to start appointment."
      };
    }

    appointment.status = "IN_PROGRESS";

    return {
      success: true,
      message: "Appointment started successfully.",
      data: appointment
    };

  } catch (error) {

    console.error(
      "VERIFY TOKEN SERVICE ERROR:",
      error
    );

    throw error;
  }
};

exports.start = async (appointmentId) => {

  try {

    const appointment =
      await model.getById(
        appointmentId
      );

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found."
      };
    }

    if (appointment.status === "COMPLETED") {
      return {
        success: false,
        message: "Appointment already completed."
      };
    }

    if (appointment.status === "IN_PROGRESS") {
      return {
        success: true,
        message: "Appointment already in progress."
      };
    }

    const result =
      await model.start(
        appointmentId
      );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Failed to start appointment."
      };
    }

    return {
      success: true,
      message: "Appointment started successfully."
    };

  } catch (error) {

    console.error(
      "START APPOINTMENT SERVICE ERROR:",
      error
    );

    return {
      success: false,
      message: "Internal server error."
    };

  }

};

// =============================================
// Complete Appointment
// =============================================
exports.complete = async (appointmentId) => {

  try {

    const appointment =
      await model.getById(
        appointmentId
      );

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found."
      };
    }

    if (appointment.status === "COMPLETED") {
      return {
        success: true,
        message: "Appointment already completed."
      };
    }

    if (appointment.status === "PENDING") {
      return {
        success: false,
        message: "Start appointment first."
      };
    }

    const result =
      await model.complete(
        appointmentId
      );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Failed to complete appointment."
      };
    }

    return {
      success: true,
      message: "Appointment completed successfully."
    };

  } catch (error) {

    console.error(
      "COMPLETE APPOINTMENT SERVICE ERROR:",
      error
    );

    return {
      success: false,
      message: "Internal server error."
    };

  }

};

// =============================================
// Complete Appointment By Token
// =============================================
exports.completeByToken = async (token) => {

  try {

    const appointment =
      await model.getByTokenOnly(
        token
      );

    if (!appointment) {
      return {
        success: false,
        message: "Invalid appointment token."
      };
    }

    if (appointment.status === "COMPLETED") {
      return {
        success: true,
        message: "Appointment already completed."
      };
    }

    if (appointment.status === "PENDING") {
      return {
        success: false,
        message: "Start appointment first."
      };
    }

    const result =
      await model.complete(
        appointment.appointment_id
      );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Failed to complete appointment."
      };
    }

    return {
      success: true,
      message: "Appointment completed successfully."
    };

  } catch (error) {

    console.error(
      "COMPLETE BY TOKEN SERVICE ERROR:",
      error
    );

    return {
      success: false,
      message: "Internal server error."
    };

  }

};

// =============================================
// Edit Prescription
// =============================================
exports.editPrescription = async (
  appointmentId,
  medicines
) => {

  const connection =
    await db.getConnection();

  try {

    const appointment =
      await model.getById(
        appointmentId
      );

    if (!appointment) {

      connection.release();

      return {
        success: false,
        message: "Appointment not found."
      };

    }

    if (
      appointment.status !==
      "COMPLETED"
    ) {

      connection.release();

      return {
        success: false,
        message:
          "Prescription can be edited only after appointment completion."
      };

    }

    if (!appointment.completed_at) {

      connection.release();

      return {
        success: false,
        message:
          "Appointment completion time not found."
      };

    }

    const completedAt =
      new Date(
        appointment.completed_at
      );

    const now = new Date();

    const diffMinutes =
      (now - completedAt) /
      (1000 * 60);

    if (diffMinutes > 15) {

      connection.release();

      return {
        success: false,
        message:
          "Prescription can only be edited within 15 minutes."
      };

    }

    await connection.beginTransaction();

    await prescriptionModel.deleteByAppointment(
      appointmentId,
      connection
    );

    for (const medicine of medicines) {

      await prescriptionModel.insert(
        appointmentId,
        medicine,
        null,
        null,
        null,
        connection
      );

    }

    await connection.commit();

    return {
      success: true,
      message:
        "Prescription updated successfully."
    };

  } catch (error) {

    console.error(
      "EDIT PRESCRIPTION SERVICE ERROR:",
      error
    );

    try {
      await connection.rollback();
    } catch (_) {}

    return {
      success: false,
      message:
        "Internal server error."
    };

  } finally {

    connection.release();

  }

};
// =============================================
// Get Appointment Details
// =============================================
exports.getDetails = async (
  appointmentId
) => {

  try {

    const appointment =
      await model.getById(
        appointmentId
      );

    if (!appointment) {

      return {
        success: false,
        message: "Appointment not found."
      };

    }

    const prescriptions =
      await prescriptionModel.getByAppointment(
        appointmentId,
        db
      );

    return {

      success: true,

      message:
        "Appointment details fetched successfully.",

      data: {

        appointment,

        prescriptions

      }

    };

  } catch (error) {

    console.error(
      "GET DETAILS SERVICE ERROR:",
      error
    );

    return {

      success: false,

      message:
        "Internal server error."

    };

  }

};


exports.getFullPrescription = async (
  appointmentId
) => {

  try {

    const appointment =
      await prescriptionModel.getAppointmentFullDataById(
        appointmentId
      );

    if (!appointment) {
      return {
        success: false,
        message: "Appointment not found."
      };
    }

    const medicines =
      await prescriptionModel.getPrescriptionMedicines(
        appointment.appointment_id
      );

    return {
      success: true,

      message: "Prescription fetched successfully.",

      data: {

        doctor: {

          id: appointment.doctor_id,

          name: appointment.doctor_name,

          mobile: appointment.doctor_mobile,

          qualification:
            appointment.qualification,

          specialization:
            appointment.specialization,

          medical_license_no:
            appointment.medical_license_no,

          qr_url:
            appointment.qr_url,

          hospital_detail:
            parseJson(
              appointment.hospital_detail
            ),

          availability:
            parseJson(
              appointment.availability
            )
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

          token_number:
            appointment.token_number,

          date:
            appointment.slot_date,

          start_time:
            appointment.start_time,

          end_time:
            appointment.end_time,

          status:
            appointment.status,

          hospital_name:
            appointment.hospital_name
        },


        prescription:
          medicines.length > 0
            ? {

                follow_up_date:
                  medicines[0].follow_up_date,

                remark:
                  medicines[0].remark,

                diagnosis:
                  medicines[0].diagnosis,

                medicines:
                  medicines.map((medicine) => ({

                    id:
                      medicine.id,

                    medicine_name:
                      medicine.medicine_name,

                    dose:
                      medicine.dose,

                    frequency:
                      medicine.frequency,

                    duration:
                      medicine.duration,

                    instructions:
                      medicine.instructions

                  }))
              }
            : null
      }
    };

  } catch (error) {

    console.error(
      "GET FULL PRESCRIPTION SERVICE ERROR:",
      error
    );

    return {
      success: false,
      message: "Internal server error."
    };
  }
};


exports.revisit = async (
  patientId,
  doctorId
) => {

  try {

    const appointment =
      await model.revisit(
        patientId,
        doctorId
      );

    if (!appointment) {

      return {

        success: false,

        message:
          "No previous appointment found."

      };

    }

    return {

      success: true,

      message:
        "Last appointment fetched successfully.",

      data: appointment

    };

  } catch (error) {

    console.error(
      "REVISIT SERVICE ERROR:",
      error
    );

    return {

      success: false,

      message:
        "Internal server error."

    };

  }

};

