(function () {
  "use strict";

  function renderBreakdown(targetId, breakdown) {
    const holder = document.getElementById(targetId);
    if (!holder) {
      return;
    }
    holder.innerHTML =
      "<p>Base Fare: INR " + breakdown.base.toFixed(2) + "</p>" +
      "<p>Add-ons: INR " + breakdown.addOn.toFixed(2) + "</p>" +
      "<p>Advance Discount (" + breakdown.advancePct + "%): -INR " + breakdown.advanceAmt.toFixed(2) + "</p>" +
      "<p>Child Discount (" + breakdown.childPct.toFixed(2) + "%): -INR " + breakdown.childAmt.toFixed(2) + "</p>" +
      "<p>Customer Category Discount (" + breakdown.membershipPct + "%): -INR " + breakdown.membershipAmt.toFixed(2) + "</p>" +
      "<p>Bulk Discount (" + breakdown.bulkPct + "%): -INR " + breakdown.bulkAmt.toFixed(2) + "</p>" +
      "<p>Tax: INR " + breakdown.tax.toFixed(2) + "</p>" +
      "<p><strong>Final Amount: INR " + breakdown.finalAmount.toFixed(2) + "</strong></p>";
  }

  window.FMS = window.FMS || {};
  window.FMS.modules = window.FMS.modules || {};
  window.FMS.modules.fareDiscount = { renderBreakdown: renderBreakdown };
})();
