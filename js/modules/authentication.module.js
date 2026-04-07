// (function () {
//   "use strict";

//   function isAlphaSpace(value) {
//     return /^[A-Za-z][A-Za-z\s]{1,49}$/.test(String(value || "").trim());
//   }

//   function isValidEmail(value) {
//     return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(value || "").trim());
//   }

//   function isFutureDate(value) {
//     const dt = new Date(String(value) + "T00:00:00");
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);
//     return dt > today;
//   }

//   function initLogin() {
//     if (document.body.getAttribute("data-page") !== "login") {
//       return;
//     }

//     const storage = window.FMS.core.storage;
//     const security = window.FMS.core.security;
//     const ui = window.FMS.core.ui;

//     storage.ensureSeed();
//     ui.readFlash("loginMsg");

//     const session = security.getSession();
//     if (session) {
//       location.href = session.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
//       return;
//     }

//     document.getElementById("loginForm").addEventListener("submit", function (event) {
//       event.preventDefault();
//       ui.setMessage("loginMsg", "", "info");

//       const userId = document.getElementById("userId").value.trim();
//       const password = document.getElementById("password").value.trim();
//       if (!userId || !password) {
//         ui.setMessage("loginMsg", "All fields are required.", "err");
//         return;
//       }

//       const user = storage.getUsers().find(function (u) {
//         return Number(u.userId) === Number(userId);
//       });

//       if (!user || !user.active) {
//         ui.setMessage("loginMsg", "Invalid user credentials or account disabled.", "err");
//         return;
//       }

//       if (user.password !== security.encryptCaesar(password)) {
//         ui.setMessage("loginMsg", "User Id and/or Password is wrong. Please check your credentials.", "err");
//         return;
//       }

//       security.saveSession({
//         userId: user.userId,
//         role: user.role,
//         userName: user.userName,
//         lastActive: Date.now(),
//         loginAt: storage.nowIso()
//       });
//       storage.addAudit("SIGN_IN", "AUTH", "Successful sign in", user.userId);
//       location.href = user.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
//     });
//   }

//   function initRegister() {
//     if (document.body.getAttribute("data-page") !== "register") {
//       return;
//     }

//     const storage = window.FMS.core.storage;
//     const security = window.FMS.core.security;
//     const ui = window.FMS.core.ui;

//     storage.ensureSeed();

//     const generatedId = storage.nextId("user");
//     document.getElementById("newUserId").value = String(generatedId);

//     document.getElementById("registerForm").addEventListener("submit", function (event) {
//       event.preventDefault();
//       ui.setMessage("registerMsg", "", "info");

//       const payload = {
//         userId: generatedId,
//         userName: document.getElementById("userName").value.trim(),
//         password: document.getElementById("regPassword").value.trim(),
//         customerCategory: document.getElementById("customerCategory").value,
//         phone: document.getElementById("phone").value.trim(),
//         emailId: document.getElementById("email").value.trim(),
//         address1: document.getElementById("address1").value.trim(),
//         address2: document.getElementById("address2").value.trim(),
//         city: document.getElementById("city").value.trim(),
//         state: document.getElementById("state").value.trim(),
//         country: document.getElementById("country").value.trim(),
//         zipCode: document.getElementById("zipCode").value.trim(),
//         dob: document.getElementById("dob").value,
//         role: "Customer",
//         active: true
//       };

//       const allFilled = Object.keys(payload).every(function (key) {
//         return payload[key] !== "" && payload[key] !== null;
//       });
//       if (!allFilled) {
//         ui.setMessage("registerMsg", "All fields are mandatory.", "err");
//         return;
//       }
//       if (!/^\d{10}$/.test(payload.phone)) {
//         ui.setMessage("registerMsg", "Phone number must contain exactly 10 digits.", "err");
//         return;
//       }
//       if (!isValidEmail(payload.emailId)) {
//         ui.setMessage("registerMsg", "Please enter a valid email address.", "err");
//         return;
//       }
//       if (!isAlphaSpace(payload.userName)) {
//         ui.setMessage("registerMsg", "User name should contain letters and spaces only.", "err");
//         return;
//       }
//       if (!isAlphaSpace(payload.city) || !isAlphaSpace(payload.state) || !isAlphaSpace(payload.country)) {
//         ui.setMessage("registerMsg", "City, State and Country should contain letters and spaces only.", "err");
//         return;
//       }
//       if (!/^\d{5,10}$/.test(payload.zipCode)) {
//         ui.setMessage("registerMsg", "Zip code should be 5 to 10 digits.", "err");
//         return;
//       }
//       if (isFutureDate(payload.dob)) {
//         ui.setMessage("registerMsg", "Date of birth cannot be in the future.", "err");
//         return;
//       }
//       if (!security.validatePassword(payload.password)) {
//         ui.setMessage("registerMsg", "Password must be at least 8 chars, include uppercase, number and special character.", "err");
//         return;
//       }

//       const users = storage.getUsers();
//       if (users.some(function (u) { return u.emailId.toLowerCase() === payload.emailId.toLowerCase(); })) {
//         ui.setMessage("registerMsg", "Email already registered.", "err");
//         return;
//       }

//       payload.password = security.encryptCaesar(payload.password);
//       users.push(payload);
//       storage.saveUsers(users);
//       storage.addAudit("CREATE", "USER", "New customer registration", generatedId);

//       sessionStorage.setItem("fms_flash", "Registration successful.");
//       location.href = "registration_success.html?userId=" + encodeURIComponent(String(generatedId));
//     });
//   }

//   function initRegisterSuccess() {
//     if (document.body.getAttribute("data-page") !== "register-success") {
//       return;
//     }
//     const ui = window.FMS.core.ui;
//     ui.readFlash("successMsg");
//     const params = new URLSearchParams(location.search);
//     document.getElementById("registeredUserId").textContent = params.get("userId") || "N/A";
//   }

//   window.FMS = window.FMS || {};
//   window.FMS.modules = window.FMS.modules || {};
//   window.FMS.modules.authentication = {
//     initLogin: initLogin,
//     initRegister: initRegister,
//     initRegisterSuccess: initRegisterSuccess
//   };
// })();


(function () {
  "use strict";

  /* ══════════════════════════════════════════════
     VALIDATION HELPERS
  ══════════════════════════════════════════════ */

  /** Show red border + error text below a field */
  function showError(fieldId, message) {
    var el = document.getElementById(fieldId);
    var errEl = document.getElementById("err-" + fieldId);
    if (el) {
      el.classList.add("invalid");
      el.classList.remove("valid");
    }
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add("visible");
    }
  }

  /** Clear red border + error text for a field */
  function clearError(fieldId) {
    var el = document.getElementById(fieldId);
    var errEl = document.getElementById("err-" + fieldId);
    if (el) {
      el.classList.remove("invalid");
      el.classList.add("valid");
    }
    if (errEl) {
      errEl.textContent = "";
      errEl.classList.remove("visible");
    }
  }

  /** Generate a unique random alphanumeric User ID (8 chars, e.g. "A3X9KQ2M") */
  function generateUserId() {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var id = "";
    for (var i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  /* ──────────────────────────────────────────
     Field-level validators  (return true = valid)
  ────────────────────────────────────────── */

  function validateUserName() {
    var val = document.getElementById("userName").value.trim();
    if (!val) { showError("userName", "Username is required"); return false; }
    if (!/^[A-Za-z ]+$/.test(val)) { showError("userName", "Only letters and spaces allowed"); return false; }
    if (val.length < 5) { showError("userName", "Minimum 5 characters required"); return false; }
    if (val.length > 26) { showError("userName", "Maximum 26 characters allowed"); return false; }
    clearError("userName");
    return true;
  }

  function validatePassword() {
    var val = document.getElementById("regPassword").value;
    if (!val) { showError("regPassword", "Password is required"); return false; }
    if (val.length < 8) { showError("regPassword", "Minimum 8 characters required"); return false; }
    if (val.length > 15) { showError("regPassword", "Maximum 15 characters allowed"); return false; }
    if (!/[A-Z]/.test(val)) { showError("regPassword", "Needs one uppercase letter"); return false; }
    if (!/[a-z]/.test(val)) { showError("regPassword", "Needs one lowercase letter"); return false; }
    if (!/[^A-Za-z0-9]/.test(val)) { showError("regPassword", "Needs one special character"); return false; }
    clearError("regPassword");
    return true;
  }

  function validatePhone() {
    var val = document.getElementById("phone").value.trim();
    if (!val) { showError("phone", "Mobile number is required"); return false; }
    if (!/^\d{10}$/.test(val)) { showError("phone", "Exactly 10 digits required"); return false; }
    if (!/^[6789]/.test(val)) { showError("phone", "Must start with 6, 7, 8 or 9"); return false; }
    clearError("phone");
    return true;
  }

  function validateEmail() {
    var val = document.getElementById("email").value.trim();
    if (!val) { showError("email", "Email address is required"); return false; }
    if (val.length > 40) { showError("email", "Maximum 40 characters allowed"); return false; }
    // First character must be a letter
    if (!/^[A-Za-z]/.test(val)) { showError("email", "Must start with a letter"); return false; }
    // Must end with @gmail.com or @tcs.com
    if (!/^[A-Za-z][A-Za-z0-9]*@(gmail\.com|tcs\.com)$/.test(val)) {
      showError("email", "Use @gmail.com or @tcs.com");
      return false;
    }
    clearError("email");
    return true;
  }

  function validateState() {
    var val = document.getElementById("state").value;
    if (!val) { showError("state", "Please select a state"); return false; }
    clearError("state");
    return true;
  }

  function validateZipCode() {
    var val = document.getElementById("zipCode").value.trim();
    if (!val) { showError("zipCode", "Zip code is required"); return false; }
    if (!/^\d{6}$/.test(val)) { showError("zipCode", "Exactly 6 digits required"); return false; }
    clearError("zipCode");
    return true;
  }

  function validateCity() {
    var val = document.getElementById("city").value.trim();
    if (!val) { showError("city", "City is required"); return false; }
    if (!/^[A-Za-z]+$/.test(val)) { showError("city", "Only alphabets allowed"); return false; }
    if (val.length < 4) { showError("city", "Minimum 4 characters required"); return false; }
    if (val.length > 20) { showError("city", "Maximum 20 characters allowed"); return false; }
    clearError("city");
    return true;
  }

  function validateDob() {
    var val = document.getElementById("dob").value;
    if (!val) { showError("dob", "Date of birth is required"); return false; }
    var year = parseInt(val.split("-")[0], 10);
    if (year >= 2010) { showError("dob", "Must be before year 2010"); return false; }
    clearError("dob");
    return true;
  }

  function validateCustomerCategory() {
    var val = document.getElementById("customerCategory").value;
    if (!val) { showError("customerCategory", "Please select a category"); return false; }
    clearError("customerCategory");
    return true;
  }

  function validateAddress1() {
    var val = document.getElementById("address1").value.trim();
    if (!val) { showError("address1", "Address line 1 required"); return false; }
    clearError("address1");
    return true;
  }

  // function validateAddress2() {
  //   var val = document.getElementById("address2").value.trim();
  //   if (!val) { showError("address2", "Address line 2 required"); return false; }
  //   clearError("address2");
  //   return true;
  // }

  /* ══════════════════════════════════════════════
     LIVE (blur) LISTENERS — attach per field
  ══════════════════════════════════════════════ */

  function attachLiveValidation() {
    var blurMap = {
      "userName":          validateUserName,
      "regPassword":       validatePassword,
      "phone":             validatePhone,
      "email":             validateEmail,
      "state":             validateState,
      "zipCode":           validateZipCode,
      "city":              validateCity,
      "dob":               validateDob,
      "customerCategory":  validateCustomerCategory,
      "address1":          validateAddress1,
      "address2":          validateAddress2
    };

    Object.keys(blurMap).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("blur", blurMap[id]);
        el.addEventListener("input", function () {
          // Clear error on any keystroke so user gets instant feedback
          var errEl = document.getElementById("err-" + id);
          if (el.classList.contains("invalid")) {
            blurMap[id](); // re-validate immediately while typing
          }
        });
      }
    });

    // Phone: restrict to digits only while typing
    var phoneEl = document.getElementById("phone");
    if (phoneEl) {
      phoneEl.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 10);
      });
    }

    // ZipCode: restrict to digits only while typing
    var zipEl = document.getElementById("zipCode");
    if (zipEl) {
      zipEl.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 6);
      });
    }
  }

  /* ══════════════════════════════════════════════
     LOGIN PAGE
  ══════════════════════════════════════════════ */

  function initLogin() {
    if (document.body.getAttribute("data-page") !== "login") {
      return;
    }

    var storage = window.FMS.core.storage;
    var security = window.FMS.core.security;
    var ui = window.FMS.core.ui;

    storage.ensureSeed();
    ui.readFlash("loginMsg");

    var session = security.getSession();
    if (session) {
      location.href = session.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
      return;
    }

    document.getElementById("loginForm").addEventListener("submit", function (event) {
      event.preventDefault();
      ui.setMessage("loginMsg", "", "info");

      var userId   = document.getElementById("userId").value.trim();
      var password = document.getElementById("password").value.trim();
      if (!userId || !password) {
        ui.setMessage("loginMsg", "All fields are required.", "err");
        return;
      }

      var user = storage.getUsers().find(function (u) {
        return Number(u.userId) === Number(userId);
      });

      if (!user || !user.active) {
        ui.setMessage("loginMsg", "Invalid user credentials or account disabled.", "err");
        return;
      }

      if (user.password !== security.encryptCaesar(password)) {
        ui.setMessage("loginMsg", "User Id and/or Password is wrong. Please check your credentials.", "err");
        return;
      }

      security.saveSession({
        userId: user.userId,
        role: user.role,
        userName: user.userName,
        lastActive: Date.now(),
        loginAt: storage.nowIso()
      });
      storage.addAudit("SIGN_IN", "AUTH", "Successful sign in", user.userId);
      location.href = user.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
    });
  }

  /* ══════════════════════════════════════════════
     REGISTER PAGE
  ══════════════════════════════════════════════ */

  function initRegister() {
    if (document.body.getAttribute("data-page") !== "register") {
      return;
    }

    var storage = window.FMS.core.storage;
    var security = window.FMS.core.security;
    var ui = window.FMS.core.ui;

    storage.ensureSeed();

    // Country is locked to India
    var countryEl = document.getElementById("country");
    if (countryEl) {
      countryEl.value = "India";
      countryEl.setAttribute("disabled", "true"); // visually locked
    }

    // DOB: enforce max date = Dec 31 2009 (browser-level guard)
    var dobEl = document.getElementById("dob");
    if (dobEl) {
      dobEl.setAttribute("max", "2009-12-31");
    }

    // Attach live blur/input validators
    attachLiveValidation();

    document.getElementById("registerForm").addEventListener("submit", function (event) {
      event.preventDefault();
      ui.setMessage("registerMsg", "", "info");

      // Run ALL validators and collect results
      var valid = [
        validateUserName(),
        validatePassword(),
        validateCustomerCategory(),
        validatePhone(),
        validateEmail(),
        validateAddress1(),
        validateAddress2(),
        validateCity(),
        validateState(),
        validateZipCode(),
        validateDob()
      ].every(Boolean);

      if (!valid) {
        ui.setMessage("registerMsg", "Please fix the errors above.", "err");
        return;
      }

      // Check duplicate email
      var emailVal = document.getElementById("email").value.trim();
      var users = storage.getUsers();
      if (users.some(function (u) { return u.emailId.toLowerCase() === emailVal.toLowerCase(); })) {
        showError("email", "Email already registered");
        ui.setMessage("registerMsg", "Email already registered.", "err");
        return;
      }

      // ── All valid → Generate User ID now ──
      var generatedId = generateUserId();
      document.getElementById("newUserId").value = generatedId;
      clearError("newUserId");

      var payload = {
        userId:           generatedId,
        userName:         document.getElementById("userName").value.trim(),
        password:         security.encryptCaesar(document.getElementById("regPassword").value),
        customerCategory: document.getElementById("customerCategory").value,
        phone:            document.getElementById("phone").value.trim(),
        emailId:          emailVal,
        address1:         document.getElementById("address1").value.trim(),
        address2:         document.getElementById("address2").value.trim(),
        city:             document.getElementById("city").value.trim(),
        state:            document.getElementById("state").value,
        country:          "India",
        zipCode:          document.getElementById("zipCode").value.trim(),
        dob:              document.getElementById("dob").value,
        role:             "Customer",
        active:           true
      };

      users.push(payload);
      storage.saveUsers(users);
      storage.addAudit("CREATE", "USER", "New customer registration", generatedId);

      // Show inline success message
      ui.setMessage("registerMsg", "Registered Successfully", "ok");

      // Redirect after a brief pause so user sees the message
      setTimeout(function () {
        sessionStorage.setItem("fms_flash", "Registration successful.");
        location.href = "registration_success.html?userId=" + encodeURIComponent(String(generatedId));
      }, 1500);
    });
  }

  /* ══════════════════════════════════════════════
     REGISTER SUCCESS PAGE
  ══════════════════════════════════════════════ */

  function initRegisterSuccess() {
    if (document.body.getAttribute("data-page") !== "register-success") {
      return;
    }
    var ui = window.FMS.core.ui;
    ui.readFlash("successMsg");
    var params = new URLSearchParams(location.search);
    document.getElementById("registeredUserId").textContent = params.get("userId") || "N/A";
  }

  /* ══════════════════════════════════════════════
     EXPORT
  ══════════════════════════════════════════════ */

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.authentication = {
    initLogin:           initLogin,
    initRegister:        initRegister,
    initRegisterSuccess: initRegisterSuccess
  };
})();