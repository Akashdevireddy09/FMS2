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
      location.href = session.role === "Admin" ? "admin_dashboard.html" : "customer_dashboard.html";
    });
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
      modules.adminDashboardFlightManagement && modules.adminDashboardFlightManagement.init,
      initErrorPage
    ].forEach(function (fn) {
      if (typeof fn === "function") {
        fn();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
