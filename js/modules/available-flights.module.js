(function () {
  "use strict";

  function formatDuration(minutes) {
    const total = Number(minutes || 0);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return hours + "h " + mins + "m";
  }

  function normalizeStopCount(value) {
    const n = Number(value || 0);
    return n > 0 ? 1 : 0;
  }

  function renderAirlineFilters(results, carrierMap) {
    const holder = document.getElementById("airlineFilterList");
    const ids = Array.from(new Set(results.map(function (x) { return Number(x.flight.carrierId); })));
    holder.innerHTML = ids.map(function (carrierId) {
      const name = carrierMap[carrierId] || carrierId;
      return "<label class=\"inline-choice\"><input class=\"airline-filter\" type=\"checkbox\" value=\"" + carrierId + "\" checked> " +
        window.FMS.core.ui.escapeHtml(String(name)) + "</label>";
    }).join("");
  }

  function renderList(results, carrierMap) {
    const ui = window.FMS.core.ui;
    const holder = document.getElementById("availableFlightsList");

    if (!results.length) {
      holder.innerHTML = "<p class=\"muted\">No flights match current filters.</p>";
      return;
    }

    holder.innerHTML = results.map(function (x, index) {
      const carrierName = carrierMap[x.flight.carrierId] || x.flight.carrierId;
      const dep = ui.escapeHtml(x.flight.departureTime || "--:--");
      const arr = ui.escapeHtml(x.flight.arrivalTime || "--:--");
      const dur = ui.escapeHtml(formatDuration(x.flight.durationMins || 0));
      const stopText = normalizeStopCount(x.flight.stops) === 0
        ? "Non-stop"
        : "1 Stop" + (x.flight.stopCity ? " (via " + ui.escapeHtml(String(x.flight.stopCity)) + ")" : "");
      return "<div class=\"flight-item flight-row\">" +
        "<div class=\"flight-left\">" +
        "<div class=\"flight-emoji\" aria-hidden=\"true\">&#9992;&#65039;</div>" +
        "<div class=\"flight-id\">" + ui.escapeHtml(x.flight.flightId) + "</div>" +
        "<div class=\"flight-carrier-name\">" + ui.escapeHtml(String(carrierName)) + "</div>" +
        "</div>" +
        "<div class=\"flight-route-block\">" +
        "<div class=\"flight-time-row\"><span>" + dep + "</span><span class=\"flight-duration\">" + dur + "</span><span>" + arr + "</span></div>" +
        "<div class=\"flight-route\">" + ui.escapeHtml(x.flight.origin) + " &#8594; " + ui.escapeHtml(x.flight.destination) + "</div>" +
        "<div class=\"muted\">" + ui.escapeHtml(x.schedule.dateOfTravel) + " | " + stopText + "</div>" +
        "</div>" +
        "<div class=\"flight-right\">" +
        "<div class=\"flight-fare\">&#8377;" + Number(x.flight.airFare).toFixed(0) + "</div>" +
        "<button class=\"flight-select-btn\" data-index=\"" + index + "\">Select</button>" +
        "</div>" +
        "</div>";
    }).join("");
  }

  function applyFilters(results) {
    const minFare = Number(document.getElementById("fareMin").value || 0);
    const maxFare = Number(document.getElementById("fareMax").value || Number.MAX_SAFE_INTEGER);
    const allowNonStop = document.getElementById("stopNonStop").checked;
    const allowOneStop = document.getElementById("stopOne").checked;
    const selectedAirlines = Array.from(document.querySelectorAll(".airline-filter:checked")).map(function (x) {
      return Number(x.value);
    });

    return results.filter(function (x) {
      const fare = Number(x.flight.airFare || 0);
      const stops = normalizeStopCount(x.flight.stops);
      const airlineAllowed = !selectedAirlines.length || selectedAirlines.indexOf(Number(x.flight.carrierId)) >= 0;
      const stopAllowed = (stops === 0 && allowNonStop) || (stops === 1 && allowOneStop);
      return fare >= minFare && fare <= maxFare && stopAllowed && airlineAllowed;
    });
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "available-flights") {
      return;
    }

    const security = window.FMS.core.security;
    const storage = window.FMS.core.storage;
    const ui = window.FMS.core.ui;
    if (!security.requireAuth("Customer")) {
      return;
    }
    security.startSessionGuard();

    const carrierMap = storage.getCarriers().reduce(function (map, c) {
      map[c.carrierId] = c.carrierName;
      return map;
    }, {});

    const raw = sessionStorage.getItem("fms_search_results");
    const results = raw ? JSON.parse(raw) : [];
    const holder = document.getElementById("availableFlightsList");
    const layout = document.getElementById("flightLayout");
    const toggleBtn = document.getElementById("toggleFiltersBtn");

    if (toggleBtn && layout) {
      toggleBtn.addEventListener("click", function () {
        const hidden = layout.classList.toggle("filters-hidden");
        toggleBtn.setAttribute("aria-expanded", hidden ? "false" : "true");
        toggleBtn.setAttribute("title", hidden ? "Show filters" : "Hide filters");
        toggleBtn.setAttribute("aria-label", hidden ? "Show filters" : "Hide filters");
      });
    }

    if (!results.length) {
      holder.innerHTML = "<p class=\"muted\">No flights available. Try another search.</p>";
    } else {
      renderAirlineFilters(results, carrierMap);
      renderList(results, carrierMap);

      function bindSelectButtons(currentList) {
        holder.querySelectorAll("button[data-index]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            const index = Number(btn.getAttribute("data-index"));
            sessionStorage.setItem("fms_selected_flight", JSON.stringify(currentList[index]));
            location.href = "flight_selection.html";
          });
        });
      }

      bindSelectButtons(results);

      document.getElementById("applyFiltersBtn").addEventListener("click", function () {
        const filtered = applyFilters(results);
        renderList(filtered, carrierMap);
        bindSelectButtons(filtered);
      });

      document.getElementById("clearFiltersBtn").addEventListener("click", function () {
        document.getElementById("fareMin").value = "";
        document.getElementById("fareMax").value = "";
        document.getElementById("stopNonStop").checked = true;
        document.getElementById("stopOne").checked = true;
        document.querySelectorAll(".airline-filter").forEach(function (x) { x.checked = true; });
        renderList(results, carrierMap);
        bindSelectButtons(results);
      });
    }

    document.getElementById("backSearchBtn").addEventListener("click", function () {
      location.href = "flight_search.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.availableFlights = { init: init };
})();
