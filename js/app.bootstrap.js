(function () {
  "use strict";

  function initErrorPage() {
    if (document.body.getAttribute("data-page") !== "error") {
      return;
    }
    const btn = document.getElementById("goHomeBtn");
    if (!btn) {
      return;
    }
    btn.addEventListener("click", function () {
      const session = window.FMS.core.security.getSession();
      if (!session) {
        location.href = "index (1).html";
        return;
      }
      location.href = session.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
    });
  }

  function setActiveAdminNav() {
    var nav = document.querySelector(".admin-nav-links");
    if (!nav) {
      return;
    }

    var currentFile = (window.location.pathname.split("/").pop() || "").toLowerCase();
    var currentPage = String(document.body.getAttribute("data-page") || "").toLowerCase();

    nav.querySelectorAll("a, button").forEach(function (el) {
      el.classList.remove("active");
      el.removeAttribute("aria-current");
    });

    function activate(selector) {
      var el = nav.querySelector(selector);
      if (!el) {
        return;
      }
      el.classList.add("active");
      el.setAttribute("aria-current", "page");
    }

    function activateByText(text) {
      var target = Array.from(nav.querySelectorAll("button")).find(function (el) {
        return String(el.textContent || "").trim() === text;
      });
      if (target) {
        target.classList.add("active");
        target.setAttribute("aria-current", "page");
      }
    }

    if (currentFile === "admin_dashboard.html" || currentPage === "admin") {
      activate('button#tabHome');
      return;
    }

    if (currentFile === "add-carrier.html" || currentFile === "manage-carriers.html") {
      activateByText("Carrier Management");
      return;
    }
    if (currentFile === "add-flight.html" || currentFile === "manage-flights.html") {
      activateByText("Flight Management");
      return;
    }
    if (currentFile === "admin_schedule.html") {
      activateByText("Flight Schedule");
      return;
    }
    if (currentFile === "admin_users.html") {
      activate('a[href="admin_users.html?option=all"]');
      return;
    }
    if (currentFile === "admin_analytics.html") {
      activateByText("Analytics");
      return;
    }
    if (currentFile === "admin_audit.html") {
      activateByText("Audit Trail");
    }
  }

  function ensureSharedFooter() {
    if (document.querySelector(".admin-footer, .app-footer")) {
      return;
    }

    var footer = document.createElement("footer");
    footer.className = "app-footer";
    footer.innerHTML =
      '<div class="app-footer-inner">' +
        '<span class="app-footer-brand">FMS Airline Services</span>' +
        '<span class="app-footer-sep">•</span>' +
        '<span class="app-footer-note">Internal administrative use only</span>' +
      '</div>';
    document.body.appendChild(footer);
  }

  function run() {
    window.FMS.core.storage.ensureSeed();

    const modules = window.FMS.modules || {};
    [
      modules.authentication && modules.authentication.initLogin,
      modules.authentication && modules.authentication.initRegister,
      modules.authentication && modules.authentication.initRegisterSuccess,
      modules.userDashboard && modules.userDashboard.init,
      modules.myBookings && modules.myBookings.init,
      modules.flightSearch && modules.flightSearch.init,
      modules.availableFlights && modules.availableFlights.init,
      modules.flightSelection && modules.flightSelection.init,
      modules.preview && modules.preview.init,
      modules.payment && modules.payment.init,
      modules.bookingConfirmation && modules.bookingConfirmation.init,
      modules.cancellationRefund && modules.cancellationRefund.init,
      modules.adminCarrierForm && modules.adminCarrierForm.init,
      modules.adminCarrierList && modules.adminCarrierList.init,
      modules.adminFlightForm && modules.adminFlightForm.init,
      modules.adminFlightList && modules.adminFlightList.init,
      modules.adminSchedule && modules.adminSchedule.init,
      modules.adminUsers && modules.adminUsers.init,
      modules.adminAnalytics && modules.adminAnalytics.init,
      modules.adminAudit && modules.adminAudit.init,
      modules.adminDashboardFlightManagement && modules.adminDashboardFlightManagement.init,
      initErrorPage
    ].forEach(function (fn) {
      if (typeof fn === "function") {
        fn();
      }
    });

    setActiveAdminNav();
    ensureSharedFooter();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    setTimeout(run, 0);
  }
})();
