(function () {
  "use strict";

  function classMultiplier(seatCategory) {
    if (seatCategory === "Business") {
      return 1.8;
    }
    if (seatCategory === "Executive") {
      return 1.35;
    }
    return 1;
  }

  function membershipPercent(category, carrier) {
    if (!carrier) {
      return 0;
    }
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

  function advancePercent(daysBeforeTravel, carrier) {
    if (!carrier) {
      return 0;
    }
    if (daysBeforeTravel >= 90) {
      return Number(carrier.discount90 || 0);
    }
    if (daysBeforeTravel >= 60) {
      return Number(carrier.discount60 || 0);
    }
    if (daysBeforeTravel >= 30) {
      return Number(carrier.discount30 || 0);
    }
    return 0;
  }

  function childDiscountDetails(passengers, noOfSeats, baseFare) {
    if (!passengers || !passengers.length) {
      return { pct: 0, amt: 0, count: 0 };
    }

    const childCount = passengers.filter(function (p) { return Number(p.age) < 12; }).length;
    if (!childCount) {
      return { pct: 0, amt: 0, count: 0 };
    }

    const seatCount = Math.max(1, Number(noOfSeats) || passengers.length || 1);
    const perPassengerBaseFare = Number(baseFare || 0) / seatCount;
    const childAmt = childCount * perPassengerBaseFare * 0.25;
    const childPct = Number(baseFare || 0) > 0 ? (childAmt / Number(baseFare || 0)) * 100 : 0;

    return {
      pct: childPct,
      amt: childAmt,
      count: childCount
    };
  }

  function bulkPercent(noOfSeats, carrier) {
    if (!carrier) {
      return 0;
    }
    if (Number(noOfSeats) >= 5) {
      return Number(carrier.bulkBookingDiscount || 0);
    }
    return 0;
  }

  function daysBefore(dateString) {
    const now = new Date();
    const dt = new Date(String(dateString) + "T00:00:00");
    return Math.max(0, Math.floor((dt - now) / 86400000));
  }

  function calculateBreakdown(booking, carrier, userCategory) {
    const base = Number(booking.baseFare || booking.bookingAmount || 0);
    const addOn = Number(booking.addOnAmount || 0);
    const days = daysBefore(booking.dateOfTravel);

    const advancePct = advancePercent(days, carrier);
    const membershipPct = membershipPercent(userCategory, carrier);
    const bulkPct = bulkPercent(booking.noOfSeats, carrier);
    const child = childDiscountDetails(booking.passengers || [], booking.noOfSeats, base);
    const childPct = child.pct;

    const advanceAmt = (base * advancePct) / 100;
    const membershipAmt = (base * membershipPct) / 100;
    const bulkAmt = (base * bulkPct) / 100;
    const childAmt = child.amt;

    const subtotal = base + addOn;
    const discounted = subtotal - advanceAmt - membershipAmt - bulkAmt - childAmt;
    const tax = 500;
    const finalAmount = Math.max(0, discounted + tax);

    return {
      base: base,
      addOn: addOn,
      advancePct: advancePct,
      advanceAmt: advanceAmt,
      membershipPct: membershipPct,
      membershipAmt: membershipAmt,
      bulkPct: bulkPct,
      bulkAmt: bulkAmt,
      childPct: childPct,
      childAmt: childAmt,
      childCount: child.count,
      tax: tax,
      finalAmount: finalAmount
    };
  }

  function refundPercent(daysLeft, carrier) {
    if (!carrier) {
      return 0;
    }
    if (daysLeft >= 20) {
      return Number(carrier.refund20Days || 0);
    }
    if (daysLeft >= 10) {
      return Number(carrier.refund10Days || 0);
    }
    if (daysLeft >= 2) {
      return Number(carrier.refund2Days || 0);
    }
    return 0;
  }

  window.FMS = window.FMS || {};
  window.FMS.core = window.FMS.core || {};
  window.FMS.core.pricing = {
    classMultiplier: classMultiplier,
    calculateBreakdown: calculateBreakdown,
    daysBefore: daysBefore,
    refundPercent: refundPercent
  };
})();
