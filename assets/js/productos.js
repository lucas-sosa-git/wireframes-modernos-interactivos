(function () {
  const TOOLTIP_SELECTOR = '[data-bs-toggle="tooltip"]';
  const TABLE_MODES = {
    products: "products",
    dispatchUnits: "dispatchUnits",
  };
  const PAGE_SIZE_BY_MODE = {
    [TABLE_MODES.products]: 10,
    [TABLE_MODES.dispatchUnits]: 10,
  };
  const COLUMN_VISIBILITY_STORAGE_KEY = "gs1.products.columnVisibility.v1";
  const REQUIRED_CORE_COLUMNS = ["code", "name"];
  const COLUMN_LAYOUT = {
    image: { min: 72, width: 72, max: 72, fixed: true },
    type: { min: 110, width: 110, max: 120, fixed: true },
    code: { min: 140, flexible: true },
    name: { min: 210, flexible: true, priority: "primary" },
    status: { min: 100, width: 100, max: 110, fixed: true },
    brand: { min: 120, flexible: true },
    variety: { min: 120, flexible: true },
    origin: { min: 120, flexible: true },
    packagingLevel: { min: 120, flexible: true },
    baseQuantity: { min: 160, flexible: true },
    destination: { min: 140, flexible: true },
    modifiedAt: { min: 140, width: 140, max: 145, fixed: true },
    createdAt: { min: 140, width: 140, max: 145, fixed: true },
    actions: { min: 230, width: 230, max: 230, fixed: true },
  };

  const currentUser = {
    name: "Maria Alejandra Lopez",
    email: "maria.lopez@empresa.com",
  };

  const licenses = [
    { id: "lic-1", name: "GS1 Alimentos del Sur", cuit: "30-71234567-8", membership: "Plan Estandar" },
    { id: "lic-2", name: "GS1 Nutricion Andina", cuit: "30-70111222-4", membership: "Plan Estandar" },
    { id: "lic-3", name: "GS1 Mercado Federal", cuit: "30-69888777-0", membership: "Plan Premium" },
  ];

  const notifications = [
    {
      title: "Revision pendiente de productos",
      description: "Hay 4 productos con observaciones antes de publicarlos.",
      timestamp: "Hoy 09:15",
      unread: true,
    },
    {
      title: "Factura disponible",
      description: "La factura del plan estandar ya puede descargarse.",
      timestamp: "Ayer 18:40",
      unread: true,
    },
    {
      title: "Capacitacion de carga masiva",
      description: "Sesion programada para el 18/07/2026 a las 10:00.",
      timestamp: "11/07/2026 10:00",
      unread: true,
    },
  ];

  const VIEW_CONFIG = {
    [TABLE_MODES.products]: {
      title: "Tabla Productos",
      statusLabel: "productos",
      emptyMessage: "No hay productos comerciales para mostrar con los filtros activos.",
      downloadLabel: "Descargar productos a Excel",
      columns: [
        { key: "image", label: "Imagen", className: "product-col-image", filterable: false },
        { key: "type", label: "Tipo de codigo", className: "product-col-tipo" },
        { key: "code", label: "Codigo", className: "product-col-codigo" },
        { key: "name", label: "Producto", className: "product-col-producto" },
        { key: "status", label: "Estado", className: "product-col-estado" },
        { key: "brand", label: "Marca", className: "product-col-marca" },
        { key: "variety", label: "Variedad", className: "product-col-variedad" },
        { key: "origin", label: "Origen", className: "product-col-origen" },
        { key: "modifiedAt", label: "Fecha de modificacion", className: "product-col-fecha-mod" },
        { key: "createdAt", label: "Fecha de alta", className: "product-col-fecha-alta" },
      ],
    },
    [TABLE_MODES.dispatchUnits]: {
      title: "Tabla Unidades de Despacho",
      statusLabel: "unidades de despacho",
      emptyMessage: "No hay unidades de despacho para mostrar con los filtros activos.",
      downloadLabel: "Descargar unidades de despacho a Excel",
      columns: [
        { key: "image", label: "Imagen", className: "product-col-image", filterable: false },
        { key: "type", label: "Tipo de codigo", className: "product-col-tipo" },
        { key: "code", label: "Codigo", className: "product-col-codigo" },
        { key: "name", label: "Unidad de despacho", className: "product-col-producto" },
        { key: "status", label: "Estado", className: "product-col-estado" },
        { key: "brand", label: "Marca", className: "product-col-marca" },
        { key: "packagingLevel", label: "Nivel", className: "product-col-variedad" },
        { key: "baseQuantity", label: "Contenido", className: "product-col-origin-wide" },
        { key: "destination", label: "Destino", className: "product-col-origen" },
        { key: "modifiedAt", label: "Fecha de modificacion", className: "product-col-fecha-mod" },
      ],
    },
  };

  const tableState = {
    [TABLE_MODES.products]: {
      page: 1,
      filters: {},
      filterSearch: {},
      sort: null,
      visibleColumns: [],
    },
    [TABLE_MODES.dispatchUnits]: {
      page: 1,
      filters: {},
      filterSearch: {},
      sort: null,
      visibleColumns: [],
    },
  };

  const state = {
    activeTable: TABLE_MODES.products,
    datasets: {
      [TABLE_MODES.products]: [],
      [TABLE_MODES.dispatchUnits]: [],
    },
    currentLicense: licenses[0],
    activeFilterMenu: null,
    activeFilterColumn: null,
    activeFilterDraft: [],
    activeFilterDraftSearch: "",
    bulkUploadType: null,
    bulkUploadSource: "generic",
    tooltips: [],
    lastFocusTrigger: null,
    digitalLinkValue: "",
  };

  let tableWrap;
  let tableEl;
  let tableHead;
  let tableBody;
  let tableColgroup;
  let paginationControls;
  let paginationStatus;
  let tableModeHeading;
  let modeButtons;
  let downloadButton;
  let columnsDropdownMenu;
  let toast;
  let toastBody;
  let productDetailModal;
  let logsModal;
  let imageModal;
  let digitalLinkModal;
  let symbolModal;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!window.GS1ProductCatalog) {
      return;
    }

    cacheDom();
    ensureDynamicModals();
    cacheDom();
    loadDatasets();
    initializeFilters();
    initBootstrap();
    initEventHandlers();
    renderNotifications();
    updateAccountContext();
    renderLicenseSelector();
    renderTable();
    initBulkUploadModal();
    initChart();
    initLogoutFlow();
    refreshTooltips();
  }

  function cacheDom() {
    tableWrap = document.querySelector(".product-table-wrap");
    tableEl = tableWrap ? tableWrap.querySelector("table") : null;
    tableHead = tableEl ? tableEl.querySelector("thead") : null;
    tableBody = document.getElementById("productosTableBody");
    tableColgroup = tableEl ? tableEl.querySelector("colgroup") : null;
    paginationControls = document.getElementById("paginationControls");
    paginationStatus = document.getElementById("paginationStatus");
    tableModeHeading = document.getElementById("tableModeHeading");
    modeButtons = Array.from(document.querySelectorAll("[data-table-mode]"));
    downloadButton = document.getElementById("downloadProductsBtn");
    columnsDropdownMenu = document.getElementById("columnsDropdownMenu");
    toastBody = document.getElementById("productsToastBody");
  }

  function loadDatasets() {
    state.datasets[TABLE_MODES.products] = window.GS1ProductCatalog.getCommercialProducts();
    state.datasets[TABLE_MODES.dispatchUnits] = window.GS1ProductCatalog.getDispatchUnits().map((record) => ({
      ...record,
      type: normalizeDispatchType(record.type),
    }));
  }

  function initializeFilters() {
    Object.keys(VIEW_CONFIG).forEach((mode) => {
      VIEW_CONFIG[mode].columns.forEach((column) => {
        if (column.filterable === false) {
          return;
        }
        tableState[mode].filters[column.key] = null;
        tableState[mode].filterSearch[column.key] = "";
      });
      tableState[mode].visibleColumns = getInitialVisibleColumns(mode);
    });
  }

  function getInitialVisibleColumns(mode) {
    const stored = readStoredColumnVisibility()[mode];
    const availableKeys = VIEW_CONFIG[mode].columns.map((column) => column.key);
    const normalized = Array.isArray(stored)
      ? stored.filter((key, index) => availableKeys.includes(key) && stored.indexOf(key) === index)
      : availableKeys;
    return ensureValidVisibleColumns(mode, normalized);
  }

  function readStoredColumnVisibility() {
    try {
      const raw = window.localStorage.getItem(COLUMN_VISIBILITY_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      return {};
    }
  }

  function persistColumnVisibility() {
    const payload = Object.values(TABLE_MODES).reduce((accumulator, mode) => {
      accumulator[mode] = [...tableState[mode].visibleColumns];
      return accumulator;
    }, {});

    try {
      window.localStorage.setItem(COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
      // Keep the UI usable even if persistence is not available.
    }
  }

  function ensureValidVisibleColumns(mode, keys) {
    const availableKeys = VIEW_CONFIG[mode].columns.map((column) => column.key);
    const normalized = Array.isArray(keys)
      ? keys.filter((key, index) => availableKeys.includes(key) && keys.indexOf(key) === index)
      : [];

    if (!normalized.length) {
      normalized.push(...availableKeys);
    }

    if (!REQUIRED_CORE_COLUMNS.some((key) => normalized.includes(key))) {
      normalized.unshift("name");
    }

    return availableKeys.filter((key) => normalized.includes(key));
  }

  function getVisibleColumns(mode = state.activeTable) {
    return VIEW_CONFIG[mode].columns.filter((column) => tableState[mode].visibleColumns.includes(column.key));
  }

  function getColumnConfig(mode, columnKey) {
    return VIEW_CONFIG[mode].columns.find((column) => column.key === columnKey) || null;
  }

  function getColumnLayout(columnKey) {
    return COLUMN_LAYOUT[columnKey] || { min: 120, flexible: true };
  }

  function buildColumnStyle(columnKey) {
    const layout = getColumnLayout(columnKey);
    const styles = [];
    if (layout.width) {
      styles.push(`width:${layout.width}px`);
    }
    if (layout.min) {
      styles.push(`min-width:${layout.min}px`);
    }
    if (layout.max) {
      styles.push(`max-width:${layout.max}px`);
    }
    return styles.join(";");
  }

  function initBootstrap() {
    const toastEl = document.getElementById("productsToast");
    toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 2400 }) : null;
    productDetailModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("productDetailModal"));
    logsModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("logsModal"));
    imageModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("imageModal"));
    digitalLinkModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("digitalLinkModal"));
    symbolModal = bootstrap.Modal.getOrCreateInstance(document.getElementById("symbolModal"));
    ["productDetailModal", "imageModal", "digitalLinkModal", "symbolModal", "logsModal"].forEach(initModalFocusRestoration);
  }

  function initEventHandlers() {
    downloadButton.addEventListener("click", handleDownload);

    document.querySelectorAll("[data-tool-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const message = button.dataset.toolAction === "dv"
          ? "Calculo de digito verificador preparado para integracion."
          : "Verificacion de etiquetas preparada para integracion.";
        showToast(message);
      });
    });

    modeButtons.forEach((button) => {
      button.addEventListener("click", () => setActiveTable(button.dataset.tableMode));
    });

    paginationControls.addEventListener("click", (event) => {
      const button = event.target.closest("[data-page]");
      if (!button) {
        return;
      }
      const nextPage = Number(button.dataset.page);
      if (Number.isNaN(nextPage) || nextPage < 1) {
        return;
      }
      getCurrentTableState().page = nextPage;
      closeFilterMenus();
      renderTable();
    });

    tableHead.addEventListener("click", (event) => {
      const toggle = event.target.closest(".column-filter-toggle");
      if (!toggle) {
        return;
      }
      event.stopPropagation();
      const column = toggle.dataset.column;
      const shouldClose = state.activeFilterMenu && state.activeFilterColumn === column;
      closeFilterMenus();
      if (!shouldClose) {
        openFilterMenu(column, toggle);
      }
    });

    tableWrap.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-row-action]");
      if (!actionButton) {
        return;
      }
      event.preventDefault();
      handleRowAction(actionButton.dataset.rowAction, actionButton.dataset.productId, actionButton);
    });

    columnsDropdownMenu.addEventListener("click", (event) => {
      const button = event.target.closest("[data-column-visibility]");
      if (!button) {
        return;
      }
      event.preventDefault();
      toggleColumnVisibility(button.dataset.columnVisibility);
    });

    document.addEventListener("click", (event) => {
      if (
        state.activeFilterMenu &&
        !event.target.closest(".column-filter-menu") &&
        !event.target.closest(".column-filter-toggle")
      ) {
        closeFilterMenus();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeFilterMenus();
      }
    });

    window.addEventListener("resize", repositionActiveFilterMenu);
    window.addEventListener("scroll", repositionActiveFilterMenu, true);
    document.getElementById("copyDigitalLinkBtn").addEventListener("click", copyDigitalLink);
  }

  function ensureDynamicModals() {
    if (!document.getElementById("digitalLinkModal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div class="modal fade" id="digitalLinkModal" tabindex="-1" aria-labelledby="digitalLinkModalLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h2 class="modal-title fs-5" id="digitalLinkModalLabel">GS1 Digital Link</h2>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                  <div class="small text-secondary mb-3" id="digitalLinkCodeMeta"></div>
                  <div class="border rounded p-3 bg-body-tertiary">
                    <div class="small text-secondary">Digital Link</div>
                    <div id="digitalLinkValue" class="fw-semibold text-break mt-1"></div>
                  </div>
                  <div class="small text-success mt-2 d-none" id="digitalLinkCopyFeedback">Digital Link copiado.</div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                  <button type="button" class="btn btn-primary" id="copyDigitalLinkBtn">Copiar</button>
                </div>
              </div>
            </div>
          </div>
        `,
      );
    }

    if (!document.getElementById("symbolModal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div class="modal fade" id="symbolModal" tabindex="-1" aria-labelledby="symbolModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h2 class="modal-title fs-5" id="symbolModalLabel">Simbologia</h2>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                  <div class="row g-3 align-items-start">
                    <div class="col-lg-8">
                      <div class="border rounded p-3 bg-white symbol-preview-shell">
                        <div id="symbolPreview" class="symbol-preview" role="img" aria-label="Previsualizacion de simbologia"></div>
                      </div>
                    </div>
                    <div class="col-lg-4">
                      <div class="small text-secondary">Identificador</div>
                      <div class="fw-semibold mb-3" id="symbolIdentifierLabel">-</div>
                      <div class="small text-secondary">Simbologia</div>
                      <div class="fw-semibold mb-3" id="symbolTypeLabel">-</div>
                      <div class="small text-secondary">Codigo</div>
                      <div class="fw-semibold mb-3" id="symbolCodeLabel">-</div>
                      <div class="small text-secondary">Producto</div>
                      <div class="fw-semibold" id="symbolProductLabel">-</div>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        `,
      );
    }

    const imageModalBody = document.querySelector("#imageModal .modal-body");
    if (imageModalBody) {
      imageModalBody.innerHTML = `
        <div id="productImagePreviewWrap" class="product-image-modal-preview"></div>
        <div class="small text-secondary mt-3" id="productImageCaption"></div>
        <div class="small text-secondary mt-1" id="productImageMeta"></div>
      `;
    }

    if (!document.getElementById("columnFilterFloatingMenu")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        '<div class="column-filter-menu dropdown-menu p-0" id="columnFilterFloatingMenu"></div>',
      );
    }
  }

  function handleDownload() {
    const records = getCurrentFilteredItems();
    showToast(`Descarga preparada para ${records.length} ${VIEW_CONFIG[state.activeTable].statusLabel}.`);
  }

  function setActiveTable(mode) {
    if (!VIEW_CONFIG[mode] || state.activeTable === mode) {
      return;
    }

    closeFilterMenus();
    hideVisibleTooltips();
    tableModeHeading.classList.add("is-switching");

    window.setTimeout(() => {
      state.activeTable = mode;
      getCurrentTableState().page = 1;
      syncModeHeading();
      renderTable();
    }, 90);

    window.setTimeout(() => {
      tableModeHeading.classList.remove("is-switching");
    }, 190);
  }

  function syncModeHeading() {
    const orderedModes = [state.activeTable, ...Object.values(TABLE_MODES).filter((mode) => mode !== state.activeTable)];
    orderedModes.forEach((mode, index) => {
      const button = modeButtons.find((candidate) => candidate.dataset.tableMode === mode);
      if (!button) {
        return;
      }
      button.style.order = String(index);
      button.classList.toggle("is-active", mode === state.activeTable);
      button.setAttribute("aria-pressed", String(mode === state.activeTable));
    });

    downloadButton.textContent = VIEW_CONFIG[state.activeTable].downloadLabel;
    renderColumnsMenu();
  }

  function renderTable() {
    syncModeHeading();
    renderTableStructure();
    updateTableDimensions();
    renderTableRows();
    updateFilterIndicators();
    refreshTooltips();
  }

  function renderColumnsMenu() {
    const current = getCurrentTableState();
    const columns = VIEW_CONFIG[state.activeTable].columns;

    columnsDropdownMenu.innerHTML = `
      <div class="columns-menu__panel">
        <div class="columns-menu__header">
          <div class="fw-semibold">Columnas visibles</div>
          <div class="small text-secondary">Preferencia guardada por tabla.</div>
        </div>
        <div class="columns-menu__list">
          ${columns.map((column) => renderColumnVisibilityOption(column, current)).join("")}
          ${renderHiddenFilterSummary(current)}
        </div>
      </div>
    `;
  }

  function renderColumnVisibilityOption(column, current) {
    const isVisible = current.visibleColumns.includes(column.key);
    const isCoreColumn = REQUIRED_CORE_COLUMNS.includes(column.key);
    const visibleCoreColumns = REQUIRED_CORE_COLUMNS.filter((key) => current.visibleColumns.includes(key));
    const lockReason = isCoreColumn && visibleCoreColumns.length === 1 && isVisible
      ? "Debe quedar visible Codigo o Producto."
      : "";
    const hasHiddenActiveFilter = !isVisible && current.filters[column.key] && current.filters[column.key].length;

    return `
      <button
        type="button"
        class="dropdown-item columns-menu__item ${isVisible ? "is-selected" : ""}"
        data-column-visibility="${column.key}"
        ${lockReason ? `disabled title="${escapeAttribute(lockReason)}"` : ""}
      >
        <span class="columns-menu__item-main">
          <span class="form-check-input columns-menu__indicator ${isVisible ? "checked" : ""}" aria-hidden="true"></span>
          <span>${escapeHtml(column.label)}</span>
        </span>
        <span class="columns-menu__badges">
          ${isCoreColumn ? '<span class="badge text-bg-light">Base</span>' : ""}
          ${hasHiddenActiveFilter ? '<span class="badge text-bg-warning">Filtro activo</span>' : ""}
        </span>
      </button>
    `;
  }

  function renderHiddenFilterSummary(current) {
    const hiddenWithFilters = VIEW_CONFIG[state.activeTable].columns.filter((column) => {
      return !current.visibleColumns.includes(column.key) && current.filters[column.key] && current.filters[column.key].length;
    });

    if (!hiddenWithFilters.length) {
      return "";
    }

    return `
      <div class="columns-menu__summary text-secondary small">
        Hay ${hiddenWithFilters.length} filtro(s) aplicado(s) en columnas ocultas.
      </div>
    `;
  }

  function renderTableStructure() {
    const visibleColumns = getVisibleColumns();
    tableColgroup.innerHTML = [
      ...visibleColumns.map((column) => `
        <col
          class="${column.className || ""}"
          data-column-key="${column.key}"
          style="${buildColumnStyle(column.key)}"
        >
      `),
      `<col class="product-col-acciones" data-column-key="actions" style="${buildColumnStyle("actions")}">`,
    ].join("");

    tableHead.innerHTML = `
      <tr>
        ${visibleColumns.map(renderHeaderCell).join("")}
        <th scope="col" class="text-end product-grid__actions-head" data-column-key="actions" style="${buildColumnStyle("actions")}">Acciones</th>
      </tr>
    `;
  }

  function updateTableDimensions(mode = state.activeTable) {
    if (!tableEl) {
      return;
    }

    const visibleColumns = getVisibleColumns(mode);
    const minimumWidth = visibleColumns.reduce((total, column) => {
      return total + getColumnLayout(column.key).min;
    }, getColumnLayout("actions").min);

    tableEl.style.width = "100%";
    tableEl.style.minWidth = `${minimumWidth}px`;
  }

  function toggleColumnVisibility(columnKey) {
    const current = getCurrentTableState();
    const isVisible = current.visibleColumns.includes(columnKey);
    let nextVisible = isVisible
      ? current.visibleColumns.filter((key) => key !== columnKey)
      : [...current.visibleColumns, columnKey];

    nextVisible = ensureValidVisibleColumns(state.activeTable, nextVisible);
    const changed = nextVisible.join("|") !== current.visibleColumns.join("|");
    if (!changed) {
      renderColumnsMenu();
      refreshTooltips();
      return;
    }

    current.visibleColumns = nextVisible;
    persistColumnVisibility();

    if (!nextVisible.includes(columnKey) && state.activeFilterColumn === columnKey) {
      closeFilterMenus();
    }

    renderTable();
  }

  function renderHeaderCell(column) {
    if (column.filterable === false) {
      return `<th scope="col" data-column-key="${column.key}" style="${buildColumnStyle(column.key)}">${column.label}</th>`;
    }

    const currentSort = getCurrentTableState().sort;
    const sortSymbol = currentSort && currentSort.column === column.key
      ? currentSort.direction === "asc" ? "▲" : "▼"
      : "▼";

    return `
      <th scope="col" data-column-key="${column.key}" style="${buildColumnStyle(column.key)}">
        <div class="column-filter-header">
          <span>${column.label}</span>
          <button
            type="button"
            class="btn btn-sm btn-light column-filter-toggle"
            data-column="${column.key}"
            aria-label="Filtrar ${escapeAttribute(column.label)}"
          >
            ${sortSymbol}
          </button>
        </div>
      </th>
    `;
  }

  function renderTableRows() {
    const records = getCurrentFilteredItems();
    const pageSize = PAGE_SIZE_BY_MODE[state.activeTable];
    const current = getCurrentTableState();
    const visibleColumns = getVisibleColumns();
    const totalPages = Math.max(1, Math.ceil(records.length / pageSize));

    if (current.page > totalPages) {
      current.page = 1;
    }

    const startIndex = (current.page - 1) * pageSize;
    const visibleItems = records.slice(startIndex, startIndex + pageSize);
    const colspan = visibleColumns.length + 1;

    tableBody.innerHTML = visibleItems.length
      ? visibleItems.map(renderRow).join("")
      : `<tr><td colspan="${colspan}" class="text-center py-4 text-secondary">${VIEW_CONFIG[state.activeTable].emptyMessage}</td></tr>`;

    const firstVisible = records.length ? startIndex + 1 : 0;
    const lastVisible = records.length ? Math.min(startIndex + pageSize, records.length) : 0;
    paginationStatus.textContent = `Mostrando ${firstVisible}-${lastVisible} de ${records.length} ${VIEW_CONFIG[state.activeTable].statusLabel}`;
    renderPagination(totalPages);
  }

  function renderRow(record) {
    const cells = getVisibleColumns().map((column) => {
      if (column.key === "image") {
        return `<td data-column-key="${column.key}" style="${buildColumnStyle(column.key)}">${renderThumbnailButton(record)}</td>`;
      }
      if (column.key === "status") {
        return `<td class="product-cell-nowrap" data-column-key="${column.key}" style="${buildColumnStyle(column.key)}"><span class="badge ${statusBadgeClass(record.status)}">${escapeHtml(record.status)}</span></td>`;
      }
      return `<td class="${getCellClass(column.key)}" data-column-key="${column.key}" style="${buildColumnStyle(column.key)}">${escapeHtml(record[column.key] || "")}</td>`;
    });

    cells.push(`
      <td class="text-end product-cell-nowrap product-grid__actions-cell" data-column-key="actions" style="${buildColumnStyle("actions")}">
        <div class="btn-group btn-group-sm product-row-actions" role="group" aria-label="Acciones del registro">
          ${renderActionButton("detail", record.id, "Detalle", "eye")}
          ${renderActionButton("copy", record.id, "Copiar", "files")}
          ${renderActionButton("edit", record.id, "Modificar", "pencil-square")}
          ${renderActionButton("logs", record.id, "Logs", "clock-history")}
          ${renderActionButton("image", record.id, "Ver imagen", "image")}
          ${renderActionButton("digital-link", record.id, "Generar Digital Link", "link-45deg")}
          ${renderActionButton("symbol", record.id, "Generar simbologia", "upc-scan")}
        </div>
      </td>
    `);

    return `<tr>${cells.join("")}</tr>`;
  }

  function renderThumbnailButton(record) {
    return `
      <button
        type="button"
        class="product-thumbnail"
        data-row-action="image"
        data-product-id="${record.id}"
        title="Ver imagen"
        aria-label="Ver imagen de ${escapeAttribute(record.name)}"
        data-bs-toggle="tooltip"
        data-bs-title="Ver imagen"
      >
        ${renderImageContent(record, true)}
      </button>
    `;
  }

  function renderActionButton(action, id, label, icon) {
    const iconMarkup = getBootstrapIcon(icon, 14);
    const commonAttrs = `
      class="btn btn-outline-secondary"
      title="${escapeAttribute(label)}"
      aria-label="${escapeAttribute(label)}"
      data-bs-toggle="tooltip"
      data-bs-title="${escapeAttribute(label)}"
    `;

    if (action === "edit" && state.activeTable === TABLE_MODES.dispatchUnits) {
      return `
        <span
          class="d-inline-flex"
          tabindex="0"
          data-bs-toggle="tooltip"
          data-bs-title="La edicion de unidades de despacho todavia no esta disponible en esta pantalla."
        >
          <button type="button" class="btn btn-outline-secondary" disabled aria-label="Modificar deshabilitado">
            ${iconMarkup}
          </button>
        </span>
      `;
    }

    return `<button type="button" ${commonAttrs} data-row-action="${action}" data-product-id="${id}">${iconMarkup}</button>`;
  }

  function renderPagination(totalPages) {
    const current = getCurrentTableState();
    const buttons = [];

    buttons.push(`
      <li class="page-item ${current.page === 1 ? "disabled" : ""}">
        <button class="page-link" type="button" data-page="${current.page - 1}" ${current.page === 1 ? "disabled" : ""}>Anterior</button>
      </li>
    `);

    for (let page = 1; page <= totalPages; page += 1) {
      buttons.push(`
        <li class="page-item ${page === current.page ? "active" : ""}">
          <button class="page-link" type="button" data-page="${page}">${page}</button>
        </li>
      `);
    }

    buttons.push(`
      <li class="page-item ${current.page === totalPages ? "disabled" : ""}">
        <button class="page-link" type="button" data-page="${current.page + 1}" ${current.page === totalPages ? "disabled" : ""}>Siguiente</button>
      </li>
    `);

    paginationControls.innerHTML = buttons.join("");
  }

  function getCurrentFilteredItems() {
    const current = getCurrentTableState();
    let items = state.datasets[state.activeTable].filter((record) => {
      return Object.entries(current.filters).every(([column, values]) => {
        if (!values || !values.length) {
          return true;
        }
        return values.includes(String(record[column] || ""));
      });
    });

    if (!current.sort) {
      return items;
    }

    items = [...items].sort((left, right) => {
      const leftValue = normalizeSortValue(left, current.sort.column);
      const rightValue = normalizeSortValue(right, current.sort.column);
      const result = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
      return current.sort.direction === "asc" ? result : result * -1;
    });

    return items;
  }

  function normalizeSortValue(record, column) {
    if (column === "createdAt" || column === "modifiedAt") {
      return record[column] || "";
    }
    return normalizeText(record[column] || "");
  }

  function openFilterMenu(column, trigger) {
    const menu = document.getElementById("columnFilterFloatingMenu");
    if (!menu) {
      return;
    }
    const values = getUniqueValues(column);
    const current = getCurrentTableState();
    state.activeFilterDraft = current.filters[column] ? [...current.filters[column]] : [...values];
    state.activeFilterDraftSearch = current.filterSearch[column] || "";
    state.activeFilterColumn = column;
    state.activeFilterMenu = menu;
    state.lastFocusTrigger = trigger;
    renderFilterMenu(column);
    menu.classList.add("show");
    positionFilterMenu(trigger, menu);
  }

  function renderFilterMenu(column) {
    const menu = state.activeFilterMenu;
    if (!menu) {
      return;
    }

    const current = getCurrentTableState();
    const allValues = getUniqueValues(column);
    const selectedValues = new Set(state.activeFilterDraft);
    const visibleValues = allValues.filter((value) => normalizeText(value).includes(normalizeText(state.activeFilterDraftSearch)));
    const allVisibleSelected = visibleValues.length > 0 && visibleValues.every((value) => selectedValues.has(value));
    const hasActiveFilter = Boolean(current.filters[column] && current.filters[column].length);

    menu.innerHTML = `
      <div class="column-filter-card">
        <div class="column-filter-actions">
          <button type="button" class="dropdown-item" data-filter-sort="${column}:asc">Orden ascendente</button>
          <button type="button" class="dropdown-item" data-filter-sort="${column}:desc">Orden descendente</button>
        </div>
        <div class="column-filter-toolbar p-3 border-top border-bottom">
          <input
            type="search"
            class="form-control form-control-sm"
            data-filter-search="${column}"
            placeholder="Buscar valor"
            value="${escapeAttribute(state.activeFilterDraftSearch)}"
          >
        </div>
        <div class="filter-panel__body column-filter-checklist">
          <label class="column-filter-option fw-semibold">
            <input type="checkbox" data-select-all="${column}" ${allVisibleSelected ? "checked" : ""}>
            Seleccionar todo
          </label>
          ${visibleValues.map((value) => `
            <label class="column-filter-option">
              <input
                type="checkbox"
                data-filter-option="${column}"
                value="${escapeAttribute(value)}"
                ${selectedValues.has(value) ? "checked" : ""}
              >
              ${escapeHtml(value)}
            </label>
          `).join("") || '<div class="small text-secondary py-2">No hay coincidencias para ese filtro.</div>'}
        </div>
        <div class="filter-panel__footer column-filter-footer">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-filter-clear="${column}" ${hasActiveFilter ? "" : "disabled"}>Limpiar</button>
          <button type="button" class="btn btn-sm btn-outline-secondary" data-filter-cancel="${column}">Cancelar</button>
          <button type="button" class="btn btn-sm btn-primary" data-filter-apply="${column}">Aplicar</button>
        </div>
      </div>
    `;

    bindFilterMenuEvents(column, allValues);
    const searchInput = menu.querySelector(`[data-filter-search="${column}"]`);
    if (searchInput) {
      searchInput.focus();
      searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  }

  function bindFilterMenuEvents(column, allValues) {
    const menu = state.activeFilterMenu;
    if (!menu) {
      return;
    }

    menu.querySelector(`[data-filter-search="${column}"]`).addEventListener("input", (event) => {
      state.activeFilterDraftSearch = event.target.value;
      renderFilterMenu(column);
      menu.classList.add("show");
      positionFilterMenu(state.lastFocusTrigger, menu);
    });

    const selectAll = menu.querySelector(`[data-select-all="${column}"]`);
    if (selectAll) {
      selectAll.addEventListener("change", (event) => {
        const currentSet = new Set(state.activeFilterDraft);
        const visibleValues = Array.from(menu.querySelectorAll(`[data-filter-option="${column}"]`)).map((input) => input.value);
        if (event.target.checked) {
          visibleValues.forEach((value) => currentSet.add(value));
        } else {
          visibleValues.forEach((value) => currentSet.delete(value));
        }
        state.activeFilterDraft = allValues.filter((value) => currentSet.has(value));
        renderFilterMenu(column);
        menu.classList.add("show");
        positionFilterMenu(state.lastFocusTrigger, menu);
      });
    }

    menu.querySelectorAll(`[data-filter-option="${column}"]`).forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        state.activeFilterDraft = Array.from(menu.querySelectorAll(`[data-filter-option="${column}"]:checked`)).map((input) => input.value);
      });
    });

    menu.querySelector(`[data-filter-apply="${column}"]`).addEventListener("click", () => {
      const selected = Array.from(menu.querySelectorAll(`[data-filter-option="${column}"]:checked`)).map((input) => input.value);
      const current = getCurrentTableState();
      current.filters[column] = selected.length === allValues.length ? null : selected;
      current.filterSearch[column] = state.activeFilterDraftSearch;
      current.page = 1;
      closeFilterMenus();
      renderTable();
    });

    menu.querySelector(`[data-filter-clear="${column}"]`).addEventListener("click", () => {
      const current = getCurrentTableState();
      current.filters[column] = null;
      current.filterSearch[column] = "";
      current.page = 1;
      closeFilterMenus();
      renderTable();
    });

    menu.querySelector(`[data-filter-cancel="${column}"]`).addEventListener("click", closeFilterMenus);

    menu.querySelectorAll("[data-filter-sort]").forEach((button) => {
      button.addEventListener("click", () => {
        const [, direction] = button.dataset.filterSort.split(":");
        const current = getCurrentTableState();
        current.sort = { column, direction };
        current.page = 1;
        closeFilterMenus();
        renderTable();
      });
    });
  }

  function getUniqueValues(column) {
    return Array.from(new Set(state.datasets[state.activeTable].map((record) => String(record[column] || "")).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right, "es"));
  }

  function positionFilterMenu(trigger, menu) {
    if (!trigger || !menu) {
      return;
    }

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const width = Math.min(320, window.innerWidth - 24);
    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;
    const maxHeight = Math.max(280, Math.max(availableBelow, availableAbove, window.innerHeight - 24));

    let left = rect.right - width;
    if (left < viewportPadding) {
      left = viewportPadding;
    }
    if (left + width > window.innerWidth - viewportPadding) {
      left = window.innerWidth - width - viewportPadding;
    }

    let top = rect.bottom + 6;
    if (availableBelow < 320 && availableAbove > availableBelow) {
      top = Math.max(viewportPadding, rect.top - Math.min(maxHeight, 420));
    }

    menu.style.position = "fixed";
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    menu.style.width = `${width}px`;
    menu.style.maxHeight = `${Math.min(maxHeight, window.innerHeight - 24)}px`;
    menu.style.zIndex = "1095";
  }

  function repositionActiveFilterMenu() {
    if (state.activeFilterMenu && state.lastFocusTrigger) {
      positionFilterMenu(state.lastFocusTrigger, state.activeFilterMenu);
    }
  }

  function closeFilterMenus() {
    if (!state.activeFilterMenu) {
      return;
    }
    state.activeFilterMenu.classList.remove("show");
    state.activeFilterMenu.removeAttribute("style");
    state.activeFilterMenu.innerHTML = "";
    state.activeFilterMenu = null;
    state.activeFilterColumn = null;
    state.activeFilterDraft = [];
    state.activeFilterDraftSearch = "";
  }

  function updateFilterIndicators() {
    const current = getCurrentTableState();
    tableHead.querySelectorAll(".column-filter-toggle").forEach((button) => {
      const column = button.dataset.column;
      const header = button.closest("th");
      const hasFilter = Boolean(current.filters[column] && current.filters[column].length);
      const hasSort = current.sort && current.sort.column === column;
      header.classList.toggle("column-has-filter", hasFilter);
      header.classList.toggle("column-has-sort", hasSort);
      button.textContent = hasSort ? (current.sort.direction === "asc" ? "▲" : "▼") : "▼";
    });
  }

  function handleRowAction(action, productId, trigger) {
    const record = window.GS1ProductCatalog.getById(productId);
    if (!record) {
      return;
    }

    state.lastFocusTrigger = trigger || document.activeElement;

    if (action === "detail") {
      openProductDetailModal(record);
      return;
    }
    if (action === "copy") {
      window.location.href = `producto-copiar.html?id=${encodeURIComponent(productId)}`;
      return;
    }
    if (action === "edit") {
      if (record.mode !== TABLE_MODES.products) {
        showToast("La edicion de unidades de despacho todavia no esta disponible en esta pantalla.");
        return;
      }
      window.location.href = `producto-editar.html?id=${encodeURIComponent(productId)}`;
      return;
    }
    if (action === "logs") {
      renderLogs(record);
      logsModal.show();
      return;
    }
    if (action === "image") {
      openImageModal(record);
      return;
    }
    if (action === "digital-link") {
      openDigitalLinkModal(record);
      return;
    }
    if (action === "symbol") {
      openSymbolModal(record);
    }
  }

  function openProductDetailModal(record) {
    const fields = buildProductDetailFields(record);
    document.getElementById("productDetailModalLabel").textContent = record.name;
    document.getElementById("productDetailModalMeta").textContent = `${record.type} | ${record.code}`;
    document.getElementById("productDetailMedia").innerHTML = renderImageContent(record, false);
    document.getElementById("productDetailFields").innerHTML = fields.map((field) => `
      <div class="col-md-6">
        <div class="product-detail-field">
          <div class="small text-secondary">${escapeHtml(field.label)}</div>
          <div class="fw-semibold mt-1">${escapeHtml(field.value)}</div>
        </div>
      </div>
    `).join("");
    document.getElementById("productDetailNote").innerHTML = `
      <div class="fw-semibold mb-1">Descripcion corta</div>
      <div class="text-secondary">${escapeHtml(record.shortDescription || "Sin descripcion disponible.")}</div>
    `;
    productDetailModal.show();
  }

  function buildProductDetailFields(record) {
    const fields = [
      { label: "Tipo de codigo", value: record.type },
      { label: "Codigo", value: record.code },
      { label: "Estado", value: record.status },
      { label: "Marca", value: record.brand },
      { label: "Clasificacion", value: record.classification },
      { label: "Contenido", value: record.content },
      { label: "Origen", value: record.origin },
      { label: "Fecha de alta", value: record.createdAt },
      { label: "Fecha de modificacion", value: record.modifiedAt },
      { label: "Distribucion", value: record.distributionType },
    ];

    if (record.mode === TABLE_MODES.dispatchUnits) {
      fields.splice(4, 0,
        { label: "Nivel de empaque", value: record.packagingLevel || "-" },
        { label: "Cantidad base", value: record.baseQuantity || "-" },
        { label: "Destino", value: record.destination || "-" },
      );
    } else {
      fields.splice(4, 0,
        { label: "Variedad", value: record.variety || "-" },
      );
    }

    return fields;
  }

  function renderLogs(record) {
    const entries = [
      { title: "Alta creada", detail: `Se genero el registro inicial para ${record.code}.`, timestamp: record.createdAt },
      { title: "Validacion comercial", detail: `${record.brand} quedo listo para seguimiento operativo.`, timestamp: record.modifiedAt },
      { title: "Ultima actualizacion", detail: `Se reviso ${record.name}.`, timestamp: record.modifiedAt },
    ];

    document.getElementById("logsTimeline").innerHTML = entries.map((entry) => `
      <div class="notification-card">
        <div class="fw-semibold">${escapeHtml(entry.title)}</div>
        <div class="small text-secondary">${escapeHtml(entry.detail)}</div>
        <div class="small text-secondary mt-1">${escapeHtml(entry.timestamp)}</div>
      </div>
    `).join("");
  }

  function openImageModal(record) {
    const wrapper = document.getElementById("productImagePreviewWrap");
    wrapper.innerHTML = record.image
      ? `<img id="productImagePreview" src="${escapeAttribute(record.image)}" alt="Imagen de ${escapeAttribute(record.name)}" class="img-fluid rounded border">`
      : renderImagePlaceholder(record, false);
    document.getElementById("productImageCaption").textContent = record.name;
    document.getElementById("productImageMeta").textContent = `${record.type} | ${record.code}`;
    imageModal.show();
  }

  function openDigitalLinkModal(record) {
    state.digitalLinkValue = `https://id.gs1.org/01/${normalizeGtinForDigitalLink(record.code)}`;
    document.getElementById("digitalLinkCodeMeta").textContent = `${record.type} | ${record.code}`;
    document.getElementById("digitalLinkValue").textContent = state.digitalLinkValue;
    document.getElementById("digitalLinkCopyFeedback").classList.add("d-none");
    digitalLinkModal.show();
  }

  function openSymbolModal(record) {
    const symbol = generateSymbolPreview(record);
    document.getElementById("symbolPreview").innerHTML = symbol.svg;
    document.getElementById("symbolIdentifierLabel").textContent = record.type;
    document.getElementById("symbolTypeLabel").textContent = symbol.label;
    document.getElementById("symbolCodeLabel").textContent = record.code;
    document.getElementById("symbolProductLabel").textContent = record.name;
    symbolModal.show();
  }

  async function copyDigitalLink() {
    if (!state.digitalLinkValue) {
      return;
    }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(state.digitalLinkValue);
      } else {
        const helper = document.createElement("textarea");
        helper.value = state.digitalLinkValue;
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      document.getElementById("digitalLinkCopyFeedback").classList.remove("d-none");
      showToast("Digital Link copiado.");
    } catch (error) {
      showToast("No fue posible copiar el Digital Link.");
    }
  }

  function generateSymbolPreview(record) {
    if (record.type === "UPC-12") {
      return { label: "UPC-A", svg: renderUpcSvg(record.code) };
    }
    if (record.type === "GTIN-8") {
      return { label: "EAN-8", svg: renderEan8Svg(record.code) };
    }
    if (record.type === "GTIN-13") {
      return { label: "EAN-13", svg: renderEan13Svg(record.code) };
    }
    return { label: "ITF-14", svg: renderItf14Svg(record.code) };
  }

  function renderEan13Svg(code) {
    const L = { 0: "0001101", 1: "0011001", 2: "0010011", 3: "0111101", 4: "0100011", 5: "0110001", 6: "0101111", 7: "0111011", 8: "0110111", 9: "0001011" };
    const G = { 0: "0100111", 1: "0110011", 2: "0011011", 3: "0100001", 4: "0011101", 5: "0111001", 6: "0000101", 7: "0010001", 8: "0001001", 9: "0010111" };
    const R = { 0: "1110010", 1: "1100110", 2: "1101100", 3: "1000010", 4: "1011100", 5: "1001110", 6: "1010000", 7: "1000100", 8: "1001000", 9: "1110100" };
    const parity = { 0: "LLLLLL", 1: "LLGLGG", 2: "LLGGLG", 3: "LLGGGL", 4: "LGLLGG", 5: "LGGLLG", 6: "LGGGLL", 7: "LGLGLG", 8: "LGLGGL", 9: "LGGLGL" };
    const digits = String(code).split("").map(Number);
    const pattern = ["101"];
    const schema = parity[digits[0]];
    for (let index = 1; index <= 6; index += 1) {
      pattern.push(schema[index - 1] === "L" ? L[digits[index]] : G[digits[index]]);
    }
    pattern.push("01010");
    for (let index = 7; index < digits.length; index += 1) {
      pattern.push(R[digits[index]]);
    }
    pattern.push("101");
    return renderBarcodeSvg(pattern.join(""), code);
  }

  function renderUpcSvg(code) {
    return renderEan13Svg(`0${code}`);
  }

  function renderEan8Svg(code) {
    const L = { 0: "0001101", 1: "0011001", 2: "0010011", 3: "0111101", 4: "0100011", 5: "0110001", 6: "0101111", 7: "0111011", 8: "0110111", 9: "0001011" };
    const R = { 0: "1110010", 1: "1100110", 2: "1101100", 3: "1000010", 4: "1011100", 5: "1001110", 6: "1010000", 7: "1000100", 8: "1001000", 9: "1110100" };
    const digits = String(code).split("").map(Number);
    const pattern = ["101"];
    for (let index = 0; index < 4; index += 1) {
      pattern.push(L[digits[index]]);
    }
    pattern.push("01010");
    for (let index = 4; index < digits.length; index += 1) {
      pattern.push(R[digits[index]]);
    }
    pattern.push("101");
    return renderBarcodeSvg(pattern.join(""), code);
  }

  function renderItf14Svg(code) {
    const patterns = { 0: "00110", 1: "10001", 2: "01001", 3: "11000", 4: "00101", 5: "10100", 6: "01100", 7: "00011", 8: "10010", 9: "01010" };
    const digits = String(code).padStart(14, "0").split("").map(Number);
    let sequence = "1010";
    for (let index = 0; index < digits.length; index += 2) {
      const bars = patterns[digits[index]];
      const spaces = patterns[digits[index + 1]];
      for (let step = 0; step < 5; step += 1) {
        sequence += bars[step] === "1" ? "11" : "1";
        sequence += spaces[step] === "1" ? "00" : "0";
      }
    }
    sequence += "1101";
    return renderBarcodeSvg(sequence, code, { barHeight: 92, quietZone: 18 });
  }

  function renderBarcodeSvg(bits, label, options = {}) {
    const moduleWidth = options.moduleWidth || 2;
    const barHeight = options.barHeight || 84;
    const quietZone = options.quietZone || 12;
    const width = bits.length * moduleWidth + quietZone * 2;
    let x = quietZone;
    let bars = "";
    for (const bit of bits) {
      if (bit === "1") {
        bars += `<rect x="${x}" y="0" width="${moduleWidth}" height="${barHeight}" fill="#111827"></rect>`;
      }
      x += moduleWidth;
    }
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${barHeight + 24}" class="barcode-svg" preserveAspectRatio="xMidYMid meet">
        <rect width="${width}" height="${barHeight + 24}" fill="#ffffff"></rect>
        ${bars}
        <text x="${width / 2}" y="${barHeight + 18}" font-size="14" text-anchor="middle" fill="#111827" font-family="Arial, sans-serif">${escapeHtml(label)}</text>
      </svg>
    `;
  }

  function renderImageContent(record, compact) {
    if (record.image) {
      return `<img src="${escapeAttribute(record.image)}" alt="Imagen de ${escapeAttribute(record.name)}" class="${compact ? "product-thumb-image" : "img-fluid rounded border"}">`;
    }
    return renderImagePlaceholder(record, compact);
  }

  function renderImagePlaceholder(record, compact) {
    return `
      <div class="${compact ? "product-thumb-placeholder" : "product-image-placeholder"}" aria-label="Sin imagen para ${escapeAttribute(record.name)}">
        ${getBootstrapIcon("image", compact ? 16 : 24)}
        <span>${compact ? "Sin imagen" : "No hay imagen disponible"}</span>
      </div>
    `;
  }

  function getCurrentTableState() {
    return tableState[state.activeTable];
  }

  function normalizeDispatchType(type) {
    return String(type || "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace("ITF14", "GTIN-14")
      .replace("ITF-14", "GTIN-14")
      .replace("DUN14", "GTIN-14")
      .replace("DUN-14", "GTIN-14")
      .replace("GTIN14", "GTIN-14") === "GTIN-14"
      ? "GTIN-14"
      : "GTIN-14";
  }

  function normalizeGtinForDigitalLink(code) {
    return String(code).replace(/\D/g, "").padStart(14, "0");
  }

  function initBulkUploadModal() {
    const modalElement = document.getElementById("massUploadModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    const fileInput = document.getElementById("massUploadFile");
    const fileName = document.getElementById("massUploadFileName");
    const error = document.getElementById("massUploadError");
    const success = document.getElementById("massUploadSuccess");
    const confirmButton = document.getElementById("confirmMassUploadBtn");

    document.getElementById("massUploadBtn").addEventListener("click", () => {
      openBulkUploadModal(state.activeTable === TABLE_MODES.dispatchUnits ? "dun14" : "generic");
      modal.show();
    });

    document.querySelectorAll("[data-bulk-upload-trigger]").forEach((button) => {
      button.addEventListener("click", () => {
        openBulkUploadModal(button.dataset.bulkUploadTrigger);
        modal.show();
      });
    });

    document.querySelectorAll("[data-bulk-type-option]").forEach((button) => {
      button.addEventListener("click", () => {
        state.bulkUploadType = button.dataset.bulkTypeOption;
        updateBulkUploadUi();
      });
    });

    fileInput.addEventListener("change", () => {
      fileName.textContent = fileInput.files[0]
        ? `Archivo seleccionado: ${fileInput.files[0].name}`
        : "Todavia no seleccionaste ningun archivo.";
      error.classList.add("d-none");
      success.classList.add("d-none");
    });

    modalElement.addEventListener("hidden.bs.modal", resetBulkUploadModal);

    confirmButton.addEventListener("click", () => {
      if (!state.bulkUploadType) {
        showBulkUploadError("Selecciona si queres cargar Productos o DUN 14.");
        return;
      }
      if (!fileInput.files.length) {
        showBulkUploadError("Selecciona un archivo antes de confirmar la carga.");
        return;
      }
      const file = fileInput.files[0];
      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        showBulkUploadError("La extension del archivo debe ser .xlsx o .xls.");
        return;
      }

      confirmButton.disabled = true;
      error.classList.add("d-none");
      success.classList.add("d-none");

      window.setTimeout(() => {
        const label = state.bulkUploadType === "dun14" ? "DUN 14" : "productos";
        const message = `La carga masiva de ${label} se completo correctamente.`;
        success.textContent = message;
        success.classList.remove("d-none");
        confirmButton.disabled = false;
        fileInput.value = "";
        fileName.textContent = "Todavia no seleccionaste ningun archivo.";
        showToast(message);
      }, 850);
    });

    function showBulkUploadError(message) {
      error.textContent = message;
      error.classList.remove("d-none");
      success.classList.add("d-none");
    }
  }

  function openBulkUploadModal(type) {
    state.bulkUploadSource = type;
    state.bulkUploadType = type === "generic" ? null : type;
    resetBulkUploadFields();
    updateBulkUploadUi();
  }

  function updateBulkUploadUi() {
    const title = document.getElementById("massUploadModalLabel");
    const selector = document.getElementById("bulkUploadTypeSelector");
    const hint = document.getElementById("massUploadTypeHint");
    selector.classList.toggle("d-none", state.bulkUploadSource !== "generic");

    if (state.bulkUploadType === "product") {
      title.textContent = "Carga masiva de productos";
      hint.textContent = "Tipo seleccionado: Producto";
    } else if (state.bulkUploadType === "dun14") {
      title.textContent = "Carga masiva de DUN 14";
      hint.textContent = "Tipo seleccionado: DUN 14";
    } else {
      title.textContent = "Carga masiva";
      hint.textContent = "Selecciona primero que queres cargar.";
    }

    document.querySelectorAll("[data-bulk-type-option]").forEach((button) => {
      const active = button.dataset.bulkTypeOption === state.bulkUploadType;
      button.classList.toggle("btn-primary", active);
      button.classList.toggle("btn-outline-primary", !active);
    });
  }

  function resetBulkUploadModal() {
    state.bulkUploadType = null;
    state.bulkUploadSource = "generic";
    resetBulkUploadFields();
    updateBulkUploadUi();
  }

  function resetBulkUploadFields() {
    document.getElementById("massUploadFile").value = "";
    document.getElementById("massUploadFileName").textContent = "Todavia no seleccionaste ningun archivo.";
    document.getElementById("massUploadError").classList.add("d-none");
    document.getElementById("massUploadSuccess").classList.add("d-none");
    document.getElementById("massUploadSuccess").textContent = "";
    document.getElementById("confirmMassUploadBtn").disabled = false;
  }

  function renderLicenseSelector() {
    const selector = document.getElementById("licenseSelector");
    selector.innerHTML = licenses.map((license) => `
      <div class="license-card ${state.currentLicense.id === license.id ? "license-card-active" : ""}">
        <div>
          <div class="fw-semibold">${license.name}</div>
          <div class="small text-secondary">CUIT ${license.cuit}</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <span class="badge ${state.currentLicense.id === license.id ? "text-bg-success" : "text-bg-light"}">${state.currentLicense.id === license.id ? "Activa" : "Disponible"}</span>
          <button
            type="button"
            class="btn btn-sm ${state.currentLicense.id === license.id ? "btn-outline-secondary" : "btn-primary"}"
            data-license-id="${license.id}"
            ${state.currentLicense.id === license.id ? "disabled" : ""}
          >
            Cambiar
          </button>
        </div>
      </div>
    `).join("");

    selector.querySelectorAll("[data-license-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = licenses.find((license) => license.id === button.dataset.licenseId);
        if (!next) {
          return;
        }
        state.currentLicense = next;
        updateAccountContext();
        renderLicenseSelector();
        showToast(`Licencia activa: ${next.name}`);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("licenseModal")).hide();
      });
    });
  }

  function updateAccountContext() {
    document.getElementById("currentUserName").textContent = currentUser.name;
    document.getElementById("currentUserEmail").textContent = currentUser.email;
    document.getElementById("accountLicenseName").textContent = state.currentLicense.name;
    document.getElementById("accountLicenseCuit").textContent = state.currentLicense.cuit;
    document.getElementById("accountMembershipName").textContent = state.currentLicense.membership;
    document.getElementById("currentLicenseNameMenu").textContent = state.currentLicense.name;
  }

  function renderNotifications() {
    const list = document.getElementById("notificationList");
    list.innerHTML = notifications.map((notification) => `
      <div class="notification-card">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <div class="fw-semibold">${escapeHtml(notification.title)}</div>
            <div class="small text-secondary">${escapeHtml(notification.description)}</div>
          </div>
          ${notification.unread ? '<span class="badge text-bg-danger">Nuevo</span>' : ""}
        </div>
        <div class="small text-secondary mt-2">${escapeHtml(notification.timestamp)}</div>
      </div>
    `).join("");

    document.getElementById("notificationBadge").textContent = String(notifications.filter((item) => item.unread).length);
  }

  function refreshTooltips() {
    state.tooltips.forEach((tooltip) => tooltip.dispose());
    state.tooltips = [];
    document.querySelectorAll(TOOLTIP_SELECTOR).forEach((element) => {
      state.tooltips.push(new bootstrap.Tooltip(element));
    });
  }

  function hideVisibleTooltips() {
    state.tooltips.forEach((tooltip) => tooltip.hide());
  }

  function initChart() {
    const canvas = document.getElementById("chDonut3");
    if (!canvas || typeof Chart === "undefined") {
      return;
    }

    new Chart(canvas, {
      type: "pie",
      data: {
        labels: ["Disponibles", "GTIN generados", "Reservados"],
        datasets: [
          {
            backgroundColor: ["#cd3c0d", "#0d6efd", "#6c757d"],
            borderWidth: 2,
            data: [390, 81, 17],
          },
        ],
      },
      options: {
        cutoutPercentage: 65,
        legend: {
          position: "bottom",
          labels: { pointStyle: "circle", usePointStyle: true },
        },
      },
    });
  }

  function initLogoutFlow() {
    const button = document.getElementById("confirmLogoutBtn");
    if (!button) {
      return;
    }
    button.addEventListener("click", () => {
      window.location.href = "../b04/ingresar.html";
    });
  }

  function initModalFocusRestoration(modalId) {
    const modalElement = document.getElementById(modalId);
    if (!modalElement) {
      return;
    }
    modalElement.addEventListener("hidden.bs.modal", () => {
      if (state.lastFocusTrigger && typeof state.lastFocusTrigger.focus === "function") {
        state.lastFocusTrigger.focus();
      }
    });
  }

  function statusBadgeClass(status) {
    if (status === "Activo") {
      return "text-bg-success";
    }
    if (status === "Pendiente") {
      return "text-bg-warning";
    }
    return "text-bg-secondary";
  }

  function getCellClass(key) {
    return key === "code" || key === "createdAt" || key === "modifiedAt" ? "product-cell-nowrap" : "product-cell-break";
  }

  function showToast(message) {
    if (!toast || !toastBody) {
      return;
    }
    toastBody.textContent = message;
    toast.show();
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }

  function getBootstrapIcon(name, size) {
    const icons = {
      eye: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16" aria-hidden="true"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5"/></svg>`,
      files: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-files" viewBox="0 0 16 16" aria-hidden="true"><path d="M13 0a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V2a2 2 0 0 1 2-2zM4 3v8a2 2 0 0 0 2 2h5V3a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1m8 8h1a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v1h5a2 2 0 0 1 2 2z"/></svg>`,
      "pencil-square": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16" aria-hidden="true"><path d="M15.502 1.94a.5.5 0 0 1 0 .706l-1.793 1.793-2.647-2.647L12.855 0.5a.5.5 0 0 1 .707 0z"/><path d="M1 13.5V16h2.5l7.372-7.372-2.647-2.647z"/><path fill-rule="evenodd" d="M1 1h11.5a1 1 0 0 1 1 1V6l-1 1V2a.5.5 0 0 0-.5-.5H1.5A.5.5 0 0 0 1 2v12a.5.5 0 0 0 .5.5H8l-1 1H1.5A1.5 1.5 0 0 1 0 14V2A1 1 0 0 1 1 1"/></svg>`,
      "clock-history": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-clock-history" viewBox="0 0 16 16" aria-hidden="true"><path d="M8.515 3.879a.5.5 0 0 0-1 0v4.182l3.182 1.909a.5.5 0 1 0 .516-.857L8.515 7.494z"/><path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .91-.414A6 6 0 1 1 8 2z"/><path d="M8 1.5A.5.5 0 0 1 8.5 1h1a.5.5 0 0 1 0 1h-.5v1a.5.5 0 0 1-1 0V2H7.5a.5.5 0 0 1 0-1z"/></svg>`,
      image: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16" aria-hidden="true"><path d="M.5 1A1.5 1.5 0 0 0-1 2.5v11A1.5 1.5 0 0 0 .5 15h15a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 15.5 1zm0 1h15a.5.5 0 0 1 .5.5v6.248l-3.37-3.37a1 1 0 0 0-1.415 0L6.5 10.293 4.354 8.146a.5.5 0 0 0-.708 0L0 11.793V2.5A.5.5 0 0 1 .5 2m15 12H.5a.5.5 0 0 1-.5-.5v-.293l4-4 2.146 2.147a1 1 0 0 0 1.415 0l4.793-4.793L16 10.207V13.5a.5.5 0 0 1-.5.5M4.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/></svg>`,
      "link-45deg": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.715 6.542a3 3 0 0 1 0-4.243l1.414-1.414a3 3 0 1 1 4.243 4.243l-.707.707-.708-.707.708-.707a2 2 0 1 0-2.829-2.829L5.422 3.006a2 2 0 0 0 0 2.829l.707.707-.707.707z"/><path d="M6.586 9.458a3 3 0 0 1 0 4.242l-1.414 1.415a3 3 0 0 1-4.243-4.243l.707-.707.708.707-.708.707a2 2 0 1 0 2.829 2.829l1.414-1.414a2 2 0 0 0 0-2.829l-.707-.707.707-.707z"/><path d="M5.793 8.5a.5.5 0 0 1 0-1h4.414a.5.5 0 0 1 0 1z"/></svg>`,
      "upc-scan": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-upc-scan" viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 1a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm1 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm1 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm1 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm1 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0M1 7.5a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 7.5M1.5 9a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm1 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm1 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm1 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0zm2 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 1 0zm1 0a.5.5 0 0 0-1 0v3a.5.5 0 0 0 1 0"/></svg>`,
    };
    return icons[name] || "";
  }
})();
