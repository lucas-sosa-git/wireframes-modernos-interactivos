(function () {
  const MOUNT_SELECTOR = "[data-shortcuts]";
  const STORAGE_KEY = "gs1.portal.shortcuts.v1";
  const LEGACY_STORAGE_KEY = "gs1.shortcuts.visible";
  const STATE_VERSION = 1;
  const subscribers = new Set();
  const mounts = new Map();

  const shortcutsCatalog = [
    {
      id: "productos",
      label: "Productos",
      description: "Gestion de productos comerciales",
      href: "productos.html",
      variant: "primary",
      icon: "box-seam",
    },
    {
      id: "instructivos",
      label: "Instructivos",
      description: "Guias y documentacion operativa",
      href: "../b03/instructivos.html",
      icon: "file-earmark-medical",
    },
    {
      id: "utilidades",
      label: "Utilidades",
      description: "Herramientas complementarias del portal",
      href: "../b03/utilidades.html",
      icon: "box-seam",
    },
    {
      id: "usuarios",
      label: "Usuarios",
      description: "Administracion de usuarios",
      href: "../b03/usuarios.html",
      icon: "people",
    },
    {
      id: "empresas",
      label: "Empresas",
      description: "Gestion de empresas y licencias",
      href: "../b03/empresas.html",
      icon: "building",
    },
    {
      id: "gtin",
      label: "GTIN",
      description: "Generadores y consulta de GTIN",
      href: "../b03/gtin.html",
      icon: "upc",
    },
    {
      id: "simbologia",
      label: "Simbologia",
      description: "Generador de simbologia GS1",
      href: "../assets/otros/GeneradorCodigo_qr_dl",
      target: "_blank",
      icon: "fingerprint",
    },
    {
      id: "verificador",
      label: "Verificador",
      description: "Calculo de digito verificador",
      href: "../b03/utilidades.html",
      icon: "regex",
    },
    {
      id: "verified",
      label: "Verified",
      description: "Verified by GS1",
      href: "../b03/utilidades.html",
      icon: "patch-check",
    },
  ];

  const catalogById = new Map(shortcutsCatalog.map((shortcut) => [shortcut.id, shortcut]));
  const defaultShortcutIds = shortcutsCatalog.map((shortcut) => shortcut.id);
  let currentState = loadState();
  let storageListenerBound = false;

  function initAll() {
    document.querySelectorAll(MOUNT_SELECTOR).forEach((mount, index) => mountShortcuts(mount, index));
    bindStorageListener();
  }

  function mountShortcuts(mount, index) {
    if (mount.dataset.shortcutsMounted === "true") {
      renderMount(mount);
      return;
    }

    mount.dataset.shortcutsMounted = "true";
    mount.dataset.shortcutsInstanceId = String(index + 1);
    mount.innerHTML = createMarkup(index + 1);
    mounts.set(mount, {
      modalEl: mount.querySelector("[data-shortcuts-modal]"),
      draftIds: [...currentState.enabledShortcutIds],
    });
    bindMountEvents(mount);
    renderMount(mount);
  }

  function createMarkup(instanceId) {
    return `
      <div class="shortcuts-section__shell" data-shortcuts-root>
        <div class="shortcuts-section__header">
          <div>
            <div class="small text-secondary">Mantene visibles los accesos que mas usas.</div>
            <div class="small text-secondary" data-shortcuts-count></div>
          </div>
          <button type="button" class="btn btn-outline-secondary btn-sm shortcuts-edit-button" data-shortcuts-open>
            ${getIcon("plus-circle-dotted", 18)}
            <span>Agregar</span>
          </button>
        </div>
        <div class="shortcut-strip" data-shortcuts-strip></div>
      </div>
      <div class="modal fade" data-shortcuts-modal tabindex="-1" aria-labelledby="shortcutsModalLabel-${instanceId}" aria-hidden="true">
        <div class="modal-dialog shortcuts-modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h2 class="modal-title fs-5" id="shortcutsModalLabel-${instanceId}">Atajos</h2>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
                <p class="text-secondary mb-0">Activa o desactiva los accesos que queres mostrar en esta vista.</p>
                <span class="shortcut-selection-count" data-shortcuts-selection-count></span>
              </div>
              <div class="shortcut-options aplicativos" data-shortcuts-options></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" data-shortcuts-save>Guardar Cambios</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function bindMountEvents(mount) {
    const mountState = mounts.get(mount);
    const openButton = mount.querySelector("[data-shortcuts-open]");
    const saveButton = mount.querySelector("[data-shortcuts-save]");
    const modalEl = mountState.modalEl;
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

    openButton.addEventListener("click", () => {
      mountState.draftIds = [...currentState.enabledShortcutIds];
      renderOptions(mount);
      modal.show();
    });

    saveButton.addEventListener("click", () => {
      const nextState = sanitizeState({
        version: STATE_VERSION,
        enabledShortcutIds: mountState.draftIds,
        updatedAt: new Date().toISOString(),
      });
      save(nextState);
      modal.hide();
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      mountState.draftIds = [...currentState.enabledShortcutIds];
      renderOptions(mount);
    });

    modalEl.addEventListener("change", (event) => {
      const input = event.target.closest("[data-shortcut-option]");
      if (!input) {
        return;
      }

      const nextDraft = new Set(mountState.draftIds);
      if (input.checked) {
        nextDraft.add(input.dataset.shortcutOption);
      } else {
        nextDraft.delete(input.dataset.shortcutOption);
      }
      mountState.draftIds = sanitizeShortcutIds(Array.from(nextDraft));
      updateDraftCount(mount);
    });
  }

  function renderMount(mount) {
    renderStrip(mount);
    renderOptions(mount);
  }

  function renderStrip(mount) {
    const strip = mount.querySelector("[data-shortcuts-strip]");
    const countEl = mount.querySelector("[data-shortcuts-count]");
    const visibleSet = new Set(currentState.enabledShortcutIds);

    strip.innerHTML = shortcutsCatalog
      .filter((shortcut) => visibleSet.has(shortcut.id))
      .map((shortcut) => `
        <a
          class="shortcut-card ${shortcut.variant === "primary" ? "shortcut-card-primary" : ""}"
          href="${shortcut.href}"
          ${shortcut.target ? `target="${shortcut.target}" rel="noreferrer"` : ""}
          data-shortcut-id="${shortcut.id}"
        >
          <span class="shortcut-card-icon" aria-hidden="true">${getIcon(shortcut.icon, 26)}</span>
          <span class="shortcut-card-label">${shortcut.label}</span>
        </a>
      `)
      .join("");

    countEl.textContent = `${currentState.enabledCount} atajos activos`;
  }

  function renderOptions(mount) {
    const mountState = mounts.get(mount);
    const options = mount.querySelector("[data-shortcuts-options]");
    const draftSet = new Set(mountState.draftIds);

    options.innerHTML = shortcutsCatalog
      .map((shortcut) => `
        <label class="shortcut-option-card" for="shortcut-option-${mount.dataset.shortcutsInstanceId}-${shortcut.id}">
          <input
            type="checkbox"
            class="form-check-input position-absolute end-0 m-1 fs-4 shortcut-option-check"
            id="shortcut-option-${mount.dataset.shortcutsInstanceId}-${shortcut.id}"
            data-shortcut-option="${shortcut.id}"
            ${draftSet.has(shortcut.id) ? "checked" : ""}
          >
          <span class="shortcut-option-content">
            <span class="shortcut-option-icon feature-icon d-inline-flex align-items-center justify-content-center text-bg-primary bg-gradient fs-2 mb-1" aria-hidden="true">${getIcon(shortcut.icon, 32)}</span>
            <span class="shortcut-option-copy">
              <small>${shortcut.label}</small>
            </span>
          </span>
        </label>
      `)
      .join("");

    updateDraftCount(mount);
  }

  function updateDraftCount(mount) {
    const mountState = mounts.get(mount);
    const countEl = mount.querySelector("[data-shortcuts-selection-count]");
    countEl.textContent = `${mountState.draftIds.length} atajos seleccionados`;
  }

  function sanitizeShortcutIds(shortcutIds) {
    const seen = new Set();
    return shortcutIds.filter((id) => {
      if (!catalogById.has(id) || seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    });
  }

  function sanitizeState(candidate) {
    const safeIds = sanitizeShortcutIds(Array.isArray(candidate.enabledShortcutIds) ? candidate.enabledShortcutIds : []);
    const normalizedIds = safeIds.length ? safeIds : [...defaultShortcutIds];

    return {
      version: STATE_VERSION,
      enabledShortcutIds: normalizedIds,
      enabledCount: normalizedIds.length,
      updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : new Date().toISOString(),
    };
  }

  function loadState() {
    const nextState = readStoredState();
    persistState(nextState);
    return nextState;
  }

  function readStoredState() {
    try {
      const rawCurrent = localStorage.getItem(STORAGE_KEY);
      if (rawCurrent) {
        const parsedCurrent = JSON.parse(rawCurrent);
        if (parsedCurrent && parsedCurrent.version === STATE_VERSION) {
          return sanitizeState(parsedCurrent);
        }
      }
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
    }

    try {
      const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (rawLegacy) {
        const parsedLegacy = JSON.parse(rawLegacy);
        if (Array.isArray(parsedLegacy)) {
          const migrated = sanitizeState({
            version: STATE_VERSION,
            enabledShortcutIds: parsedLegacy,
            updatedAt: new Date().toISOString(),
          });
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          return migrated;
        }
      }
    } catch (error) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return sanitizeState({
      version: STATE_VERSION,
      enabledShortcutIds: defaultShortcutIds,
      updatedAt: new Date().toISOString(),
    });
  }

  function persistState(nextState) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }

  function save(nextState) {
    currentState = sanitizeState(nextState);
    persistState(currentState);
    notify();
    return currentState;
  }

  function restoreDefaults() {
    return save({
      version: STATE_VERSION,
      enabledShortcutIds: defaultShortcutIds,
      updatedAt: new Date().toISOString(),
    });
  }

  function notify() {
    mounts.forEach((_, mount) => renderMount(mount));
    subscribers.forEach((callback) => callback(getState()));
    window.dispatchEvent(
      new CustomEvent("gs1:shortcuts-changed", {
        detail: getState(),
      })
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

  function bindStorageListener() {
    if (storageListenerBound) {
      return;
    }
    storageListenerBound = true;
    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY && event.key !== LEGACY_STORAGE_KEY) {
        return;
      }
      currentState = readStoredState();
      notify();
    });
  }

  function getState() {
    return {
      version: currentState.version,
      enabledShortcutIds: [...currentState.enabledShortcutIds],
      enabledCount: currentState.enabledCount,
      updatedAt: currentState.updatedAt,
    };
  }

  function getEnabledCount() {
    return currentState.enabledCount;
  }

  function getCatalog() {
    return shortcutsCatalog.map((shortcut) => ({ ...shortcut }));
  }

  function getIcon(iconName, size) {
    const iconSize = size || 24;
    const icons = {
      "box-seam": `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z"/></svg>`,
      gear: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/></svg>`,
      "file-earmark-medical": `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path d="M7.5 5.5a.5.5 0 0 0-1 0v.634l-.549-.317a.5.5 0 1 0-.5.866L6 7l-.549.317a.5.5 0 1 0 .5.866l.549-.317V8.5a.5.5 0 1 0 1 0v-.634l.549.317a.5.5 0 1 0 .5-.866L8 7l.549-.317a.5.5 0 1 0-.5-.866l-.549.317zm-2 4.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/></svg>`,
      people: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>`,
      building: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/><path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3z"/></svg>`,
      upc: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path d="M3 4.5a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0zm2 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0zm2 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0zm2 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0z"/></svg>`,
      fingerprint: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path d="M8.06 6.5a.5.5 0 0 1 .5.5v.776a11.5 11.5 0 0 1-.552 3.519l-1.331 4.14a.5.5 0 0 1-.952-.305l1.33-4.141a10.5 10.5 0 0 0 .504-3.213V7a.5.5 0 0 1 .5-.5Z"/><path d="M6.06 7a2 2 0 1 1 4 0 .5.5 0 1 1-1 0 1 1 0 1 0-2 0v.332q0 .613-.066 1.221A.5.5 0 0 1 6 8.447q.06-.555.06-1.115zm3.509 1a.5.5 0 0 1 .487.513 11.5 11.5 0 0 1-.587 3.339l-1.266 3.8a.5.5 0 0 1-.949-.317l1.267-3.8a10.5 10.5 0 0 0 .535-3.048A.5.5 0 0 1 9.569 8m-3.356 2.115a.5.5 0 0 1 .33.626L5.24 14.939a.5.5 0 1 1-.955-.296l1.303-4.199a.5.5 0 0 1 .625-.329"/><path d="M4.759 5.833A3.501 3.501 0 0 1 11.559 7a.5.5 0 0 1-1 0 2.5 2.5 0 0 0-4.857-.833.5.5 0 1 1-.943-.334m.3 1.67a.5.5 0 0 1 .449.546 10.7 10.7 0 0 1-.4 2.031l-1.222 4.072a.5.5 0 1 1-.958-.287L4.15 9.793a9.7 9.7 0 0 0 .363-1.842.5.5 0 0 1 .546-.449Zm6 .647a.5.5 0 0 1 .5.5c0 1.28-.213 2.552-.632 3.762l-1.09 3.145a.5.5 0 0 1-.944-.327l1.089-3.145c.382-1.105.578-2.266.578-3.435a.5.5 0 0 1 .5-.5Z"/><path d="M3.902 4.222a5 5 0 0 1 5.202-2.113.5.5 0 0 1-.208.979 4 4 0 0 0-4.163 1.69.5.5 0 0 1-.831-.556m6.72-.955a.5.5 0 0 1 .705-.052A4.99 4.99 0 0 1 13.059 7v1.5a.5.5 0 1 1-1 0V7a3.99 3.99 0 0 0-1.386-3.028.5.5 0 0 1-.051-.705M3.68 5.842a.5.5 0 0 1 .422.568q-.044.289-.044.59c0 .71-.1 1.417-.298 2.1l-1.14 3.923a.5.5 0 1 1-.96-.279L2.8 8.821A6.5 6.5 0 0 0 3.058 7q0-.375.054-.736a.5.5 0 0 1 .568-.422m8.882 3.66a.5.5 0 0 1 .456.54c-.084 1-.298 1.986-.64 2.934l-.744 2.068a.5.5 0 0 1-.941-.338l.745-2.07a10.5 10.5 0 0 0 .584-2.678.5.5 0 0 1 .54-.456"/><path d="M4.81 1.37A6.5 6.5 0 0 1 14.56 7a.5.5 0 1 1-1 0 5.5 5.5 0 0 0-8.25-4.765.5.5 0 0 1-.5-.865m-.89 1.257a.5.5 0 0 1 .04.706A5.48 5.48 0 0 0 2.56 7a.5.5 0 0 1-1 0c0-1.664.626-3.184 1.655-4.333a.5.5 0 0 1 .706-.04ZM1.915 8.02a.5.5 0 0 1 .346.616l-.779 2.767a.5.5 0 1 1-.962-.27l.778-2.767a.5.5 0 0 1 .617-.346m12.15.481a.5.5 0 0 1 .49.51c-.03 1.499-.161 3.025-.727 4.533l-.07.187a.5.5 0 0 1-.936-.351l.07-.187c.506-1.35.634-2.74.663-4.202a.5.5 0 0 1 .51-.49"/></svg>`,
      regex: `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M3.05 3.05a7 7 0 0 0 0 9.9.5.5 0 0 1-.707.707 8 8 0 0 1 0-11.314.5.5 0 1 1 .707.707m9.9-.707a.5.5 0 0 1 .707 0 8 8 0 0 1 0 11.314.5.5 0 0 1-.707-.707 7 7 0 0 0 0-9.9.5.5 0 0 1 0-.707M6 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0m5-6.5a.5.5 0 0 0-1 0v2.117L8.257 5.57a.5.5 0 0 0-.514.858L9.528 7.5 7.743 8.571a.5.5 0 1 0 .514.858L10 8.383V10.5a.5.5 0 1 0 1 0V8.383l1.743 1.046a.5.5 0 0 0 .514-.858L11.472 7.5l1.785-1.071a.5.5 0 1 0-.514-.858L11 6.617z"/></svg>`,
      "patch-check": `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10.354 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7 8.793l2.646-2.647a.5.5 0 0 1 .708 0"/><path d="m10.273 2.513-.921-.944.715-.698.622.637.89-.011a2.89 2.89 0 0 1 2.924 2.924l-.01.89.636.622a2.89 2.89 0 0 1 0 4.134l-.637.622.011.89a2.89 2.89 0 0 1-2.924 2.924l-.89-.01-.622.636a2.89 2.89 0 0 1-4.134 0l-.622-.637-.89.011a2.89 2.89 0 0 1-2.924-2.924l.01-.89-.636-.622a2.89 2.89 0 0 1 0-4.134l.637-.622-.011-.89a2.89 2.89 0 0 1 2.924-2.924l.89.01.622-.636a2.89 2.89 0 0 1 4.134 0l-.715.698a1.89 1.89 0 0 0-2.704 0l-.92.944-1.32-.016a1.89 1.89 0 0 0-1.911 1.912l.016 1.318-.944.921a1.89 1.89 0 0 0 0 2.704l.944.92-.016 1.32a1.89 1.89 0 0 0 1.912 1.911l1.318-.016.921.944a1.89 1.89 0 0 0 2.704 0l.92-.944 1.32.016a1.89 1.89 0 0 0 1.911-1.912l-.016-1.318.944-.921a1.89 1.89 0 0 0 0-2.704l-.944-.92.016-1.32a1.89 1.89 0 0 0-1.912-1.911z"/></svg>`,
      "plus-circle-dotted": `<svg xmlns="http://www.w3.org/2000/svg" width="${iconSize}" height="${iconSize}" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0q-.264 0-.523.017l.064.998a7 7 0 0 1 .918 0l.064-.998A8 8 0 0 0 8 0M6.44.152q-.52.104-1.012.27l.321.948q.43-.147.884-.237L6.44.153zm4.132.271a8 8 0 0 0-1.011-.27l-.194.98q.453.09.884.237zm1.873.925a8 8 0 0 0-.906-.524l-.443.896q.413.205.793.459zM4.46.824q-.471.233-.905.524l.556.83a7 7 0 0 1 .793-.458zM2.725 1.985q-.394.346-.74.74l.752.66q.303-.345.648-.648zm11.29.74a8 8 0 0 0-.74-.74l-.66.752q.346.303.648.648zm1.161 1.735a8 8 0 0 0-.524-.905l-.83.556q.254.38.458.793l.896-.443zM1.348 3.555q-.292.433-.524.906l.896.443q.205-.413.459-.793zM.423 5.428a8 8 0 0 0-.27 1.011l.98.194q.09-.453.237-.884zM15.848 6.44a8 8 0 0 0-.27-1.012l-.948.321q.147.43.237.884zM.017 7.477a8 8 0 0 0 0 1.046l.998-.064a7 7 0 0 1 0-.918zM16 8a8 8 0 0 0-.017-.523l-.998.064a7 7 0 0 1 0 .918l.998.064A8 8 0 0 0 16 8M.152 9.56q.104.52.27 1.012l.948-.321a7 7 0 0 1-.237-.884l-.98.194zm15.425 1.012q.168-.493.27-1.011l-.98-.194q-.09.453-.237.884zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a7 7 0 0 1-.458-.793zm13.828.905q.292-.434.524-.906l-.896-.443q-.205.413-.459.793zm-12.667.83q.346.394.74.74l.66-.752a7 7 0 0 1-.648-.648zm11.29.74q.394-.346.74-.74l-.752-.66q-.302.346-.648.648zm-1.735 1.161q.471-.233.905-.524l-.556-.83a7 7 0 0 1-.793.458zm-7.985-.524q.434.292.906.524l.443-.896a7 7 0 0 1-.793-.459zm1.873.925q.493.168 1.011.27l.194-.98a7 7 0 0 1-.884-.237zm4.132.271a8 8 0 0 0 1.012-.27l-.321-.948a7 7 0 0 1-.884.237l.194.98zm-2.083.135a8 8 0 0 0 1.046 0l-.064-.998a7 7 0 0 1-.918 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"/></svg>`,
    };

    return icons[iconName] || "";
  }

  window.GS1Shortcuts = {
    initAll,
    getState,
    getEnabledCount,
    save,
    restoreDefaults,
    subscribe,
    getCatalog,
  };

  document.addEventListener("DOMContentLoaded", initAll);
})();
