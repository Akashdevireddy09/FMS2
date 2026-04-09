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

  function isPastDate(dateString) {
    var selected = new Date(String(dateString) + "T00:00:00");
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  }

  function setFieldError(inputId, message) {
    var input = document.getElementById(inputId);
    var err = document.getElementById(inputId + "Err");
    if (input) {
      input.classList.toggle("input-error", Boolean(message));
    }
    if (err) {
      err.textContent = message || "";
      err.classList.toggle("show", Boolean(message));
    }
  }

  function clearFieldError(inputId) {
    setFieldError(inputId, "");
  }

  function validateCarrierNameField() {
    var el = document.getElementById("carrierName");
    var raw = el ? el.value.trim() : "";
    if (!raw) { setFieldError("carrierName", "Carrier name is required."); return false; }
    if (!/^[A-Za-z ]+$/.test(raw)) { setFieldError("carrierName", "Only alphabets and spaces are allowed."); return false; }
    clearFieldError("carrierName");
    return true;
  }

  function validatePercentField(inputId, label) {
    var el = document.getElementById(inputId);
    var raw = el ? String(el.value || "").trim() : "";
    if (!raw) { setFieldError(inputId, label + " is required."); return false; }
    if (!/^\d+$/.test(raw)) { setFieldError(inputId, "Only numbers are allowed."); return false; }
    var value = Number(raw);
    if (value < 0) { setFieldError(inputId, label + " cannot be negative."); return false; }
    if (value >= 100) { setFieldError(inputId, label + " must be less than 100."); return false; }
    clearFieldError(inputId);
    return true;
  }

  function validateRefundRules(values) {
    var valid = true;
    if (!(values.refund2Days < values.refund10Days && values.refund10Days < values.refund20Days)) {
      setFieldError("refund2Days", "Refund order must be: 2 Days < 10 Days < 20+ Days.");
      setFieldError("refund10Days", "Refund order must be: 2 Days < 10 Days < 20+ Days.");
      setFieldError("refund20Days", "Refund order must be: 2 Days < 10 Days < 20+ Days.");
      valid = false;
    }
    if (!(values.refund2Days < values.discount90)) {
      setFieldError("refund2Days", "Refund 2 Days must be less than Discount 90 Days.");
      valid = false;
    }
    return valid;
  }

  function validateCarrierForm() {
    var discountFields = [
      ["discount30","Discount 30 Days"],["discount60","Discount 60 Days"],["discount90","Discount 90 Days"],
      ["bulkBookingDiscount","Bulk Discount"],["silverDiscount","Silver Discount"],
      ["goldDiscount","Gold Discount"],["platinumDiscount","Platinum Discount"]
    ];
    var refundFields = [
      ["refund2Days","Refund 2 Days"],["refund10Days","Refund 10 Days"],["refund20Days","Refund 20+ Days"]
    ];
    var valid = validateCarrierNameField();
    discountFields.concat(refundFields).forEach(function (pair) {
      if (!validatePercentField(pair[0], pair[1])) { valid = false; }
    });
    if (!valid) { return false; }
    var values = {
      discount90: num(document.getElementById("discount90").value),
      refund2Days: num(document.getElementById("refund2Days").value),
      refund10Days: num(document.getElementById("refund10Days").value),
      refund20Days: num(document.getElementById("refund20Days").value)
    };
    return validateRefundRules(values);
  }

  function attachCarrierFieldValidation() {
    var carrierName = document.getElementById("carrierName");
    var counter = document.getElementById("carrierNameCount");
    if (carrierName) {
      carrierName.addEventListener("input", function () {
        var sanitized = carrierName.value.replace(/[^A-Za-z ]/g, "");
        if (carrierName.value !== sanitized) {
          carrierName.value = sanitized;
          setFieldError("carrierName", "Only alphabets and spaces are allowed.");
        } else {
          validateCarrierNameField();
        }
        if (counter) { counter.textContent = carrierName.value.length + " / 20"; }
      });
      carrierName.addEventListener("blur", validateCarrierNameField);
    }
    [
      ["discount30","Discount 30 Days"],["discount60","Discount 60 Days"],["discount90","Discount 90 Days"],
      ["bulkBookingDiscount","Bulk Discount"],["refund2Days","Refund 2 Days"],
      ["refund10Days","Refund 10 Days"],["refund20Days","Refund 20+ Days"],
      ["silverDiscount","Silver Discount"],["goldDiscount","Gold Discount"],["platinumDiscount","Platinum Discount"]
    ].forEach(function (pair) {
      var el = document.getElementById(pair[0]);
      if (!el) { return; }
      el.addEventListener("input", function () {
        var digitsOnly = el.value.replace(/\D/g, "");
        if (digitsOnly !== el.value) { setFieldError(pair[0], "Only numbers are allowed."); }
        el.value = digitsOnly;
        validatePercentField(pair[0], pair[1]);
      });
      el.addEventListener("blur", function () { validatePercentField(pair[0], pair[1]); });
    });
  }

  function clearCarrierErrors() {
    ["carrierName","discount30","discount60","discount90","bulkBookingDiscount",
     "refund2Days","refund10Days","refund20Days","silverDiscount","goldDiscount","platinumDiscount"
    ].forEach(clearFieldError);
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "admin") {
      return;
    }

    var storage = window.FMS.core.storage;
    var security = window.FMS.core.security;
    var ui = window.FMS.core.ui;

    var session = security.requireAuth("Admin");
    if (!session) { return; }
    security.startSessionGuard();
    ui.readFlash("adminMsg");

    document.getElementById("adminName").textContent = session.userName;
    document.getElementById("adminLogoutBtn").addEventListener("click", function () {
      storage.addAudit("SIGN_OUT", "AUTH", "Admin logout", session.userId);
      security.logout("Signed out successfully.");
    });

    // ─── SECTION SWITCHER ───
    function showSection(id) {
      ["landingSection","carrierSection","flightSection","scheduleSection","userSection","analyticsSection","auditSection"].forEach(function (x) {
        var node = document.getElementById(x);
        if (node) { node.classList.add("hidden"); }
      });
      var selected = document.getElementById(id);
      if (selected) { selected.classList.remove("hidden"); }
    }

    // ─── TAB BINDINGS ───
    // Home stays on dashboard
    var tabHome = document.getElementById("tabHome");
    if (tabHome) {
      tabHome.addEventListener("click", function () {
        showSection("landingSection");
        renderLandingPage(currentPeriod);
      });
    }
    // Carrier & Flight — navigate to dedicated pages
    var tabCarrier = document.getElementById("tabCarrier");
    if (tabCarrier) {
      tabCarrier.addEventListener("click", function () { location.href = "manage-carriers.html"; });
    }
    var tabFlight = document.getElementById("tabFlight");
    if (tabFlight) {
      tabFlight.addEventListener("click", function () { location.href = "manage-flights.html"; });
    }
    // Schedule, Users, Analytics, Audit — navigate to dedicated pages
    var tabSchedule = document.getElementById("tabSchedule");
    if (tabSchedule) {
      tabSchedule.addEventListener("click", function () { location.href = "admin_schedule.html"; });
    }
    var tabUsers = document.getElementById("tabUsers");
    if (tabUsers) {
      tabUsers.addEventListener("click", function () { location.href = "admin_users.html"; });
    }
    var tabAnalytics = document.getElementById("tabAnalytics");
    if (tabAnalytics) {
      tabAnalytics.addEventListener("click", function () { location.href = "admin_analytics.html?option=kpi"; });
    }
    var tabAudit = document.getElementById("tabAudit");
    if (tabAudit) {
      tabAudit.addEventListener("click", function () { location.href = "admin_audit.html"; });
    }

    // ═══════════════════ LANDING PAGE ═══════════════════
    var currentPeriod = "today";

    function getFilteredBookings(period) {
      var bookings = storage.getBookings() || [];
      var now = new Date();
      if (period === "today") {
        var today = now.toISOString().split("T")[0];
        return bookings.filter(function (b) { return b.createdOn && b.createdOn.startsWith(today); });
      } else if (period === "weekly") {
        var weekAgo = new Date(now.getTime() - 7 * 86400000);
        return bookings.filter(function (b) { return b.createdOn && new Date(b.createdOn) >= weekAgo; });
      } else if (period === "monthly") {
        var monthAgo = new Date(now.getTime() - 30 * 86400000);
        return bookings.filter(function (b) { return b.createdOn && new Date(b.createdOn) >= monthAgo; });
      } else if (period === "yearly") {
        var yearAgo = new Date(now.getTime() - 365 * 86400000);
        return bookings.filter(function (b) { return b.createdOn && new Date(b.createdOn) >= yearAgo; });
      }
      return bookings;
    }

    function renderLandingPage(period) {
      var allBookings = storage.getBookings() || [];
      var allSchedules = storage.getSchedules() || [];
      var allFlights = storage.getFlights() || [];
      var allUsers = storage.getUsers() || [];
      var auditTrail = storage.getAudit() || [];
      var todayStart = new Date().toISOString().split("T")[0];
      var todayBookings = allBookings.filter(function (b) { return b.createdOn && b.createdOn.startsWith(todayStart); });
      var totalRevenue = todayBookings.reduce(function (sum, b) { return sum + (num(b.totalPrice) || 0); }, 0);
      var activeFlightIds = new Set(allSchedules.map(function (s) { return s.flightId; }));
      var pendingCancellations = allBookings.filter(function (b) { return b.bookingStatus === "Pending"; }).length;

      var el;
      el = document.getElementById("metricTotalBookings"); if (el) el.textContent = todayBookings.length;
      el = document.getElementById("metricRevenue"); if (el) el.textContent = totalRevenue.toFixed(2);
      el = document.getElementById("metricActiveFlights"); if (el) el.textContent = activeFlightIds.size;
      el = document.getElementById("metricPendingCancellations"); if (el) el.textContent = pendingCancellations;

      var totalEcon = 0, totalBiz = 0, totalExec = 0, bookedEcon = 0, bookedBiz = 0, bookedExec = 0;
      allFlights.forEach(function (f) {
        totalEcon += f.seatCapacityEconomyClass || 0;
        totalBiz += f.seatCapacityBusinessClass || 0;
        totalExec += f.seatCapacityExecutiveClass || 0;
      });
      allSchedules.forEach(function (s) {
        bookedEcon += s.economyClassBookedCount || 0;
        bookedBiz += s.businessClassBookedCount || 0;
        bookedExec += s.executiveClassBookedCount || 0;
      });
      var econUtil = totalEcon > 0 ? Math.round((bookedEcon / totalEcon) * 100) : 0;
      var bizUtil = totalBiz > 0 ? Math.round((bookedBiz / totalBiz) * 100) : 0;
      var execUtil = totalExec > 0 ? Math.round((bookedExec / totalExec) * 100) : 0;

      el = document.getElementById("seatEconomyFill"); if (el) el.style.width = econUtil + "%";
      el = document.getElementById("metricSeatEconomy"); if (el) el.textContent = econUtil + "%";
      el = document.getElementById("seatBusinessFill"); if (el) el.style.width = bizUtil + "%";
      el = document.getElementById("metricSeatBusiness"); if (el) el.textContent = bizUtil + "%";
      el = document.getElementById("seatExecutiveFill"); if (el) el.style.width = execUtil + "%";
      el = document.getElementById("metricSeatExecutive"); if (el) el.textContent = execUtil + "%";

      var confirmed = todayBookings.filter(function (b) { return b.bookingStatus === "Booked"; }).length;
      var pending = todayBookings.filter(function (b) { return b.bookingStatus === "Pending"; }).length;
      var cancelled = todayBookings.filter(function (b) { return b.bookingStatus === "Cancelled"; }).length;
      var paymentFailed = todayBookings.filter(function (b) { return b.paymentStatus === "Failed"; }).length;
      el = document.getElementById("statusConfirmed"); if (el) el.textContent = confirmed;
      el = document.getElementById("statusPending"); if (el) el.textContent = pending;
      el = document.getElementById("statusCancelled"); if (el) el.textContent = cancelled;
      el = document.getElementById("metricPaymentFailures"); if (el) el.textContent = paymentFailed;

      var routeRevenue = {};
      todayBookings.forEach(function (b) {
        var flight = allFlights.find(function (f) { return Number(f.flightId) === Number(b.flightId); });
        if (flight) {
          var route = flight.origin + " → " + flight.destination;
          routeRevenue[route] = (routeRevenue[route] || 0) + (num(b.totalPrice) || 0);
        }
      });
      var sortedRoutes = Object.entries(routeRevenue).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
      el = document.getElementById("topRoutesContainer");
      if (el) el.innerHTML = sortedRoutes.map(function (r) {
        return "<div class=\"route-item\"><span>" + ui.escapeHtml(r[0]) + "</span><span>₹" + r[1].toFixed(2) + "</span></div>";
      }).join("") || "<div class=\"route-item\">No route data available</div>";

      var carrierBookings = {};
      todayBookings.forEach(function (b) {
        var flight = allFlights.find(function (f) { return Number(f.flightId) === Number(b.flightId); });
        if (flight) { carrierBookings[flight.carrierId] = (carrierBookings[flight.carrierId] || 0) + 1; }
      });
      var sortedCarriers = Object.entries(carrierBookings).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
      el = document.getElementById("popularCarriersContainer");
      if (el) el.innerHTML = sortedCarriers.map(function (c) {
        var carrier = storage.getCarriers().find(function (car) { return Number(car.carrierId) === Number(c[0]); });
        return "<div class=\"carrier-item\"><span>" + ui.escapeHtml(carrier ? carrier.carrierName : "Unknown") + "</span><span>" + c[1] + " bookings</span></div>";
      }).join("") || "<div class=\"carrier-item\">No carrier data available</div>";

      var customers = allUsers.filter(function (u) { return u.role === "Customer"; });
      var activeUsers = customers.filter(function (u) { return u.active; }).length;
      var weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      var newUsers = customers.filter(function (u) { return u.createdOn && new Date(u.createdOn) >= weekAgo; }).length;
      el = document.getElementById("statActiveUsers"); if (el) el.textContent = activeUsers;
      el = document.getElementById("statNewUsers"); if (el) el.textContent = newUsers;
      el = document.getElementById("statTotalUsers"); if (el) el.textContent = customers.length;
      el = document.getElementById("metricRecentActions"); if (el) el.textContent = auditTrail.length;

      var oversoldCount = 0;
      allSchedules.forEach(function (s) {
        var flight = allFlights.find(function (f) { return Number(f.flightId) === Number(s.flightId); });
        if (flight && (s.economyClassBookedCount > flight.seatCapacityEconomyClass ||
            s.businessClassBookedCount > flight.seatCapacityBusinessClass ||
            s.executiveClassBookedCount > flight.seatCapacityExecutiveClass)) { oversoldCount++; }
      });
      el = document.getElementById("metricOversoldFlights"); if (el) el.textContent = oversoldCount;

      var lowInventoryCount = 0;
      allSchedules.forEach(function (s) {
        var flight = allFlights.find(function (f) { return Number(f.flightId) === Number(s.flightId); });
        if (flight) {
          if ((flight.seatCapacityEconomyClass || 0) - (s.economyClassBookedCount || 0) < 5 ||
              (flight.seatCapacityBusinessClass || 0) - (s.businessClassBookedCount || 0) < 3 ||
              (flight.seatCapacityExecutiveClass || 0) - (s.executiveClassBookedCount || 0) < 2) { lowInventoryCount++; }
        }
      });
      el = document.getElementById("metricLowInventory"); if (el) el.textContent = lowInventoryCount;
      el = document.getElementById("metricPendingApprovals"); if (el) el.textContent = allBookings.filter(function (b) { return b.bookingStatus === "Pending"; }).length;

      var errorCount = auditTrail.filter(function (a) { return a.action && a.action.includes("FAIL"); }).length;
      el = document.getElementById("metricSystemHealth"); if (el) el.textContent = errorCount > 10 ? "At Risk" : errorCount > 5 ? "Caution" : "Good";
    }

    function attachLandingPageListeners() {
      document.querySelectorAll(".period-btn").forEach(function (btn) {
        btn.addEventListener("click", function () {
          document.querySelectorAll(".period-btn").forEach(function (b) { b.classList.remove("active"); });
          btn.classList.add("active");
          currentPeriod = btn.getAttribute("data-period");
          renderLandingPage(currentPeriod);
        });
      });

      document.querySelectorAll(".metric-card.clickable").forEach(function (card) {
        card.addEventListener("click", function () {
          var action = card.getAttribute("data-action");
          if (action === "showBookings" || action === "showRevenue" || action === "showRevenueChart") {
            location.href = "admin_analytics.html?option=kpi";
          } else if (action === "showActiveFlights" || action === "showOversoldFlights" || action === "showLowInventory") {
            location.href = "admin_analytics.html?option=inventory";
          } else if (action === "showPendingCancellations" || action === "showPendingApprovals") {
            location.href = "admin_users.html";
          } else if (action === "showPaymentFailures" || action === "showRecentActions") {
            location.href = "admin_audit.html";
          }
        });
      });
    }

    // ─── CARRIER MANAGEMENT (on dashboard) ───
    var editingCarrierId = null;
    attachCarrierFieldValidation();

    function clearCarrierForm() {
      ["carrierId","carrierName","discount30","discount60","discount90","bulkBookingDiscount",
       "refund2Days","refund10Days","refund20Days","silverDiscount","goldDiscount","platinumDiscount"
      ].forEach(function (id) {
        var el = document.getElementById(id); if (el) { el.value = ""; }
      });
      clearCarrierErrors();
      var counter = document.getElementById("carrierNameCount");
      if (counter) { counter.textContent = "0 / 20"; }
    }

    function renderCarriers() {
      var rows = storage.getCarriers().map(function (c) {
        return "<tr>" +
          "<td>" + c.carrierId + "</td><td>" + ui.escapeHtml(c.carrierName) + "</td>" +
          "<td>" + c.discount30 + "%</td><td>" + c.discount60 + "%</td><td>" + c.discount90 + "%</td><td>" + c.bulkBookingDiscount + "%</td>" +
          "<td><input type=\"radio\" name=\"carrierEdit\" value=\"" + c.carrierId + "\" /></td>" +
          "<td><input type=\"checkbox\" class=\"carrierDelete\" value=\"" + c.carrierId + "\" /></td>" +
          "</tr>";
      }).join("");
      var body = document.getElementById("carrierBody");
      if (body) { body.innerHTML = rows || "<tr><td colspan=\"8\">No carriers found.</td></tr>"; }
    }

    function upsertCarrier(isEdit) {
      if (!validateCarrierForm()) {
        ui.setMessage("adminMsg", "Please correct the highlighted carrier fields.", "err");
        return false;
      }
      var payload = {
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
      if (!payload.carrierName) { ui.setMessage("adminMsg", "Carrier Name is required.", "err"); return false; }
      var carriers = storage.getCarriers();
      var out;
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

    var addCarrierBtn = document.getElementById("addCarrierBtn");
    if (addCarrierBtn) {
      addCarrierBtn.addEventListener("click", function () {
        var saved = upsertCarrier(Boolean(editingCarrierId));
        if (!saved) { return; }
        editingCarrierId = null;
        addCarrierBtn.textContent = "Add Carrier";
        clearCarrierForm();
      });
    }

    var editCarrierBtn = document.getElementById("editCarrierBtn");
    if (editCarrierBtn) {
      editCarrierBtn.addEventListener("click", function () {
        var selected = document.querySelector("input[name='carrierEdit']:checked");
        if (!selected) { ui.setMessage("adminMsg", "Please select Carrier to be Edited.", "warn"); return; }
        var c = storage.getCarriers().find(function (x) { return Number(x.carrierId) === Number(selected.value); });
        if (!c) { return; }
        editingCarrierId = Number(c.carrierId);
        ["carrierId","carrierName","discount30","discount60","discount90","bulkBookingDiscount",
         "refund2Days","refund10Days","refund20Days","silverDiscount","goldDiscount","platinumDiscount"
        ].forEach(function (id) {
          var el = document.getElementById(id); if (el) { el.value = c[id] !== undefined ? c[id] : ""; }
        });
        clearCarrierErrors();
        var counter = document.getElementById("carrierNameCount");
        if (counter) { counter.textContent = String(c.carrierName.length) + " / 20"; }
        if (addCarrierBtn) { addCarrierBtn.textContent = "Save Carrier"; }
        ui.setMessage("adminMsg", "Carrier loaded. Modify fields and click Save Carrier.", "info");
      });
    }

    var deleteCarrierBtn = document.getElementById("deleteCarrierBtn");
    if (deleteCarrierBtn) {
      deleteCarrierBtn.addEventListener("click", function () {
        var selected = Array.from(document.querySelectorAll(".carrierDelete:checked")).map(function (el) { return Number(el.value); });
        if (!selected.length) { ui.setMessage("adminMsg", "Please select Carrier(s) to be Deleted.", "warn"); return; }
        ui.showConfirmPopup({
          title: "Delete Carrier(s)",
          message: "Delete the selected carrier(s)? This action cannot be undone.",
          confirmText: "Delete",
          cancelText: "Cancel",
          onConfirm: function () {
          storage.saveCarriers(storage.getCarriers().filter(function (c) { return !selected.includes(Number(c.carrierId)); }));
          storage.addAudit("DELETE", "CARRIER", "Deleted carriers: " + selected.join(","), session.userId);
          renderCarriers();
          ui.setMessage("adminMsg", "Carrier(s) deleted successfully.", "ok");
          }
        });
      });
    }

    // ─── FLIGHT MANAGEMENT (on dashboard) ───
    // NOTE: boardingTime and arrivalTime are NOT part of flight — they live in schedule.
    function renderFlights() {
      var carriers = storage.getCarriers();
      var rows = storage.getFlights().map(function (f) {
        var c = carriers.find(function (x) { return Number(x.carrierId) === Number(f.carrierId); });
        return "<tr>" +
          "<td><input type=\"checkbox\" class=\"flightDelete\" value=\"" + f.flightId + "\" /></td>" +
          "<td>" + f.flightId + "</td><td>" + (c ? ui.escapeHtml(c.carrierName) : f.carrierId) + "</td>" +
          "<td>" + ui.escapeHtml(f.origin) + "</td><td>" + ui.escapeHtml(f.destination) + "</td>" +
          "<td>" + f.airFare + "</td><td>" + f.seatCapacityEconomyClass + "</td>" +
          "<td>" + f.seatCapacityBusinessClass + "</td><td>" + f.seatCapacityExecutiveClass + "</td>" +
          "</tr>";
      }).join("");
      var body = document.getElementById("flightBody");
      if (body) { body.innerHTML = rows || "<tr><td colspan=\"9\">No flights found.</td></tr>"; }

      var opts = carriers.map(function (c) { return "<option value=\"" + c.carrierId + "\">" + ui.escapeHtml(c.carrierName) + "</option>"; }).join("");
      var sel = document.getElementById("flightCarrierId");
      if (sel) { sel.innerHTML = opts; }
    }

    var saveFlightBtn = document.getElementById("saveFlightBtn");
    if (saveFlightBtn) {
      saveFlightBtn.addEventListener("click", function () {
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
          ui.setMessage("adminMsg", "Origin and Destination must be different valid cities.", "err"); return;
        }
        if (payload.airFare <= 0) {
          ui.setMessage("adminMsg", "Air fare must be greater than zero.", "err"); return;
        }
        var list = storage.getFlights();
        list.push(payload);
        storage.saveFlights(list);
        storage.addAudit("CREATE", "FLIGHT", "Flight created " + payload.flightId, session.userId);
        renderFlights();
        ui.setMessage("adminMsg", "Flight saved. Go to Flight Schedule to set boarding/arrival times and dates.", "ok");
      });
    }

    var deleteFlightBtn = document.getElementById("deleteFlightBtn");
    if (deleteFlightBtn) {
      deleteFlightBtn.addEventListener("click", function () {
        var selected = Array.from(document.querySelectorAll(".flightDelete:checked")).map(function (el) { return Number(el.value); });
        if (!selected.length) { ui.setMessage("adminMsg", "Please select Flight(s) to delete.", "warn"); return; }
        ui.showConfirmPopup({
          title: "Delete Flight(s)",
          message: "Delete the selected flight(s)? This action cannot be undone.",
          confirmText: "Delete",
          cancelText: "Cancel",
          onConfirm: function () {
          storage.saveFlights(storage.getFlights().filter(function (f) { return !selected.includes(Number(f.flightId)); }));
          storage.addAudit("DELETE", "FLIGHT", "Deleted flights: " + selected.join(","), session.userId);
          renderFlights();
          ui.setMessage("adminMsg", "Flight(s) deleted.", "ok");
          }
        });
      });
    }

    // Flight filters
    ["filterAllFlights","filterActiveFlights","filterInactiveFlights"].forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) { return; }
      btn.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) {
          if (id === "filterAllFlights") {
            row.style.display = "";
          } else {
            var fid = row.querySelector(".flightDelete") ? row.querySelector(".flightDelete").value : "";
            var scheds = storage.getSchedules().filter(function (s) { return Number(s.flightId) === Number(fid); });
            row.style.display = (id === "filterActiveFlights" ? scheds.length > 0 : scheds.length === 0) ? "" : "none";
          }
        });
      });
    });

    // ─── SCHEDULE section on dashboard (read-only overview) ───
    function renderSchedules() {
      var rows = storage.getSchedules().map(function (s) {
        var timing = JSON.parse(localStorage.getItem("fms_schedule_timing_" + s.flightScheduleId) || "{}");
        return "<tr>" +
          "<td><input type=\"checkbox\" class=\"scheduleDelete\" value=\"" + s.flightScheduleId + "\" /></td>" +
          "<td>" + s.flightScheduleId + "</td><td>" + s.flightId + "</td><td>" + s.dateOfTravel + "</td>" +
          "<td>" + (timing.boardingTime || "—") + "</td><td>" + (timing.arrivalTime || "—") + "</td>" +
          "<td>" + s.businessClassBookedCount + "</td><td>" + s.economyClassBookedCount + "</td><td>" + s.executiveClassBookedCount + "</td>" +
          "</tr>";
      }).join("");
      var body = document.getElementById("scheduleBody");
      if (body) { body.innerHTML = rows || "<tr><td colspan=\"9\">No schedules found.</td></tr>"; }

      var sel = document.getElementById("scheduleFlightId");
      if (sel) {
        sel.innerHTML = storage.getFlights().map(function (f) {
          return "<option value=\"" + f.flightId + "\">" + f.flightId + " - " + ui.escapeHtml(f.origin) + " to " + ui.escapeHtml(f.destination) + "</option>";
        }).join("");
      }
    }

    var saveScheduleBtn = document.getElementById("saveScheduleBtn");
    if (saveScheduleBtn) {
      saveScheduleBtn.addEventListener("click", function () {
        var travelDate = document.getElementById("scheduleDate").value;
        if (!travelDate || isPastDate(travelDate)) {
          ui.setMessage("adminMsg", "Schedule date must be today or in the future.", "err"); return;
        }
        var schedId = storage.nextId("schedule");
        var list = storage.getSchedules();
        list.push({
          flightScheduleId: schedId,
          flightId: num(document.getElementById("scheduleFlightId").value),
          dateOfTravel: travelDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        });
        storage.saveSchedules(list);
        storage.addAudit("CREATE", "SCHEDULE", "Flight schedule created", session.userId);
        renderSchedules();
        ui.setMessage("adminMsg", "Schedule saved. Use Flight Schedule page to set boarding/arrival times.", "ok");
      });
    }

    var deleteScheduleBtn = document.getElementById("deleteScheduleBtn");
    if (deleteScheduleBtn) {
      deleteScheduleBtn.addEventListener("click", function () {
        var selected = Array.from(document.querySelectorAll(".scheduleDelete:checked")).map(function (el) { return Number(el.value); });
        if (!selected.length) { ui.setMessage("adminMsg", "Please select Schedule(s) to delete.", "warn"); return; }
        ui.showConfirmPopup({
          title: "Delete Schedule(s)",
          message: "Delete the selected schedule(s)? This action cannot be undone.",
          confirmText: "Delete",
          cancelText: "Cancel",
          onConfirm: function () {
          storage.saveSchedules(storage.getSchedules().filter(function (s) { return !selected.includes(Number(s.flightScheduleId)); }));
          storage.addAudit("DELETE", "SCHEDULE", "Deleted schedules: " + selected.join(","), session.userId);
          renderSchedules();
          }
        });
      });
    }

    // ─── USER MANAGEMENT ───
    function renderUsers() {
      var q = (document.getElementById("userSearch") ? document.getElementById("userSearch").value : "").toLowerCase();
      var users = storage.getUsers().filter(function (u) {
        if (u.role !== "Customer") { return false; }
        return !q || u.userName.toLowerCase().includes(q) || String(u.userId).includes(q) || u.emailId.toLowerCase().includes(q);
      });
      var body = document.getElementById("userBody");
      if (!body) { return; }
      body.innerHTML = users.map(function (u) {
        var bookingCount = storage.getBookings().filter(function (b) { return Number(b.userId) === Number(u.userId); }).length;
        return "<tr>" +
          "<td>" + u.userId + "</td><td>" + ui.escapeHtml(u.userName) + "</td><td>" + ui.escapeHtml(u.emailId) + "</td>" +
          "<td>" + ui.escapeHtml(u.customerCategory) + "</td><td>" + (u.active ? "Active" : "Disabled") + "</td>" +
          "<td>" + bookingCount + "</td>" +
          "<td><button onclick=\"showUserBookings(" + u.userId + ", '" + ui.escapeHtml(u.userName).replace(/'/g, "\\'") + "', '" + ui.escapeHtml(u.customerCategory).replace(/'/g, "\\'") + "')\">View Bookings</button></td>" +
          "</tr>";
      }).join("") || "<tr><td colspan=\"7\">No users found.</td></tr>";
    }

    window.showUserBookings = function (userId, userName, category) {
      var bookings = storage.getBookings().filter(function (b) { return Number(b.userId) === Number(userId); });
      var flights = storage.getFlights(); var schedules = storage.getSchedules(); var carriers = storage.getCarriers();
      var bookingsList = bookings.map(function (b) {
        var sched = schedules.find(function (s) { return Number(s.flightScheduleId) === Number(b.flightScheduleId); });
        var fli = sched ? flights.find(function (f) { return Number(f.flightId) === Number(sched.flightId); }) : null;
        var carr = fli ? carriers.find(function (c) { return Number(c.carrierId) === Number(fli.carrierId); }) : null;
        return "<div style=\"background:#f0f4f8; padding:10px; margin:8px 0; border-radius:8px; border-left:3px solid #1e5bb8;\">" +
          "<div><strong>Booking #" + b.bookingId + "</strong></div>" +
          "<div>Flight: " + (fli ? fli.origin + " → " + fli.destination : "Unknown") + "</div>" +
          "<div>Carrier: " + (carr ? ui.escapeHtml(carr.carrierName) : "Unknown") + "</div>" +
          "<div>Ticket: " + b.ticketNumber + " | Seats: " + b.noOfSeatsBooked + " | Class: " + b.classType + "</div>" +
          "<div>Date: " + (sched ? sched.dateOfTravel : "N/A") + " | Amount: ₹" + b.finalAmount + "</div></div>";
      }).join("") || "<p style=\"color:#999;\">No bookings found.</p>";
      var title = document.getElementById("bookingModalTitle");
      var content = document.getElementById("bookingModalContent");
      var modal = document.getElementById("bookingModal");
      if (title) { title.textContent = "Bookings for " + userName + " (" + category + " Tier)"; }
      if (content) { content.innerHTML = bookingsList; }
      if (modal) { modal.style.display = "flex"; }
    };

    window.closeBookingModal = function () {
      var modal = document.getElementById("bookingModal");
      if (modal) { modal.style.display = "none"; }
    };

    var userSearchBtn = document.getElementById("userSearchBtn");
    if (userSearchBtn) { userSearchBtn.addEventListener("click", renderUsers); }

    ["filterAllUsers","filterActiveUsers","filterInactiveUsers"].forEach(function (id) {
      var btn = document.getElementById(id);
      if (!btn) { return; }
      btn.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#userBody tr")).forEach(function (row) {
          if (id === "filterAllUsers") { row.style.display = ""; }
          else {
            var statusCell = row.cells[4];
            var isActive = statusCell && statusCell.textContent.includes("Active");
            row.style.display = (id === "filterActiveUsers" ? isActive : !isActive) ? "" : "none";
          }
        });
      });
    });

    // ─── ANALYTICS ───
    function renderAnalytics() {
      var bookings = storage.getBookings();
      var booked = bookings.filter(function (b) { return b.bookingStatus === "Booked"; });
      var cancelled = bookings.filter(function (b) { return b.bookingStatus === "Cancelled"; });
      var revenue = booked.reduce(function (sum, b) { return sum + Number(b.finalAmount || b.bookingAmount || 0); }, 0);
      var el;
      el = document.getElementById("analyticsTotalBookings"); if (el) el.textContent = booked.length;
      el = document.getElementById("analyticsRevenue"); if (el) el.textContent = "INR " + revenue.toFixed(2);
      el = document.getElementById("analyticsCancelled"); if (el) el.textContent = cancelled.length;
      var inv = storage.getSchedules().map(function (s) {
        var flight = storage.getFlights().find(function (f) { return Number(f.flightId) === Number(s.flightId); });
        if (!flight) { return null; }
        return "<tr><td>" + s.flightScheduleId + "</td><td>" + flight.flightId + "</td><td>" + ui.escapeHtml(flight.origin + " to " + flight.destination) + "</td><td>" + s.dateOfTravel + "</td>" +
          "<td>" + s.economyClassBookedCount + "/" + flight.seatCapacityEconomyClass + "</td>" +
          "<td>" + s.businessClassBookedCount + "/" + flight.seatCapacityBusinessClass + "</td>" +
          "<td>" + s.executiveClassBookedCount + "/" + flight.seatCapacityExecutiveClass + "</td></tr>";
      }).filter(Boolean).join("");
      var body = document.getElementById("inventoryBody");
      if (body) { body.innerHTML = inv || "<tr><td colspan=\"7\">No schedule inventory data.</td></tr>"; }
    }

    // ─── AUDIT ───
    function renderAudit() {
      var rows = storage.getAudit().map(function (a) {
        return "<tr><td>" + ui.escapeHtml(a.createdOn) + "</td><td>" + ui.escapeHtml(a.userId) + "</td><td>" + ui.escapeHtml(a.action) + "</td><td>" + ui.escapeHtml(a.entity) + "</td><td>" + ui.escapeHtml(a.details) + "</td></tr>";
      }).join("");
      var body = document.getElementById("auditBody");
      if (body) { body.innerHTML = rows || "<tr><td colspan=\"5\">No audit records.</td></tr>"; }
    }

    // ─── APPLY VIEW FROM QUERY (no auto-redirect) ───
    function applyViewFromQuery() {
      var params = new URLSearchParams(window.location.search);
      var view = (params.get("view") || "home").toLowerCase();
      var option = (params.get("option") || "").toLowerCase();

      if (view === "carrier") {
        showSection("carrierSection"); renderCarriers();
        return;
      }
      if (view === "flight") {
        showSection("flightSection"); renderFlights();
        if (option === "active") { var b = document.getElementById("filterActiveFlights"); if (b) b.click(); }
        else if (option === "inactive") { var b2 = document.getElementById("filterInactiveFlights"); if (b2) b2.click(); }
        return;
      }
      // schedule, users, analytics, audit now open their own pages — 
      // but if someone lands here with those view params, show landing
      showSection("landingSection");
      if (["today","weekly","monthly","yearly"].includes(option)) { currentPeriod = option; }
      renderLandingPage(currentPeriod);
    }

    // ─── INIT ───
    attachLandingPageListeners();
    renderCarriers();
    renderFlights();
    renderSchedules();
    renderUsers();
    renderAnalytics();
    renderAudit();
    applyViewFromQuery();
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminDashboardFlightManagement = { init: init };
})();
