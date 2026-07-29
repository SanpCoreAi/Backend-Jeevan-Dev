const QRModel = require("../../models/admin/qrModel");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

function generateQrCode() {

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let random = "";

    for (let i = 0; i < 8; i++) {
        random += chars.charAt(
            Math.floor(Math.random() * chars.length)
        );
    }

    return `DR-${random}`;
}

exports.generateQrCodes = async (count) => {
    try {

        const lastQr = await QRModel.getLastQrCode();

        let lastNumber = 0;

        if (lastQr?.qr_code) {
            const match = lastQr.qr_code.match(/\d+/);

            if (match) {
                lastNumber = parseInt(match[0], 10);
            }
        }

        const uploadDir = path.join(process.cwd(), "uploads", "qrcodes");

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

const qrData = [];

for (let i = 0; i < count; i++) {

    let qrCode;
    let exists = true;

    while (exists) {

        qrCode = generateQrCode();

        const qr = await QRModel.findQrCode(qrCode);

        if (!qr) {
            exists = false;
        }
    }

    const imageName = `${qrCode}.png`;
    const imagePath = `uploads/qrcodes/${imageName}`;

    await QRCode.toFile(
        path.join(uploadDir, imageName),
        qrCode
    );

    qrData.push({
        qrCode,
        imagePath
    });
}

        const result = await QRModel.bulkInsert(qrData);

        return {
            statusCode: 201,
            success: true,
            message: `${count} QR Codes generated successfully.`,
            data: {
                generated: result.affectedRows,
                firstQr: qrData[0].qrCode,
                lastQr: qrData[qrData.length - 1].qrCode
            }
        };

    } catch (error) {

        console.error("Generate QR Service Error:", error);

        return {
            statusCode: 500,
            success: false,
            message: "Failed to generate QR Codes."
        };
    }
};

exports.getAllQrCodes = async ({
    page,
    limit,
    status
}) => {

    try {

        const offset = (page - 1) * limit;

        const { rows, total } = await QRModel.getAllQrCodes({
            limit,
            offset,
            status
        });

        return {
            statusCode: 200,
            success: true,
            message: "QR Codes fetched successfully.",
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

    } catch (error) {

        console.error("Get QR Service Error:", error);

        return {
            statusCode: 500,
            success: false,
            message: "Failed to fetch QR Codes."
        };

    }
};

exports.getDoctorQrCodes = async (doctorId) => {

    try {

        const qrCodes = await QRModel.getDoctorQrCodes(doctorId);

        return {
            statusCode: 200,
            success: true,
            message: "Doctor QR Codes fetched successfully.",
            data: qrCodes
        };

    } catch (error) {

        console.error("Get Doctor QR Service Error:", error);

        return {
            statusCode: 500,
            success: false,
            message: "Failed to fetch doctor QR Codes."
        };

    }
};

exports.getAllQrDetails = async ({
    page,
    limit,
    status
}) => {

    try {

        const offset = (page - 1) * limit;

        const { rows, total } = await QRModel.getAllQrDetails({
            limit,
            offset,
            status
        });

        return {
            statusCode: 200,
            success: true,
            message: "QR details fetched successfully.",
            data: rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

    } catch (error) {

        console.error("Get QR Details Service Error:", error);

        return {
            statusCode: 500,
            success: false,
            message: "Failed to fetch QR details."
        };

    }
};