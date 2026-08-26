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

    page = Math.max(
      1,
      Number(page) || 1
    );

    limit = Math.min(
      50,
      Math.max(
        1,
        Number(limit) || 10
      )
    );

    const offset =
      (page - 1) * limit;

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

    // Fetch doctors
    let doctors =
      await findAllWithUsers();

    // Map data according to tables
    doctors = doctors.map((doctor) => {

      const language =
        safeParse(
          doctor.language,
          []
        );

      const hospitalDetail =
        safeParse(
          doctor.hospital_detail,
          []
        );

      const images =
        safeParse(
          doctor.images,
          []
        );

      return {

        userId:
          doctor.user_id,

        registrationId:
          doctor.registration_id || null,

        // doctor_registrations
        fullName:
          doctor.full_name || "",

        gender:
          doctor.gender || "",

        age:
          Number(doctor.age) || 0,

        email:
          doctor.email || "",

        phoneNumber:
          doctor.mobile || "",

        medicalRegistrationNumber:
          doctor.medical_registration_number || "",

        medicalCouncil:
          doctor.medical_council || "",

        qualification:
          doctor.qualification || "",

        specialization:
          doctor.specialization || "",

        onboardingStatus:
          doctor.onboarding_status || "",

        selfie:
          doctor.selfie || null,

        // doctors
        experience:
          Number(doctor.experience) || 0,

        language,

        consultationFee:
          Number(
            doctor.consultation_fee
          ) || 0,

        bio:
          doctor.bio || "",

        availability:
          safeParse(
            doctor.availability,
            []
          ),

        hospitalDetail,

        qrUrl:
          doctor.qr_url || null,

        acceptEmergencyPatients:
          doctor.accept_emergency_patients,

        // ratings
        avgRating:
          Number(
            doctor.avg_rating
          ) || 0,

        totalFeedbacks:
          Number(
            doctor.total_feedbacks || 0
          ),

        totalRatings:
          Number(
            doctor.total_ratings || 0
          ),

        positiveFeedbacks:
          Number(
            doctor.positive_feedbacks || 0
          ),

        negativeFeedbacks:
          Number(
            doctor.negative_feedbacks || 0
          ),

        images
      };

    });

    // Search
    if (search.trim()) {

      const words =
        normalize(search).split(" ");

      doctors =
        doctors.filter((doctor) => {

          const hospitalNames =
            doctor.hospitalDetail.map(
              (x) =>
                normalize(
                  x.hospitalName
                )
            );

          const streetNames =
            doctor.hospitalDetail.map(
              (x) =>
                normalize(
                  x.streetName
                )
            );

          const areaLocalities =
            doctor.hospitalDetail.map(
              (x) =>
                normalize(
                  x.areaLocality
                )
            );

          const hospitalCities =
            doctor.hospitalDetail.map(
              (x) =>
                normalize(
                  x.city
                )
            );

          const hospitalStates =
            doctor.hospitalDetail.map(
              (x) =>
                normalize(
                  x.state
                )
            );

          const hospitalDistricts =
            doctor.hospitalDetail.map(
              (x) =>
                normalize(
                  x.district
                )
            );

          const hospitalPinCodes =
            doctor.hospitalDetail.map(
              (x) =>
                normalize(
                  x.pinCode
                )
            );

          const hospitalLandmarks =
            doctor.hospitalDetail.map(
              (x) =>
                normalize(
                  x.landmark
                )
            );

          const languages =
            doctor.language.map(
              normalize
            );

          const searchable = [

            // doctor_registrations
            normalize(
              doctor.fullName
            ),

            normalize(
              doctor.email
            ),

            normalize(
              doctor.phoneNumber
            ),

            normalize(
              doctor.medicalRegistrationNumber
            ),

            normalize(
              doctor.medicalCouncil
            ),

            normalize(
              doctor.qualification
            ),

            normalize(
              doctor.specialization
            ),

            normalize(
              doctor.onboardingStatus
            ),

            // doctors
            normalize(
              doctor.acceptEmergencyPatients
            ),

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

          return words.every(
            (word) =>
              searchable.some(
                (field) =>
                  field.includes(word)
              )
          );

        });

    }

    // Remove duplicate doctors
    const seen = new Set();

    doctors =
      doctors.filter((doctor) => {

        if (
          seen.has(
            doctor.userId
          )
        ) {
          return false;
        }

        seen.add(
          doctor.userId
        );

        return true;

      });

    // Sorting
    doctors.sort((a, b) => {

      switch (sortBy) {

        case "experience":

          return order === "asc"
            ? a.experience -
              b.experience
            : b.experience -
              a.experience;

        case "consultationFee":

          return order === "asc"
            ? a.consultationFee -
              b.consultationFee
            : b.consultationFee -
              a.consultationFee;

        case "avgRating":

          return order === "asc"
            ? a.avgRating -
              b.avgRating
            : b.avgRating -
              a.avgRating;

        case "fullName":

          return order === "asc"
            ? a.fullName.localeCompare(
                b.fullName
              )
            : b.fullName.localeCompare(
                a.fullName
              );

        default:

          return 0;
      }

    });

    // Pagination
    const paginated =
      doctors.slice(
        offset,
        offset + limit
      );

    return {

      success: true,

      statusCode: 200,

      message:
        paginated.length
          ? "Doctors fetched successfully."
          : "No doctors found.",

      total:
        doctors.length,

      page,

      limit,

      data:
        paginated.map(
          (doctor) => ({

            userId:
              doctor.userId,

            registrationId:
              doctor.registrationId,

            // doctor_registrations
            fullName:
              doctor.fullName,

            gender:
              doctor.gender,

            age:
              doctor.age,

            email:
              doctor.email,

            phoneNumber:
              doctor.phoneNumber,

            medicalRegistrationNumber:
              doctor.medicalRegistrationNumber,

            medicalCouncil:
              doctor.medicalCouncil,

            qualification:
              doctor.qualification,

            specialization:
              doctor.specialization,

            onboardingStatus:
              doctor.onboardingStatus,

            selfie:
              doctor.selfie,

            // doctors
            experience:
              doctor.experience,

            language:
              doctor.language,

            consultationFee:
              doctor.consultationFee,

            bio:
              doctor.bio,

            availability:
              doctor.availability,

            hospitalDetail:
              doctor.hospitalDetail,

            qrUrl:
              doctor.qrUrl,

            acceptEmergencyPatients:
              doctor.acceptEmergencyPatients,

            // ratings
            avgRating:
              Number(
                doctor.avgRating || 0
              ).toFixed(1),

            totalFeedbacks:
              Number(
                doctor.totalFeedbacks || 0
              ),

            totalRatings:
              Number(
                doctor.totalRatings || 0
              ),

            positiveFeedbacks:
              Number(
                doctor.positiveFeedbacks || 0
              ),

            negativeFeedbacks:
              Number(
                doctor.negativeFeedbacks || 0
              ),

            profileImage:
              doctor.images?.length &&
              doctor.images[0]?.fileKey
                ? `${S3_BASE_URL}/${encodeURI(
                    doctor.images[0].fileKey
                  )}`
                : null

          })
        )

    };

  } catch (error) {

    console.error(
      "SEARCH DOCTOR SERVICE ERROR:",
      error
    );

    return {

      success: false,

      statusCode: 500,

      message:
        "Internal Server Error",

      total: 0,

      page: 1,

      limit: 10,

      data: []

    };

  }
};