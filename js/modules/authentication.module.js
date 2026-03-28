(function () {
  "use strict";

  function isAlphaSpace(value) {
    return /^[A-Za-z][A-Za-z\s]{1,49}$/.test(String(value || "").trim());
  }

  function isValidEmail(value) {
    return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(String(value || "").trim());
  }

  function isFutureDate(value) {
    const dt = new Date(String(value) + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dt > today;
  }

  function initLogin() {
    if (document.body.getAttribute("data-page") !== "login") {
      return;
    }

    const storage = window.FMS.core.storage;
    const security = window.FMS.core.security;
    const ui = window.FMS.core.ui;

    storage.ensureSeed();
    ui.readFlash("loginMsg");

    const session = security.getSession();
    if (session) {
      location.href = session.role === "Admin" ? "admin_dashboard.html" : "customer_dashboard.html";
      return;
    }

    document.getElementById("loginForm").addEventListener("submit", function (event) {
      event.preventDefault();
      ui.setMessage("loginMsg", "", "info");

      const userId = document.getElementById("userId").value.trim();
      const password = document.getElementById("password").value.trim();
      if (!userId || !password) {
        ui.setMessage("loginMsg", "All fields are required.", "err");
        return;
      }

      const user = storage.getUsers().find(function (u) {
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
      location.href = user.role === "Admin" ? "admin_dashboard.html" : "customer_dashboard.html";
    });
  }

  function initRegister() {
    if (document.body.getAttribute("data-page") !== "register") {
      return;
    }

    const storage = window.FMS.core.storage;
    const security = window.FMS.core.security;
    const ui = window.FMS.core.ui;

    storage.ensureSeed();

    const generatedId = storage.nextId("user");
    document.getElementById("newUserId").value = String(generatedId);

    document.getElementById("registerForm").addEventListener("submit", function (event) {
      event.preventDefault();
      ui.setMessage("registerMsg", "", "info");

      const payload = {
        userId: generatedId,
        userName: document.getElementById("userName").value.trim(),
        password: document.getElementById("regPassword").value.trim(),
        customerCategory: document.getElementById("customerCategory").value,
        phone: document.getElementById("phone").value.trim(),
        emailId: document.getElementById("email").value.trim(),
        address1: document.getElementById("address1").value.trim(),
        address2: document.getElementById("address2").value.trim(),
        city: document.getElementById("city").value.trim(),
        state: document.getElementById("state").value.trim(),
        country: document.getElementById("country").value.trim(),
        zipCode: document.getElementById("zipCode").value.trim(),
        dob: document.getElementById("dob").value,
        role: "Customer",
        active: true
      };

      const allFilled = Object.keys(payload).every(function (key) {
        return payload[key] !== "" && payload[key] !== null;
      });
      if (!allFilled) {
        ui.setMessage("registerMsg", "All fields are mandatory.", "err");
        return;
      }
      if (!/^\d{10}$/.test(payload.phone)) {
        ui.setMessage("registerMsg", "Phone number must contain exactly 10 digits.", "err");
        return;
      }
      if (!isValidEmail(payload.emailId)) {
        ui.setMessage("registerMsg", "Please enter a valid email address.", "err");
        return;
      }
      if (!isAlphaSpace(payload.userName)) {
        ui.setMessage("registerMsg", "User name should contain letters and spaces only.", "err");
        return;
      }
      if (!isAlphaSpace(payload.city) || !isAlphaSpace(payload.state) || !isAlphaSpace(payload.country)) {
        ui.setMessage("registerMsg", "City, State and Country should contain letters and spaces only.", "err");
        return;
      }
      if (!/^\d{5,10}$/.test(payload.zipCode)) {
        ui.setMessage("registerMsg", "Zip code should be 5 to 10 digits.", "err");
        return;
      }
      if (isFutureDate(payload.dob)) {
        ui.setMessage("registerMsg", "Date of birth cannot be in the future.", "err");
        return;
      }
      if (!security.validatePassword(payload.password)) {
        ui.setMessage("registerMsg", "Password must be at least 8 chars, include uppercase, number and special character.", "err");
        return;
      }

      const users = storage.getUsers();
      if (users.some(function (u) { return u.emailId.toLowerCase() === payload.emailId.toLowerCase(); })) {
        ui.setMessage("registerMsg", "Email already registered.", "err");
        return;
      }

      payload.password = security.encryptCaesar(payload.password);
      users.push(payload);
      storage.saveUsers(users);
      storage.addAudit("CREATE", "USER", "New customer registration", generatedId);

      sessionStorage.setItem("fms_flash", "Registration successful.");
      location.href = "registration_success.html?userId=" + encodeURIComponent(String(generatedId));
    });
  }

  function initRegisterSuccess() {
    if (document.body.getAttribute("data-page") !== "register-success") {
      return;
    }
    const ui = window.FMS.core.ui;
    ui.readFlash("successMsg");
    const params = new URLSearchParams(location.search);
    document.getElementById("registeredUserId").textContent = params.get("userId") || "N/A";
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.authentication = {
    initLogin: initLogin,
    initRegister: initRegister,
    initRegisterSuccess: initRegisterSuccess
  };
})();
