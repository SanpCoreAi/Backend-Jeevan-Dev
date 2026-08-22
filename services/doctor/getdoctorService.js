require("dotenv").config();

const { findAllWithUsers } = require("../../models/doctorModel");
const safeParse = require("../../utils/safeJson");

const S3_BASE_URL =
  process.env.AWS_S3_BUCKET_URL ||
  process.env.APP_BASE_URL ||
  "";

const normalize = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

exports.searchDoctorService = async (filters = {}) => {
  try {

    let {
      search = "",
      page = 1,
      limit = 10,
      sortBy = "experience",
      order = "desc"
    } = filters;

    page = Math.max(1, Number(page) || 1);
    limit = Math.min(50, Math.max(1, Number(limit) || 10));

    const offset = (page - 1) * limit;

    const allowedSort = [
      "experience",
      "consultationFee",
      "avgRating",
      "fullName"
    ];

    if (!allowedSort.includes(sortBy)) {
      sortBy = "experience";
    }

    order =
      String(order).toLowerCase() === "asc"
        ? "asc"
        : "desc";

    let doctors = await findAllWithUsers();

    doctors = doctors.map((doctor) => {

      const language =
        safeParse(doctor.language, []);

      const hospitalDetail =
        safeParse(doctor.hospital_detail, []);

      const images =
        safeParse(doctor.images, []);

      return {

        userId: doctor.user_id,

        fullName:
          doctor.user_full_name || "",

        email:
          doctor.user_email || "",

        phoneNumber:
          doctor.user_phone_number || "",

        username:
          doctor.username || "",

        specialization:
          doctor.specialization || "",

        qualification:
          doctor.qualification || "",

        medicalLicense:
          doctor.medical_license_no || "",

        bio:
          doctor.bio || "",

        experience:
          Number(doctor.experience) || 0,

        consultationFee:
          Number(doctor.consultation_fee) || 0,

        avgRating:
          Number(doctor.avg_rating) || 0,

        totalFeedbacks:
          Number(doctor.total_feedbacks) || 0,

        totalRatings:
          Number(doctor.total_ratings) || 0,

        positiveFeedbacks:
          Number(doctor.positive_feedbacks) || 0,

        negativeFeedbacks:
          Number(doctor.negative_feedbacks) || 0,

        language,

        hospitalDetail,

        images
      };

    });

    if (search.trim()) {
      const words =
        normalize(search).split(" ");
      doctors = doctors.filter((doctor) => {

        const hospitalNames =
          doctor.hospitalDetail.map(x =>
            normalize(x.hospitalName)
          );

        const streetNames =
          doctor.hospitalDetail.map(x =>
            normalize(x.streetName)
          );

        const areaLocalities =
          doctor.hospitalDetail.map(x =>
            normalize(x.areaLocality)
          );

        const hospitalCities =
          doctor.hospitalDetail.map(x =>
            normalize(x.city)
          );

        const hospitalStates =
          doctor.hospitalDetail.map(x =>
            normalize(x.state)
          );

        const hospitalDistricts =
          doctor.hospitalDetail.map(x =>
            normalize(x.district)
          );

        const hospitalPinCodes =
          doctor.hospitalDetail.map(x =>
            normalize(x.pinCode)
          );

        const hospitalLandmarks =
          doctor.hospitalDetail.map(x =>
            normalize(x.landmark)
          );

        const languages =
          doctor.language.map(normalize);

        const searchable = [

          normalize(doctor.fullName),

          normalize(doctor.username),

          normalize(doctor.specialization),

          normalize(doctor.qualification),

          normalize(doctor.medicalLicense),

          ...hospitalNames,

          ...streetNames,

          ...areaLocalities,

          ...hospitalCities,

          ...hospitalStates,

          ...hospitalDistricts,

          ...hospitalPinCodes,

          ...hospitalLandmarks,

          ...languages

        ];

        return words.every(word =>
          searchable.some(field =>
            field.includes(word)
          )
        );

      });

    }

    const seen = new Set();

    doctors = doctors.filter((doctor) => {

      if (seen.has(doctor.userId)) {
        return false;
      }

      seen.add(doctor.userId);

      return true;

    });

    doctors.sort((a, b) => {

      switch (sortBy) {

        case "experience":

          return order === "asc"
            ? a.experience - b.experience
            : b.experience - a.experience;

        case "consultationFee":

          return order === "asc"
            ? a.consultationFee - b.consultationFee
            : b.consultationFee - a.consultationFee;

        case "avgRating":

          return order === "asc"
            ? a.avgRating - b.avgRating
            : b.avgRating - a.avgRating;

        default:

          return order === "asc"
            ? a.fullName.localeCompare(
                b.fullName
              )
            : b.fullName.localeCompare(
                a.fullName
              );
      }

    });

    const paginated =
      doctors.slice(offset, offset + limit);

    return {

      success: true,

      statusCode: 200,

      message:
        paginated.length
          ? "Doctors fetched successfully."
          : "No doctors found.",

      total: doctors.length,

      page,

      limit,

      data: paginated.map(doctor => ({

        ...doctor,

        avgRating:
          doctor.avgRating.toFixed(1),

        profileImage:

          doctor.images?.length
            ? `${S3_BASE_URL}/${encodeURI(
                doctor.images[0].fileKey
              )}`
            : null

      }))

    };

  } catch (error) {

    console.error(
      "SEARCH DOCTOR SERVICE ERROR:",
      error
    );

    return {

      success: false,

      statusCode: 500,

      message: "Internal Server Error",

      total: 0,

      page: 1,

      limit: 10,

      data: []

    };

  }
};