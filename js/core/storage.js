(function () {
  "use strict";

  const STORAGE_KEYS = {
    users: "fms_users",
    carriers: "fms_carriers",
    flights: "fms_flights",
    schedules: "fms_schedules",
    bookings: "fms_bookings",
    session: "fms_session",
    seq: "fms_seq",
    audit: "fms_audit"
  };

  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function ensureSeed() {
    const FMS = window.FMS;
    const users = getJSON(STORAGE_KEYS.users, []);
    const carriers = getJSON(STORAGE_KEYS.carriers, []);
    const flights = getJSON(STORAGE_KEYS.flights, []);
    const schedules = getJSON(STORAGE_KEYS.schedules, []);

    if (!users.length) {
      users.push(
        {
          userId: 1001,
          userName: "System Admin",
          password: FMS.core.security.encryptCaesar("Admin@123"),
          role: "Admin",
          customerCategory: "Gold",
          phone: "9999999999",
          emailId: "admin@fms.com",
          address1: "HQ Block A",
          address2: "Airport Road",
          city: "Bengaluru",
          state: "Karnataka",
          country: "India",
          zipCode: "560001",
          dob: "1990-01-01",
          active: true
        },
        {
          userId: 1002,
          userName: "Demo Customer",
          password: FMS.core.security.encryptCaesar("Customer@123"),
          role: "Customer",
          customerCategory: "Silver",
          phone: "8888888888",
          emailId: "customer@fms.com",
          address1: "Skyline Residency",
          address2: "Sector 9",
          city: "Delhi",
          state: "Delhi",
          country: "India",
          zipCode: "110001",
          dob: "1998-08-15",
          active: true
        }
      );
      setJSON(STORAGE_KEYS.users, users);
    }

    if (!carriers.length) {
      const list = [
        {
          carrierId: 301,
          carrierName: "Aero Wings",
          discount30: 5,
          discount60: 10,
          discount90: 15,
          bulkBookingDiscount: 7,
          refund2Days: 40,
          refund10Days: 65,
          refund20Days: 85,
          silverDiscount: 2,
          goldDiscount: 5,
          platinumDiscount: 8
        },
        {
          carrierId: 302,
          carrierName: "Nimbus Air",
          discount30: 4,
          discount60: 9,
          discount90: 14,
          bulkBookingDiscount: 6,
          refund2Days: 35,
          refund10Days: 60,
          refund20Days: 80,
          silverDiscount: 2,
          goldDiscount: 4,
          platinumDiscount: 7
        }
      ];
      setJSON(STORAGE_KEYS.carriers, list);
    }

    if (flights.length < 12) {
      setJSON(STORAGE_KEYS.flights, [
        {
          flightId: 9001,
          carrierId: 301,
          origin: "Bengaluru",
          destination: "Delhi",
          airFare: 5200,
          departureTime: "06:20",
          arrivalTime: "09:05",
          durationMins: 165,
          stops: 0,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9002,
          carrierId: 302,
          origin: "Bengaluru",
          destination: "Delhi",
          airFare: 5600,
          departureTime: "11:35",
          arrivalTime: "14:30",
          durationMins: 175,
          stops: 0,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9003,
          carrierId: 301,
          origin: "Bengaluru",
          destination: "Delhi",
          airFare: 6100,
          departureTime: "19:10",
          arrivalTime: "22:00",
          durationMins: 170,
          stops: 1,
          stopCity: "Nagpur",
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9004,
          carrierId: 301,
          origin: "Hyderabad",
          destination: "Chennai",
          airFare: 3400,
          departureTime: "07:10",
          arrivalTime: "08:30",
          durationMins: 80,
          stops: 0,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9005,
          carrierId: 302,
          origin: "Hyderabad",
          destination: "Chennai",
          airFare: 3600,
          departureTime: "13:40",
          arrivalTime: "15:05",
          durationMins: 85,
          stops: 0,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9006,
          carrierId: 301,
          origin: "Hyderabad",
          destination: "Chennai",
          airFare: 3950,
          departureTime: "20:25",
          arrivalTime: "22:00",
          durationMins: 95,
          stops: 1,
          stopCity: "Bengaluru",
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9007,
          carrierId: 302,
          origin: "Hyderabad",
          destination: "Indore",
          airFare: 4700,
          departureTime: "09:15",
          arrivalTime: "11:25",
          durationMins: 130,
          stops: 0,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9008,
          carrierId: 301,
          origin: "Hyderabad",
          destination: "Indore",
          airFare: 5100,
          departureTime: "17:55",
          arrivalTime: "20:25",
          durationMins: 150,
          stops: 1,
          stopCity: "Mumbai",
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9009,
          carrierId: 301,
          origin: "Bengaluru",
          destination: "Hyderabad",
          airFare: 3300,
          departureTime: "06:45",
          arrivalTime: "08:05",
          durationMins: 80,
          stops: 0,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9010,
          carrierId: 302,
          origin: "Bengaluru",
          destination: "Hyderabad",
          airFare: 3500,
          departureTime: "12:20",
          arrivalTime: "13:45",
          durationMins: 85,
          stops: 0,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9011,
          carrierId: 301,
          origin: "Bengaluru",
          destination: "Hyderabad",
          airFare: 3700,
          departureTime: "19:00",
          arrivalTime: "20:30",
          durationMins: 90,
          stops: 1,
          stopCity: "Chennai",
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        },
        {
          flightId: 9012,
          carrierId: 302,
          origin: "Hyderabad",
          destination: "Delhi",
          airFare: 5400,
          departureTime: "21:10",
          arrivalTime: "23:40",
          durationMins: 150,
          stops: 0,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        }
      ]);
    }

    // Backfill stop-city metadata for existing seeded flights without forcing a full data reset.
    (function backfillStopCities() {
      const stopCityByFlight = {
        9003: "Nagpur",
        9006: "Bengaluru",
        9008: "Mumbai",
        9011: "Chennai"
      };
      const currentFlights = getJSON(STORAGE_KEYS.flights, []);
      let changed = false;
      const nextFlights = currentFlights.map(function (f) {
        const id = Number(f.flightId);
        if (Number(f.stops || 0) > 0 && !f.stopCity && stopCityByFlight[id]) {
          changed = true;
          return Object.assign({}, f, { stopCity: stopCityByFlight[id] });
        }
        return f;
      });
      if (changed) {
        setJSON(STORAGE_KEYS.flights, nextFlights);
      }
    })();

    if (schedules.length < 12) {
      const seedDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      setJSON(STORAGE_KEYS.schedules, [
        {
          flightScheduleId: 7001,
          flightId: 9001,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7002,
          flightId: 9002,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7003,
          flightId: 9003,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7004,
          flightId: 9004,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7005,
          flightId: 9005,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7006,
          flightId: 9006,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7007,
          flightId: 9007,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7008,
          flightId: 9008,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7009,
          flightId: 9009,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7010,
          flightId: 9010,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7011,
          flightId: 9011,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        },
        {
          flightScheduleId: 7012,
          flightId: 9012,
          dateOfTravel: seedDate,
          businessClassBookedCount: 0,
          economyClassBookedCount: 0,
          executiveClassBookedCount: 0
        }
      ]);
    }

    if (!getJSON(STORAGE_KEYS.bookings, null)) {
      setJSON(STORAGE_KEYS.bookings, []);
    }

    if (!getJSON(STORAGE_KEYS.audit, null)) {
      setJSON(STORAGE_KEYS.audit, []);
    }

    if (!getJSON(STORAGE_KEYS.seq, null)) {
      setJSON(STORAGE_KEYS.seq, {
        user: 2000,
        carrier: 500,
        flight: 9500,
        schedule: 7500,
        booking: 11000
      });
    }
  }

  function nextId(scopeName) {
    const seq = getJSON(STORAGE_KEYS.seq, {
      user: 2000,
      carrier: 500,
      flight: 9500,
      schedule: 7500,
      booking: 11000
    });
    seq[scopeName] = (seq[scopeName] || 1) + 1;
    setJSON(STORAGE_KEYS.seq, seq);
    return seq[scopeName];
  }

  function addAudit(action, entity, details, userId) {
    const audit = getJSON(STORAGE_KEYS.audit, []);
    audit.unshift({
      id: Date.now(),
      action: action,
      entity: entity,
      details: details,
      userId: userId,
      createdOn: nowIso()
    });
    setJSON(STORAGE_KEYS.audit, audit.slice(0, 300));
  }

  window.FMS = window.FMS || {};
  window.FMS.core = window.FMS.core || {};
  window.FMS.core.storage = {
    keys: STORAGE_KEYS,
    getJSON: getJSON,
    setJSON: setJSON,
    nowIso: nowIso,
    ensureSeed: ensureSeed,
    nextId: nextId,
    addAudit: addAudit,
    getUsers: function () { return getJSON(STORAGE_KEYS.users, []); },
    saveUsers: function (list) { setJSON(STORAGE_KEYS.users, list); },
    getCarriers: function () { return getJSON(STORAGE_KEYS.carriers, []); },
    saveCarriers: function (list) { setJSON(STORAGE_KEYS.carriers, list); },
    getFlights: function () { return getJSON(STORAGE_KEYS.flights, []); },
    saveFlights: function (list) { setJSON(STORAGE_KEYS.flights, list); },
    getSchedules: function () { return getJSON(STORAGE_KEYS.schedules, []); },
    saveSchedules: function (list) { setJSON(STORAGE_KEYS.schedules, list); },
    getBookings: function () { return getJSON(STORAGE_KEYS.bookings, []); },
    saveBookings: function (list) { setJSON(STORAGE_KEYS.bookings, list); },
    getAudit: function () { return getJSON(STORAGE_KEYS.audit, []); }
  };
})();
