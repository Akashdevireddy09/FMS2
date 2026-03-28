(function () {
  "use strict";

  function normalizeCity(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function isPastTravelDate(dateString) {
    const selected = new Date(String(dateString) + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  }

  function isPastFlightDateTime(dateString, departureTime) {
    const time = (departureTime || "00:00") + ":00";
    const departure = new Date(String(dateString) + "T" + time);
    return departure <= new Date();
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "flight-search") {
      return;
    }

    const security = window.FMS.core.security;
    const storage = window.FMS.core.storage;
    const ui = window.FMS.core.ui;
    if (!security.requireAuth("Customer")) {
      return;
    }
    security.startSessionGuard();

    document.getElementById("searchBtn").addEventListener("click", function () {
      const from = normalizeCity(document.getElementById("fromCity").value);
      const to = normalizeCity(document.getElementById("toCity").value);
      const date = document.getElementById("travelDate").value;

      if (!from || !to || !date) {
        ui.setMessage("flightSearchMsg", "From, To and Date are required.", "err");
        return;
      }
      if (from === to) {
        ui.setMessage("flightSearchMsg", "From and To cities cannot be same.", "err");
        return;
      }
      if (isPastTravelDate(date)) {
        ui.setMessage("flightSearchMsg", "Past travel dates are not allowed.", "err");
        return;
      }

      // Read latest data for every search so admin updates are reflected immediately.
let schedules = storage.getSchedules();
const flights = storage.getFlights();

const flightsById = flights.reduce(function (map, flight) {
  map[Number(flight.flightId)] = flight;
  return map;
}, {});

function routeMatches(flight) {
  return normalizeCity(flight.origin) === from && normalizeCity(flight.destination) === to;
}

function buildAvailable(scheduleList) {
  return scheduleList
    .filter(function (s) { return s.dateOfTravel === date; })
    .map(function (s) {
      const flight = flightsById[Number(s.flightId)];
      return flight ? { flight: flight, schedule: s } : null;
    })
    .filter(Boolean)
    .filter(function (x) { return routeMatches(x.flight); })
    .filter(function (x) { return !isPastFlightDateTime(x.schedule.dateOfTravel, x.flight.departureTime); });
}

let available = buildAvailable(schedules);

if (!available.length) {
  const routeFlights = flights.filter(routeMatches);

  // Auto-create schedules for this date if route exists but admin skipped scheduling.
  if (routeFlights.length) {
    const existingKeys = new Set(
      schedules.map(function (s) { return String(s.flightId) + "|" + s.dateOfTravel; })
    );

    routeFlights.forEach(function (f) {
      const key = String(f.flightId) + "|" + date;
      if (!existingKeys.has(key)) {
        schedules.push({
          flightScheduleId: storage.nextId("schedule"),
          flightId: Number(f.flightId),
          dateOfTravel: date,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        });
      }
    });

    storage.saveSchedules(schedules);
    available = buildAvailable(schedules);
  }
}

if (!available.length) {
  ui.setMessage("flightSearchMsg", "No flights found for the selected route.", "warn");
  sessionStorage.removeItem("fms_search_results");
  sessionStorage.removeItem("fms_search_date");
  return;
}

sessionStorage.setItem("fms_search_results", JSON.stringify(available));
sessionStorage.setItem("fms_search_date", date);
location.href = "available_flights.html";
    });

    document.getElementById("backHomeBtn").addEventListener("click", function () {
      location.href = "customer_dashboard.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.flightSearch = { init: init };
})();
