(function () {
  "use strict";

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
    box.className = "msg " + (type || "info");
    box.textContent = text;
  }

  function readFlash(msgId) {
    const value = sessionStorage.getItem("fms_flash");
    if (!value) {
      return;
    }
    setMessage(msgId, value, "info");
    sessionStorage.removeItem("fms_flash");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function byId(id) {
    return document.getElementById(id);
  }

  window.FMS = window.FMS || {};
  window.FMS.core = window.FMS.core || {};
  window.FMS.core.ui = {
    byId: byId,
    setMessage: setMessage,
    readFlash: readFlash,
    escapeHtml: escapeHtml
  };
})();
