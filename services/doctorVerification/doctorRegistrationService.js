const db = require("../../config/db");
const doctorRegistrationModel = require("../../models/doctorVerification/doctorRegistrationModel");
const { sendOtpEmail } = require("../../utils/sendEmail");

exports.createDoctorRegistration = async (body) => {

    let connection;

    try {

        connection = await db.getConnection();

        await connection.beginTransaction();

        const {
            fullName,
            gender,
            age,
            email,
            mobile,
            medicalRegistrationNumber,
            medicalCouncil,
            qualification,
            specialization,
            registrationExpiryDate
        } = body;

        // Check Email
        const emailExists = await doctorRegistrationModel.findByEmail(email, connection);

        if (emailExists) {

            await connection.rollback();

            return {
                success: false,
                statusCode: 409,
                message: "Email already exists."
            };
        }

        // Check Mobile
        const mobileExists = await doctorRegistrationModel.findByMobile(mobile, connection);

        if (mobileExists) {

            await connection.rollback();

            return {
                success: false,
                statusCode: 409,
                message: "Mobile number already exists."
            };
        }

        // Check Medical Registration Number
        const registrationExists = await doctorRegistrationModel.findByRegistrationNumber(
            medicalRegistrationNumber,
            connection
        );

        if (registrationExists) {

            await connection.rollback();

            return {
                success: false,
                statusCode: 409,
                message: "Medical registration number already exists."
            };
        }

        const registrationId = await doctorRegistrationModel.create(
            {
                fullName,
                gender,
                age,
                email,
                mobile,
                medicalRegistrationNumber,
                medicalCouncil,
                qualification,
                specialization,
                registrationExpiryDate
            },
            connection
        );

        await connection.commit();

        return {
            success: true,
            statusCode: 201,
            message: "Doctor registration created successfully.",
            data: {
                registrationId
            }
        };

    } catch (error) {

        if (connection) {
            await connection.rollback();
        }

        throw error;

    } finally {

        if (connection) {
            connection.release();
        }

    }

};

exports.getDoctorRegistrationById = async (id) => {

    const registration = await doctorRegistrationModel.findById(id);

    if (!registration) {
        return {
            success: false,
            statusCode: 404,
            message: "Doctor registration not found."
        };
    }

    return {
        success: true,
        statusCode: 200,
        message: "Doctor registration fetched successfully.",
        data: registration
    };
};

exports.getAllDoctorRegistrations = async (query) => {

    const {
        page,
        limit,
        search,
        status
    } = query;

    const offset = (page - 1) * limit;

    const registrations =
        await doctorRegistrationModel.findAll(
            {
                limit,
                offset,
                search,
                status
            }
        );

    const total =
        await doctorRegistrationModel.countAll(search, status);

    return {
        success: true,
        statusCode: 200,
        message: "Doctor registrations fetched successfully.",
        total,
        page,
        limit,
        data: registrations
    };
};

exports.updateDoctorRegistration = async (id, body) => {

    const exists =
        await doctorRegistrationModel.findById(id);

    if (!exists) {
        return {
            success: false,
            statusCode: 404,
            message: "Doctor registration not found."
        };
    }

    await doctorRegistrationModel.update(id, body);

    return {
        success: true,
        statusCode: 200,
        message: "Doctor registration updated successfully."
    };
};

exports.submitDoctorRegistration = async (id) => {

    const exists =
        await doctorRegistrationModel.findById(id);

    if (!exists) {
        return {
            success: false,
            statusCode: 404,
            message: "Doctor registration not found."
        };
    }

    await doctorRegistrationModel.submit(id);

    return {
        success: true,
        statusCode: 200,
        message: "Doctor registration submitted successfully."
    };
};

exports.deleteDoctorRegistration = async (id) => {

    const exists =
        await doctorRegistrationModel.findById(id);

    if (!exists) {
        return {
            success: false,
            statusCode: 404,
            message: "Doctor registration not found."
        };
    }

    await doctorRegistrationModel.delete(id);

    return {
        success: true,
        statusCode: 200,
        message: "Doctor registration deleted successfully."
    };
};

exports.sendEmailOtp = async ({ email }) => {

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    const exists = await doctorRegistrationModel.findByEmail(email);

    if (!exists) {

        return {
            success: false,
            statusCode: 404,
            message: "Email not found."
        };

    }

    await doctorRegistrationModel.saveEmailOtp(
        email,
        otp,
        expiry
    );

    await sendOtpEmail(email, otp);

    return {
        success: true,
        statusCode: 200,
        message: "OTP sent successfully."
    };

};

exports.verifyEmailOtp = async ({ email, otp }) => {

    const user = await doctorRegistrationModel.verifyEmailOtp(
        email,
        otp
    );

    if (!user) {

        return {
            success: false,
            statusCode: 400,
            message: "Invalid or expired OTP."
        };

    }

    await doctorRegistrationModel.markEmailVerified(email);

    return {
        success: true,
        statusCode: 200,
        message: "Email verified successfully."
    };

};