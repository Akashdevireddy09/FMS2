(function () {
  "use strict";

  function num(value) {
    return Number(value || 0);
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-manage-flights") {
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

    function renderFlights() {
      const carriers = storage.getCarriers();
      const rows = storage.getFlights().map(function (f) {
        const c = carriers.find(function (x) { return Number(x.carrierId) === Number(f.carrierId); });
        const timing = JSON.parse(localStorage.getItem("flight_times_" + f.flightId) || '{}');
        return "<tr>" +
          "<td><input type=\"checkbox\" class=\"flightDelete\" value=\"" + f.flightId + "\" /></td>" +
          "<td>" + f.flightId + "</td><td>" + (c ? ui.escapeHtml(c.carrierName) : f.carrierId) + "</td>" +
          "<td>" + ui.escapeHtml(f.origin) + "</td><td>" + ui.escapeHtml(f.destination) + "</td>" +
          "<td>" + (timing.boardingTime || '—') + "</td><td>" + (timing.arrivalTime || '—') + "</td><td>" + (timing.duration || '—') + "</td>" +
          "<td>" + f.airFare + "</td><td>" + f.seatCapacityEconomyClass + "</td><td>" + f.seatCapacityBusinessClass + "</td><td>" + f.seatCapacityExecutiveClass + "</td>" +
          "</tr>";
      }).join("");
      document.getElementById("flightBody").innerHTML = rows || "<tr><td colspan=\"12\">No flights found.</td></tr>";
    }

    renderFlights();

    const filterBtn = document.getElementById("flightFilterBtn");
    const filterMenu = document.getElementById("flightFilterMenu");

    if (filterBtn && filterMenu) {
      filterBtn.addEventListener("click", function () {
        const isOpen = !filterMenu.classList.contains("hidden");
        filterMenu.classList.toggle("hidden", isOpen);
        filterBtn.setAttribute("aria-expanded", String(!isOpen));
      });
    }

    function closeFilterMenu() {
      if (filterMenu) {
        filterMenu.classList.add("hidden");
      }
      if (filterBtn) {
        filterBtn.setAttribute("aria-expanded", "false");
      }
    }

    document.addEventListener("click", function (event) {
      if (!filterMenu || !filterBtn) {
        return;
      }
      if (filterMenu.contains(event.target) || filterBtn.contains(event.target)) {
        return;
      }
      closeFilterMenu();
    });

    // Flight filters
    const filterAllFlights = document.getElementById("filterAllFlights");
    const filterActiveFlights = document.getElementById("filterActiveFlights");
    const filterInactiveFlights = document.getElementById("filterInactiveFlights");

    if (filterAllFlights) {
      filterAllFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) { row.style.display = ""; });
        closeFilterMenu();
      });
    }

    if (filterActiveFlights) {
      filterActiveFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) {
          const flightId = row.querySelector('.flightDelete') ? row.querySelector('.flightDelete').value : '';
          const scheds = storage.getSchedules().filter(function (s) { return Number(s.flightId) === Number(flightId); });
          row.style.display = scheds.length > 0 ? "" : "none";
        });
        closeFilterMenu();
      });
    }

    if (filterInactiveFlights) {
      filterInactiveFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) {
          const flightId = row.querySelector('.flightDelete') ? row.querySelector('.flightDelete').value : '';
          const scheds = storage.getSchedules().filter(function (s) { return Number(s.flightId) === Number(flightId); });
          row.style.display = scheds.length === 0 ? "" : "none";
        });
        closeFilterMenu();
      });
    }

    document.getElementById("deleteFlightBtn").addEventListener("click", function () {
      const selected = Array.from(document.querySelectorAll(".flightDelete:checked")).map(function (el) { return Number(el.value); });
      if (!selected.length) {
        ui.setMessage("adminMsg", "Please select Flight(s) to delete.", "warn");
        return;
      }
      storage.saveFlights(storage.getFlights().filter(function (f) { return !selected.includes(Number(f.flightId)); }));
      storage.addAudit("DELETE", "FLIGHT", "Deleted flights: " + selected.join(","), session.userId);
      renderFlights();
      ui.setMessage("adminMsg", "Flight(s) deleted successfully.", "ok");
    });

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminFlightList = { init: init };
})();
