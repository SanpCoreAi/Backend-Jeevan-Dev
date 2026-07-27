const QRModel = require("../../models/admin/qrModel");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

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

        for (let i = 1; i <= count; i++) {

            lastNumber++;

            const qrCode = `QR${String(lastNumber).padStart(6, "0")}`;

            const imageName = `${qrCode}.png`;

            const imagePath = `uploads/qrcodes/${imageName}`;

            // QR Image Generate
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