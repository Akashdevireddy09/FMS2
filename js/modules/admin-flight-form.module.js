(function () {
  "use strict";

  function num(value) {
    return Number(value || 0);
  }

  function normalizeCity(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-add-flight") {
      return;
    }

    const storage = window.FMS.core.storage;
    const security = window.FMS.core.security;
    const ui = window.FMS.core.ui;

    const session = security.requireAuth("Admin");
    if (!session) {
      return;
    }
    security.startSessionGuard();

    document.getElementById("adminName").textContent = session.userName;
    document.getElementById("adminLogoutBtn").addEventListener("click", function () {
      storage.addAudit("SIGN_OUT", "AUTH", "Admin logout", session.userId);
      security.logout("Signed out successfully.");
    });

    // Populate carrier dropdown
    function renderCarrierDropdown() {
      const carriers = storage.getCarriers();
      const opts = carriers.map(function (c) { 
        return "<option value=\"" + c.carrierId + "\">" + ui.escapeHtml(c.carrierName) + "</option>"; 
      }).join("");
      document.getElementById("flightCarrierId").innerHTML = opts || "<option>No carriers found. Add carriers first.</option>";
    }

    renderCarrierDropdown();

    // Calculate flight duration
    function calculateFlightDuration() {
      const boarding = document.getElementById("boardingTime").value;
      const arrival = document.getElementById("arrivalTime").value;
      if (boarding && arrival) {
        const [bh, bm] = boarding.split(":").map(Number);
        const [ah, am] = arrival.split(":").map(Number);
        let bMin = bh * 60 + bm;
        let aMin = ah * 60 + am;
        if (aMin < bMin) aMin += 24 * 60;
        const dur = aMin - bMin;
        const h = Math.floor(dur / 60);
        const m = dur % 60;
        document.getElementById("flightDuration").value = h + "h " + m + "m";
      }
    }

    const boardingTimeEl = document.getElementById("boardingTime");
    const arrivalTimeEl = document.getElementById("arrivalTime");
    if (boardingTimeEl) boardingTimeEl.addEventListener("change", calculateFlightDuration);
    if (arrivalTimeEl) arrivalTimeEl.addEventListener("change", calculateFlightDuration);

    document.getElementById("saveFlightBtn").addEventListener("click", function () {
      const boardingTime = document.getElementById("boardingTime").value;
      const arrivalTime = document.getElementById("arrivalTime").value;
      const payload = {
        flightId: storage.nextId("flight"),
        carrierId: num(document.getElementById("flightCarrierId").value),
        origin: document.getElementById("origin").value.trim(),
        destination: document.getElementById("destination").value.trim(),
        airFare: num(document.getElementById("airFare").value),
        seatCapacityEconomyClass: num(document.getElementById("seatEconomy").value),
        seatCapacityBusinessClass: num(document.getElementById("seatBusiness").value),
        seatCapacityExecutiveClass: num(document.getElementById("seatExecutive").value)
      };

      // Validation
      if (payload.seatCapacityEconomyClass < 20 || payload.seatCapacityBusinessClass < 10 || payload.seatCapacityExecutiveClass < 5) {
        ui.setMessage("adminMsg", "Seat capacity constraints: Economy >= 20, Business >= 10, Executive >= 5.", "err");
        return;
      }
      if (!payload.origin || !payload.destination || normalizeCity(payload.origin) === normalizeCity(payload.destination)) {
        ui.setMessage("adminMsg", "Origin and Destination must be different valid cities.", "err");
        return;
      }
      if (payload.airFare <= 0) {
        ui.setMessage("adminMsg", "Air fare must be greater than zero.", "err");
        return;
      }
      if (!boardingTime || !arrivalTime) {
        ui.setMessage("adminMsg", "Boarding and arrival times are required.", "err");
        return;
      }

      // Save flight
      const list = storage.getFlights();
      list.push(payload);
      storage.saveFlights(list);

      // Store flight timing data
      const duration = document.getElementById("flightDuration").value;
      localStorage.setItem("flight_times_" + payload.flightId, JSON.stringify({
        boardingTime: boardingTime,
        arrivalTime: arrivalTime,
        duration: duration
      }));

      storage.addAudit("CREATE", "FLIGHT", "Flight created " + payload.flightId, session.userId);
      ui.setMessage("adminMsg", "Flight saved successfully! Flight ID: " + payload.flightId + ". Add a schedule to make it searchable for customers.", "ok");

      // Clear form
      setTimeout(function () {
        location.href = "manage-flights.html";
      }, 1500);
    });

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminFlightForm = { init: init };
})();
