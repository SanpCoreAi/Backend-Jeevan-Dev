const db = require("../../config/db");
const QRModel = require("../../models/admin/qrModel");


exports.connectDoctorQr = async ({
  doctorId,
  qrCodes,
  adminId
}) => {

  const connection = await db.getConnection();

  try {

    await connection.beginTransaction();

    if (!Array.isArray(qrCodes) || qrCodes.length === 0) {

      await connection.rollback();

      return {
        statusCode: 400,
        success: false,
        message: "At least one QR Code is required."
      };
    }

    // Get doctor details from doctors table
    const doctor = await QRModel.findDoctorByUserId(
      connection,
      doctorId
    );

    if (!doctor) {

      await connection.rollback();

      return {
        statusCode: 404,
        success: false,
        message: "Doctor not found."
      };
    }

    // Hospital details automatically taken from doctor table
    const hospitalDetail = doctor.hospital_detail;

    if (
      hospitalDetail === null ||
      hospitalDetail === undefined
    ) {

      await connection.rollback();

      return {
        statusCode: 400,
        success: false,
        message: "Hospital details not found for this doctor."
      };
    }

    const connectedQrCodes = [];
    const alreadyConnectedQrCodes = [];

    for (const qrCode of qrCodes) {

      if (!qrCode || typeof qrCode !== "string") {

        await connection.rollback();

        return {
          statusCode: 400,
          success: false,
          message: "Invalid QR Code."
        };
      }

      const qr = await QRModel.findQrCode(
        connection,
        qrCode
      );

      if (!qr) {

        await connection.rollback();

        return {
          statusCode: 404,
          success: false,
          message: `QR Code ${qrCode} not found.`
        };
      }

      // QR already assigned
      if (qr.status === "ASSIGNED") {

        if (
          Number(qr.doctor_user_id) ===
          Number(doctorId)
        ) {

          alreadyConnectedQrCodes.push({
            qrCode: qr.qr_code,
            qrUrl:
              `${process.env.FRONTEND_URL}/scan/${qr.qr_code}`,
            qrImage: qr.qr_image
          });

          continue;
        }

        await connection.rollback();

        return {
          statusCode: 400,
          success: false,
          message:
            `QR Code ${qrCode} is already assigned to another doctor.`
        };
      }

      // QR should be AVAILABLE
      if (qr.status !== "AVAILABLE") {

        await connection.rollback();

        return {
          statusCode: 400,
          success: false,
          message:
            `QR Code ${qrCode} cannot be assigned. Current status: ${qr.status}`
        };
      }

      // Assign QR
      const result = await QRModel.assignQrToDoctor(
        connection,
        doctorId,
        qrCode,
        hospitalDetail
      );

      if (result.affectedRows === 0) {

        await connection.rollback();

        return {
          statusCode: 400,
          success: false,
          message:
            `Unable to assign QR Code ${qrCode}.`
        };
      }

      const qrUrl =
        `${process.env.FRONTEND_URL}/scan/${qr.qr_code}`;

      connectedQrCodes.push({
        qrCode: qr.qr_code,
        qrUrl,
        qrImage: qr.qr_image
      });
    }

    const allDoctorQrCodes = [
      ...connectedQrCodes,
      ...alreadyConnectedQrCodes
    ];

    const qrCodeList = allDoctorQrCodes.map(
      item => item.qrCode
    );

    const qrUrlList = allDoctorQrCodes.map(
      item => item.qrUrl
    );

    await QRModel.updateDoctorQrData(
      connection,
      doctorId,
      qrCodeList,
      qrUrlList
    );

    await connection.commit();

    return {
      statusCode: 200,

      success: true,

      message:
        connectedQrCodes.length > 0
          ? `${connectedQrCodes.length} new QR Codes connected successfully.`
          : "QR Codes are already connected with this doctor.",

      data: {
        doctorId,
        connectedBy: adminId,
        newlyConnected: connectedQrCodes,
        alreadyConnected: alreadyConnectedQrCodes,
        totalQrCodes: allDoctorQrCodes.length
      }
    };

  } catch (error) {

    await connection.rollback();

    console.error(
      "Connect Doctor QR Service Error:",
      error
    );

    return {
      statusCode: 500,
      success: false,
      message: "Internal server error."
    };

  } finally {

    connection.release();
  }
};

exports.scanQr = async ({ user, qrCode }) => {

    if (!user?.id) {
        return {
            statusCode: 401,
            body: {
                success: false,
                message: "Unauthorized user."
            }
        };
    }

    const doctor = await QRModel.findDoctorByQr(qrCode);

    if (!doctor) {
        return {
            statusCode: 404,
            body: {
                success: false,
                message: "Invalid QR Code."
            }
        };
    }

    const hospitals = await QRModel.getDoctorHospitals(
        doctor.doctor_id
    );

    return {
        statusCode: 200,
        body: {
            success: true,
            message: "Doctor found successfully.",
            data: {
                doctorId: doctor.doctor_id,
                doctorUserId: doctor.doctor_user_id,
                doctorName: doctor.doctor_name,
                specialization: doctor.specialization,
                profileImage: doctor.profile_image,
                hospitals
            }
        }
    };
};

exports.changeDoctorStatus = async (doctorId) => {

    const doctor =
        await QRModel.findByUserId(doctorId);

    if (!doctor) {
        return {
            success: false,
            statusCode: 404,
            message: "Doctor not found."
        };
    }

    const newStatus =
        doctor.status === "ACTIVE"
            ? "INACTIVE"
            : "ACTIVE";

    await QRModel.updateStatus(
        doctorId,
        newStatus
    );

    return {
        success: true,
        statusCode: 200,
        message: `Doctor ${newStatus.toLowerCase()} successfully.`
    };

};