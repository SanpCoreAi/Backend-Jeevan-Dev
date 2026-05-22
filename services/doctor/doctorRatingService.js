const DoctorRatingModel = require("../../models/doctorRatingModel");

class DoctorRatingService {

  static parseValue(value, fallback) {
    if (!value) return fallback;

    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value.split(",").map(v => v.trim());
      }
    }
    return value;
  }

  static async getDoctorProfileWithRating(doctorId) {

    if (!doctorId) {
      return {
        status: 400,
        success: false,
        message: "doctorId is required"
      };
    }

    const doctor = await DoctorRatingModel.getDoctorWithRating(doctorId);

    if (!doctor) {
      return {
        status: 404,
        success: false,
        message: "Doctor not found"
      };
    }

    // Handle QR code URL formatting
    const BASE_FILE_URL = "http://localhost:4000/uploads";
    let qrUrl = null;
    if (doctor.qr_code) {
      if (doctor.qr_code.startsWith('data:') || doctor.qr_code.startsWith('http')) {
        qrUrl = doctor.qr_code;
      } else {
        qrUrl = `${BASE_FILE_URL}/qr/${doctor.qr_code}`;
      }
    }

    return {
      status: 200,
      success: true,
      data: {
        id: doctor.id,
        username: doctor.username,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        language: this.parseValue(doctor.language, []),
        consultationFee: doctor.consultation_fee,
        medicalLicenseNo: doctor.medical_license_no,
        bio: doctor.bio,
        availability: this.parseValue(doctor.availability, []),
        hospitalDetail: this.parseValue(doctor.hospital_detail, {}),
        totalRatings: Number(doctor.total_ratings) || 0,
        averageRating: doctor.avg_rating ? Number(doctor.avg_rating) : 0,
        qr_code: qrUrl
      }
    };
  }
}

module.exports = DoctorRatingService;
