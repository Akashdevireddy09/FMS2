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

  function setFieldError(inputId, message) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(inputId + "Err");
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
    const el = document.getElementById("carrierName");
    const raw = el ? el.value.trim() : "";
    if (!raw) {
      setFieldError("carrierName", "Carrier name is required.");
      return false;
    }
    if (!/^[A-Za-z ]+$/.test(raw)) {
      setFieldError("carrierName", "Only alphabets and spaces are allowed.");
      return false;
    }
    clearFieldError("carrierName");
    return true;
  }

  function validatePercentField(inputId, label) {
    const el = document.getElementById(inputId);
    const raw = el ? String(el.value || "").trim() : "";
    if (!raw) {
      setFieldError(inputId, label + " is required.");
      return false;
    }
    if (!/^\d+$/.test(raw)) {
      setFieldError(inputId, "Only numbers are allowed.");
      return false;
    }
    const value = Number(raw);
    if (value < 0) {
      setFieldError(inputId, label + " cannot be negative.");
      return false;
    }
    if (value >= 100) {
      setFieldError(inputId, label + " must be less than 100.");
      return false;
    }
    clearFieldError(inputId);
    return true;
  }

  function validateRefundRules(values) {
    let valid = true;
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
    const discountFields = [
      ["discount30", "Discount 30 Days"],
      ["discount60", "Discount 60 Days"],
      ["discount90", "Discount 90 Days"],
      ["bulkBookingDiscount", "Bulk Discount"],
      ["silverDiscount", "Silver Discount"],
      ["goldDiscount", "Gold Discount"],
      ["platinumDiscount", "Platinum Discount"]
    ];
    const refundFields = [
      ["refund2Days", "Refund 2 Days"],
      ["refund10Days", "Refund 10 Days"],
      ["refund20Days", "Refund 20+ Days"]
    ];

    let valid = validateCarrierNameField();
    discountFields.concat(refundFields).forEach(function (pair) {
      if (!validatePercentField(pair[0], pair[1])) {
        valid = false;
      }
    });

    if (!valid) {
      return false;
    }

    const values = {
      discount90: num(document.getElementById("discount90").value),
      refund2Days: num(document.getElementById("refund2Days").value),
      refund10Days: num(document.getElementById("refund10Days").value),
      refund20Days: num(document.getElementById("refund20Days").value)
    };
    return validateRefundRules(values);
  }

  function attachCarrierFieldValidation() {
    const carrierName = document.getElementById("carrierName");
    const counter = document.getElementById("carrierNameCount");
    if (carrierName) {
      carrierName.addEventListener("input", function () {
        const original = carrierName.value;
        const sanitized = original.replace(/[^A-Za-z ]/g, "");
        if (original !== sanitized) {
          carrierName.value = sanitized;
          setFieldError("carrierName", "Only alphabets and spaces are allowed.");
        } else {
          validateCarrierNameField();
        }
        if (counter) {
          counter.textContent = carrierName.value.length + " / 20";
        }
      });
      carrierName.addEventListener("blur", validateCarrierNameField);
    }

    [
      ["discount30", "Discount 30 Days"],
      ["discount60", "Discount 60 Days"],
      ["discount90", "Discount 90 Days"],
      ["bulkBookingDiscount", "Bulk Discount"],
      ["refund2Days", "Refund 2 Days"],
      ["refund10Days", "Refund 10 Days"],
      ["refund20Days", "Refund 20+ Days"],
      ["silverDiscount", "Silver Discount"],
      ["goldDiscount", "Gold Discount"],
      ["platinumDiscount", "Platinum Discount"]
    ].forEach(function (pair) {
      const inputId = pair[0];
      const label = pair[1];
      const el = document.getElementById(inputId);
      if (!el) {
        return;
      }
      el.addEventListener("input", function () {
        const original = el.value;
        const digitsOnly = original.replace(/\D/g, "");
        if (digitsOnly !== original) {
          setFieldError(inputId, "Only numbers are allowed.");
        }
        el.value = digitsOnly;
        validatePercentField(inputId, label);
      });
      el.addEventListener("blur", function () {
        validatePercentField(inputId, label);
      });
    });
  }

  function clearCarrierErrors() {
    [
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
    ].forEach(clearFieldError);
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
      ["landingSection", "carrierSection", "flightSection", "scheduleSection", "userSection", "analyticsSection", "auditSection"].forEach(function (x) {
        const node = document.getElementById(x);
        if (node) {
          node.classList.add("hidden");
        }
      });
      const selected = document.getElementById(id);
      if (selected) {
        selected.classList.remove("hidden");
      }
    }

    function bindTab(tabId, handler) {
      const tab = document.getElementById(tabId);
      if (tab) {
        tab.addEventListener("click", handler);
      }
    }

    bindTab("tabHome", function () { showSection("landingSection"); renderLandingPage(currentPeriod); });
    bindTab("tabCarrier", function () { location.href = "manage-carriers.html"; });
    bindTab("tabFlight", function () { location.href = "manage-flights.html"; });
    bindTab("tabSchedule", function () { showSection("scheduleSection"); renderSchedules(); });
    bindTab("tabUsers", function () { showSection("userSection"); renderUsers(); });
    bindTab("tabAnalytics", function () { showSection("analyticsSection"); renderAnalytics(); });
    bindTab("tabAudit", function () { showSection("auditSection"); renderAudit(); });

    // ═══════════════════ LANDING PAGE COMPREHENSIVE ANALYTICS ═══════════════════
    let currentPeriod = "today";

    function getFilteredBookings(period) {
      const bookings = storage.getBookings() || [];
      const now = new Date();
      let filteredBookings = [];

      if (period === "today") {
        const today = now.toISOString().split("T")[0];
        filteredBookings = bookings.filter(function (b) { return b.createdOn && b.createdOn.startsWith(today); });
      } else if (period === "weekly") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(function (b) { return b.createdOn && new Date(b.createdOn) >= weekAgo; });
      } else if (period === "monthly") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(function (b) { return b.createdOn && new Date(b.createdOn) >= monthAgo; });
      } else if (period === "yearly") {
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        filteredBookings = bookings.filter(function (b) { return b.createdOn && new Date(b.createdOn) >= yearAgo; });
      }

      return filteredBookings;
    }

    function renderLandingPage(period) {
      const filteredBookings = getFilteredBookings(period);
      const allBookings = storage.getBookings() || [];
      const allSchedules = storage.getSchedules() || [];
      const allFlights = storage.getFlights() || [];
      const allUsers = storage.getUsers() || [];
      const auditTrail = storage.getAudit() || [];

      // ═════ EXECUTIVE SUMMARY ═════
      const todayStart = new Date().toISOString().split("T")[0];
      const todayBookings = allBookings.filter(function (b) { return b.createdOn && b.createdOn.startsWith(todayStart); });
      const totalRevenue = todayBookings.reduce(function (sum, b) { return sum + (num(b.totalPrice) || 0); }, 0);
      const activeFlightIds = new Set(allSchedules.map(function (s) { return s.flightId; }));
      const pendingCancellations = allBookings.filter(function (b) { return b.bookingStatus === "Pending"; }).length;

      document.getElementById("metricTotalBookings").textContent = todayBookings.length;
      document.getElementById("metricRevenue").textContent = totalRevenue.toFixed(2);
      document.getElementById("metricActiveFlights").textContent = activeFlightIds.size;
      document.getElementById("metricPendingCancellations").textContent = pendingCancellations;

      // ═════ SEAT UTILIZATION ═════
      let totalEconomySeat = 0, totalBusinessSeat = 0, totalExecutiveSeat = 0;
      let bookedEconomySeat = 0, bookedBusinessSeat = 0, bookedExecutiveSeat = 0;

      allFlights.forEach(function (f) {
        totalEconomySeat += f.seatCapacityEconomyClass || 0;
        totalBusinessSeat += f.seatCapacityBusinessClass || 0;
        totalExecutiveSeat += f.seatCapacityExecutiveClass || 0;
      });

      allSchedules.forEach(function (s) {
        bookedEconomySeat += s.economyClassBookedCount || 0;
        bookedBusinessSeat += s.businessClassBookedCount || 0;
        bookedExecutiveSeat += s.executiveClassBookedCount || 0;
      });

      const economyUtil = totalEconomySeat > 0 ? Math.round((bookedEconomySeat / totalEconomySeat) * 100) : 0;
      const businessUtil = totalBusinessSeat > 0 ? Math.round((bookedBusinessSeat / totalBusinessSeat) * 100) : 0;
      const executiveUtil = totalExecutiveSeat > 0 ? Math.round((bookedExecutiveSeat / totalExecutiveSeat) * 100) : 0;

      document.getElementById("seatEconomyFill").style.width = economyUtil + "%";
      document.getElementById("metricSeatEconomy").textContent = economyUtil + "%";
      document.getElementById("seatBusinessFill").style.width = businessUtil + "%";
      document.getElementById("metricSeatBusiness").textContent = businessUtil + "%";
      document.getElementById("seatExecutiveFill").style.width = executiveUtil + "%";
      document.getElementById("metricSeatExecutive").textContent = executiveUtil + "%";

      // ═════ BOOKING STATUS DISTRIBUTION ═════
      const confirmed = todayBookings.filter(function (b) { return b.bookingStatus === "Booked"; }).length;
      const pending = todayBookings.filter(function (b) { return b.bookingStatus === "Pending"; }).length;
      const cancelled = todayBookings.filter(function (b) { return b.bookingStatus === "Cancelled"; }).length;
      const paymentFailed = todayBookings.filter(function (b) { return b.paymentStatus === "Failed"; }).length;

      document.getElementById("statusConfirmed").textContent = confirmed;
      document.getElementById("statusPending").textContent = pending;
      document.getElementById("statusCancelled").textContent = cancelled;
      document.getElementById("metricPaymentFailures").textContent = paymentFailed;

      // ═════ TOP 5 ROUTES BY REVENUE ═════
      const routeRevenue = {};
      todayBookings.forEach(function (b) {
        const flight = allFlights.find(function (f) { return Number(f.flightId) === Number(b.flightId); });
        if (flight) {
          const route = flight.origin + " → " + flight.destination;
          routeRevenue[route] = (routeRevenue[route] || 0) + (num(b.totalPrice) || 0);
        }
      });

      const sortedRoutes = Object.entries(routeRevenue).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
      document.getElementById("topRoutesContainer").innerHTML = sortedRoutes.map(function (r) {
        return "<div class=\"route-item\"><span>" + ui.escapeHtml(r[0]) + "</span><span>₹" + r[1].toFixed(2) + "</span></div>";
      }).join("") || "<div class=\"route-item\">No route data available</div>";

      // ═════ POPULAR CARRIERS ═════
      const carrierBookings = {};
      todayBookings.forEach(function (b) {
        const flight = allFlights.find(function (f) { return Number(f.flightId) === Number(b.flightId); });
        if (flight) {
          carrierBookings[flight.carrierId] = (carrierBookings[flight.carrierId] || 0) + 1;
        }
      });

      const sortedCarriers = Object.entries(carrierBookings).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 5);
      document.getElementById("popularCarriersContainer").innerHTML = sortedCarriers.map(function (c) {
        const carrier = storage.getCarriers().find(function (car) { return Number(car.carrierId) === Number(c[0]); });
        return "<div class=\"carrier-item\"><span>" + ui.escapeHtml(carrier ? carrier.carrierName : "Unknown") + "</span><span>" + c[1] + " bookings</span></div>";
      }).join("") || "<div class=\"carrier-item\">No carrier data available</div>";

      // ═════ USER STATISTICS ═════
      const customers = allUsers.filter(function (u) { return u.role === "Customer"; });
      const activeUsers = customers.filter(function (u) { return u.active; }).length;
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newUsers = customers.filter(function (u) { return u.createdOn && new Date(u.createdOn) >= weekAgo; }).length;

      document.getElementById("statActiveUsers").textContent = activeUsers;
      document.getElementById("statNewUsers").textContent = newUsers;
      document.getElementById("statTotalUsers").textContent = customers.length;

      // ═════ RECENT ADMIN ACTIONS ═════
      const recentActions = auditTrail.filter(function (a) { return a.userId && a.userId !== String(session.userId) || a.action !== "SIGN_OUT"; }).slice(-5).length;
      document.getElementById("metricRecentActions").textContent = auditTrail.length;

      // ═════ OVERSOLD FLIGHTS ═════
      let oversoldCount = 0;
      allSchedules.forEach(function (s) {
        const flight = allFlights.find(function (f) { return Number(f.flightId) === Number(s.flightId); });
        if (flight) {
          const economyOversold = s.economyClassBookedCount > flight.seatCapacityEconomyClass;
          const businessOversold = s.businessClassBookedCount > flight.seatCapacityBusinessClass;
          const executiveOversold = s.executiveClassBookedCount > flight.seatCapacityExecutiveClass;
          if (economyOversold || businessOversold || executiveOversold) {
            oversoldCount++;
          }
        }
      });
      document.getElementById("metricOversoldFlights").textContent = oversoldCount;

      // ═════ LOW INVENTORY ALERTS ═════
      let lowInventoryCount = 0;
      allSchedules.forEach(function (s) {
        const flight = allFlights.find(function (f) { return Number(f.flightId) === Number(s.flightId); });
        if (flight) {
          const economyLeft = (flight.seatCapacityEconomyClass || 0) - (s.economyClassBookedCount || 0);
          const businessLeft = (flight.seatCapacityBusinessClass || 0) - (s.businessClassBookedCount || 0);
          const executiveLeft = (flight.seatCapacityExecutiveClass || 0) - (s.executiveClassBookedCount || 0);
          if (economyLeft < 5 || businessLeft < 3 || executiveLeft < 2) {
            lowInventoryCount++;
          }
        }
      });
      document.getElementById("metricLowInventory").textContent = lowInventoryCount;

      // ═════ PENDING APPROVALS ═════
      const pendingApprovals = allBookings.filter(function (b) { return b.bookingStatus === "Pending"; }).length;
      document.getElementById("metricPendingApprovals").textContent = pendingApprovals;

      // ═════ SYSTEM HEALTH ═════
      const errorCount = auditTrail.filter(function (a) { return a.action && a.action.includes("FAIL"); }).length;
      const healthStatus = errorCount > 10 ? "At Risk" : errorCount > 5 ? "Caution" : "Good";
      document.getElementById("metricSystemHealth").textContent = healthStatus;
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

      // ═════ CLICKABLE METRIC HANDLERS ═════
      document.querySelectorAll(".metric-card.clickable").forEach(function (card) {
        card.addEventListener("click", function () {
          const action = card.getAttribute("data-action");
          if (action === "showBookings") {
            showSection("analyticsSection");
            renderAnalytics();
          } else if (action === "showRevenue") {
            showSection("analyticsSection");
            renderAnalytics();
          } else if (action === "showActiveFlights") {
            showSection("flightSection");
            renderFlights();
          } else if (action === "showPendingCancellations") {
            showSection("userSection");
            renderUsers();
          } else if (action === "showPaymentFailures") {
            showSection("auditSection");
            renderAudit();
          } else if (action === "showOversoldFlights") {
            showSection("flightSection");
            renderFlights();
            ui.setMessage("adminMsg", "Showing flights with inventory issues", "warn");
          } else if (action === "showLowInventory") {
            showSection("flightSection");
            renderFlights();
          } else if (action === "showRecentActions") {
            showSection("auditSection");
            renderAudit();
          } else if (action === "showPendingApprovals") {
            showSection("userSection");
            renderUsers();
          } else if (action === "showRevenueChart") {
            showSection("analyticsSection");
            renderAnalytics();
          }
        });
      });
    }

    let editingCarrierId = null;

    attachCarrierFieldValidation();

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
      clearCarrierErrors();
      if (document.getElementById("carrierNameCount")) {
        document.getElementById("carrierNameCount").textContent = "0 / 20";
      }
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
      if (!validateCarrierForm()) {
        ui.setMessage("adminMsg", "Please correct the highlighted carrier fields.", "err");
        return false;
      }

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
      clearCarrierErrors();
      if (document.getElementById("carrierNameCount")) {
        document.getElementById("carrierNameCount").textContent = String(c.carrierName.length) + " / 20";
      }
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

      const opts = carriers.map(function (c) { return "<option value=\"" + c.carrierId + "\">" + ui.escapeHtml(c.carrierName) + "</option>"; }).join("");
      document.getElementById("flightCarrierId").innerHTML = opts;
    }

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
      renderFlights();
      document.getElementById("boardingTime").value = "";
      document.getElementById("arrivalTime").value = "";
      document.getElementById("flightDuration").value = "";
      ui.setMessage("adminMsg", "Flight saved. Add a schedule to make it searchable for customers.", "ok");
    });

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

    // Flight filters
    const filterAllFlights = document.getElementById("filterAllFlights");
    const filterActiveFlights = document.getElementById("filterActiveFlights");
    const filterInactiveFlights = document.getElementById("filterInactiveFlights");

    if (filterAllFlights) {
      filterAllFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) { row.style.display = ""; });
      });
    }

    if (filterActiveFlights) {
      filterActiveFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) {
          const flightId = row.querySelector('.flightDelete') ? row.querySelector('.flightDelete').value : '';
          const scheds = storage.getSchedules().filter(function (s) { return Number(s.flightId) === Number(flightId); });
          row.style.display = scheds.length > 0 ? "" : "none";
        });
      });
    }

    if (filterInactiveFlights) {
      filterInactiveFlights.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#flightBody tr")).forEach(function (row) {
          const flightId = row.querySelector('.flightDelete') ? row.querySelector('.flightDelete').value : '';
          const scheds = storage.getSchedules().filter(function (s) { return Number(s.flightId) === Number(flightId); });
          row.style.display = scheds.length === 0 ? "" : "none";
        });
      });
    }

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
          "<td><button onclick=\"showUserBookings(" + u.userId + ", '" + ui.escapeHtml(u.userName).replace(/'/g, "\\'") + "', '" + ui.escapeHtml(u.customerCategory).replace(/'/g, "\\'") + "')\">View Bookings</button></td>" +
          "</tr>";
      }).join("") || "<tr><td colspan=\"7\">No users found.</td></tr>";
    }

    window.showUserBookings = function(userId, userName, category) {
      const bookings = storage.getBookings().filter(function (b) { return Number(b.userId) === Number(userId); });
      const flights = storage.getFlights();
      const schedules = storage.getSchedules();
      const carriers = storage.getCarriers();
      
      const bookingsList = bookings.map(function (b) {
        const sched = schedules.find(function (s) { return Number(s.flightScheduleId) === Number(b.flightScheduleId); });
        const fli = sched ? flights.find(function (f) { return Number(f.flightId) === Number(sched.flightId); }) : null;
        const carr = fli ? carriers.find(function (c) { return Number(c.carrierId) === Number(fli.carrierId); }) : null;
        return "<div style=\"background:#f0f4f8; padding:10px; margin:8px 0; border-radius:8px; border-left:3px solid #1e5bb8;\">" +
          "<div><strong>Booking #" + b.bookingId + "</strong></div>" +
          "<div style=\"font-size:0.9rem; color:#333;\">Flight: " + (fli ? fli.origin + " → " + fli.destination : "Unknown") + "</div>" +
          "<div style=\"font-size:0.9rem; color:#333;\">Carrier: " + (carr ? ui.escapeHtml(carr.carrierName) : "Unknown") + "</div>" +
          "<div style=\"font-size:0.9rem; color:#333;\">Ticket: " + b.ticketNumber + " | Seats: " + b.noOfSeatsBooked + " | Class: " + b.classType + "</div>" +
          "<div style=\"font-size:0.9rem; color:#333;\">Date: " + (sched ? sched.dateOfTravel : "N/A") + " | Amount: ₹" + b.finalAmount + "</div>" +
          "</div>";
      }).join("") || "<p style=\"color:#999;\">No bookings found.</p>";
      
      document.getElementById("bookingModalTitle").textContent = "Bookings for " + userName + " (" + category + " Tier)";
      document.getElementById("bookingModalContent").innerHTML = bookingsList;
      document.getElementById("bookingModal").style.display = "flex";
    };

    window.closeBookingModal = function() {
      document.getElementById("bookingModal").style.display = "none";
    };

    document.getElementById("userSearchBtn").addEventListener("click", renderUsers);

    // User Filters
    const filterAllUsers = document.getElementById("filterAllUsers");
    const filterActiveUsers = document.getElementById("filterActiveUsers");
    const filterInactiveUsers = document.getElementById("filterInactiveUsers");

    if (filterAllUsers) {
      filterAllUsers.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#userBody tr")).forEach(function (row) { row.style.display = ""; });
      });
    }

    if (filterActiveUsers) {
      filterActiveUsers.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#userBody tr")).forEach(function (row) {
          const statusCell = row.cells[4];
          row.style.display = statusCell && statusCell.textContent.includes("Active") ? "" : "none";
        });
      });
    }

    if (filterInactiveUsers) {
      filterInactiveUsers.addEventListener("click", function () {
        Array.from(document.querySelectorAll("#userBody tr")).forEach(function (row) {
          const statusCell = row.cells[4];
          row.style.display = statusCell && !statusCell.textContent.includes("Active") ? "" : "none";
        });
      });
    }

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

    function applyViewFromQuery() {
      const params = new URLSearchParams(window.location.search);
      const view = (params.get("view") || "home").toLowerCase();
      const option = (params.get("option") || "").toLowerCase();

      if (view === "carrier") {
        showSection("carrierSection");
        renderCarriers();
        if (option === "add") {
          const carrierName = document.getElementById("carrierName");
          if (carrierName) {
            carrierName.focus();
          }
        }
        return;
      }

      if (view === "flight") {
        showSection("flightSection");
        renderFlights();
        if (option === "active") {
          const btn = document.getElementById("filterActiveFlights");
          if (btn) { btn.click(); }
        } else if (option === "inactive") {
          const btn = document.getElementById("filterInactiveFlights");
          if (btn) { btn.click(); }
        }
        return;
      }

      if (view === "schedule") {
        showSection("scheduleSection");
        renderSchedules();
        if (option === "add") {
          const scheduleDate = document.getElementById("scheduleDate");
          if (scheduleDate) {
            scheduleDate.focus();
          }
        }
        return;
      }

      if (view === "users") {
        showSection("userSection");
        renderUsers();
        if (option === "active") {
          const btn = document.getElementById("filterActiveUsers");
          if (btn) { btn.click(); }
        } else if (option === "inactive") {
          const btn = document.getElementById("filterInactiveUsers");
          if (btn) { btn.click(); }
        }
        return;
      }

      if (view === "analytics") {
        showSection("analyticsSection");
        renderAnalytics();
        return;
      }

      if (view === "audit") {
        showSection("auditSection");
        renderAudit();
        return;
      }

      if (["today", "weekly", "monthly", "yearly"].includes(option)) {
        currentPeriod = option;
      }
      showSection("landingSection");
      renderLandingPage(currentPeriod);
    }

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
