(function () {
  "use strict";

  function formatDuration(minutes) {
    const total = Number(minutes || 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return hours + "h " + mins + "m";
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "booking-confirmation") {
      return;
    }

    const security = window.FMS.core.security;
    const storage = window.FMS.core.storage;
    const ui = window.FMS.core.ui;

    const session = security.requireAuth("Customer");
    if (!session) {
      return;
    }
    security.startSessionGuard();
    ui.readFlash("bookingSuccessMsg");

    const bookingId = Number(new URLSearchParams(location.search).get("bookingId"));
    const booking = storage.getBookings().find(function (b) {
      return Number(b.bookingId) === bookingId;
    });
    if (!booking) {
      ui.setMessage("bookingSuccessMsg", "Booking not found.", "err");
      return;
    }

    document.getElementById("successRef").textContent = String(booking.bookingId);
    document.getElementById("successJourney").textContent = booking.origin + " to " + booking.destination;
    document.getElementById("successDate").textContent = booking.dateOfTravel;
    document.getElementById("successPassengers").textContent = String(booking.noOfSeats || (booking.passengers || []).length || 0);
    document.getElementById("successNames").textContent = (booking.passengers || []).map(function (p) { return p.name; }).join(", ") || "N/A";
    document.getElementById("successSeats").textContent = (booking.passengers || []).map(function (p) { return p.seatNo; }).join(", ") || "N/A";
    document.getElementById("successDuration").textContent = formatDuration(booking.journeyDurationMins || 0);
    document.getElementById("successStatus").textContent = booking.bookingStatus;
    document.getElementById("successAmount").textContent = Number(booking.finalAmount || booking.bookingAmount || 0).toFixed(2);
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.bookingConfirmation = { init: init };
})();
