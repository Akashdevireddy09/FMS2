(function () {
  "use strict";

  function num(value) {
    return Number(value || 0);
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-manage-flights") {
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

    function renderFlights() {
      var carriers = storage.getCarriers();
      var rows = storage.getFlights().map(function (f) {
        var c = carriers.find(function (x) { return Number(x.carrierId) === Number(f.carrierId); });
        return "<tr>" +
          "<td><input type=\"checkbox\" class=\"flightDelete\" value=\"" + f.flightId + "\" /></td>" +
          "<td>" + f.flightId + "</td>" +
          "<td>" + (c ? ui.escapeHtml(c.carrierName) : f.carrierId) + "</td>" +
          "<td>" + ui.escapeHtml(f.origin) + "</td>" +
          "<td>" + ui.escapeHtml(f.destination) + "</td>" +
          "<td>₹" + f.airFare + "</td>" +
          "<td>" + f.seatCapacityEconomyClass + "</td>" +
          "<td>" + f.seatCapacityBusinessClass + "</td>" +
          "<td>" + f.seatCapacityExecutiveClass + "</td>" +
          "</tr>";
      }).join("");
      document.getElementById("flightBody").innerHTML = rows || "<tr><td colspan=\"9\">No flights found.</td></tr>";
    }

    renderFlights();

    var filterBtn = document.getElementById("flightFilterBtn");
    var filterMenu = document.getElementById("flightFilterMenu");

    if (filterBtn && filterMenu) {
      filterBtn.addEventListener("click", function () {
        var isOpen = !filterMenu.classList.contains("hidden");
        filterMenu.classList.toggle("hidden", isOpen);
        filterBtn.setAttribute("aria-expanded", String(!isOpen));
      });
    }

    function closeFilterMenu() {
      if (filterMenu) { filterMenu.classList.add("hidden"); }
      if (filterBtn) { filterBtn.setAttribute("aria-expanded", "false"); }
    }

    document.addEventListener("click", function (event) {
      if (!filterMenu || !filterBtn) { return; }
      if (filterMenu.contains(event.target) || filterBtn.contains(event.target)) { return; }
      closeFilterMenu();
    });

    var filterAllFlights = document.getElementById("filterAllFlights");
    var filterActiveFlights = document.getElementById("filterActiveFlights");
    var filterInactiveFlights = document.getElementById("filterInactiveFlights");

    if (filterAllFlights) {
      filterAllFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) { row.style.display = ""; });
        closeFilterMenu();
      });
    }
    if (filterActiveFlights) {
      filterActiveFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) {
          var fid = row.querySelector(".flightDelete") ? row.querySelector(".flightDelete").value : "";
          var scheds = storage.getSchedules().filter(function (s) { return Number(s.flightId) === Number(fid); });
          row.style.display = scheds.length > 0 ? "" : "none";
        });
        closeFilterMenu();
      });
    }
    if (filterInactiveFlights) {
      filterInactiveFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) {
          var fid = row.querySelector(".flightDelete") ? row.querySelector(".flightDelete").value : "";
          var scheds = storage.getSchedules().filter(function (s) { return Number(s.flightId) === Number(fid); });
          row.style.display = scheds.length === 0 ? "" : "none";
        });
        closeFilterMenu();
      });
    }

    document.getElementById("deleteFlightBtn").addEventListener("click", function () {
      var selected = Array.from(document.querySelectorAll(".flightDelete:checked")).map(function (el) { return Number(el.value); });
      if (!selected.length) {
        ui.setMessage("adminMsg", "Please select Flight(s) to delete.", "warn");
        return;
      }
      ui.showConfirmPopup({
        title: "Delete Flight(s)",
        message: "Delete the selected flight(s)? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: function () {
        storage.saveFlights(storage.getFlights().filter(function (f) { return !selected.includes(Number(f.flightId)); }));
        storage.addAudit("DELETE", "FLIGHT", "Deleted flights: " + selected.join(","), session.userId);
        renderFlights();
        ui.setMessage("adminMsg", "Flight(s) deleted successfully.", "ok");
        }
      });
    });

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminFlightList = { init: init };
})();
