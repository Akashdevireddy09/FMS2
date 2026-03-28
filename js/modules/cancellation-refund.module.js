(function () {
  "use strict";

  function init() {
    if (document.body.getAttribute("data-page") !== "cancellation-refund") {
      return;
    }

    const security = window.FMS.core.security;
    const storage = window.FMS.core.storage;
    const pricing = window.FMS.core.pricing;
    const ui = window.FMS.core.ui;

    const session = security.requireAuth("Customer");
    if (!session) {
      return;
    }
    security.startSessionGuard();

    function render() {
      const bookings = storage.getBookings().filter(function (b) {
        return Number(b.userId) === Number(session.userId);
      });
      const carriers = storage.getCarriers();

      document.getElementById("cancelBody").innerHTML = bookings.map(function (b) {
        const carrier = carriers.find(function (c) { return Number(c.carrierId) === Number(b.carrierId); });
        const daysLeft = pricing.daysBefore(b.dateOfTravel);
        const refundPct = pricing.refundPercent(daysLeft, carrier);
        const refundAmount = b.bookingStatus === "Booked" ? ((Number(b.finalAmount || b.bookingAmount || 0) * refundPct) / 100) : 0;

        return "<tr>" +
          "<td>" + ui.escapeHtml(b.bookingId) + "</td>" +
          "<td>" + ui.escapeHtml(b.origin + " to " + b.destination) + "</td>" +
          "<td>" + ui.escapeHtml(b.bookingStatus) + "</td>" +
          "<td>" + ui.escapeHtml(daysLeft) + "</td>" +
          "<td>" + refundPct + "%</td>" +
          "<td>INR " + refundAmount.toFixed(2) + "</td>" +
          "<td>" + (b.bookingStatus === "Booked" ? ("<button data-id=\"" + b.bookingId + "\">Cancel</button>") : "-") + "</td>" +
          "</tr>";
      }).join("") || "<tr><td colspan=\"7\">No bookings found.</td></tr>";

      document.querySelectorAll("button[data-id]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const id = Number(btn.getAttribute("data-id"));
          const updated = storage.getBookings().map(function (b) {
            if (Number(b.bookingId) === id) {
              b.bookingStatus = "Cancelled";
              b.cancelledOn = storage.nowIso();
            }
            return b;
          });
          storage.saveBookings(updated);
          storage.addAudit("CANCEL", "BOOKING", "Customer cancelled booking " + id, session.userId);
          ui.setMessage("cancelMsg", "Booking cancelled. Refund will be processed as per policy.", "ok");
          render();
        });
      });
    }

    document.getElementById("backCustomerBtn").addEventListener("click", function () {
      location.href = "customer_dashboard.html";
    });
    render();
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.cancellationRefund = { init: init };
})();
