(function () {
  "use strict";

  function num(value) {
    return Number(value || 0);
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

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-manage-carriers") {
      return;
        // Check URL parameters: view=carrier&option=manage
        const params = new URLSearchParams(window.location.search);
        const view = params.get("view");
        const option = params.get("option");
    
        if (view !== "carrier" || option !== "manage") {
          return;
        }
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
      // Show only the manage section
      const carrierSection = document.getElementById("carrierSection");
      const carrierAddForm = document.getElementById("carrierAddForm");
      const carrierAddActions = document.getElementById("carrierAddActions");
      const carrierManageTable = document.getElementById("carrierManageTable");
      const carrierManageActions = document.getElementById("carrierManageActions");
      const carrierManageNote = document.getElementById("carrierManageNote");

      if (carrierAddForm) carrierAddForm.style.display = "none";
      if (carrierAddActions) carrierAddActions.style.display = "none";
      if (carrierManageTable) carrierManageTable.style.display = "block";
      if (carrierManageActions) carrierManageActions.style.display = "flex";
      if (carrierManageNote) carrierManageNote.style.display = "block";
      if (carrierSection) carrierSection.classList.remove("hidden");

    document.getElementById("adminLogoutBtn").addEventListener("click", function () {
      storage.addAudit("SIGN_OUT", "AUTH", "Admin logout", session.userId);
      security.logout("Signed out successfully.");
    });

    function renderCarriers() {
      const rows = storage.getCarriers().map(function (c) {
        return "<tr>" +
          "<td><input type=\"radio\" name=\"carrierEdit\" value=\"" + c.carrierId + "\" /></td>" +
          "<td>" + c.carrierId + "</td><td>" + ui.escapeHtml(c.carrierName) + "</td>" +
          "<td>" + c.discount30 + "%</td><td>" + c.discount60 + "%</td><td>" + c.discount90 + "%</td><td>" + c.bulkBookingDiscount + "%</td>" +
          "<td><input type=\"checkbox\" class=\"carrierDelete\" value=\"" + c.carrierId + "\" /></td>" +
          "</tr>";
      }).join("");
      document.getElementById("carrierBody").innerHTML = rows || "<tr><td colspan=\"8\">No carriers found.</td></tr>";
    }

    function renderCarriers(filterStatus) {
      filterStatus = filterStatus || "all";
      const allCarriers = storage.getCarriers();
      let carriersToShow = allCarriers;
      
      if (filterStatus === "active") {
        carriersToShow = allCarriers.filter(function (c) { return c.active !== false; });
      } else if (filterStatus === "inactive") {
        carriersToShow = allCarriers.filter(function (c) { return c.active === false; });
      }

      const rows = carriersToShow.map(function (c) {
        const status = c.active !== false ? "Active" : "Inactive";
        const statusClass = c.active !== false ? "style=\"color:#22863a; font-weight:600;\"" : "style=\"color:#cb2431; font-weight:600;\"";
        return "<tr>" +
          "<td><input type=\"radio\" name=\"carrierEdit\" value=\"" + c.carrierId + "\" /></td>" +
          "<td>" + c.carrierId + "</td><td>" + ui.escapeHtml(c.carrierName) + "</td>" +
          "<td " + statusClass + ">" + status + "</td>" +
          "<td>" + c.discount30 + "%</td><td>" + c.discount60 + "%</td><td>" + c.discount90 + "%</td><td>" + c.bulkBookingDiscount + "%</td>" +
          "<td><input type=\"checkbox\" class=\"carrierDelete\" value=\"" + c.carrierId + "\" /></td>" +
          "</tr>";
      }).join("");
      document.getElementById("carrierBody").innerHTML = rows || "<tr><td colspan=\"9\">No carriers found.</td></tr>";
    }

    // Initialize with all carriers
    let currentFilter = "all";
    renderCarriers(currentFilter);

    // Filter button toggle
    const filterBtn = document.getElementById("carrierFilterBtn");
    const filterMenu = document.getElementById("carrierFilterMenu");
    if (filterBtn && filterMenu) {
      filterBtn.addEventListener("click", function () {
        filterMenu.style.display = filterMenu.style.display === "none" ? "block" : "none";
      });
    }

    // Filter option buttons
    const filterOptions = document.querySelectorAll(".carrierFilterOption");
    filterOptions.forEach(function (btn) {
      btn.addEventListener("click", function () {
        currentFilter = this.getAttribute("data-status");
        renderCarriers(currentFilter);
        if (filterMenu) filterMenu.style.display = "none";
      });
    });

    document.getElementById("deleteCarrierBtn").addEventListener("click", function () {
      const selected = Array.from(document.querySelectorAll(".carrierDelete:checked")).map(function (el) { return Number(el.value); });
      if (!selected.length) {
        ui.setMessage("adminMsg", "Please select Carrier(s) to delete.", "warn");
        return;
      }
      storage.saveCarriers(storage.getCarriers().filter(function (c) { return !selected.includes(Number(c.carrierId)); }));
      storage.addAudit("DELETE", "CARRIER", "Deleted carriers: " + selected.join(","), session.userId);
      renderCarriers();
      ui.setMessage("adminMsg", "Carrier(s) deleted successfully.", "ok");
    });

    document.getElementById("editCarrierBtn").addEventListener("click", function () {
      const selected = document.querySelector("input[name='carrierEdit']:checked");
      if (!selected) {
        ui.setMessage("adminMsg", "Please select Carrier to be edited.", "warn");
        return;
      }
      const c = storage.getCarriers().find(function (x) { return Number(x.carrierId) === Number(selected.value); });
      if (!c) {
        return;
      }
      // Set selected carrier in session for editing
      sessionStorage.setItem("fms_edit_carrier", JSON.stringify(c));
      location.href = "edit-carrier.html";
    });

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminCarrierList = { init: init };
})();
