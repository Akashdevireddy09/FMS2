(function () {
  "use strict";

  function init() {
    if (document.body.getAttribute("data-page") !== "payment") {
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

    const paramId = Number(new URLSearchParams(location.search).get("bookingId"));
    const myPending = storage.getBookings().filter(function (b) {
      return Number(b.userId) === Number(session.userId) && (b.bookingStatus === "Pending Payment" || b.bookingStatus === "Pending Preview");
    });

    const booking = paramId
      ? storage.getBookings().find(function (b) { return Number(b.bookingId) === paramId; })
      : (myPending.length ? myPending[myPending.length - 1] : null);

    if (!booking) {
      ui.setMessage("paymentMsg", "No pending booking found. Please create a booking first.", "warn");
      return;
    }

    const user = storage.getUsers().find(function (u) { return Number(u.userId) === Number(session.userId); });
    const carrier = storage.getCarriers().find(function (c) { return Number(c.carrierId) === Number(booking.carrierId); });
    const breakdown = pricing.calculateBreakdown(booking, carrier, user ? user.customerCategory : "Silver");

    document.getElementById("bookingRef").textContent = String(booking.bookingId);
    document.getElementById("journeyRef").textContent = booking.origin + " to " + booking.destination;
    document.getElementById("travelDateRef").textContent = booking.dateOfTravel;
    document.getElementById("ticketsRef").textContent = String(booking.noOfSeats);

    window.FMS.modules.fareDiscount.renderBreakdown("paymentBreakdown", breakdown);

    function togglePayment() {
      const method = document.getElementById("paymentMethod").value;
      document.getElementById("cardSection").classList.add("hidden");
      document.getElementById("netbankingSection").classList.add("hidden");
      document.getElementById("upiSection").classList.add("hidden");
      if (method === "credit" || method === "debit") {
        document.getElementById("cardSection").classList.remove("hidden");
      } else if (method === "netbanking") {
        document.getElementById("netbankingSection").classList.remove("hidden");
      } else {
        document.getElementById("upiSection").classList.remove("hidden");
      }
    }

    document.getElementById("paymentMethod").addEventListener("change", togglePayment);
    togglePayment();

    document.getElementById("payNowBtn").addEventListener("click", function () {
      const method = document.getElementById("paymentMethod").value;
      if ((method === "credit" || method === "debit") && !/^\d{16}$/.test(document.getElementById("cardNumber").value.trim())) {
        ui.setMessage("paymentMsg", "Enter valid 16-digit card number.", "err");
        return;
      }
      if ((method === "credit" || method === "debit") && !/^\d{3}$/.test(document.getElementById("cvv").value.trim())) {
        ui.setMessage("paymentMsg", "Enter valid 3-digit CVV.", "err");
        return;
      }
      if (method === "netbanking" && !/^\d{9,18}$/.test(document.getElementById("accountNumber").value.trim())) {
        ui.setMessage("paymentMsg", "Enter valid 9-18 digit account number.", "err");
        return;
      }
      if (method === "upi" && !/^[A-Za-z0-9](?:[A-Za-z0-9._-]{1,253})@[A-Za-z][A-Za-z0-9.-]{1,63}$/.test(document.getElementById("upi").value.trim())) {
        ui.setMessage("paymentMsg", "Enter valid UPI id.", "err");
        return;
      }

      const updated = storage.getBookings().map(function (b) {
        if (Number(b.bookingId) === Number(booking.bookingId)) {
          b.finalAmount = Number(breakdown.finalAmount.toFixed(2));
          b.bookingMethod = method;
          b.bookingStatus = "Booked";
          b.paymentDate = storage.nowIso();
        }
        return b;
      });
      storage.saveBookings(updated);
      storage.addAudit("PAYMENT", "BOOKING", "Payment completed for booking " + booking.bookingId, session.userId);

      sessionStorage.setItem("fms_flash", "Payment successful. Booking confirmed.");
      location.href = "booking_confirmation.html?bookingId=" + encodeURIComponent(String(booking.bookingId));
    });

    document.getElementById("cancelPaymentBtn").addEventListener("click", function () {
      location.href = "customer_dashboard.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.payment = { init: init };
})();
