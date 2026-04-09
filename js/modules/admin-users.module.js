(function () {
  "use strict";

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-users") {
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

    function escapeAttr(value) {
      return ui.escapeHtml(String(value || "")).replace(/"/g, "&quot;");
    }

    function getBookingSchedule(booking, schedules) {
      return schedules.find(function (s) { return Number(s.flightScheduleId) === Number(booking.flightScheduleId); }) || null;
    }

    function getBookingFlight(schedule, flights) {
      if (!schedule) { return null; }
      return flights.find(function (f) { return Number(f.flightId) === Number(schedule.flightId); }) || null;
    }

    function getBookingCarrier(flight, carriers) {
      if (!flight) { return null; }
      return carriers.find(function (c) { return Number(c.carrierId) === Number(flight.carrierId); }) || null;
    }

    function bookingSummaryHtml(booking, schedule, flight, carrier) {
      var route = flight ? ui.escapeHtml(flight.origin + " → " + flight.destination) : "Unknown route";
      var carrierName = carrier ? ui.escapeHtml(carrier.carrierName) : "Unknown carrier";
      var date = schedule ? ui.escapeHtml(schedule.dateOfTravel) : "N/A";
      var amount = Number(booking.finalAmount || booking.bookingAmount || 0).toFixed(2);
      return "<div class=\"booking-snippet\">" +
        "<div><strong>#" + ui.escapeHtml(String(booking.bookingId)) + "</strong> | " + ui.escapeHtml(String(booking.bookingStatus || "")) + "</div>" +
        "<div>" + route + "</div>" +
        "<div>" + carrierName + "</div>" +
        "<div>" + ui.escapeHtml(String(date)) + " | " + ui.escapeHtml(String(booking.seatCategory || "")) + " | Seats: " + ui.escapeHtml(String(booking.noOfSeats || booking.noOfSeatsBooked || 0)) + "</div>" +
        "<div>INR " + amount + "</div>" +
      "</div>";
    }

    var currentFilter = "all";
    var filterBtn = document.getElementById("userFilterBtn");
    var filterMenu = document.getElementById("userFilterMenu");

    function closeFilterMenu() {
      if (filterMenu) { filterMenu.style.display = "none"; }
      if (filterBtn) { filterBtn.setAttribute("aria-expanded", "false"); }
    }

    function toggleFilterMenu() {
      if (!filterMenu || !filterBtn) { return; }
      var open = filterMenu.style.display === "block";
      filterMenu.style.display = open ? "none" : "block";
      filterBtn.setAttribute("aria-expanded", open ? "false" : "true");
    }

    function renderUsers(statusFilter) {
      statusFilter = statusFilter || "all";
      currentFilter = statusFilter;
      var q = (document.getElementById("userSearch") ? document.getElementById("userSearch").value : "").toLowerCase();
      var bookings = storage.getBookings();
      var schedules = storage.getSchedules();
      var flights = storage.getFlights();
      var carriers = storage.getCarriers();
      var users = storage.getUsers().filter(function (u) {
        if (u.role !== "Customer") { return false; }
        if (statusFilter === "active" && !u.active) { return false; }
        if (statusFilter === "inactive" && u.active) { return false; }
        return !q || u.userName.toLowerCase().includes(q) || String(u.userId).includes(q) || u.emailId.toLowerCase().includes(q);
      });

      document.getElementById("userBody").innerHTML = users.map(function (u) {
        var userBookings = bookings.filter(function (b) { return Number(b.userId) === Number(u.userId); })
          .slice()
          .sort(function (a, b) { return Number(b.bookingId || 0) - Number(a.bookingId || 0); });
        var bookingCount = userBookings.length;
        var latestBooking = userBookings[0] || null;
        var latestSummary = "<span class=\"muted\">No bookings found</span>";
        if (latestBooking) {
          var latestSchedule = getBookingSchedule(latestBooking, schedules);
          var latestFlight = getBookingFlight(latestSchedule, flights);
          var latestCarrier = getBookingCarrier(latestFlight, carriers);
          latestSummary = bookingSummaryHtml(latestBooking, latestSchedule, latestFlight, latestCarrier);
          if (bookingCount > 1) {
            latestSummary += "<div class=\"muted\" style=\"margin-top:6px;\">+" + (bookingCount - 1) + " more booking(s)</div>";
          }
        }
        return "<tr>" +
          "<td>" + u.userId + "</td><td>" + ui.escapeHtml(u.userName) + "</td><td>" + ui.escapeHtml(u.emailId) + "</td>" +
          "<td>" + ui.escapeHtml(u.customerCategory) + "</td><td>" + (u.active ? "Active" : "Disabled") + "</td>" +
          "<td>" + bookingCount + "<div style=\"margin-top:6px;\">" + latestSummary + "</div></td>" +
          "<td><button onclick=\"showUserBookings(" + u.userId + ", '" + ui.escapeHtml(u.userName).replace(/'/g, "\\'") + "', '" + ui.escapeHtml(u.customerCategory).replace(/'/g, "\\'") + "')\">View Bookings</button></td>" +
          "</tr>";
      }).join("") || "<tr><td colspan=\"7\">No users found.</td></tr>";
    }

    window.showUserBookings = function (userId, userName, category) {
      var bookings = storage.getBookings().filter(function (b) { return Number(b.userId) === Number(userId); });
      var flights = storage.getFlights(); var schedules = storage.getSchedules(); var carriers = storage.getCarriers();
      var bookingsList = bookings.map(function (b) {
        var sched = schedules.find(function (s) { return Number(s.flightScheduleId) === Number(b.flightScheduleId); });
        var fli = sched ? flights.find(function (f) { return Number(f.flightId) === Number(sched.flightId); }) : null;
        var carr = fli ? carriers.find(function (c) { return Number(c.carrierId) === Number(fli.carrierId); }) : null;
        return "<div style=\"background:#f0f4f8; padding:10px; margin:8px 0; border-radius:8px; border-left:3px solid #1e5bb8;\">" +
          "<div><strong>Booking #" + b.bookingId + "</strong></div>" +
          "<div>Flight: " + (fli ? fli.origin + " → " + fli.destination : "Unknown") + "</div>" +
          "<div>Carrier: " + (carr ? ui.escapeHtml(carr.carrierName) : "Unknown") + "</div>" +
          "<div>Ticket: " + b.ticketNumber + " | Seats: " + b.noOfSeatsBooked + " | Class: " + b.classType + "</div>" +
          "<div>Date: " + (sched ? sched.dateOfTravel : "N/A") + " | Amount: ₹" + b.finalAmount + "</div></div>";
      }).join("") || "<p style=\"color:#999;\">No bookings found.</p>";

      document.getElementById("bookingModalTitle").textContent = "Bookings for " + userName + " (" + category + " Tier)";
      document.getElementById("bookingModalContent").innerHTML = bookingsList;
      document.getElementById("bookingModal").style.display = "flex";
    };

    document.getElementById("closeBookingModalBtn").addEventListener("click", function () {
      document.getElementById("bookingModal").style.display = "none";
    });

    document.getElementById("userSearchBtn").addEventListener("click", function () { renderUsers(currentFilter); });

    if (filterBtn && filterMenu) {
      filterBtn.addEventListener("click", function (event) {
        event.stopPropagation();
        toggleFilterMenu();
      });

      filterMenu.addEventListener("click", function (event) {
        var target = event.target;
        if (target && target.getAttribute("data-filter")) {
          currentFilter = target.getAttribute("data-filter");
          closeFilterMenu();
          renderUsers(currentFilter);
        }
      });

      document.addEventListener("click", function (event) {
        if (!filterMenu.contains(event.target) && event.target !== filterBtn) {
          closeFilterMenu();
        }
      });
    }

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });

    // Auto-apply filter from URL param
    var params = new URLSearchParams(window.location.search);
    var option = params.get("option") || "all";
    renderUsers(option);
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminUsers = { init: init };
})();
