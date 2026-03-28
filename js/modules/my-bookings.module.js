(function () {
  "use strict";

  function isPastDate(dateString) {
    const dt = new Date(String(dateString) + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dt < today;
  }

  function statusBucket(booking) {
    if (booking.bookingStatus === "Cancelled") {
      return "cancelled";
    }
    if (booking.bookingStatus === "Booked") {
      return isPastDate(booking.dateOfTravel) ? "past" : "upcoming";
    }
    if (booking.bookingStatus === "Pending Preview" || booking.bookingStatus === "Pending Payment") {
      return "pending";
    }
    return "other";
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "my-bookings") {
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

    const all = storage.getBookings().filter(function (b) {
      return Number(b.userId) === Number(session.userId);
    });

    const counts = all.reduce(function (acc, b) {
      const bucket = statusBucket(b);
      acc[bucket] = (acc[bucket] || 0) + 1;
      return acc;
    }, { upcoming: 0, past: 0, cancelled: 0, pending: 0, other: 0 });

    document.getElementById("kpiUpcoming").textContent = String(counts.upcoming || 0);
    document.getElementById("kpiPast").textContent = String(counts.past || 0);
    document.getElementById("kpiCancelled").textContent = String(counts.cancelled || 0);

    const body = document.getElementById("myBookingsBody");

    function render(filterKey) {
      const list = all.filter(function (b) {
        if (!filterKey || filterKey === "all") {
          return true;
        }
        return statusBucket(b) === filterKey;
      });

      body.innerHTML = list.map(function (b) {
        let action = "-";
        if (b.bookingStatus === "Pending Preview") {
          action = "<button data-action=\"resume-preview\" data-id=\"" + b.bookingId + "\">Resume Preview</button>";
        } else if (b.bookingStatus === "Pending Payment") {
          action = "<button data-action=\"resume-payment\" data-id=\"" + b.bookingId + "\">Resume Payment</button>";
        } else if (b.bookingStatus === "Booked") {
          action = "<button data-action=\"view-booked\" data-id=\"" + b.bookingId + "\" class=\"secondary\">Open Booking</button>";
        }

        return "<tr>" +
          "<td>" + ui.escapeHtml(String(b.bookingId)) + "</td>" +
          "<td>" + ui.escapeHtml(b.origin + " to " + b.destination) + "</td>" +
          "<td>" + ui.escapeHtml(String(b.dateOfTravel || "")) + "</td>" +
          "<td>" + ui.escapeHtml(String(b.seatCategory || "")) + "</td>" +
          "<td>" + ui.escapeHtml(String(b.noOfSeats || 0)) + "</td>" +
          "<td>" + ui.escapeHtml(String(b.bookingStatus || "")) + "</td>" +
          "<td>INR " + Number(b.finalAmount || b.bookingAmount || 0).toFixed(2) + "</td>" +
          "<td>" + action + "</td>" +
          "</tr>";
      }).join("") || "<tr><td colspan=\"8\">No bookings found for this filter.</td></tr>";

      body.querySelectorAll("button[data-action]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const action = btn.getAttribute("data-action");
          const bookingId = Number(btn.getAttribute("data-id"));

          if (action === "resume-preview") {
            location.href = "booking_preview.html?bookingId=" + encodeURIComponent(String(bookingId));
            return;
          }
          if (action === "resume-payment") {
            location.href = "payment_module.html?bookingId=" + encodeURIComponent(String(bookingId));
            return;
          }
          if (action === "view-booked") {
            location.href = "booking_confirmation.html?bookingId=" + encodeURIComponent(String(bookingId));
          }
        });
      });
    }

    document.getElementById("filterAll").addEventListener("click", function () { render("all"); });
    document.getElementById("filterUpcoming").addEventListener("click", function () { render("upcoming"); });
    document.getElementById("filterPast").addEventListener("click", function () { render("past"); });
    document.getElementById("filterCancelled").addEventListener("click", function () { render("cancelled"); });
    document.getElementById("filterPending").addEventListener("click", function () { render("pending"); });

    render("all");
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.myBookings = { init: init };
})();
