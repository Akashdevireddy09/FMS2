(function () {
  "use strict";

  const SHIFT = 3;
  const IDLE_LIMIT_MS = 60 * 60 * 1000;

  function encryptCaesar(value) {
    const text = String(value || "");
    let out = "";
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      if (code >= 65 && code <= 90) {
        out += String.fromCharCode(((code - 65 + SHIFT) % 26) + 65);
      } else if (code >= 97 && code <= 122) {
        out += String.fromCharCode(((code - 97 + SHIFT) % 26) + 97);
      } else {
        out += text[i];
      }
    }
    return out;
  }

  function validatePassword(value) {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/.test(value || "");
  }

  function getSession() {
    return window.FMS.core.storage.getJSON(window.FMS.core.storage.keys.session, null);
  }

  function saveSession(session) {
    window.FMS.core.storage.setJSON(window.FMS.core.storage.keys.session, session);
  }

  function clearSession() {
    localStorage.removeItem(window.FMS.core.storage.keys.session);
  }

  function touchSession() {
    const session = getSession();
    if (!session) {
      return;
    }
    session.lastActive = Date.now();
    saveSession(session);
  }

  function logout(message) {
    clearSession();
    if (message) {
      sessionStorage.setItem("fms_flash", message);
    }
    location.href = "index (1).html";
  }

  function requireAuth(role) {
    const session = getSession();
    if (!session) {
      sessionStorage.setItem("fms_flash", "Please sign in to continue.");
      location.href = "index (1).html";
      return null;
    }
    if (Date.now() - Number(session.lastActive || 0) > IDLE_LIMIT_MS) {
      logout("Session expired after 1 hour of inactivity.");
      return null;
    }
    if (role && session.role !== role) {
      location.href = session.role === "Admin" ? "admin_dashboard.html" : "customer_dashboard.html";
      return null;
    }
    touchSession();
    return session;
  }

  function startSessionGuard() {
    const update = function () { touchSession(); };
    ["click", "keydown", "mousemove", "scroll"].forEach(function (eventName) {
      document.addEventListener(eventName, update, { passive: true });
    });
    setInterval(function () {
      const session = getSession();
      if (!session) {
        return;
      }
      if (Date.now() - Number(session.lastActive || 0) > IDLE_LIMIT_MS) {
        logout("Session expired after 1 hour of inactivity.");
      }
    }, 15000);
  }

  window.FMS = window.FMS || {};
  window.FMS.core = window.FMS.core || {};
  window.FMS.core.security = {
    SHIFT: SHIFT,
    encryptCaesar: encryptCaesar,
    validatePassword: validatePassword,
    getSession: getSession,
    saveSession: saveSession,
    clearSession: clearSession,
    touchSession: touchSession,
    logout: logout,
    requireAuth: requireAuth,
    startSessionGuard: startSessionGuard
  };
})();
