(function () {
  "use strict";

  function num(value) {
    return Number(value || 0);
  }

  function normalizeCity(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function isPastDate(dateString) {
    const selected = new Date(String(dateString) + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "admin") {
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
    ui.readFlash("adminMsg");

    document.getElementById("adminName").textContent = session.userName;
    document.getElementById("adminLogoutBtn").addEventListener("click", function () {
      storage.addAudit("SIGN_OUT", "AUTH", "Admin logout", session.userId);
      security.logout("Signed out successfully.");
    });

    function showSection(id) {
      ["carrierSection", "flightSection", "scheduleSection", "userSection", "analyticsSection", "auditSection"].forEach(function (x) {
        document.getElementById(x).classList.add("hidden");
      });
      document.getElementById(id).classList.remove("hidden");
    }

    document.getElementById("tabCarrier").addEventListener("click", function () { showSection("carrierSection"); renderCarriers(); });
    document.getElementById("tabFlight").addEventListener("click", function () { showSection("flightSection"); renderFlights(); });
    document.getElementById("tabSchedule").addEventListener("click", function () { showSection("scheduleSection"); renderSchedules(); });
    document.getElementById("tabUsers").addEventListener("click", function () { showSection("userSection"); renderUsers(); });
    document.getElementById("tabAnalytics").addEventListener("click", function () { showSection("analyticsSection"); renderAnalytics(); });
    document.getElementById("tabAudit").addEventListener("click", function () { showSection("auditSection"); renderAudit(); });

    let editingCarrierId = null;

    function clearCarrierForm() {
      [
        "carrierId",
        "carrierName",
        "discount30",
        "discount60",
        "discount90",
        "bulkBookingDiscount",
        "refund2Days",
        "refund10Days",
        "refund20Days",
        "silverDiscount",
        "goldDiscount",
        "platinumDiscount"
      ].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) {
          el.value = "";
        }
      });
    }

    function renderCarriers() {
      const rows = storage.getCarriers().map(function (c) {
        return "<tr>" +
          
          "<td>" + c.carrierId + "</td><td>" + ui.escapeHtml(c.carrierName) + "</td>" +
          "<td>" + c.discount30 + "%</td><td>" + c.discount60 + "%</td><td>" + c.discount90 + "%</td><td>" + c.bulkBookingDiscount + "%</td>" +
          "<td><input type=\"radio\" name=\"carrierEdit\" value=\"" + c.carrierId + "\" /></td>" +
          "<td><input type=\"checkbox\" class=\"carrierDelete\" value=\"" + c.carrierId + "\" /></td>" +
          "</tr>";
      }).join("");
      document.getElementById("carrierBody").innerHTML = rows || "<tr><td colspan=\"8\">No carriers found.</td></tr>";
    }

    function upsertCarrier(isEdit) {
      const payload = {
        carrierId: isEdit ? editingCarrierId : storage.nextId("carrier"),
        carrierName: document.getElementById("carrierName").value.trim(),
        discount30: num(document.getElementById("discount30").value),
        discount60: num(document.getElementById("discount60").value),
        discount90: num(document.getElementById("discount90").value),
        bulkBookingDiscount: num(document.getElementById("bulkBookingDiscount").value),
        refund2Days: num(document.getElementById("refund2Days").value),
        refund10Days: num(document.getElementById("refund10Days").value),
        refund20Days: num(document.getElementById("refund20Days").value),
        silverDiscount: num(document.getElementById("silverDiscount").value),
        goldDiscount: num(document.getElementById("goldDiscount").value),
        platinumDiscount: num(document.getElementById("platinumDiscount").value)
      };
      if (!payload.carrierName) {
        ui.setMessage("adminMsg", "Carrier Name is required.", "err");
        return false;
      }

      const carriers = storage.getCarriers();
      let out;
      if (isEdit) {
        out = carriers.map(function (c) { return Number(c.carrierId) === payload.carrierId ? payload : c; });
        storage.addAudit("UPDATE", "CARRIER", "Carrier updated " + payload.carrierId, session.userId);
      } else {
        out = carriers.concat([payload]);
        storage.addAudit("CREATE", "CARRIER", "Carrier created " + payload.carrierId, session.userId);
      }
      storage.saveCarriers(out);
      renderCarriers();
      ui.setMessage("adminMsg", "Carrier data saved successfully.", "ok");
      return true;
    }

    document.getElementById("addCarrierBtn").addEventListener("click", function () {
      const saved = upsertCarrier(Boolean(editingCarrierId));
      if (!saved) {
        return;
      }
      editingCarrierId = null;
      document.getElementById("addCarrierBtn").textContent = "Add Carrier";
      clearCarrierForm();
    });

    document.getElementById("editCarrierBtn").addEventListener("click", function () {
      const selected = document.querySelector("input[name='carrierEdit']:checked");
      if (!selected) {
        ui.setMessage("adminMsg", "Please select Carrier to be Edited.", "warn");
        return;
      }
      const c = storage.getCarriers().find(function (x) { return Number(x.carrierId) === Number(selected.value); });
      if (!c) {
        return;
      }
      editingCarrierId = Number(c.carrierId);
      document.getElementById("carrierId").value = c.carrierId;
      document.getElementById("carrierName").value = c.carrierName;
      document.getElementById("discount30").value = c.discount30;
      document.getElementById("discount60").value = c.discount60;
      document.getElementById("discount90").value = c.discount90;
      document.getElementById("bulkBookingDiscount").value = c.bulkBookingDiscount;
      document.getElementById("refund2Days").value = c.refund2Days;
      document.getElementById("refund10Days").value = c.refund10Days;
      document.getElementById("refund20Days").value = c.refund20Days;
      document.getElementById("silverDiscount").value = c.silverDiscount;
      document.getElementById("goldDiscount").value = c.goldDiscount;
      document.getElementById("platinumDiscount").value = c.platinumDiscount;
      document.getElementById("addCarrierBtn").textContent = "Save Carrier";
      ui.setMessage("adminMsg", "Carrier loaded. Modify fields and click Save Carrier.", "info");
    });

    document.getElementById("deleteCarrierBtn").addEventListener("click", function () {
      const selected = Array.from(document.querySelectorAll(".carrierDelete:checked")).map(function (el) { return Number(el.value); });
      if (!selected.length) {
        ui.setMessage("adminMsg", "Please select Carrier(s) to be Deleted.", "warn");
        return;
      }
      storage.saveCarriers(storage.getCarriers().filter(function (c) { return !selected.includes(Number(c.carrierId)); }));
      storage.addAudit("DELETE", "CARRIER", "Deleted carriers: " + selected.join(","), session.userId);
      renderCarriers();
      ui.setMessage("adminMsg", "Carrier(s) deleted successfully.", "ok");
    });

    function renderFlights() {
      const carriers = storage.getCarriers();
      const rows = storage.getFlights().map(function (f) {
        const c = carriers.find(function (x) { return Number(x.carrierId) === Number(f.carrierId); });
        return "<tr>" +
          "<td><input type=\"checkbox\" class=\"flightDelete\" value=\"" + f.flightId + "\" /></td>" +
          "<td>" + f.flightId + "</td><td>" + (c ? ui.escapeHtml(c.carrierName) : f.carrierId) + "</td>" +
          "<td>" + ui.escapeHtml(f.origin) + "</td><td>" + ui.escapeHtml(f.destination) + "</td>" +
          "<td>" + f.airFare + "</td><td>" + f.seatCapacityEconomyClass + "</td><td>" + f.seatCapacityBusinessClass + "</td><td>" + f.seatCapacityExecutiveClass + "</td>" +
          "</tr>";
      }).join("");
      document.getElementById("flightBody").innerHTML = rows || "<tr><td colspan=\"9\">No flights found.</td></tr>";

      const opts = carriers.map(function (c) { return "<option value=\"" + c.carrierId + "\">" + ui.escapeHtml(c.carrierName) + "</option>"; }).join("");
      document.getElementById("flightCarrierId").innerHTML = opts;
    }

    document.getElementById("saveFlightBtn").addEventListener("click", function () {
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
      const list = storage.getFlights();
      list.push(payload);
      storage.saveFlights(list);
      storage.addAudit("CREATE", "FLIGHT", "Flight created " + payload.flightId, session.userId);
      renderFlights();
      ui.setMessage("adminMsg", "Flight saved. Add a schedule to make it searchable for customers.", "ok");
    });

    document.getElementById("deleteFlightBtn").addEventListener("click", function () {
      const selected = Array.from(document.querySelectorAll(".flightDelete:checked")).map(function (el) { return Number(el.value); });
      storage.saveFlights(storage.getFlights().filter(function (f) { return !selected.includes(Number(f.flightId)); }));
      storage.addAudit("DELETE", "FLIGHT", "Deleted flights: " + selected.join(","), session.userId);
      renderFlights();
    });

    function renderSchedules() {
      const rows = storage.getSchedules().map(function (s) {
        return "<tr>" +
          "<td><input type=\"checkbox\" class=\"scheduleDelete\" value=\"" + s.flightScheduleId + "\" /></td>" +
          "<td>" + s.flightScheduleId + "</td><td>" + s.flightId + "</td><td>" + s.dateOfTravel + "</td><td>" + s.businessClassBookedCount + "</td><td>" + s.economyClassBookedCount + "</td><td>" + s.executiveClassBookedCount + "</td>" +
          "</tr>";
      }).join("");
      document.getElementById("scheduleBody").innerHTML = rows || "<tr><td colspan=\"7\">No schedules found.</td></tr>";
      document.getElementById("scheduleFlightId").innerHTML = storage.getFlights().map(function (f) {
        return "<option value=\"" + f.flightId + "\">" + f.flightId + " - " + ui.escapeHtml(f.origin) + " to " + ui.escapeHtml(f.destination) + "</option>";
      }).join("");
    }

    document.getElementById("saveScheduleBtn").addEventListener("click", function () {
      const travelDate = document.getElementById("scheduleDate").value;
      if (!travelDate || isPastDate(travelDate)) {
        ui.setMessage("adminMsg", "Schedule date must be today or future.", "err");
        return;
      }
      const list = storage.getSchedules();
      list.push({
        flightScheduleId: storage.nextId("schedule"),
        flightId: num(document.getElementById("scheduleFlightId").value),
        dateOfTravel: travelDate,
        businessClassBookedCount: 0,
        economyClassBookedCount: 0,
        executiveClassBookedCount: 0
      });
      storage.saveSchedules(list);
      storage.addAudit("CREATE", "SCHEDULE", "Flight schedule created", session.userId);
      renderSchedules();
      ui.setMessage("adminMsg", "Flight schedule saved.", "ok");
    });

    document.getElementById("deleteScheduleBtn").addEventListener("click", function () {
      const selected = Array.from(document.querySelectorAll(".scheduleDelete:checked")).map(function (el) { return Number(el.value); });
      storage.saveSchedules(storage.getSchedules().filter(function (s) { return !selected.includes(Number(s.flightScheduleId)); }));
      storage.addAudit("DELETE", "SCHEDULE", "Deleted schedules: " + selected.join(","), session.userId);
      renderSchedules();
    });

    function renderUsers() {
      const q = (document.getElementById("userSearch").value || "").toLowerCase();
      const users = storage.getUsers().filter(function (u) {
        if (u.role !== "Customer") {
          return false;
        }
        return !q || u.userName.toLowerCase().includes(q) || String(u.userId).includes(q) || u.emailId.toLowerCase().includes(q);
      });

      document.getElementById("userBody").innerHTML = users.map(function (u) {
        const bookingCount = storage.getBookings().filter(function (b) { return Number(b.userId) === Number(u.userId); }).length;
        return "<tr>" +
          "<td>" + u.userId + "</td><td>" + ui.escapeHtml(u.userName) + "</td><td>" + ui.escapeHtml(u.emailId) + "</td>" +
          "<td>" + ui.escapeHtml(u.customerCategory) + "</td><td>" + (u.active ? "Active" : "Disabled") + "</td>" +
          "<td>" + bookingCount + "</td>" +
          "<td><button data-u=\"" + u.userId + "\" data-a=\"toggle\">Toggle Status</button></td>" +
          "<td><button data-u=\"" + u.userId + "\" data-a=\"upgrade\">Upgrade Tier</button></td>" +
          "</tr>";
      }).join("") || "<tr><td colspan=\"8\">No users found.</td></tr>";

      document.querySelectorAll("button[data-u]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          const userId = Number(btn.getAttribute("data-u"));
          const action = btn.getAttribute("data-a");
          const usersList = storage.getUsers();
          const user = usersList.find(function (x) { return Number(x.userId) === userId; });
          if (!user) {
            return;
          }
          if (action === "toggle") {
            user.active = !user.active;
            storage.addAudit("UPDATE", "USER", "User status toggled " + userId, session.userId);
          } else if (action === "upgrade") {
            user.customerCategory = user.customerCategory === "Silver" ? "Gold" : (user.customerCategory === "Gold" ? "Platinum" : "Silver");
            storage.addAudit("UPDATE", "USER", "Customer category updated " + userId, session.userId);
          }
          storage.saveUsers(usersList);
          renderUsers();
        });
      });
    }

    document.getElementById("userSearchBtn").addEventListener("click", renderUsers);

    function renderAnalytics() {
      const bookings = storage.getBookings();
      const booked = bookings.filter(function (b) { return b.bookingStatus === "Booked"; });
      const cancelled = bookings.filter(function (b) { return b.bookingStatus === "Cancelled"; });
      const revenue = booked.reduce(function (sum, b) { return sum + Number(b.finalAmount || b.bookingAmount || 0); }, 0);

      document.getElementById("analyticsTotalBookings").textContent = String(booked.length);
      document.getElementById("analyticsRevenue").textContent = "INR " + revenue.toFixed(2);
      document.getElementById("analyticsCancelled").textContent = String(cancelled.length);

      const scheduleInventory = storage.getSchedules().map(function (s) {
        const flight = storage.getFlights().find(function (f) { return Number(f.flightId) === Number(s.flightId); });
        if (!flight) {
          return null;
        }
        return "<tr>" +
          "<td>" + s.flightScheduleId + "</td><td>" + flight.flightId + "</td><td>" + ui.escapeHtml(flight.origin + " to " + flight.destination) + "</td><td>" + s.dateOfTravel + "</td>" +
          "<td>" + s.economyClassBookedCount + "/" + flight.seatCapacityEconomyClass + "</td>" +
          "<td>" + s.businessClassBookedCount + "/" + flight.seatCapacityBusinessClass + "</td>" +
          "<td>" + s.executiveClassBookedCount + "/" + flight.seatCapacityExecutiveClass + "</td>" +
          "</tr>";
      }).filter(Boolean).join("");
      document.getElementById("inventoryBody").innerHTML = scheduleInventory || "<tr><td colspan=\"7\">No schedule inventory data.</td></tr>";
    }

    function renderAudit() {
      const rows = storage.getAudit().map(function (a) {
        return "<tr><td>" + ui.escapeHtml(a.createdOn) + "</td><td>" + ui.escapeHtml(a.userId) + "</td><td>" + ui.escapeHtml(a.action) + "</td><td>" + ui.escapeHtml(a.entity) + "</td><td>" + ui.escapeHtml(a.details) + "</td></tr>";
      }).join("");
      document.getElementById("auditBody").innerHTML = rows || "<tr><td colspan=\"5\">No audit records.</td></tr>";
    }

    showSection("carrierSection");
    renderCarriers();
    renderFlights();
    renderSchedules();
    renderUsers();
    renderAnalytics();
    renderAudit();
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminDashboardFlightManagement = { init: init };
})();
