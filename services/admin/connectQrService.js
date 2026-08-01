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

        const doctor = await QRModel.findDoctorByUserId(
            connection,
            doctorId
        );


        if (!doctor) {

            await connection.rollback();

            return {
                statusCode:404,
                success:false,
                message:"Doctor not found."
            };

        }



        const connectedQrCodes = [];

        for (const qrCode of qrCodes) {

            const qr = await QRModel.findQrCode(
                connection,
                qrCode
            );


            if (!qr) {

                await connection.rollback();

                return {
                    statusCode:404,
                    success:false,
                    message:`QR Code ${qrCode} not found.`
                };

            }

            if (qr.status !== "AVAILABLE") {


                await connection.rollback();


                return {
                    statusCode:400,
                    success:false,
                    message:`QR Code ${qrCode} already assigned.`
                };

            }


            await QRModel.updateQrStatus(

                connection,

                qrCode,

                doctorId

            );


     await QRModel.assignQrToDoctor(
        connection,
         doctorId,
        qrCode
      );



            connectedQrCodes.push({

                qrCode:qrCode,

                qrImage:qr.qr_image

            });


        }

        await connection.commit();



        return {

            statusCode:200,

            success:true,

            message:
            `${connectedQrCodes.length} QR Codes connected successfully.`,

            data:{

                doctorId,

                connectedBy:adminId,

                qrCodes:connectedQrCodes

            }

        };



    } catch(error) {


        await connection.rollback();


        console.error(
            "Connect Doctor QR Service Error:",
            error
        );



        return {

            statusCode:500,

            success:false,

            message:"Internal server error."

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