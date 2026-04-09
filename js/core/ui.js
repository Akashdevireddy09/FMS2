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

  function confirmAction(message, onConfirm) {
    if (!window.confirm(message || "Are you sure you want to continue?")) {
      return false;
    }
    if (typeof onConfirm === "function") {
      onConfirm();
    }
    return true;
  }

  function showPopup(options) {
    const config = options || {};
    const existing = document.getElementById("fmsPopupOverlay");
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "fmsPopupOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "background:rgba(15,23,42,0.55)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "z-index:2000",
      "padding:16px"
    ].join(";");

    const dialog = document.createElement("div");
    dialog.style.cssText = [
      "width:min(440px, 100%)",
      "background:#fff",
      "border-radius:16px",
      "box-shadow:0 24px 60px rgba(15,23,42,0.24)",
      "padding:24px",
      "border:1px solid rgba(59,130,246,0.18)"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = config.title || "Message";
    title.style.cssText = "font-size:1.1rem;font-weight:700;color:#1e293b;margin-bottom:10px;";

    const message = document.createElement("div");
    message.innerHTML = escapeHtml(config.message || "");
    message.style.cssText = "color:#334155;line-height:1.5;margin-bottom:20px;white-space:pre-wrap;";

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:12px;";

    const okButton = document.createElement("button");
    okButton.type = "button";
    okButton.textContent = config.buttonText || "OK";
    okButton.style.cssText = [
      "border:none",
      "border-radius:10px",
      "padding:10px 16px",
      "background:#1e5bb8",
      "color:#fff",
      "font-weight:600",
      "cursor:pointer"
    ].join(";");

    function closePopup() {
      overlay.remove();
      if (typeof config.onClose === "function") {
        config.onClose();
      }
    }

    okButton.addEventListener("click", closePopup);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closePopup();
      }
    });

    actions.appendChild(okButton);
    dialog.appendChild(title);
    dialog.appendChild(message);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    okButton.focus();
    return overlay;
  }

  function showConfirmPopup(options) {
    const config = options || {};
    const existing = document.getElementById("fmsPopupOverlay");
    if (existing) {
      existing.remove();
    }

    const overlay = document.createElement("div");
    overlay.id = "fmsPopupOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "background:rgba(15,23,42,0.55)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "z-index:2000",
      "padding:16px"
    ].join(";");

    const dialog = document.createElement("div");
    dialog.style.cssText = [
      "width:min(460px, 100%)",
      "background:#fff",
      "border-radius:16px",
      "box-shadow:0 24px 60px rgba(15,23,42,0.24)",
      "padding:24px",
      "border:1px solid rgba(59,130,246,0.18)"
    ].join(";");

    const title = document.createElement("div");
    title.textContent = config.title || "Confirm Action";
    title.style.cssText = "font-size:1.1rem;font-weight:700;color:#1e293b;margin-bottom:10px;";

    const message = document.createElement("div");
    message.innerHTML = escapeHtml(config.message || "Are you sure?");
    message.style.cssText = "color:#334155;line-height:1.5;margin-bottom:20px;white-space:pre-wrap;";

    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;justify-content:flex-end;gap:12px;";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = config.cancelText || "Cancel";
    cancelButton.style.cssText = [
      "border:1px solid #cbd5e1",
      "border-radius:10px",
      "padding:10px 16px",
      "background:#fff",
      "color:#1e293b",
      "font-weight:600",
      "cursor:pointer"
    ].join(";");

    const confirmButton = document.createElement("button");
    confirmButton.type = "button";
    confirmButton.textContent = config.confirmText || "Confirm";
    confirmButton.style.cssText = [
      "border:none",
      "border-radius:10px",
      "padding:10px 16px",
      "background:#c0392b",
      "color:#fff",
      "font-weight:600",
      "cursor:pointer"
    ].join(";");

    function closePopup() {
      overlay.remove();
      if (typeof config.onCancel === "function") {
        config.onCancel();
      }
    }

    function acceptPopup() {
      overlay.remove();
      if (typeof config.onConfirm === "function") {
        config.onConfirm();
      }
    }

    cancelButton.addEventListener("click", closePopup);
    confirmButton.addEventListener("click", acceptPopup);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) {
        closePopup();
      }
    });

    actions.appendChild(cancelButton);
    actions.appendChild(confirmButton);
    dialog.appendChild(title);
    dialog.appendChild(message);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    confirmButton.focus();
    return overlay;
  }

  window.FMS = window.FMS || {};
  window.FMS.core = window.FMS.core || {};
  window.FMS.core.ui = {
    byId: byId,
    setMessage: setMessage,
    readFlash: readFlash,
    escapeHtml: escapeHtml,
    confirmAction: confirmAction,
    showPopup: showPopup,
    showConfirmPopup: showConfirmPopup
  };
})();
