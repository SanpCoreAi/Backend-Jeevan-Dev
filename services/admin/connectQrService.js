const db = require("../../config/db");
const QRModel = require("../../models/admin/qrModel");

exports.connectDoctorQr = async ({
    doctorId,
    qrCode
}) => {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        // Doctor Check
        const doctor = await QRModel.findDoctorByUserId(doctorId);

        if (!doctor) {
            await connection.rollback();

            return {
                statusCode: 404,
                success: false,
                message: "Doctor not found."
            };
        }

        if (doctor.qr_code) {
            await connection.rollback();

            return {
                statusCode: 400,
                success: false,
                message: "QR Code already connected with this doctor."
            };
        }

        // QR Check
        const qr = await QRModel.findQrCode(qrCode);

        if (!qr) {
            await connection.rollback();

            return {
                statusCode: 404,
                success: false,
                message: "QR Code not found."
            };
        }

        if (qr.status !== "AVAILABLE") {
            await connection.rollback();

            return {
                statusCode: 400,
                success: false,
                message: "QR Code is already assigned."
            };
        }

        const qrImage = qr.qr_image;
        const qrUrl = `http://localhost:4000/api/QR/scan/${qrCode}`;

        // Update Doctor
        await QRModel.assignQrToDoctor(
            connection,
            doctorId,
            qrCode,
            qrImage,
            qrUrl
        );

        // Update QR Status
        await QRModel.updateQrStatus(
            connection,
            qrCode,
            doctorId
        );

        await connection.commit();

        return {
            statusCode: 200,
            success: true,
            message: "QR Code connected successfully.",
            data: {
                doctorId,
                qrCode,
                qrImage,
                qrUrl
            }
        };

    } catch (error) {

        await connection.rollback();

        console.error("Connect QR Service Error:", error);

        return {
            statusCode: 500,
            success: false,
            message: "Internal server error."
        };

    } finally {

        connection.release();

    }
};