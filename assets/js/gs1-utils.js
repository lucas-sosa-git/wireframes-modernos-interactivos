(function () {
  function normalizeCode(value) {
    return String(value || "").replace(/\s+/g, "").trim();
  }

  function digitsOnly(value) {
    return normalizeCode(value).replace(/\D/g, "");
  }

  function computeCheckDigit(body) {
    const normalized = digitsOnly(body);
    if (!normalized) {
      return "";
    }
    const total = normalized
      .split("")
      .reverse()
      .reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
    return String((10 - (total % 10)) % 10);
  }

  function validateLength(value, expectedLengths) {
    const normalized = digitsOnly(value);
    const allowed = Array.isArray(expectedLengths) ? expectedLengths : [expectedLengths];
    return allowed.includes(normalized.length);
  }

  function getUrlParam(name, fallback) {
    const params = new URLSearchParams(window.location.search);
    const value = params.get(name);
    return value == null || value === "" ? fallback ?? null : value;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeDigitalLinkGtin(value) {
    return digitsOnly(value).padStart(14, "0").slice(-14);
  }

  function formatDate(dateValue) {
    if (!dateValue || !/^\d{4}-\d{2}-\d{2}$/.test(String(dateValue))) {
      return dateValue || "-";
    }
    const [year, month, day] = String(dateValue).split("-");
    return `${day}/${month}/${year}`;
  }

  function showSimulationToast(message, tone) {
    const toastId = "gs1-simulation-toast";
    let container = document.getElementById("gs1-simulation-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "gs1-simulation-toast-container";
      container.className = "toast-container position-fixed top-0 end-0 p-3";
      document.body.appendChild(container);
    }

    let toastEl = document.getElementById(toastId);
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = toastId;
      toastEl.className = "toast align-items-center border-0";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      toastEl.setAttribute("aria-atomic", "true");
      toastEl.innerHTML = `
        <div class="d-flex">
          <div class="toast-body"></div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
        </div>
      `;
      container.appendChild(toastEl);
    }

    toastEl.classList.remove("text-bg-dark", "text-bg-success", "text-bg-danger");
    toastEl.classList.add(tone === "success" ? "text-bg-success" : tone === "danger" ? "text-bg-danger" : "text-bg-dark");
    toastEl.querySelector(".toast-body").textContent = message;

    if (window.bootstrap && window.bootstrap.Toast) {
      window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 2600 }).show();
    }
  }

  let scrollRequest = 0;
  function scrollToElement(element, options = {}) {
    if (!(element instanceof Element)) return;
    const request = ++scrollRequest;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (request !== scrollRequest || !element.isConnected) return;
      const rect = element.getBoundingClientRect();
      const header = document.querySelector("header.position-fixed, .bg-body-secondary.position-fixed, .p-3.bg-body-secondary.border-1");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const viewportHeight = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
      const gap = options.gap == null ? 16 : options.gap;
      if (!options.force && rect.top >= headerHeight + gap && rect.bottom <= viewportHeight - gap) return;
      element.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start", inline: "nearest" });
    }));
  }

  function isVisibleField(field) {
    const style = getComputedStyle(field);
    const rect = field.getBoundingClientRect();
    return !field.disabled && !field.readOnly && field.type !== "hidden" && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  }
  function focusNextVisibleField(currentField, root = document, options = {}) {
    if (!currentField || (currentField.required && (!currentField.value || !currentField.checkValidity()))) return null;
    const excluded = options.exclude || "[data-autoadvance-exclude]";
    const fields = Array.from(root.querySelectorAll("input, select, textarea, button")).filter((field) => isVisibleField(field) && !field.matches(excluded));
    const next = fields.slice(fields.indexOf(currentField) + 1).find((field) => !field.matches("button[type=button], button[type=submit], a"));
    if (!next) return null;
    try { next.focus({ preventScroll: true }); } catch (_) { next.focus(); }
    scrollToElement(next, options);
    return next;
  }

  function saveQrHandoff(payload) {
    try {
      const token = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(`gs1:qr-handoff:${token}`, JSON.stringify(payload));
      return token;
    } catch (_) { return null; }
  }
  function readQrHandoff(token) {
    if (!token) return null;
    try { return JSON.parse(sessionStorage.getItem(`gs1:qr-handoff:${token}`) || "null"); } catch (_) { return null; }
  }

  window.GS1Utils = {
    normalizeCode,
    digitsOnly,
    computeCheckDigit,
    validateLength,
    getUrlParam,
    escapeHtml,
    normalizeDigitalLinkGtin,
    formatDate,
    showSimulationToast,
    scrollToElement,
    focusNextVisibleField,
    saveQrHandoff,
    readQrHandoff,
  };
})();
