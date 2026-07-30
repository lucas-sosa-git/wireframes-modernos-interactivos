(function () {
  const MOUNT_SELECTOR = "[data-account-summary]";
  const OPEN_SELECTOR = "[data-account-context-open]";
  const COMPANY_OPEN_SELECTOR = "[data-account-company-open]";
  const CURRENT_LICENSE_SELECTOR = "[data-account-current-license], #currentLicenseNameMenu";
  const MODAL_ID = "accountContextModal";
  const COMPANY_MODAL_ID = "accountCompanyModal";
  const STORAGE_KEY = "gs1.portal.account-context.v1";
  const STATE_VERSION = 1;
  const subscribers = new Set();

  const accounts = [
    {
      id: "account-alimentos-sur",
      name: "Alimentos del Sur S.A.",
      cuit: "30-71234567-8",
      membership: "Plan Estándar",
      membershipTier: "standard",
      licenses: [
        { id: "license-alimentos-1", code: "0012345678901" },
        { id: "license-alimentos-2", code: "0012345678902" },
      ],
    },
    {
      id: "account-nutricion-andina",
      name: "Nutrición Andina S.A.",
      cuit: "30-70111222-4",
      membership: "Plan Estándar",
      membershipTier: "standard",
      licenses: [
        { id: "license-nutricion-1", code: "0023456789012" },
        { id: "license-nutricion-2", code: "0023456789013" },
      ],
    },
    {
      id: "account-mercado-federal",
      name: "Mercado Federal S.R.L.",
      cuit: "30-69888777-0",
      membership: "Plan Premium",
      membershipTier: "premium",
      licenses: [
        { id: "license-mercado-1", code: "0034567890123" },
        { id: "license-mercado-2", code: "0034567890124" },
      ],
    },
  ];

  let currentState = loadState();
  let draftState = { ...currentState };
  let documentEventsBound = false;
  let storageListenerBound = false;

  document.addEventListener("DOMContentLoaded", () => {
    mountAll();
    bindDocumentEvents();
    bindStorageListener();
  });

  function mountAll(root = document) {
    root.querySelectorAll(MOUNT_SELECTOR).forEach(renderMount);
    ensureModal();
    ensureCompanyModal();
    syncExternalTargets();
  }

  function renderMount(mount) {
    if (!mount) {
      return;
    }

    const context = getCurrentContext();
    mount.dataset.accountSummaryMounted = "true";
    mount.innerHTML = `
      <div class="account-summary">
        <div class="account-summary__header">
        </div>
        <div class="account-summary__grid">
          <div class="account-summary__item">
            <div class="account-summary__label">Empresa</div>
            <div class="account-summary__value">${escapeHtml(context.account.name)}</div>
          </div>
          <div class="account-summary__item">
            <div class="account-summary__label">CUIT</div>
            <div class="account-summary__value">${escapeHtml(context.account.cuit)}</div>
          </div>
          <div class="account-summary__item">
            <div class="account-summary__label">Licencia</div>
            <div class="account-summary__value">${escapeHtml(context.license.code)}</div>
            <button type="button" class="btn btn-outline-secondary btn-sm" data-account-context-open>
            Cambiar licencia
          </button>
          </div>
          <div class="account-summary__item">
            <div class="account-summary__label">Membresía</div>
            <div class="account-summary__value">
              <span class="membership-badge membership-badge--${escapeHtml(context.account.membershipTier)}">${escapeHtml(context.account.membership)}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function ensureModal() {
    if (document.getElementById(MODAL_ID)) {
      return;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal fade" id="${MODAL_ID}" tabindex="-1" aria-labelledby="${MODAL_ID}Label" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title fs-5" id="${MODAL_ID}Label">Cambiar licencia</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body">
                <div class="account-context-selector">
                  <section aria-labelledby="accountContextLicensesTitle">
                    <div class="d-flex align-items-center justify-content-between gap-3 mb-2">
                      <h3 class="h6 mb-0" id="accountContextLicensesTitle">Seleccioná una licencia</h3>
                      <span class="small text-secondary">4 opciones disponibles</span>
                    </div>
                    <div class="account-context-options account-context-options--licenses" data-account-context-licenses></div>
                  </section>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" data-account-context-apply>Cambiar licencia</button>
              </div>
            </div>
          </div>
        </div>
      `,
    );
  }

  function ensureCompanyModal() {
    if (document.getElementById(COMPANY_MODAL_ID)) {
      return;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <div class="modal fade" id="${COMPANY_MODAL_ID}" tabindex="-1" aria-labelledby="${COMPANY_MODAL_ID}Label" aria-hidden="true">
          <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title fs-5" id="${COMPANY_MODAL_ID}Label">Cambiar empresa</h2>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
              </div>
              <div class="modal-body">
                <div class="d-flex align-items-center justify-content-between gap-3 mb-2">
                  <h3 class="h6 mb-0">Seleccioná una empresa</h3>
                  <span class="small text-secondary">${accounts.length} opciones disponibles</span>
                </div>
                <div class="account-context-options" data-account-company-options></div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                <button type="button" class="btn btn-primary" data-account-company-apply>Cambiar empresa</button>
              </div>
            </div>
          </div>
        </div>
      `,
    );
  }

  function renderCompanyModal() {
    ensureCompanyModal();
    const options = document.querySelector("[data-account-company-options]");
    options.innerHTML = accounts.map((account) => `
      <label class="account-context-option ${account.id === currentState.accountId ? "account-context-option--selected" : ""}">
        <input class="form-check-input" type="radio" name="accountCompany" value="${escapeHtml(account.id)}" ${account.id === currentState.accountId ? "checked" : ""}>
        <span>
          <span class="d-block fw-semibold">${escapeHtml(account.name)}</span>
          <span class="d-block small text-secondary">CUIT ${escapeHtml(account.cuit)}</span>
        </span>
        ${account.id === currentState.accountId ? '<span class="badge text-bg-success ms-auto">Activa</span>' : ""}
      </label>
    `).join("");
  }

  function renderModal() {
    ensureModal();
    const modal = document.getElementById(MODAL_ID);
    const licenseOptions = modal.querySelector("[data-account-context-licenses]");
    licenseOptions.innerHTML = getLicenseOptions()
      .map(({ account, license }) => `
        <label class="account-context-option ${license.id === draftState.licenseId ? "account-context-option--selected" : ""}">
          <input
            class="form-check-input"
            type="radio"
            name="accountContextLicense"
            value="${escapeHtml(license.id)}"
            data-account-context-license
            data-account-id="${escapeHtml(account.id)}"
            ${license.id === draftState.licenseId ? "checked" : ""}
          >
          <span>
            <span class="d-block fw-semibold">${escapeHtml(license.code)}</span>
            <span class="d-block small text-secondary">${escapeHtml(account.name)} · CUIT ${escapeHtml(account.cuit)}</span>
          </span>
          ${account.id === currentState.accountId && license.id === currentState.licenseId ? '<span class="badge text-bg-success ms-auto">Activa</span>' : ""}
        </label>
      `)
      .join("");
  }

  function bindDocumentEvents() {
    if (documentEventsBound) {
      return;
    }
    documentEventsBound = true;

    document.addEventListener("click", (event) => {
      const openTrigger = event.target.closest(OPEN_SELECTOR);
      if (openTrigger) {
        event.preventDefault();
        openSelector(openTrigger);
        return;
      }

      const companyOpenTrigger = event.target.closest(COMPANY_OPEN_SELECTOR);
      if (companyOpenTrigger) {
        event.preventDefault();
        openCompanySelector(companyOpenTrigger);
        return;
      }

      const companyApplyButton = event.target.closest("[data-account-company-apply]");
      if (companyApplyButton) {
        const selectedCompany = document.querySelector('input[name="accountCompany"]:checked');
        const account = selectedCompany && getAccount(selectedCompany.value);
        if (!account) {
          return;
        }
        selectContext(account.id, account.licenses[0].id);
        const modal = document.getElementById(COMPANY_MODAL_ID);
        if (modal && window.bootstrap) {
          bootstrap.Modal.getOrCreateInstance(modal).hide();
        }
        return;
      }

      const applyButton = event.target.closest("[data-account-context-apply]");
      if (!applyButton) {
        return;
      }

      selectContext(draftState.accountId, draftState.licenseId);
      const modal = document.getElementById(MODAL_ID);
      if (modal && window.bootstrap) {
        bootstrap.Modal.getOrCreateInstance(modal).hide();
      }
    });

    document.addEventListener("change", (event) => {
      if (event.target.matches("[data-account-context-license]")) {
        const option = getLicenseOptions().find(({ account, license }) => (
          account.id === event.target.dataset.accountId && license.id === event.target.value
        ));
        if (!option) {
          return;
        }
        draftState = { ...draftState, accountId: option.account.id, licenseId: option.license.id };
        renderModal();
      }
    });

    document.getElementById(MODAL_ID)?.addEventListener("hidden.bs.modal", () => {
      draftState = { ...currentState };
    });
  }

  function openSelector(trigger) {
    ensureModal();
    bindDocumentEvents();
    draftState = { ...currentState };
    renderModal();
    const modal = document.getElementById(MODAL_ID);
    if (!modal || !window.bootstrap) {
      return false;
    }
    bootstrap.Modal.getOrCreateInstance(modal).show(trigger);
    return true;
  }

  function openCompanySelector(trigger) {
    ensureCompanyModal();
    renderCompanyModal();
    const modal = document.getElementById(COMPANY_MODAL_ID);
    if (!modal || !window.bootstrap) {
      return false;
    }
    bootstrap.Modal.getOrCreateInstance(modal).show(trigger);
    return true;
  }

  function selectContext(accountId, licenseId) {
    const nextState = createState(accountId, licenseId);
    if (!nextState) {
      return false;
    }

    currentState = nextState;
    draftState = { ...currentState };
    persistState(currentState);
    notify();
    return getCurrentContext();
  }

  function notify() {
    document.querySelectorAll(MOUNT_SELECTOR).forEach(renderMount);
    syncExternalTargets();
    const context = getCurrentContext();
    subscribers.forEach((callback) => callback(context));
    window.dispatchEvent(
      new CustomEvent("gs1:account-context-changed", {
        detail: context,
      }),
    );
  }

  function subscribe(callback) {
    if (typeof callback !== "function") {
      return function unsubscribe() {};
    }
    subscribers.add(callback);
    return function unsubscribe() {
      subscribers.delete(callback);
    };
  }

  function getCurrentContext() {
    const account = getAccount(currentState.accountId) || accounts[0];
    const license = account.licenses.find((item) => item.id === currentState.licenseId) || account.licenses[0];
    return {
      version: STATE_VERSION,
      account: {
        id: account.id,
        name: account.name,
        cuit: account.cuit,
        membership: account.membership,
        membershipTier: account.membershipTier,
      },
      license: { ...license },
      updatedAt: currentState.updatedAt,
    };
  }

  function syncExternalTargets() {
    const context = getCurrentContext();
    document.querySelectorAll(CURRENT_LICENSE_SELECTOR).forEach((target) => {
      target.textContent = context.license.code;
    });
  }

  function loadState() {
    let storedState = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      storedState = raw ? JSON.parse(raw) : null;
    } catch (error) {
      storedState = null;
    }

    if (storedState && storedState.version === STATE_VERSION) {
      const validState = createState(storedState.accountId, storedState.licenseId, storedState.updatedAt);
      if (validState) {
        return validState;
      }
    }

    const fallbackState = createState(accounts[0].id, accounts[0].licenses[0].id);
    persistState(fallbackState);
    return fallbackState;
  }

  function createState(accountId, licenseId, updatedAt) {
    const account = getAccount(accountId);
    const license = account && account.licenses.find((item) => item.id === licenseId && /^\d+$/.test(item.code));
    const isSelectableLicense = getLicenseOptions().some((option) => (
      option.account.id === accountId && option.license.id === licenseId
    ));
    if (!account || !license || !isSelectableLicense) {
      return null;
    }
    return {
      version: STATE_VERSION,
      accountId: account.id,
      licenseId: license.id,
      updatedAt: typeof updatedAt === "string" ? updatedAt : new Date().toISOString(),
    };
  }

  function persistState(nextState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (error) {
      // The wireframe remains functional when browser storage is unavailable.
    }
  }

  function bindStorageListener() {
    if (storageListenerBound) {
      return;
    }
    storageListenerBound = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        const storedState = JSON.parse(event.newValue);
        const nextState = storedState.version === STATE_VERSION
          ? createState(storedState.accountId, storedState.licenseId, storedState.updatedAt)
          : null;
        if (!nextState) {
          return;
        }
        currentState = nextState;
        draftState = { ...currentState };
        notify();
      } catch (error) {
        // Ignore malformed state written by another tab.
      }
    });
  }

  function getAccount(accountId) {
    return accounts.find((account) => account.id === accountId);
  }

  function getLicenseOptions() {
    return accounts
      .flatMap((account) => account.licenses.map((license) => ({ account, license })))
      .slice(0, 4);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  window.GS1AccountSummary = {
    mountAll,
    getCurrentContext,
    selectContext,
    subscribe,
    openSelector,
  };
})();
