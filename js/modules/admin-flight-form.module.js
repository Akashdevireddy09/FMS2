(function () {
  "use strict";

  function num(value) {
    return Number(value || 0);
  }

  function normalizeCity(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function isValidSeatCount(value, min, max) {
    return Number.isInteger(value) && value >= min && value <= max;
  }

  function validateSeatCounts(ui, economySeats, businessSeats, executiveSeats) {
    if (!isValidSeatCount(economySeats, 20, 100)) {
      ui.setMessage("adminMsg", "Economy seats must be between 20 and 100.", "err");
      return false;
    }
    if (!isValidSeatCount(businessSeats, 10, 40)) {
      ui.setMessage("adminMsg", "Business seats must be between 10 and 40.", "err");
      return false;
    }
    if (!isValidSeatCount(executiveSeats, 5, 30)) {
      ui.setMessage("adminMsg", "Executive seats must be between 5 and 30.", "err");
      return false;
    }
    return true;
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-add-flight") {
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

    // Populate carrier dropdown
    function renderCarrierDropdown() {
      var carriers = storage.getCarriers();
      var opts = carriers.map(function (c) {
        return "<option value=\"" + c.carrierId + "\">" + ui.escapeHtml(c.carrierName) + "</option>";
      }).join("");
      document.getElementById("flightCarrierId").innerHTML = opts || "<option>No carriers found. Add carriers first.</option>";
    }

    renderCarrierDropdown();

    document.getElementById("saveFlightBtn").addEventListener("click", function () {
      var economySeats = num(document.getElementById("seatEconomy").value);
      var businessSeats = num(document.getElementById("seatBusiness").value);
      var executiveSeats = num(document.getElementById("seatExecutive").value);
      var payload = {
        flightId: storage.nextId("flight"),
        carrierId: num(document.getElementById("flightCarrierId").value),
        origin: document.getElementById("origin").value.trim(),
        destination: document.getElementById("destination").value.trim(),
        airFare: num(document.getElementById("airFare").value),
        seatCapacityEconomyClass: economySeats,
        seatCapacityBusinessClass: businessSeats,
        seatCapacityExecutiveClass: executiveSeats
      };

      if (!validateSeatCounts(ui, economySeats, businessSeats, executiveSeats)) {
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

      var list = storage.getFlights();
      list.push(payload);
      storage.saveFlights(list);
      storage.addAudit("CREATE", "FLIGHT", "Flight created " + payload.flightId, session.userId);
      ui.setMessage("adminMsg", "", "info");
      ui.showPopup({
        title: "Success",
        message: "Flight saved successfully! Flight ID: " + payload.flightId + "\nNow go to Flight Schedule to set travel dates and times.",
        buttonText: "OK",
        onClose: function () {
          ["origin", "destination", "airFare", "seatEconomy", "seatBusiness", "seatExecutive"].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) { el.value = ""; }
          });
          var carrierEl = document.getElementById("flightCarrierId");
          if (carrierEl) { carrierEl.selectedIndex = 0; }
          var originEl = document.getElementById("origin");
          if (originEl) { originEl.focus(); }
        }
      });
    });

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminFlightForm = { init: init };
})();
