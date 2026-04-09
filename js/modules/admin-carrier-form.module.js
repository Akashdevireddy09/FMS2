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

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-add-carrier") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const option = params.get("option");
    const carrierIdParam = Number(params.get("carrierId"));
    const isEditMode = option === "edit" && Number.isFinite(carrierIdParam);

    const storage = window.FMS.core.storage;
    const security = window.FMS.core.security;
    const ui = window.FMS.core.ui;

    const session = security.requireAuth("Admin");
    if (!session) {
      return;
    }
    security.startSessionGuard();

    document.getElementById("adminName").textContent = session.userName;
    // Show only the add form section
    const carrierSection = document.getElementById("carrierSection");
    const carrierAddForm = document.getElementById("carrierAddForm");
    const carrierAddActions = document.getElementById("carrierAddActions");
    const carrierManageTable = document.getElementById("carrierManageTable");
    const carrierManageActions = document.getElementById("carrierManageActions");
    const carrierManageNote = document.getElementById("carrierManageNote");

    if (carrierAddForm) carrierAddForm.style.display = "grid";
    if (carrierAddActions) carrierAddActions.style.display = "flex";
    if (carrierManageTable) carrierManageTable.style.display = "none";
    if (carrierManageActions) carrierManageActions.style.display = "none";
    if (carrierManageNote) carrierManageNote.style.display = "none";
    if (carrierSection) carrierSection.classList.remove("hidden");

    document.getElementById("adminLogoutBtn").addEventListener("click", function () {
      storage.addAudit("SIGN_OUT", "AUTH", "Admin logout", session.userId);
      security.logout("Signed out successfully.");
    });

    attachCarrierFieldValidation();

    const addCarrierBtn = document.getElementById("addCarrierBtn");
    const carrierIdInput = document.getElementById("carrierId");

    function getNextCarrierIdPreview() {
      const seq = storage.getJSON(storage.keys.seq, {
        user: 2000,
        carrier: 500,
        flight: 9500,
        schedule: 7500,
        booking: 11000
      });
      return Number(seq.carrier || 500) + 1;
    }

    let editingCarrier = null;
    if (isEditMode) {
      const carrier = storage.getCarriers().find(function (c) {
        return Number(c.carrierId) === carrierIdParam;
      });
      editingCarrier = carrier || null;
      if (!carrier) {
        ui.setMessage("adminMsg", "Carrier not found for editing.", "err");
        if (addCarrierBtn) {
          addCarrierBtn.disabled = true;
        }
      } else {
        if (carrierIdInput) carrierIdInput.value = String(carrier.carrierId);
        document.getElementById("carrierName").value = carrier.carrierName || "";
        document.getElementById("discount30").value = String(num(carrier.discount30));
        document.getElementById("discount60").value = String(num(carrier.discount60));
        document.getElementById("discount90").value = String(num(carrier.discount90));
        document.getElementById("bulkBookingDiscount").value = String(num(carrier.bulkBookingDiscount));
        document.getElementById("refund2Days").value = String(num(carrier.refund2Days));
        document.getElementById("refund10Days").value = String(num(carrier.refund10Days));
        document.getElementById("refund20Days").value = String(num(carrier.refund20Days));
        document.getElementById("silverDiscount").value = String(num(carrier.silverDiscount));
        document.getElementById("goldDiscount").value = String(num(carrier.goldDiscount));
        document.getElementById("platinumDiscount").value = String(num(carrier.platinumDiscount));
        if (document.getElementById("carrierNameCount")) {
          document.getElementById("carrierNameCount").textContent = (carrier.carrierName || "").length + " / 20";
        }
        if (addCarrierBtn) {
          addCarrierBtn.textContent = "Update Carrier";
        }
      }
    } else if (carrierIdInput) {
      carrierIdInput.value = String(getNextCarrierIdPreview());
    }

    if (addCarrierBtn) {
      addCarrierBtn.addEventListener("click", function () {
        if (!validateCarrierForm()) {
          ui.setMessage("adminMsg", "Please correct the highlighted carrier fields.", "err");
          return;
        }

        const payload = {
          carrierId: isEditMode ? carrierIdParam : storage.nextId("carrier"),
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
          platinumDiscount: num(document.getElementById("platinumDiscount").value),
          active: isEditMode ? (editingCarrier ? editingCarrier.active !== false : true) : true
        };

        if (!payload.carrierName) {
          ui.setMessage("adminMsg", "Carrier Name is required.", "err");
          return;
        }

        const carriers = storage.getCarriers();
        if (isEditMode) {
          const updated = carriers.map(function (c) {
            return Number(c.carrierId) === carrierIdParam ? Object.assign({}, c, payload) : c;
          });
          storage.saveCarriers(updated);
          storage.addAudit("UPDATE", "CARRIER", "Carrier updated " + payload.carrierId, session.userId);
        } else {
          carriers.push(payload);
          storage.saveCarriers(carriers);
          storage.addAudit("CREATE", "CARRIER", "Carrier created " + payload.carrierId, session.userId);
        }

        ui.showPopup({
          title: "Success",
          message: isEditMode
            ? "Carrier updated successfully! Carrier ID: " + payload.carrierId
            : "Carrier saved successfully! Carrier ID: " + payload.carrierId,
          buttonText: "OK",
          onClose: function () {
            clearCarrierForm();
            if (carrierIdInput) {
              carrierIdInput.value = String(getNextCarrierIdPreview());
            }
            if (addCarrierBtn) {
              addCarrierBtn.textContent = "Add Carrier";
            }
          }
        });
      });
    }

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });
  }
  window.FMS.modules.adminCarrierForm = { init: init };
})();
