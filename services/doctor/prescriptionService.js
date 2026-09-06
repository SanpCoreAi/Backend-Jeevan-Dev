const db = require("../../config/db");
const model = require("../../models/prescriptionModel");
const appointmentModel = require("../../models/appointModels");
const AppError = require("../../utils/appError");
const notificationService = require("../notification/notificationService");

exports.save = async ({
  appointmentId,
  medicines,
  remark = null,
  followUpDate = null,
  diagnosis = null
}) => {
  if (!appointmentId) {
    return {
      statusCode: 400,
      success: false,
      message: "Appointment ID is required.",
      data: null
    };
  }

  if (
    !Array.isArray(medicines) ||
    medicines.length === 0
  ) {
    return {
      statusCode: 400,
      success: false,
      message: "At least one medicine is required.",
      data: null
    };
  }

  for (const medicine of medicines) {
    if (!medicine || !medicine.medicine_name) {
      return {
        statusCode: 400,
        success: false,
        message: "Medicine name is required.",
        data: null
      };
    }
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const appointment =
      await appointmentModel.getByIdForUpdate(
        appointmentId,
        connection
      );

    if (!appointment) {
      await connection.rollback();

      return {
        statusCode: 404,
        success: false,
        message: "Appointment not found.",
        data: null
      };
    }

    if (appointment.status === "COMPLETED") {
      await connection.rollback();

      return {
        statusCode: 400,
        success: false,
        message: "Appointment already completed.",
        data: null
      };
    }

    if (appointment.status === "PENDING") {
      const started = await appointmentModel.start(
        appointmentId,
        connection
      );

      if (started.affectedRows === 0) {
        await connection.rollback();

        return {
          statusCode: 400,
          success: false,
          message: "Appointment could not be started.",
          data: null
        };
      }

      appointment.status = "IN_PROGRESS";
    }

    if (appointment.status !== "IN_PROGRESS") {
      await connection.rollback();

      return {
        statusCode: 400,
        success: false,
        message:
          "Appointment must be in progress before saving prescription.",
        data: null
      };
    }

    await model.deleteByAppointment(
      appointmentId,
      connection
    );

    for (const medicine of medicines) {
      await model.insert(
        appointmentId,
        medicine,
        remark,
        followUpDate,
        diagnosis,
        connection
      );
    }

    const completed =
      await appointmentModel.completeAppointment(
        appointmentId,
        connection
      );

    if (!completed) {
      await connection.rollback();

      return {
        statusCode: 500,
        success: false,
        message: "Failed to complete appointment.",
        data: null
      };
    }

    await connection.commit();

    try {
      await notificationService.createNotification({
        userId: appointment.patient_id,
        title: "Prescription Uploaded",
        message:
          "Your prescription has been uploaded successfully.",
        type: "SUCCESS",
        createdBy: appointment.doctor_id
      });
    } catch (notificationError) {
      console.error(
        "PRESCRIPTION NOTIFICATION ERROR:",
        notificationError
      );
    }

    return {
      statusCode: 200,
      success: true,
      message:
        "Prescription saved and appointment completed successfully.",
      data: {
        appointmentId: Number(appointmentId),
        status: "COMPLETED"
      }
    };
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error(
        "PRESCRIPTION ROLLBACK ERROR:",
        rollbackError
      );
    }

    console.error(
      "SAVE PRESCRIPTION SERVICE ERROR:",
      error
    );

    return {
      statusCode: 500,
      success: false,
      message: "Internal Server Error.",
      data: null
    };
  } finally {
    connection.release();
  }
};

exports.update = async (
  appointmentId,
  medicines,
  remark,
  followUpDate,
  diagnosis
) => {
  const appointment = await appointmentModel.getById(appointmentId);

  if (!appointment) {
    return {
      statusCode: 404,
      success: false,
      message: "Appointment not found.",
      data: null
    };
  }

  if (
    appointment.status !== "IN_PROGRESS" &&
    appointment.status !== "COMPLETED"
  ) {
    return {
      statusCode: 400,
      success: false,
      message:
        "Prescription can only be updated for in-progress or completed appointments.",
      data: null
    };
  }

  const appointmentDate = new Date(appointment.slot_date);
  const today = new Date();

  appointmentDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  if (appointmentDate.getTime() !== today.getTime()) {
    return {
      statusCode: 400,
      success: false,
      message:
        "Prescription can only be updated for today's appointment.",
      data: null
    };
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    await model.deleteByAppointment(appointmentId, conn);

    for (const med of medicines) {
      await model.insert(
        appointmentId,
        med,
        remark,
        followUpDate,
        diagnosis,
        conn
      );
    }

    await conn.commit();

    try {
      await notificationService.createNotification({
        userId: appointment.patient_id,
        title: "Prescription Updated",
        message: "Your prescription has been updated successfully.",
        type: "INFO",
        createdBy: appointment.doctor_id
      });
    } catch (notificationError) {
      console.error(
        "UPDATE PRESCRIPTION NOTIFICATION ERROR:",
        notificationError
      );
    }

    return {
      statusCode: 200,
      success: true,
      message: "Prescription updated successfully.",
      data: {
        appointmentId: Number(appointmentId),
        status: appointment.status
      }
    };
  } catch (error) {
    try {
      await conn.rollback();
    } catch (rollbackError) {
      console.error(
        "PRESCRIPTION UPDATE ROLLBACK ERROR:",
        rollbackError
      );
    }

    console.error("UPDATE PRESCRIPTION SERVICE ERROR:", error);

    return {
      statusCode: 500,
      success: false,
      message: "Internal Server Error.",
      data: null
    };
  } finally {
    conn.release();
  }
};