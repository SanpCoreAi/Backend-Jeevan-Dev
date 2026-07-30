const QRService = require("../../services/admin/connectQrService");

exports.connectDoctorQr = async (req, res) => {

    try {

        if (!req.user || req.user.role !== 4) {
            return res.status(403).json({
                success: false,
                message: "Only admin can connect QR Code."
            });
        }


        const doctorId = Number(req.params.doctorId);
        const { qrCodes } = req.body;

        if (!doctorId || Number.isInteger(doctorId) === false) {

            return res.status(400).json({
                success: false,
                message: "Valid doctorId is required."
            });

        }

        if (!Array.isArray(qrCodes) || qrCodes.length === 0) {

            return res.status(400).json({
                success: false,
                message: "QR Codes array is required."
            });

        }

        const uniqueQrCodes = [
            ...new Set(
                qrCodes.map(code => 
                    typeof code === "string"
                    ? code.trim()
                    : ""
                )
            )
        ];

        if (
            uniqueQrCodes.some(
                code => !code
            )
        ) {

            return res.status(400).json({
                success:false,
                message:"Invalid QR Code found."
            });

        }

        if (uniqueQrCodes.length > 50) {

            return res.status(400).json({
                success:false,
                message:"Maximum 50 QR codes can be connected at once."
            });

        }


        const result = await QRService.connectDoctorQr({

            doctorId,

            qrCodes: uniqueQrCodes,

            adminId:req.user.id

        });


        return res
            .status(result.statusCode || 200)
            .json(result);


    } catch(error) {


        console.error(
            "Connect Doctor QR Controller Error:",
            error
        );


        return res.status(500).json({

            success:false,

            message:"Internal server error."

        });

    }

};