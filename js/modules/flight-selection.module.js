(function () {
  "use strict";

  function seatClassList(seatCategory) {
    if (seatCategory === "Business") {
      return [1, 2];
    }
    if (seatCategory === "Executive") {
      return [3, 4];
    }
    return [5, 6, 7, 8];
  }

  function isPastTravelDate(dateString) {
    const selected = new Date(String(dateString) + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selected < today;
  }

  function isPastDeparture(dateString, departureTime) {
    const dep = new Date(String(dateString) + "T" + String(departureTime || "00:00") + ":00");
    return dep <= new Date();
  }

  function capacityByClass(flight, seatCategory) {
    if (seatCategory === "Business") {
      return Number(flight.seatCapacityBusinessClass || 0);
    }
    if (seatCategory === "Executive") {
      return Number(flight.seatCapacityExecutiveClass || 0);
    }
    return Number(flight.seatCapacityEconomyClass || 0);
  }

  function reservedSeats(storage, selectedFlight, seatCategory) {
    return new Set(
      storage.getBookings()
        .filter(function (b) {
          return Number(b.flightScheduleId) === Number(selectedFlight.schedule.flightScheduleId) &&
            b.seatCategory === seatCategory &&
            b.bookingStatus !== "Cancelled";
        })
        .flatMap(function (b) {
          return (b.passengers || []).map(function (p) { return String(p.seatNo || ""); });
        })
        .filter(Boolean)
    );
  }

  function init() {
    if (document.body.getAttribute("data-page") !== "flight-selection") {
      return;
    }

    const security = window.FMS.core.security;
    const storage = window.FMS.core.storage;
    const pricing = window.FMS.core.pricing;
    const ui = window.FMS.core.ui;

    const session = security.requireAuth("Customer");
    if (!session) {
      return;
    }
    security.startSessionGuard();

    const selected = sessionStorage.getItem("fms_selected_flight");
    if (!selected) {
      location.href = "flight_search.html";
      return;
    }
    const selectedFlight = JSON.parse(selected);

    document.getElementById("selectedFlightInfo").textContent =
      "Flight " + selectedFlight.flight.flightId + " | " + selectedFlight.flight.origin + " to " + selectedFlight.flight.destination +
      " | Fare INR " + selectedFlight.flight.airFare;

    let selectedSeats = [];

    function renderSeatMap() {
      const seatCategory = document.getElementById("seatClass").value;
      const rows = seatClassList(seatCategory);
      const holder = document.getElementById("seatMap");
      holder.innerHTML = "";
      selectedSeats = [];
      document.getElementById("seatChosen").textContent = "No seats selected";
      const blocked = reservedSeats(storage, selectedFlight, seatCategory);

      rows.forEach(function (r) {
        const row = document.createElement("div");
        row.className = "seat-row";
        ["A", "B", "C", "D", "E", "F"].forEach(function (c) {
          const seatNo = r + c;
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "seat";
          btn.textContent = seatNo;
          if (blocked.has(seatNo)) {
            btn.classList.add("locked");
            btn.title = "Already booked";
          }
          btn.addEventListener("click", function () {
            const max = Number(document.getElementById("seatCount").value || 0);
            if (!max || max < 1) {
              ui.setMessage("flightSelectionMsg", "Enter number of seats first.", "warn");
              return;
            }
            if (btn.classList.contains("selected")) {
              btn.classList.remove("selected");
              selectedSeats = selectedSeats.filter(function (s) { return s !== seatNo; });
            } else {
              if (selectedSeats.length >= max) {
                ui.setMessage("flightSelectionMsg", "Only " + max + " seats can be selected.", "warn");
                return;
              }
              btn.classList.add("selected");
              selectedSeats.push(seatNo);
            }
            document.getElementById("seatChosen").textContent = selectedSeats.length ? selectedSeats.join(", ") : "No seats selected";
          });
          row.appendChild(btn);
        });
        holder.appendChild(row);
      });
    }

    document.getElementById("buildSeatMapBtn").addEventListener("click", renderSeatMap);
    document.getElementById("seatClass").addEventListener("change", renderSeatMap);

    document.getElementById("continuePreviewBtn").addEventListener("click", function () {
      ui.setMessage("flightSelectionMsg", "", "info");
      if (isPastTravelDate(selectedFlight.schedule.dateOfTravel)) {
        ui.setMessage("flightSelectionMsg", "This flight date is in the past and cannot be booked.", "err");
        return;
      }
      if (isPastDeparture(selectedFlight.schedule.dateOfTravel, selectedFlight.flight.departureTime)) {
        ui.setMessage("flightSelectionMsg", "This flight departure time has already passed.", "err");
        return;
      }
      const seatCount = Number(document.getElementById("seatCount").value || 0);
      const seatCategory = document.getElementById("seatClass").value;
      const blockedSeats = reservedSeats(storage, selectedFlight, seatCategory);
      const availableCapacity = capacityByClass(selectedFlight.flight, seatCategory) - blockedSeats.size;
      if (!seatCount || seatCount < 1 || seatCount > 9) {
        ui.setMessage("flightSelectionMsg", "Seat count should be between 1 and 9.", "err");
        return;
      }
      if (seatCount > availableCapacity) {
        ui.setMessage("flightSelectionMsg", "Only " + Math.max(0, availableCapacity) + " seats are available in " + seatCategory + ".", "err");
        return;
      }
      if (selectedSeats.length !== seatCount) {
        ui.setMessage("flightSelectionMsg", "Select exactly " + seatCount + " seats.", "err");
        return;
      }

      const passengerWrap = document.getElementById("passengerDetails");
      if (!passengerWrap.children.length) {
        for (let i = 0; i < seatCount; i += 1) {
          const div = document.createElement("div");
          div.className = "card";
          div.innerHTML =
            "<div class=\"section-title\">Passenger " + (i + 1) + " · Seat " + selectedSeats[i] + "</div>" +
            "<div class=\"form-grid\">" +
            "<div class=\"form-row\"><label>Name <span class=\"req\">*</span></label><input class=\"p-name\" /></div>" +
            "<div class=\"form-row\"><label>Age <span class=\"req\">*</span></label><input class=\"p-age\" type=\"number\" min=\"1\" max=\"120\" /></div>" +
            "<div class=\"form-row\"><label>Food</label><select class=\"p-food\"><option value=\"0\">None</option><option value=\"250\">Veg 250</option><option value=\"350\">Non-Veg 350</option></select></div>" +
            "<div class=\"form-row\"><label>Extra Luggage (Kg)</label><input class=\"p-luggage\" type=\"number\" min=\"0\" max=\"30\" value=\"0\" /></div>" +
            "</div>";
          passengerWrap.appendChild(div);
        }
        ui.setMessage("flightSelectionMsg", "Passenger forms generated. Fill details and click Continue again.", "ok");
        return;
      }

      const cards = Array.from(passengerWrap.querySelectorAll(".card"));
      const passengers = [];
      const seenNames = new Set();
      for (let i = 0; i < cards.length; i += 1) {
        const c = cards[i];
        const name = c.querySelector(".p-name").value.trim();
        const age = Number(c.querySelector(".p-age").value || 0);
        const foodCost = Number(c.querySelector(".p-food").value || 0);
        const luggage = Number(c.querySelector(".p-luggage").value || 0);
        if (!name || !age) {
          ui.setMessage("flightSelectionMsg", "Passenger name and age are required.", "err");
          return;
        }
        if (!/^[A-Za-z][A-Za-z\s'.-]{1,49}$/.test(name)) {
          ui.setMessage("flightSelectionMsg", "Passenger name should contain letters only.", "err");
          return;
        }
        const nameKey = name.toLowerCase();
        if (seenNames.has(nameKey)) {
          ui.setMessage("flightSelectionMsg", "Passenger names should be unique.", "err");
          return;
        }
        seenNames.add(nameKey);
        if (age < 1 || age > 120) {
          ui.setMessage("flightSelectionMsg", "Passenger age must be between 1 and 120.", "err");
          return;
        }
        if (luggage < 0 || luggage > 30) {
          ui.setMessage("flightSelectionMsg", "Extra luggage should be between 0 and 30 Kg.", "err");
          return;
        }
        if (age < 12 && luggage > 0) {
          ui.setMessage("flightSelectionMsg", "Children cannot have extra luggage.", "err");
          return;
        }
        passengers.push({ name: name, age: age, seatNo: selectedSeats[i], foodCost: foodCost, extraLuggageKg: luggage });
      }

      if (passengers.every(function (p) { return p.age < 18; })) {
        ui.setMessage("flightSelectionMsg", "Children cannot travel alone. At least one passenger must be 18+.", "err");
        return;
      }

      const baseFare = Number(selectedFlight.flight.airFare) * pricing.classMultiplier(seatCategory) * seatCount;
      const addOnAmount = passengers.reduce(function (sum, p) {
        const baggageCost = p.extraLuggageKg > 15 ? (p.extraLuggageKg - 15) * 100 : 0;
        return sum + p.foodCost + baggageCost;
      }, 0);

      const bookingId = storage.nextId("booking");
      const durationMins = Number(selectedFlight.flight.durationMins || 0);
      const draft = {
        bookingId: bookingId,
        userId: session.userId,
        carrierId: selectedFlight.flight.carrierId,
        flightId: selectedFlight.flight.flightId,
        flightScheduleId: selectedFlight.schedule.flightScheduleId,
        origin: selectedFlight.flight.origin,
        destination: selectedFlight.flight.destination,
        dateOfTravel: selectedFlight.schedule.dateOfTravel,
        journeyDurationMins: durationMins,
        noOfSeats: seatCount,
        seatCategory: seatCategory,
        passengers: passengers,
        baseFare: Number(baseFare.toFixed(2)),
        addOnAmount: Number(addOnAmount.toFixed(2)),
        bookingAmount: Number((baseFare + addOnAmount).toFixed(2)),
        bookingStatus: "Pending Preview",
        createdOn: storage.nowIso()
      };
      const all = storage.getBookings();
      all.push(draft);
      storage.saveBookings(all);
      storage.addAudit("CREATE", "BOOKING", "Draft booking created", session.userId);

      location.href = "booking_preview.html?bookingId=" + encodeURIComponent(String(bookingId));
    });

    document.getElementById("backAvailableFlightsBtn").addEventListener("click", function () {
      location.href = "available_flights.html";
    });
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.flightSelection = { init: init };
})();
