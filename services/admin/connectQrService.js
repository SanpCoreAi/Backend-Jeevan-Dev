const db = require("../../config/db");
const QRModel = require("../../models/admin/qrModel");

exports.connectDoctorQr = async ({
    doctorId,
    qrCodes
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

        const connectedQrCodes = [];

        for (const qrCode of qrCodes) {

            // QR Exists
            const qr = await QRModel.findQrCode(qrCode);

            if (!qr) {
                await connection.rollback();

                return {
                    statusCode: 404,
                    success: false,
                    message: `${qrCode} not found.`
                };
            }

            // Already Assigned
            if (qr.status !== "AVAILABLE") {
                await connection.rollback();

                return {
                    statusCode: 400,
                    success: false,
                    message: `${qrCode} is already assigned.`
                };
            }

            const qrImage = qr.qr_image;
            const qrUrl = `http://localhost:4000/api/QR/scan/${qrCode}`;

            // Update QR Status
            await QRModel.updateQrStatus(
                connection,
                qrCode,
                doctorId
            );

            // Update Doctor QR Details
            await QRModel.assignQrToDoctor(
                connection,
                doctorId,
                qrCode,
                qrImage,
                qrUrl
            );

            connectedQrCodes.push({
                qrCode,
                qrImage,
                qrUrl
            });
        }

        await connection.commit();

        return {
            statusCode: 200,
            success: true,
            message: `${connectedQrCodes.length} QR Codes connected successfully.`,
            data: {
                doctorId,
                qrCodes: connectedQrCodes
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