(function () {
  "use strict";

  const STORAGE_KEYS = {
    users: "fms_users",
    carriers: "fms_carriers",
    bookings: "fms_bookings",
    session: "fms_session",
    seq: "fms_seq"
  };

  const SHIFT = 3;
  const IDLE_LIMIT_MS = 3 * 60 * 1000;

  const page = document.body.getAttribute("data-page");

  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (err) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function nextId(scopeName) {
    const seq = getJSON(STORAGE_KEYS.seq, {
      user: 2000,
      carrier: 500,
      booking: 10000
    });
    seq[scopeName] = (seq[scopeName] || 1) + 1;
    setJSON(STORAGE_KEYS.seq, seq);
    return seq[scopeName];
  }

  function encryptCaesar(value) {
    let out = "";
    const text = String(value || "");
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

  function setMessage(id, text, type) {
    const box = document.getElementById(id);
    if (!box) {
      return;
    }
    if (!text) {
      box.className = "msg";
      box.textContent = "";
      return;
    }
    box.className = "msg " + type;
    box.textContent = text;
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.session);
  }

  function getSession() {
    return getJSON(STORAGE_KEYS.session, null);
  }

  function saveSession(session) {
    setJSON(STORAGE_KEYS.session, session);
  }

  function touchSession() {
    const session = getSession();
    if (!session) {
      return;
    }
    session.lastActive = Date.now();
    saveSession(session);
  }

  function logout(reason) {
    clearSession();
    if (reason) {
      sessionStorage.setItem("fms_flash", reason);
    }
    location.href = "index (1).html";
  }

  function readFlash(msgId) {
    const flash = sessionStorage.getItem("fms_flash");
    if (flash) {
      setMessage(msgId, flash, "info");
      sessionStorage.removeItem("fms_flash");
    }
  }

  function requireAuth(role) {
    const session = getSession();
    if (!session) {
      sessionStorage.setItem("fms_flash", "Please sign in to continue.");
      location.href = "index (1).html";
      return null;
    }

    if (Date.now() - session.lastActive > IDLE_LIMIT_MS) {
      logout("Session expired after 3 minutes of inactivity.");
      return null;
    }

    if (role && session.role !== role) {
      location.href = session.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
      return null;
    }

    touchSession();
    return session;
  }

  function startSessionGuard(msgId) {
    const update = function () {
      touchSession();
    };
    ["click", "keydown", "mousemove", "scroll"].forEach(function (eventName) {
      document.addEventListener(eventName, update, { passive: true });
    });

    setInterval(function () {
      const session = getSession();
      if (!session) {
        return;
      }
      if (Date.now() - session.lastActive > IDLE_LIMIT_MS) {
        logout("Session expired after 3 minutes of inactivity.");
      }
    }, 15000);

    readFlash(msgId);
  }

  function seedData() {
    const users = getJSON(STORAGE_KEYS.users, []);
    const carriers = getJSON(STORAGE_KEYS.carriers, []);

    if (!users.length) {
      users.push(
        {
          userId: 1001,
          userName: "System Admin",
          password: encryptCaesar("Admin@123"),
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
          dob: "1990-01-01"
        },
        {
          userId: 1002,
          userName: "Demo Customer",
          password: encryptCaesar("Customer@123"),
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
          dob: "1998-08-15"
        }
      );
      setJSON(STORAGE_KEYS.users, users);
    }

    if (!carriers.length) {
      setJSON(STORAGE_KEYS.carriers, [
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
      ]);
    }

    if (!getJSON(STORAGE_KEYS.bookings, null)) {
      setJSON(STORAGE_KEYS.bookings, []);
    }

    if (!getJSON(STORAGE_KEYS.seq, null)) {
      setJSON(STORAGE_KEYS.seq, {
        user: 2000,
        carrier: 500,
        booking: 10000
      });
    }
  }

  function getUsers() {
    return getJSON(STORAGE_KEYS.users, []);
  }

  function saveUsers(users) {
    setJSON(STORAGE_KEYS.users, users);
  }

  function getCarriers() {
    return getJSON(STORAGE_KEYS.carriers, []);
  }

  function saveCarriers(carriers) {
    setJSON(STORAGE_KEYS.carriers, carriers);
  }

  function getBookings() {
    return getJSON(STORAGE_KEYS.bookings, []);
  }

  function saveBookings(bookings) {
    setJSON(STORAGE_KEYS.bookings, bookings);
  }

  function findUserById(userId) {
    const users = getUsers();
    return users.find(function (u) {
      return Number(u.userId) === Number(userId);
    });
  }

  function signInUser(user) {
    saveSession({
      userId: user.userId,
      role: user.role,
      userName: user.userName,
      lastActive: Date.now(),
      loginAt: nowIso()
    });
  }

  function initLoginPage() {
    seedData();
    readFlash("loginMsg");

    const session = getSession();
    if (session) {
      location.href = session.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
      return;
    }

    const form = document.getElementById("loginForm");
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setMessage("loginMsg", "", "info");

      const userId = document.getElementById("userId").value.trim();
      const password = document.getElementById("password").value.trim();

      if (!userId || !password) {
        setMessage("loginMsg", "All fields are required.", "err");
        return;
      }

      const user = findUserById(userId);
      const encryptedInput = encryptCaesar(password);

      if (!user || user.password !== encryptedInput) {
        setMessage("loginMsg", "User Id and/or Password is wrong. Please check your credentials.", "err");
        return;
      }

      signInUser(user);
      setMessage("loginMsg", "Sign-in successful. Redirecting...", "ok");
      setTimeout(function () {
        location.href = user.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
      }, 400);
    });
  }

  function validatePassword(password) {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,}$/.test(password);
  }

  function initRegisterPage() {
    seedData();
    const newUserIdEl = document.getElementById("newUserId");
    const generatedId = nextId("user");
    newUserIdEl.value = String(generatedId);

    const form = document.getElementById("registerForm");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      setMessage("registerMsg", "", "info");

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
        dob: document.getElementById("dob").value
      };

      const allPresent = Object.keys(payload).every(function (key) {
        return payload[key] !== "" && payload[key] !== null;
      });

      if (!allPresent) {
        setMessage("registerMsg", "All fields are mandatory.", "err");
        return;
      }

      if (!/^\d{10}$/.test(payload.phone)) {
        setMessage("registerMsg", "Phone number must contain exactly 10 digits.", "err");
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.emailId)) {
        setMessage("registerMsg", "Please enter a valid email address.", "err");
        return;
      }

      if (!/^\d{5,10}$/.test(payload.zipCode)) {
        setMessage("registerMsg", "Zip Code should be 5 to 10 digits.", "err");
        return;
      }

      if (!validatePassword(payload.password)) {
        setMessage("registerMsg", "Password must be at least 8 characters and include uppercase, number and special character.", "err");
        return;
      }

      const users = getUsers();
      const emailExists = users.some(function (u) {
        return u.emailId.toLowerCase() === payload.emailId.toLowerCase();
      });
      if (emailExists) {
        setMessage("registerMsg", "Email is already registered. Use another email.", "err");
        return;
      }

      payload.password = encryptCaesar(payload.password);
      payload.role = "Customer";

      users.push(payload);
      saveUsers(users);

      sessionStorage.setItem("fms_flash", "Registration successful.");
      location.href = "registration_success.html?userId=" + encodeURIComponent(String(payload.userId));
    });
  }

  function initRegistrationSuccess() {
    const params = new URLSearchParams(location.search);
    const userId = params.get("userId") || "N/A";
    const holder = document.getElementById("registeredUserId");
    holder.textContent = userId;
    readFlash("successMsg");
  }

  function buildFlights() {
    const carriers = getCarriers();
    const baseCities = ["Bengaluru", "Delhi", "Mumbai", "Hyderabad", "Chennai", "Kolkata", "Pune", "Bhopal"];
    const result = [];
    let id = 9000;

    carriers.forEach(function (carrier, index) {
      for (let i = 0; i < 3; i += 1) {
        const origin = baseCities[(index + i) % baseCities.length];
        const destination = baseCities[(index + i + 2) % baseCities.length];
        result.push({
          flightId: id,
          carrierId: carrier.carrierId,
          carrierName: carrier.carrierName,
          origin: origin,
          destination: destination,
          departureTime: ["06:10", "11:25", "18:40"][i],
          airFare: 4200 + i * 800 + index * 350,
          seatCapacityEconomyClass: 60,
          seatCapacityBusinessClass: 20,
          seatCapacityExecutiveClass: 30
        });
        id += 1;
      }
    });
    return result;
  }

  function ticketClassMultiplier(ticketClass) {
    if (ticketClass === "Business") {
      return 1.8;
    }
    if (ticketClass === "Executive") {
      return 1.35;
    }
    return 1;
  }

  function initCustomerDashboard() {
    const session = requireAuth("Customer");
    if (!session) {
      return;
    }
    startSessionGuard("customerMsg");

    const user = findUserById(session.userId);
    const flights = buildFlights();
    let selectedFlight = null;
    let selectedSeats = [];
    let selectedClass = "Economy";

    document.getElementById("welcomeName").textContent = user ? user.userName : "Customer";

    function userBookings() {
      return getBookings().filter(function (b) {
        return Number(b.userId) === Number(session.userId);
      });
    }

    function refreshSummary() {
      const bookings = userBookings();
      const booked = bookings.filter(function (b) {
        return b.bookingStatus === "Booked";
      });
      const amount = booked.reduce(function (sum, b) {
        return sum + Number(b.bookingAmount || 0);
      }, 0);

      document.getElementById("kpiFlights").textContent = String(flights.length);
      document.getElementById("kpiBookings").textContent = String(booked.length);
      document.getElementById("kpiSpent").textContent = "INR " + amount.toFixed(2);

      const historyBody = document.getElementById("historyBody");
      const rows = bookings
        .sort(function (a, b) { return Number(b.bookingId) - Number(a.bookingId); })
        .map(function (b) {
          return "<tr>" +
            "<td>" + escapeHtml(b.bookingId) + "</td>" +
            "<td>" + escapeHtml(b.origin + " to " + b.destination) + "</td>" +
            "<td>" + escapeHtml(b.seatCategory) + "</td>" +
            "<td>" + escapeHtml(b.noOfSeats) + "</td>" +
            "<td><span class=\"badge " + (b.bookingStatus === "Booked" ? "ok" : "pending") + "\">" + escapeHtml(b.bookingStatus) + "</span></td>" +
            "<td>INR " + Number(b.bookingAmount || 0).toFixed(2) + "</td>" +
            "</tr>";
        })
        .join("");
      historyBody.innerHTML = rows || "<tr><td colspan=\"6\">No bookings yet.</td></tr>";

      if (user) {
        document.getElementById("profileInfo").innerHTML =
          "<p><strong>User Id:</strong> " + escapeHtml(user.userId) + "</p>" +
          "<p><strong>Name:</strong> " + escapeHtml(user.userName) + "</p>" +
          "<p><strong>Email:</strong> " + escapeHtml(user.emailId) + "</p>" +
          "<p><strong>Phone:</strong> " + escapeHtml(user.phone) + "</p>" +
          "<p><strong>Category:</strong> " + escapeHtml(user.customerCategory) + "</p>" +
          "<p><strong>Address:</strong> " + escapeHtml(user.address1 + ", " + user.address2 + ", " + user.city) + "</p>";
      }
    }

    function showSection(sectionId) {
      ["dashboardSection", "bookSection", "historySection", "profileSection"].forEach(function (id) {
        document.getElementById(id).classList.add("hidden");
      });
      document.getElementById(sectionId).classList.remove("hidden");
    }

    function renderFlightResults(filtered) {
      const holder = document.getElementById("flightResults");
      if (!filtered.length) {
        holder.innerHTML = "<p class=\"muted\">No flights found for this search.</p>";
        return;
      }

      holder.innerHTML = filtered.map(function (f) {
        return "<div class=\"flight-item\">" +
          "<div>" +
          "<div><strong>" + escapeHtml(f.origin + " to " + f.destination) + "</strong> · " + escapeHtml(f.departureTime) + "</div>" +
          "<div class=\"muted\">Carrier: " + escapeHtml(f.carrierName) + " | Base Fare: INR " + Number(f.airFare).toFixed(2) + "</div>" +
          "</div>" +
          "<button data-flight-id=\"" + escapeHtml(f.flightId) + "\">Select</button>" +
          "</div>";
      }).join("");

      holder.querySelectorAll("button[data-flight-id]").forEach(function (button) {
        button.addEventListener("click", function () {
          const flightId = Number(button.getAttribute("data-flight-id"));
          selectedFlight = flights.find(function (f) { return Number(f.flightId) === flightId; }) || null;
          selectedSeats = [];
          document.getElementById("selectedFlightInfo").textContent = selectedFlight
            ? selectedFlight.origin + " to " + selectedFlight.destination + " | " + selectedFlight.carrierName + " | " + selectedFlight.departureTime
            : "";
          setMessage("customerMsg", "Flight selected. Continue with seats and passengers.", "ok");
        });
      });
    }

    function renderSeatMap() {
      const map = document.getElementById("seatMap");
      map.innerHTML = "";
      selectedSeats = [];
      document.getElementById("selectedSeatsLabel").textContent = "No seats selected";

      const maxRows = 8;
      const cols = ["A", "B", "C", "D", "E", "F"];
      for (let row = 1; row <= maxRows; row += 1) {
        const rowEl = document.createElement("div");
        rowEl.className = "seat-row";

        cols.forEach(function (col) {
          const seatNo = row + col;
          const seat = document.createElement("button");
          seat.type = "button";
          seat.className = "seat";
          seat.textContent = seatNo;

          const isBusinessBand = row <= 2;
          const isExecutiveBand = row >= 3 && row <= 4;
          const currentClass = document.getElementById("seatClass").value;
          let allowed = false;
          if (currentClass === "Business" && isBusinessBand) {
            allowed = true;
          }
          if (currentClass === "Executive" && isExecutiveBand) {
            allowed = true;
          }
          if (currentClass === "Economy" && row >= 5) {
            allowed = true;
          }
          if (!allowed) {
            seat.classList.add("locked");
          }

          seat.addEventListener("click", function () {
            const count = Number(document.getElementById("seatCount").value || 0);
            if (!count || count < 1) {
              setMessage("customerMsg", "Please enter number of seats first.", "warn");
              return;
            }
            if (seat.classList.contains("selected")) {
              seat.classList.remove("selected");
              selectedSeats = selectedSeats.filter(function (s) { return s !== seatNo; });
            } else {
              if (selectedSeats.length >= count) {
                setMessage("customerMsg", "You can select only " + count + " seats.", "warn");
                return;
              }
              seat.classList.add("selected");
              selectedSeats.push(seatNo);
            }
            document.getElementById("selectedSeatsLabel").textContent = selectedSeats.length
              ? "Selected Seats: " + selectedSeats.join(", ")
              : "No seats selected";
          });

          rowEl.appendChild(seat);
        });

        map.appendChild(rowEl);
      }
    }

    function renderPassengerForms() {
      const count = Number(document.getElementById("seatCount").value || 0);
      if (!selectedFlight) {
        setMessage("customerMsg", "Please select a flight first.", "warn");
        return false;
      }
      if (count < 1 || count > 9) {
        setMessage("customerMsg", "Number of seats must be between 1 and 9.", "err");
        return false;
      }
      if (selectedSeats.length !== count) {
        setMessage("customerMsg", "Select exactly " + count + " seats to continue.", "err");
        return false;
      }

      const holder = document.getElementById("passengerForms");
      holder.innerHTML = "";
      for (let i = 0; i < count; i += 1) {
        const block = document.createElement("div");
        block.className = "card";
        block.innerHTML =
          "<div class=\"section-title\">Passenger " + (i + 1) + " · Seat " + escapeHtml(selectedSeats[i]) + "</div>" +
          "<div class=\"form-grid\">" +
          "<div class=\"form-row\"><label>Name <span class=\"req\">*</span></label><input title=\"Passenger full name\" class=\"p-name\" /></div>" +
          "<div class=\"form-row\"><label>Age <span class=\"req\">*</span></label><input title=\"Passenger age\" class=\"p-age\" type=\"number\" min=\"0\" max=\"120\" /></div>" +
          "<div class=\"form-row\"><label>Food</label><select class=\"p-food\"><option value=\"0\">None</option><option value=\"300\">Veg Meal · 300</option><option value=\"450\">Non Veg Meal · 450</option><option value=\"120\">Snacks · 120</option></select></div>" +
          "<div class=\"form-row\"><label>Extra Luggage (Kg)</label><input class=\"p-luggage\" type=\"number\" min=\"0\" max=\"40\" value=\"0\" /></div>" +
          "</div>";
        holder.appendChild(block);
      }

      setMessage("customerMsg", "Passenger section ready. Submit to continue payment.", "ok");
      return true;
    }

    function submitBooking() {
      const travelDate = document.getElementById("travelDate").value;
      const seatCount = Number(document.getElementById("seatCount").value || 0);
      selectedClass = document.getElementById("seatClass").value;

      if (!travelDate) {
        setMessage("customerMsg", "Please choose travel date.", "err");
        return;
      }

      const passengerCards = Array.from(document.querySelectorAll("#passengerForms .card"));
      if (passengerCards.length !== seatCount) {
        setMessage("customerMsg", "Generate passenger section before booking.", "err");
        return;
      }

      const passengers = [];
      for (let i = 0; i < passengerCards.length; i += 1) {
        const card = passengerCards[i];
        const name = card.querySelector(".p-name").value.trim();
        const age = Number(card.querySelector(".p-age").value);
        const food = Number(card.querySelector(".p-food").value || 0);
        const luggage = Number(card.querySelector(".p-luggage").value || 0);

        if (!name || !age) {
          setMessage("customerMsg", "Passenger name and age are mandatory for all seats.", "err");
          return;
        }

        passengers.push({
          name: name,
          age: age,
          seatNo: selectedSeats[i],
          foodCost: food,
          extraLuggageKg: luggage
        });
      }

      const baseFare = Number(selectedFlight.airFare) * ticketClassMultiplier(selectedClass) * seatCount;
      const addOns = passengers.reduce(function (sum, p) {
        const baggageCost = p.extraLuggageKg > 15 ? (p.extraLuggageKg - 15) * 100 : 0;
        return sum + p.foodCost + baggageCost;
      }, 0);

      const bookingId = nextId("booking");
      const draftBooking = {
        bookingId: bookingId,
        flightId: selectedFlight.flightId,
        carrierId: selectedFlight.carrierId,
        userId: session.userId,
        origin: selectedFlight.origin,
        destination: selectedFlight.destination,
        seatCategory: selectedClass,
        noOfSeats: seatCount,
        dateOfTravel: travelDate,
        passengers: passengers,
        baseFare: Number(baseFare.toFixed(2)),
        addOnAmount: Number(addOns.toFixed(2)),
        bookingAmount: Number((baseFare + addOns).toFixed(2)),
        bookingStatus: "Pending Payment",
        createdOn: nowIso()
      };

      const bookings = getBookings();
      bookings.push(draftBooking);
      saveBookings(bookings);

      location.href = "payment_module.html?bookingId=" + encodeURIComponent(String(bookingId));
    }

    document.getElementById("navDashboard").addEventListener("click", function () {
      showSection("dashboardSection");
      refreshSummary();
    });

    document.getElementById("navBook").addEventListener("click", function () {
      showSection("bookSection");
      setMessage("customerMsg", "", "info");
    });

    document.getElementById("navHistory").addEventListener("click", function () {
      showSection("historySection");
      refreshSummary();
    });

    document.getElementById("navProfile").addEventListener("click", function () {
      showSection("profileSection");
      refreshSummary();
    });

    document.getElementById("logoutBtn").addEventListener("click", function () {
      logout("Signed out successfully.");
    });

    document.getElementById("searchFlightsBtn").addEventListener("click", function () {
      const from = document.getElementById("fromCity").value.trim();
      const to = document.getElementById("toCity").value.trim();
      if (!from || !to) {
        setMessage("customerMsg", "Origin and destination are required for flight search.", "err");
        return;
      }
      const result = flights.filter(function (f) {
        return f.origin.toLowerCase() === from.toLowerCase() && f.destination.toLowerCase() === to.toLowerCase();
      });
      renderFlightResults(result);
    });

    document.getElementById("seatClass").addEventListener("change", renderSeatMap);
    document.getElementById("buildPassengerBtn").addEventListener("click", function () {
      renderSeatMap();
      renderPassengerForms();
    });
    document.getElementById("submitBookingBtn").addEventListener("click", submitBooking);

    refreshSummary();
    renderFlightResults(flights.slice(0, 4));
  }

  function initAdminDashboard() {
    const session = requireAuth("Admin");
    if (!session) {
      return;
    }
    startSessionGuard("adminMsg");
    document.getElementById("adminName").textContent = session.userName;

    function renderTable() {
      const carriers = getCarriers();
      const body = document.getElementById("carrierBody");
      if (!carriers.length) {
        body.innerHTML = "<tr><td colspan=\"8\">No carriers found.</td></tr>";
        return;
      }

      body.innerHTML = carriers.map(function (c) {
        return "<tr>" +
          "<td><input type=\"radio\" name=\"carrierEdit\" value=\"" + escapeHtml(c.carrierId) + "\" /></td>" +
          "<td><input type=\"checkbox\" class=\"carrierDelete\" value=\"" + escapeHtml(c.carrierId) + "\" /></td>" +
          "<td>" + escapeHtml(c.carrierId) + "</td>" +
          "<td>" + escapeHtml(c.carrierName) + "</td>" +
          "<td>" + escapeHtml(c.discount30) + "%</td>" +
          "<td>" + escapeHtml(c.discount60) + "%</td>" +
          "<td>" + escapeHtml(c.discount90) + "%</td>" +
          "<td>" + escapeHtml(c.bulkBookingDiscount) + "%</td>" +
          "</tr>";
      }).join("");
    }

    document.getElementById("addCarrierBtn").addEventListener("click", function () {
      location.href = "admin/carrier_form.html?mode=add";
    });

    document.getElementById("editCarrierBtn").addEventListener("click", function () {
      const selected = document.querySelector("input[name='carrierEdit']:checked");
      if (!selected) {
        setMessage("adminMsg", "Please select Carrier to be Edited.", "warn");
        return;
      }
      location.href = "admin/carrier_form.html?mode=edit&carrierId=" + encodeURIComponent(selected.value);
    });

    document.getElementById("deleteCarrierBtn").addEventListener("click", function () {
      const selected = Array.from(document.querySelectorAll(".carrierDelete:checked")).map(function (el) {
        return Number(el.value);
      });
      if (!selected.length) {
        setMessage("adminMsg", "Please select Carrier(s) to be Deleted.", "warn");
        return;
      }
      const current = getCarriers();
      const updated = current.filter(function (c) {
        return !selected.includes(Number(c.carrierId));
      });
      saveCarriers(updated);
      renderTable();
      setMessage("adminMsg", "Selected carrier(s) deleted successfully.", "ok");
    });

    document.getElementById("adminLogoutBtn").addEventListener("click", function () {
      logout("Signed out successfully.");
    });

    readFlash("adminMsg");
    renderTable();
  }

  function initCarrierFormPage() {
    const session = requireAuth("Admin");
    if (!session) {
      return;
    }
    startSessionGuard("carrierFormMsg");

    const params = new URLSearchParams(location.search);
    const mode = params.get("mode") || "add";
    const carrierId = Number(params.get("carrierId"));

    const title = document.getElementById("carrierFormTitle");
    const idInput = document.getElementById("carrierId");
    const fields = [
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
    ];

    let original = null;

    if (mode === "edit") {
      title.textContent = "Edit Carrier";
      const target = getCarriers().find(function (c) {
        return Number(c.carrierId) === carrierId;
      });
      if (!target) {
        sessionStorage.setItem("fms_flash", "Carrier not found for editing.");
        location.href = "admin/admin_dashboard.html";
        return;
      }
      original = Object.assign({}, target);
      idInput.value = String(target.carrierId);
      idInput.readOnly = true;
      fields.forEach(function (field) {
        document.getElementById(field).value = String(target[field]);
      });
    } else {
      title.textContent = "Add Carrier";
      idInput.value = String(nextId("carrier"));
      idInput.readOnly = true;
    }

    document.getElementById("carrierForm").addEventListener("submit", function (event) {
      event.preventDefault();
      setMessage("carrierFormMsg", "", "info");

      const payload = {
        carrierId: Number(idInput.value),
        carrierName: document.getElementById("carrierName").value.trim(),
        discount30: Number(document.getElementById("discount30").value),
        discount60: Number(document.getElementById("discount60").value),
        discount90: Number(document.getElementById("discount90").value),
        bulkBookingDiscount: Number(document.getElementById("bulkBookingDiscount").value),
        refund2Days: Number(document.getElementById("refund2Days").value),
        refund10Days: Number(document.getElementById("refund10Days").value),
        refund20Days: Number(document.getElementById("refund20Days").value),
        silverDiscount: Number(document.getElementById("silverDiscount").value),
        goldDiscount: Number(document.getElementById("goldDiscount").value),
        platinumDiscount: Number(document.getElementById("platinumDiscount").value)
      };

      if (!payload.carrierName) {
        setMessage("carrierFormMsg", "Carrier Name is required.", "err");
        return;
      }

      const numericFields = [
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
      ];

      const valid = numericFields.every(function (field) {
        const value = payload[field];
        return Number.isFinite(value) && value >= 0 && value <= 100;
      });

      if (!valid) {
        setMessage("carrierFormMsg", "All percentage values must be between 0 and 100.", "err");
        return;
      }

      const carriers = getCarriers();

      if (mode === "edit") {
        const changed = JSON.stringify(payload) !== JSON.stringify(original);
        if (!changed) {
          setMessage("carrierFormMsg", "There are no changes made in the form to be saved.", "warn");
          return;
        }

        const updated = carriers.map(function (c) {
          return Number(c.carrierId) === payload.carrierId ? payload : c;
        });
        saveCarriers(updated);
        sessionStorage.setItem("fms_flash", "Carrier updated successfully.");
      } else {
        carriers.push(payload);
        saveCarriers(carriers);
        sessionStorage.setItem("fms_flash", "Carrier information saved successfully in the system.");
      }

      location.href = "admin/admin_dashboard.html";
    });

    document.getElementById("cancelCarrierBtn").addEventListener("click", function () {
      location.href = "admin/admin_dashboard.html";
    });
  }

  function getAdvancePercent(days, carrier) {
    if (days >= 90) {
      return Number(carrier.discount90 || 0);
    }
    if (days >= 60) {
      return Number(carrier.discount60 || 0);
    }
    if (days >= 30) {
      return Number(carrier.discount30 || 0);
    }
    return 0;
  }

  function getMembershipPercent(category, carrier) {
    if (category === "Silver") {
      return Number(carrier.silverDiscount || 0);
    }
    if (category === "Gold") {
      return Number(carrier.goldDiscount || 0);
    }
    if (category === "Platinum") {
      return Number(carrier.platinumDiscount || 0);
    }
    return 0;
  }

  function initPaymentPage() {
    const session = requireAuth("Customer");
    if (!session) {
      return;
    }
    startSessionGuard("paymentMsg");

    const params = new URLSearchParams(location.search);
    const bookingId = Number(params.get("bookingId"));

    const bookings = getBookings();
    const booking = bookings.find(function (b) {
      return Number(b.bookingId) === bookingId;
    });

    if (!booking) {
      setMessage("paymentMsg", "Booking not found. Please return to customer dashboard.", "err");
      document.getElementById("payNowBtn").disabled = true;
      return;
    }

    if (booking.bookingStatus === "Booked") {
      location.href = "booking_success.html?bookingId=" + encodeURIComponent(String(bookingId));
      return;
    }

    const carrier = getCarriers().find(function (c) {
      return Number(c.carrierId) === Number(booking.carrierId);
    });
    const user = findUserById(session.userId);

    document.getElementById("bookingRef").textContent = String(booking.bookingId);
    document.getElementById("journeyRef").textContent = booking.origin + " to " + booking.destination;
    document.getElementById("travelDateRef").textContent = booking.dateOfTravel;
    document.getElementById("ticketsRef").textContent = String(booking.noOfSeats);
    document.getElementById("baseFare").value = String(Number(booking.bookingAmount).toFixed(2));

    function calculateAmount() {
      const base = Number(document.getElementById("baseFare").value || 0);
      const tax = 500;
      const today = new Date();
      const travelDate = new Date(booking.dateOfTravel + "T00:00:00");
      const diff = Math.max(0, Math.floor((travelDate - today) / (1000 * 60 * 60 * 24)));

      const advancePercent = carrier ? getAdvancePercent(diff, carrier) : 0;
      const bulkPercent = booking.noOfSeats >= 5 && carrier ? Number(carrier.bulkBookingDiscount || 0) : 0;
      const memberPercent = carrier && user ? getMembershipPercent(user.customerCategory, carrier) : 0;

      const advanceDiscount = (base * advancePercent) / 100;
      const bulkDiscount = (base * bulkPercent) / 100;
      const memberDiscount = (base * memberPercent) / 100;
      const finalAmount = Math.max(0, base - advanceDiscount - bulkDiscount - memberDiscount + tax);

      document.getElementById("advanceDiscount").textContent = advanceDiscount.toFixed(2);
      document.getElementById("bulkDiscount").textContent = bulkDiscount.toFixed(2);
      document.getElementById("memberDiscount").textContent = memberDiscount.toFixed(2);
      document.getElementById("tax").textContent = tax.toFixed(2);
      document.getElementById("finalAmount").textContent = finalAmount.toFixed(2);

      return finalAmount;
    }

    function togglePayment() {
      const method = document.getElementById("paymentMethod").value;
      document.getElementById("cardSection").classList.add("hidden");
      document.getElementById("netbankingSection").classList.add("hidden");
      document.getElementById("upiSection").classList.add("hidden");

      if (method === "credit" || method === "debit") {
        document.getElementById("cardSection").classList.remove("hidden");
      } else if (method === "netbanking") {
        document.getElementById("netbankingSection").classList.remove("hidden");
      } else {
        document.getElementById("upiSection").classList.remove("hidden");
      }
    }

    document.getElementById("paymentMethod").addEventListener("change", togglePayment);

    document.getElementById("payNowBtn").addEventListener("click", function () {
      setMessage("paymentMsg", "", "info");
      const method = document.getElementById("paymentMethod").value;

      if (method === "credit" || method === "debit") {
        const card = document.getElementById("cardNumber").value.trim();
        const expiry = document.getElementById("expiry").value;
        const cvv = document.getElementById("cvv").value.trim();
        if (!/^\d{16}$/.test(card)) {
          setMessage("paymentMsg", "Enter valid 16-digit card number.", "err");
          return;
        }
        if (!expiry) {
          setMessage("paymentMsg", "Select expiry date.", "err");
          return;
        }
        if (!/^\d{3}$/.test(cvv)) {
          setMessage("paymentMsg", "Enter valid 3-digit CVV.", "err");
          return;
        }
      }

      if (method === "netbanking") {
        const account = document.getElementById("accountNumber").value.trim();
        if (!/^\d{9,18}$/.test(account)) {
          setMessage("paymentMsg", "Enter valid account number.", "err");
          return;
        }
      }

      if (method === "upi") {
        const upi = document.getElementById("upi").value.trim();
        if (!/^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/.test(upi)) {
          setMessage("paymentMsg", "Enter valid UPI ID.", "err");
          return;
        }
      }

      const amount = calculateAmount();
      const updated = getBookings().map(function (b) {
        if (Number(b.bookingId) === Number(booking.bookingId)) {
          b.bookingAmount = Number(amount.toFixed(2));
          b.bookingStatus = "Booked";
          b.bookingMethod = method;
          b.paymentDate = nowIso();
        }
        return b;
      });
      saveBookings(updated);

      sessionStorage.setItem("fms_flash", "Payment successful. Booking confirmed.");
      location.href = "booking_success.html?bookingId=" + encodeURIComponent(String(booking.bookingId));
    });

    document.getElementById("cancelPaymentBtn").addEventListener("click", function () {
      location.href = "customer_dashboard.html";
    });

    togglePayment();
    calculateAmount();
  }

  function initBookingSuccess() {
    const session = requireAuth("Customer");
    if (!session) {
      return;
    }
    startSessionGuard("bookingSuccessMsg");

    const params = new URLSearchParams(location.search);
    const bookingId = Number(params.get("bookingId"));
    const booking = getBookings().find(function (b) {
      return Number(b.bookingId) === bookingId;
    });

    if (!booking) {
      setMessage("bookingSuccessMsg", "Booking not found.", "err");
      return;
    }

    readFlash("bookingSuccessMsg");

    document.getElementById("successRef").textContent = String(booking.bookingId);
    document.getElementById("successJourney").textContent = booking.origin + " to " + booking.destination;
    document.getElementById("successAmount").textContent = Number(booking.bookingAmount || 0).toFixed(2);
    document.getElementById("successStatus").textContent = booking.bookingStatus;
    document.getElementById("successDate").textContent = booking.dateOfTravel;
  }

  function initErrorPages() {
    const homeBtn = document.getElementById("goHomeBtn");
    if (!homeBtn) {
      return;
    }
    homeBtn.addEventListener("click", function () {
      const session = getSession();
      if (!session) {
        location.href = "index (1).html";
        return;
      }
      location.href = session.role === "Admin" ? "admin/admin_dashboard.html" : "customer_dashboard.html";
    });
  }

  seedData();

  if (page === "login") {
    initLoginPage();
  } else if (page === "register") {
    initRegisterPage();
  } else if (page === "register-success") {
    initRegistrationSuccess();
  } else if (page === "customer") {
    initCustomerDashboard();
  } else if (page === "admin") {
    initAdminDashboard();
  } else if (page === "carrier-form") {
    initCarrierFormPage();
  } else if (page === "payment") {
    initPaymentPage();
  } else if (page === "booking-success") {
    initBookingSuccess();
  } else if (page === "error") {
    initErrorPages();
  }
})();
