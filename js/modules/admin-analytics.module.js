(function () {
  "use strict";

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-analytics") {
      return;
    }

    var storage = window.FMS.core.storage;
    var security = window.FMS.core.security;
    var ui = window.FMS.core.ui;

    var session = security.requireAuth("Admin");
    if (!session) { return; }
    security.startSessionGuard();

    document.getElementById("adminName").textContent = session.userName;
    document.getElementById("adminLogoutBtn").addEventListener("click", function () {
      storage.addAudit("SIGN_OUT", "AUTH", "Admin logout", session.userId);
      security.logout("Signed out successfully.");
    });

    function renderAnalytics() {
      var bookings = storage.getBookings();
      var booked = bookings.filter(function (b) { return b.bookingStatus === "Booked"; });
      var cancelled = bookings.filter(function (b) { return b.bookingStatus === "Cancelled"; });
      var revenue = booked.reduce(function (sum, b) { return sum + Number(b.finalAmount || b.bookingAmount || 0); }, 0);
      var schedules = storage.getSchedules();
      var activeFlightIds = new Set(schedules.map(function (s) { return s.flightId; }));

      document.getElementById("analyticsTotalBookings").textContent = booked.length;
      document.getElementById("analyticsRevenue").textContent = "INR " + revenue.toFixed(2);
      document.getElementById("analyticsCancelled").textContent = cancelled.length;
      document.getElementById("analyticsActiveFlights").textContent = activeFlightIds.size;

      var inv = schedules.map(function (s) {
        var flight = storage.getFlights().find(function (f) { return Number(f.flightId) === Number(s.flightId); });
        if (!flight) { return null; }
        return "<tr>" +
          "<td>" + s.flightScheduleId + "</td>" +
          "<td>" + flight.flightId + "</td>" +
          "<td>" + ui.escapeHtml(flight.origin + " → " + flight.destination) + "</td>" +
          "<td>" + s.dateOfTravel + "</td>" +
          "<td>" + s.economyClassBookedCount + "/" + flight.seatCapacityEconomyClass + "</td>" +
          "<td>" + s.businessClassBookedCount + "/" + flight.seatCapacityBusinessClass + "</td>" +
          "<td>" + s.executiveClassBookedCount + "/" + flight.seatCapacityExecutiveClass + "</td>" +
          "</tr>";
      }).filter(Boolean).join("");

      document.getElementById("inventoryBody").innerHTML = inv || "<tr><td colspan=\"7\">No schedule inventory data.</td></tr>";
    }

    function setView(view) {
      var kpiButton = document.getElementById("showKpiBtn");
      var inventoryButton = document.getElementById("showInventoryBtn");

      if (kpiSection) { kpiSection.style.display = view === "inventory" ? "none" : "block"; }
      if (inventorySection) { inventorySection.style.display = view === "inventory" ? "block" : "none"; }
      if (kpiButton) { kpiButton.classList.toggle("active", view !== "inventory"); }
      if (inventoryButton) { inventoryButton.classList.toggle("active", view === "inventory"); }
    }

    // Show/hide sections based on URL param
    var params = new URLSearchParams(window.location.search);
    var option = params.get("option") || "kpi";

    var kpiSection = document.getElementById("kpiSection");
    var inventorySection = document.getElementById("inventorySection");

    setView(option === "inventory" ? "inventory" : "kpi");

    document.getElementById("showKpiBtn").addEventListener("click", function () {
      setView("kpi");
    });

    document.getElementById("showInventoryBtn").addEventListener("click", function () {
      setView("inventory");
    });

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });

    renderAnalytics();
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminAnalytics = { init: init };
})();
