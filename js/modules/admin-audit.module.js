(function () {
  "use strict";

  function init() {
    if (document.body.getAttribute("data-page") !== "admin-audit") {
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

    function renderAudit() {
      var rows = storage.getAudit().map(function (a) {
        return "<tr>" +
          "<td>" + ui.escapeHtml(a.createdOn) + "</td>" +
          "<td>" + ui.escapeHtml(a.userId) + "</td>" +
          "<td>" + ui.escapeHtml(a.action) + "</td>" +
          "<td>" + ui.escapeHtml(a.entity) + "</td>" +
          "<td>" + ui.escapeHtml(a.details) + "</td>" +
          "</tr>";
      }).join("");
      document.getElementById("auditBody").innerHTML = rows || "<tr><td colspan=\"5\">No audit records found.</td></tr>";
    }

    document.getElementById("backBtn").addEventListener("click", function () {
      location.href = "admin_dashboard.html";
    });

    renderAudit();
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.adminAudit = { init: init };
})();
