(function () {
  "use strict";

  function fmtMoney(value) {
    return "INR " + Number(value || 0).toFixed(2);
  }

  function renderOfferSummary(holderId, booking, user, breakdown) {
    const holder = document.getElementById(holderId);
    const days = window.FMS.core.pricing.daysBefore(booking.dateOfTravel);
    const category = user ? user.customerCategory : "Silver";
    const offers = [];

    if (Number(breakdown.advanceAmt || 0) > 0) {
      offers.push("Advance booking offer (" + breakdown.advancePct + "%): -" + fmtMoney(breakdown.advanceAmt));
    }
    if (Number(breakdown.membershipAmt || 0) > 0) {
      offers.push(category + " membership offer (" + breakdown.membershipPct + "%): -" + fmtMoney(breakdown.membershipAmt));
    }
    if (Number(breakdown.bulkAmt || 0) > 0) {
      offers.push("Bulk booking offer (" + breakdown.bulkPct + "%): -" + fmtMoney(breakdown.bulkAmt));
    }
    if (Number(breakdown.childAmt || 0) > 0) {
      offers.push("Child passenger offer (" + breakdown.childPct.toFixed(2) + "%): -" + fmtMoney(breakdown.childAmt));
    }

    if (!offers.length) {
      holder.innerHTML =
        "<div class=\"section-title\">Offers Availed</div>" +
        "<p class=\"muted\">No offer is applicable for this booking date/category. Book earlier or check membership tier benefits.</p>" +
        "<p class=\"muted\">Days before travel: " + days + "</p>";
      return;
    }

    holder.innerHTML =
      "<div class=\"section-title\">Offers Availed</div>" +
      "<ul>" + offers.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" +
      "<p class=\"muted\">Days before travel: " + days + "</p>";
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "booking-preview") {
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

    const bookingId = Number(new URLSearchParams(location.search).get("bookingId"));
    const booking = storage.getBookings().find(function (b) { return Number(b.bookingId) === bookingId; });
    if (!booking) {
      ui.setMessage("previewMsg", "Booking not found.", "err");
      return;
    }

    const user = storage.getUsers().find(function (u) { return Number(u.userId) === Number(session.userId); });
    const carrier = storage.getCarriers().find(function (c) { return Number(c.carrierId) === Number(booking.carrierId); });

    document.getElementById("previewJourney").textContent = booking.origin + " to " + booking.destination;
    document.getElementById("previewTravelDate").textContent = booking.dateOfTravel;
    document.getElementById("previewSeats").textContent = String(booking.noOfSeats);
    document.getElementById("previewClass").textContent = booking.seatCategory;
    document.getElementById("previewBookingDate").textContent = (booking.createdOn || storage.nowIso()).slice(0, 10);
    document.getElementById("previewCustomerCategory").textContent = user ? user.customerCategory : "Silver";

    const breakdown = pricing.calculateBreakdown(booking, carrier, user ? user.customerCategory : "Silver");
    renderOfferSummary("offerSummary", booking, user, breakdown);
    window.FMS.modules.fareDiscount.renderBreakdown("discountBreakdown", breakdown);

    document.getElementById("continueToPaymentBtn").addEventListener("click", function () {
      const updated = storage.getBookings().map(function (b) {
        if (Number(b.bookingId) === bookingId) {
          b.bookingStatus = "Pending Payment";
          b.finalAmount = Number(breakdown.finalAmount.toFixed(2));
        }
        return b;
      });
      storage.saveBookings(updated);
      location.href = "payment_module.html?bookingId=" + encodeURIComponent(String(bookingId));
    });

    document.getElementById("backSelectionBtn").addEventListener("click", function () {
      location.href = "flight_selection.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.preview = { init: init };
})();
