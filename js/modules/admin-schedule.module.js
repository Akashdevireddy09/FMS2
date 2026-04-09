(function () {
  "use strict";

  function num(value) {
    return Number(value || 0);
  }

  function isPastDate(dateString) {
    var selected = new Date(String(dateString) + "T00:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  }

  function calculateDuration(boarding, arrival) {
    if (!boarding || !arrival) { return ""; }
    var bParts = boarding.split(":").map(Number);
    var aParts = arrival.split(":").map(Number);
    var bMin = bParts[0] * 60 + bParts[1];
    var aMin = aParts[0] * 60 + aParts[1];
    if (aMin < bMin) { aMin += 24 * 60; }
    var dur = aMin - bMin;
    return Math.floor(dur / 60) + "h " + (dur % 60) + "m";
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-schedule") {
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

    // ─── Auto-calculate duration ───
    var boardingEl = document.getElementById("scheduleBoardingTime");
    var arrivalEl = document.getElementById("scheduleArrivalTime");
    var durationEl = document.getElementById("scheduleDuration");

    function updateDuration() {
      if (boardingEl && arrivalEl && durationEl) {
        durationEl.value = calculateDuration(boardingEl.value, arrivalEl.value);
      }
    }
    if (boardingEl) { boardingEl.addEventListener("change", updateDuration); }
    if (arrivalEl) { arrivalEl.addEventListener("change", updateDuration); }

    // ─── Populate flight dropdown ───
    function populateFlightDropdown() {
      var sel = document.getElementById("scheduleFlightId");
      if (!sel) { return; }
      sel.innerHTML = storage.getFlights().map(function (f) {
        return "<option value=\"" + f.flightId + "\">" + f.flightId + " — " + ui.escapeHtml(f.origin) + " → " + ui.escapeHtml(f.destination) + "</option>";
      }).join("") || "<option value=\"\">No flights available. Add flights first.</option>";
    }

    // ─── Render schedule table ───
    function renderSchedules() {
      var rows = storage.getSchedules().map(function (s) {
        // Retrieve boarding/arrival from localStorage
        var timing = {};
        try {
          timing = JSON.parse(localStorage.getItem("fms_schedule_timing_" + s.flightScheduleId) || "{}");
        } catch (e) {}

        var flight = storage.getFlights().find(function (f) { return Number(f.flightId) === Number(s.flightId); });
        var route = flight ? ui.escapeHtml(flight.origin + " → " + flight.destination) : "—";

        return "<tr>" +
          "<td><input type=\"checkbox\" class=\"scheduleDelete\" value=\"" + s.flightScheduleId + "\" /></td>" +
          "<td>" + s.flightScheduleId + "</td>" +
          "<td>" + s.flightId + "</td>" +
          "<td>" + route + "</td>" +
          "<td>" + s.dateOfTravel + "</td>" +
          "<td>" + (timing.boardingTime || "—") + "</td>" +
          "<td>" + (timing.arrivalTime || "—") + "</td>" +
          "<td>" + (timing.duration || "—") + "</td>" +
          "<td>" + s.economyClassBookedCount + "</td>" +
          "<td>" + s.businessClassBookedCount + "</td>" +
          "<td>" + s.executiveClassBookedCount + "</td>" +
          "</tr>";
      }).join("");
      document.getElementById("scheduleBody").innerHTML = rows || "<tr><td colspan=\"11\">No schedules found.</td></tr>";
    }

    // ─── Toggle add form ───
    var scheduleFormPanel = document.getElementById("scheduleFormPanel");
    var scheduleListPanel = document.getElementById("scheduleListPanel");
    var showAddScheduleBtn = document.getElementById("showAddScheduleBtn");
    var cancelScheduleFormBtn = document.getElementById("cancelScheduleFormBtn");

    // Check URL param: if option=add, auto-show the form
    var params = new URLSearchParams(window.location.search);
    var option = params.get("option") || "";
    var isAddMode = option === "add";
    if (isAddMode) {
      if (scheduleFormPanel) { scheduleFormPanel.style.display = "block"; }
      if (scheduleListPanel) { scheduleListPanel.style.display = "none"; }
    } else {
      if (scheduleFormPanel) { scheduleFormPanel.style.display = "none"; }
      if (scheduleListPanel) { scheduleListPanel.style.display = ""; }
    }

    if (showAddScheduleBtn) {
      showAddScheduleBtn.addEventListener("click", function () {
        location.href = "admin_schedule.html?option=add";
      });
    }

    if (cancelScheduleFormBtn) {
      cancelScheduleFormBtn.addEventListener("click", function () {
        if (isAddMode) {
          location.href = "admin_schedule.html";
          return;
        }
        if (scheduleFormPanel) { scheduleFormPanel.style.display = "none"; }
        // Clear form
        ["scheduleDate","scheduleBoardingTime","scheduleArrivalTime","scheduleDuration"].forEach(function (id) {
          var el = document.getElementById(id); if (el) { el.value = ""; }
        });
      });
    }

    // ─── Save schedule ───
    document.getElementById("saveScheduleBtn").addEventListener("click", function () {
      var travelDate = document.getElementById("scheduleDate").value;
      var boarding = boardingEl ? boardingEl.value : "";
      var arrival = arrivalEl ? arrivalEl.value : "";

      if (!travelDate || isPastDate(travelDate)) {
        ui.setMessage("adminMsg", "Schedule date must be today or in the future.", "err");
        return;
      }
      if (!boarding) {
        ui.setMessage("adminMsg", "Boarding time is required.", "err");
        return;
      }
      if (!arrival) {
        ui.setMessage("adminMsg", "Arrival time is required.", "err");
        return;
      }

      var schedId = storage.nextId("schedule");
      var flightId = num(document.getElementById("scheduleFlightId").value);
      var duration = durationEl ? durationEl.value : calculateDuration(boarding, arrival);

      var list = storage.getSchedules();
      list.push({
        flightScheduleId: schedId,
        flightId: flightId,
        dateOfTravel: travelDate,
        businessClassBookedCount: 0,
        economyClassBookedCount: 0,
        executiveClassBookedCount: 0
      });
      storage.saveSchedules(list);

      // Save boarding, arrival, duration to localStorage
      localStorage.setItem("fms_schedule_timing_" + schedId, JSON.stringify({
        boardingTime: boarding,
        arrivalTime: arrival,
        duration: duration
      }));

      storage.addAudit("CREATE", "SCHEDULE", "Schedule created " + schedId + " for flight " + flightId, session.userId);
      if (!isAddMode) {
        renderSchedules();
      }
      ui.setMessage("adminMsg", "Schedule saved successfully! Schedule ID: " + schedId, "ok");

      // Clear form fields
      ["scheduleDate","scheduleBoardingTime","scheduleArrivalTime","scheduleDuration"].forEach(function (id) {
        var el = document.getElementById(id); if (el) { el.value = ""; }
      });
      if (!isAddMode) {
        if (scheduleFormPanel) { scheduleFormPanel.style.display = "none"; }
      }
    });

    // ─── Delete schedule ───
    document.getElementById("deleteScheduleBtn").addEventListener("click", function () {
      var selected = Array.from(document.querySelectorAll(".scheduleDelete:checked")).map(function (el) { return Number(el.value); });
      if (!selected.length) {
        ui.setMessage("adminMsg", "Please select Schedule(s) to delete.", "warn");
        return;
      }
      ui.showConfirmPopup({
        title: "Delete Schedule(s)",
        message: "Delete the selected schedule(s)? This action cannot be undone.",
        confirmText: "Delete",
        cancelText: "Cancel",
        onConfirm: function () {
        // Also remove timing data from localStorage
        selected.forEach(function (id) {
          localStorage.removeItem("fms_schedule_timing_" + id);
        });
        storage.saveSchedules(storage.getSchedules().filter(function (s) { return !selected.includes(Number(s.flightScheduleId)); }));
        storage.addAudit("DELETE", "SCHEDULE", "Deleted schedules: " + selected.join(","), session.userId);
        renderSchedules();
        ui.setMessage("adminMsg", "Schedule(s) deleted successfully.", "ok");
        }
      });
    });

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });

    // ─── Init ───
    populateFlightDropdown();
    if (!isAddMode) {
      renderSchedules();
    }
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminSchedule = { init: init };
})();
