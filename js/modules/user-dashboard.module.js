(function () {
  "use strict";

  function init() {
    if (document.body.getAttribute("data-page") !== "customer") {
      return;
    }

    const storage = window.FMS.core.storage;
    const security = window.FMS.core.security;
    const ui = window.FMS.core.ui;

    const session = security.requireAuth("Customer");
    if (!session) {
      return;
    }
    security.startSessionGuard();
    ui.readFlash("customerMsg");

    const users = storage.getUsers();
    const bookings = storage.getBookings();
    const flights = storage.getFlights();
    const user = users.find(function (u) { return Number(u.userId) === Number(session.userId); });

    const myBookings = bookings.filter(function (b) { return Number(b.userId) === Number(session.userId); });
    const paid = myBookings.filter(function (b) { return b.bookingStatus === "Booked"; });
    const spend = paid.reduce(function (sum, b) { return sum + Number(b.finalAmount || b.bookingAmount || 0); }, 0);

    document.getElementById("welcomeName").textContent = user ? user.userName : "Customer";
    document.getElementById("kpiFlights").textContent = String(flights.length);
    document.getElementById("kpiBookings").textContent = String(paid.length);
    document.getElementById("kpiSpent").textContent = "INR " + spend.toFixed(2);

    document.getElementById("goFlightSearch").addEventListener("click", function () {
      location.href = "flight_search.html";
    });
    document.getElementById("goMyBookings").addEventListener("click", function () {
      location.href = "my_bookings.html";
    });
    document.getElementById("goCancellation").addEventListener("click", function () {
      location.href = "cancellation_refund.html";
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
      storage.addAudit("SIGN_OUT", "AUTH", "Customer logout", session.userId);
      security.logout("Signed out successfully.");
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.userDashboard = { init: init };
})();
