const dashboardModel = require("../../models/dashboardModel");
const User = require("../../models/usermodel");

exports.cardNumber = async (params) => {

  const [
    patients,
    doctors,
    assistants,
    completedAppointments,
    upcomingAppointments,
    pastAppointments,
  ] = await Promise.all([

    dashboardModel.getPatientsCount(params),

    dashboardModel.getDoctorsCount(params),

    dashboardModel.getAssistantsCount(params),

    dashboardModel.getCompletedAppointmentsCount(params),

    dashboardModel.getUpcomingAppointmentsCount(params),

    dashboardModel.getPastAppointmentsCount(params),

  ]);

  return {

    patients,

    doctors,

    assistants,

    completedAppointments,

    upcomingAppointments,

    pastAppointments,

  };

};

exports.getAppointmentGraph = async (doctorId) => {

  const rows =
    await dashboardModel.getWeeklyAppointmentStats(
      doctorId
    );

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const onlineGraph = [];
  const offlineGraph = [];

  days.forEach((day) => {

    const online = rows.find(
      (item) =>
        item.day_name === day &&
        (item.appointment_type || "")
          .toLowerCase() === "online"
    );

    const offline = rows.find(
      (item) =>
        item.day_name === day &&
        (item.appointment_type || "")
          .toLowerCase() === "offline"
    );

    onlineGraph.push({

      day: day.substring(0, 3),

      value: online ? online.total : 0,

    });

    offlineGraph.push({

      day: day.substring(0, 3),

      value: offline ? offline.total : 0,

    });

  });

  return {

    online_total: onlineGraph.reduce(
      (sum, item) => sum + item.value,
      0
    ),

    offline_total: offlineGraph.reduce(
      (sum, item) => sum + item.value,
      0
    ),

    online_graph: onlineGraph,

    offline_graph: offlineGraph,

  };

};

exports.getTodayStats = async (doctorId) => {

  const stats =
    await dashboardModel.getTodayAppointmentStats(
      doctorId
    );

  return {

    today_appointments:
      stats.total_appointments || 0,

    today_completed:
      stats.completed || 0,

    today_pending:
      stats.pending || 0,

    today_cancelled:
      stats.cancelled || 0,

  };

};

exports.getUserById = async (id) => {

  return await User.findById(id);

};