(function () {
  const PAGE_SIZE = 20;
  const STORAGE_KEYS = {
    shortcuts: "gs1.shortcuts.visible",
  };

  const shortcutsCatalog = [
    { id: "genera-codigo", label: "Gener\u00e1 tu c\u00f3digo", href: "producto-nuevo.html", variant: "primary", icon: "upc-scan" },
    { id: "ajustes", label: "Ajustes", href: "micuenta.html", icon: "gear" },
    { id: "crear-usuario", label: "Crear usuario", href: "micuenta.html", icon: "person-add" },
    { id: "codigo-qr", label: "C\u00f3digo QR", href: "../assets/otros/GeneradorCodigo_qr_dl", target: "_blank", icon: "qr-code" },
    { id: "negociar", label: "NegociAR", href: "pagar.html", icon: "cart2" },
    { id: "legibilidad", label: "Legibilidad", href: "producto-ficha.html", icon: "truck" },
  ];
  const defaultShortcutIds = shortcutsCatalog.map((shortcut) => shortcut.id);

  const users = [
    { id: "user-1", name: "María Alejandra López", email: "maria.lopez@empresa.com" },
    { id: "user-2", name: "Julián Ferrer", email: "julian.ferrer@empresa.com" },
    { id: "user-3", name: "Sofía Rivas", email: "sofia.rivas@empresa.com" },
  ];

  const licenses = [
    { id: "lic-1", name: "GS1 Alimentos del Sur", cuit: "30-71234567-8", membership: "Plan Estándar" },
    { id: "lic-2", name: "GS1 Nutrición Andina", cuit: "30-70111222-4", membership: "Plan Estándar" },
    { id: "lic-3", name: "GS1 Mercado Federal", cuit: "30-69888777-0", membership: "Plan Premium" },
  ];

  const notifications = [
    {
      title: "Revisión pendiente de productos",
      description: "Hay 4 productos con observaciones para revisar antes de publicarlos.",
      timestamp: "Hoy 09:15",
      unread: true,
    },
    {
      title: "Factura disponible",
      description: "La factura del servicio membresía estándar ya puede descargarse.",
      timestamp: "Ayer 18:40",
      unread: true,
    },
    {
      title: "Próxima capacitación",
      description: "Capacitación de carga masiva programada para el 18/07/2026 a las 10:00.",
      timestamp: "11/07/2026 10:00",
      unread: true,
    },
  ];

  const images = [
    "../assets/img/producto-1c.jpg",
    "../assets/img/producto-1.jpg",
    "../assets/img/usuario.jpg",
  ];

  const state = {
    products: [],
    currentPage: 1,
    sort: { column: null, direction: null },
    filters: {},
    filterSearch: {},
    shortcutIds: loadShortcutIds(),
    currentUser: users[0],
    currentLicense: licenses[0],
    selectedProduct: null,
    activeFilterMenu: null,
    bulkUploadType: null,
    bulkUploadSource: "generic",
  };

  const tableBody = document.getElementById("productosTableBody");
  const paginationControls = document.getElementById("paginationControls");
  const paginationStatus = document.getElementById("paginationStatus");
  const toastEl = document.getElementById("productsToast");
  const toastBody = document.getElementById("productsToastBody");
  const toast = toastEl ? new bootstrap.Toast(toastEl, { delay: 2400 }) : null;
  const copyProductModal = new bootstrap.Modal(document.getElementById("copyProductModal"));
  const logsModal = new bootstrap.Modal(document.getElementById("logsModal"));
  const imageModal = new bootstrap.Modal(document.getElementById("imageModal"));

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    state.products = createProducts();
    initializeFilters();
    renderShortcuts();
    renderUserSelector();
    renderLicenseSelector();
    renderNotifications();
    updateAccountContext();
    renderTable();
    initMainDropdowns();
    initShortcuts();
    initBulkUploadModal();
    initUserSwitcher();
    initLicenseSwitcher();
    initFloatingBar();
    initTooltips();
    initChart();
    initFilterMenus();
  }

  function createProducts() {
    const tipos = ["GTIN-13", "GTIN-14", "GTIN-8"];
    const estados = ["Activo", "Pendiente", "Borrador"];
    const marcas = ["La Huella", "Verde Norte", "Campo Vivo", "Origen Uno", "Gran Molino"];
    const variedades = ["Clásico", "Light", "Sin TACC", "Integral", "Premium", "Orgánico"];
    const origenes = ["Argentina", "Uruguay", "Chile", "Paraguay", "Bolivia"];
    const productos = [];

    for (let index = 0; index < 48; index += 1) {
      const baseCode = String(7798300000000 + index * 173).padStart(13, "0");
      const month = String((index % 12) + 1).padStart(2, "0");
      const day = String((index % 28) + 1).padStart(2, "0");
      const modDay = String(((index + 5) % 28) + 1).padStart(2, "0");
      const altaIso = `2026-${month}-${day}`;
      const modIso = `2026-${month}-${modDay}`;
      const marca = marcas[index % marcas.length];
      const variedad = variedades[index % variedades.length];

      productos.push({
        id: `prod-${index + 1}`,
        tipo: tipos[index % tipos.length],
        codigo: baseCode,
        producto: `${marca} ${variedad} ${index + 1}`,
        estado: estados[index % estados.length],
        marca,
        variedad,
        origen: origenes[index % origenes.length],
        fechaAltaIso: altaIso,
        fechaModificacionIso: modIso,
        fechaAlta: formatDate(altaIso),
        fechaModificacion: formatDate(modIso),
        modifyHref: "producto-editar.html",
        detailHref: "producto-ficha.html",
        copyHref: "producto-copiar.html",
        imageSrc: images[index % images.length],
      });
    }

    return productos;
  }

  function initializeFilters() {
    [
      "tipo",
      "codigo",
      "producto",
      "estado",
      "marca",
      "variedad",
      "origen",
      "fechaModificacion",
      "fechaAlta",
    ].forEach((column) => {
      state.filters[column] = null;
      state.filterSearch[column] = "";
    });
  }

  function initMainDropdowns() {
    document.getElementById("downloadProductsBtn").addEventListener("click", () => {
      showToast("Funcionalidad preparada para integración");
    });

    document.querySelectorAll("[data-tool-action]").forEach((button) => {
      button.addEventListener("click", () => {
        if (button.dataset.toolAction === "dv") {
          showToast("Cálculo de dígito verificador preparado para integración");
          return;
        }
        showToast("Verificación de etiquetas preparada para integración");
      });
    });
  }

  function initShortcuts() {
    const modalEl = document.getElementById("shortcutsModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const openBtn = document.getElementById("openShortcutsModalBtn");
    const restoreBtn = document.getElementById("restoreShortcutsBtn");
    const saveBtn = document.getElementById("saveShortcutsBtn");

    openBtn.addEventListener("click", () => {
      renderShortcutOptions();
      modal.show();
    });

    restoreBtn.addEventListener("click", () => {
      setShortcutIds(defaultShortcutIds);
      renderShortcutOptions();
      renderShortcuts();
    });

    saveBtn.addEventListener("click", () => {
      saveShortcutIds();
      renderShortcuts();
      modal.hide();
      showToast("Atajos actualizados");
    });
  }

  function renderShortcutOptions() {
    const container = document.getElementById("shortcutOptions");
    const selected = new Set(state.shortcutIds);
    container.innerHTML = shortcutsCatalog
      .map((shortcut) => `
        <label class="shortcut-option-card">
          <input type="checkbox" class="form-check-input mt-0" data-shortcut-option="${shortcut.id}" ${selected.has(shortcut.id) ? "checked" : ""}>
          <span>
            <strong>${shortcut.label}</strong><br>
            <small class="text-secondary">${shortcut.href}</small>
          </span>
        </label>
      `)
      .join("");

    container.querySelectorAll("[data-shortcut-option]").forEach((input) => {
      input.addEventListener("change", () => {
        const next = new Set(state.shortcutIds);
        if (input.checked) {
          next.add(input.dataset.shortcutOption);
        } else {
          next.delete(input.dataset.shortcutOption);
        }
        setShortcutIds(
          shortcutsCatalog
            .filter((shortcut) => next.has(shortcut.id))
            .map((shortcut) => shortcut.id)
        );
      });
    });
  }

  function renderShortcuts() {
    const shortcutStrip = document.getElementById("shortcutStrip");
    const visibleSet = new Set(state.shortcutIds);
    const cards = shortcutsCatalog
      .filter((shortcut) => visibleSet.has(shortcut.id))
      .map((shortcut) => {
        return `
          <a class="shortcut-card ${shortcut.variant === "primary" ? "shortcut-card-primary" : ""}" data-shortcut-id="${shortcut.id}" href="${shortcut.href}" ${shortcut.target ? `target="${shortcut.target}"` : ""}>
            <span class="shortcut-card-icon" aria-hidden="true">${getShortcutIcon(shortcut.icon)}</span>
            <span class="shortcut-card-label">${shortcut.label}</span>
          </a>
        `;
      })
      .join("");

    shortcutStrip.innerHTML = `${cards}
      <button type="button" class="shortcut-card shortcut-card-add" id="openShortcutsModalBtn">
        <span class="shortcut-card-icon" aria-hidden="true">${getShortcutIcon("plus-circle-dotted")}</span>
        <span class="shortcut-card-label">Agregar atajos</span>
      </button>`;

    document.getElementById("openShortcutsModalBtn").addEventListener("click", () => {
      renderShortcutOptions();
      bootstrap.Modal.getOrCreateInstance(document.getElementById("shortcutsModal")).show();
    });
  }

  function initBulkUploadModal() {
    const modalEl = document.getElementById("massUploadModal");
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    const fileInput = document.getElementById("massUploadFile");
    const fileName = document.getElementById("massUploadFileName");
    const errorEl = document.getElementById("massUploadError");
    const successEl = document.getElementById("massUploadSuccess");
    const confirmBtn = document.getElementById("confirmMassUploadBtn");

    document.getElementById("massUploadBtn").addEventListener("click", () => {
      openBulkUploadModal("generic");
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
      fileName.textContent = fileInput.files[0] ? `Archivo seleccionado: ${fileInput.files[0].name}` : "Todavía no seleccionaste ningún archivo.";
      errorEl.classList.add("d-none");
      successEl.classList.add("d-none");
    });

    modalEl.addEventListener("hidden.bs.modal", () => {
      resetBulkUploadModal();
    });

    confirmBtn.addEventListener("click", () => {
      if (!state.bulkUploadType) {
        showBulkUploadError("Seleccioná si querés cargar Productos o DUN 14.");
        return;
      }

      if (!fileInput.files.length) {
        showBulkUploadError("Seleccioná un archivo antes de confirmar la carga.");
        return;
      }

      const file = fileInput.files[0];
      if (!/\.(xlsx|xls)$/i.test(file.name)) {
        showBulkUploadError("La extensión del archivo debe ser .xlsx o .xls.");
        return;
      }

      confirmBtn.disabled = true;
      errorEl.classList.add("d-none");
      successEl.classList.add("d-none");

      window.setTimeout(() => {
        const label = state.bulkUploadType === "dun14" ? "DUN 14" : "productos";
        const message = `La carga masiva de ${label} se completó correctamente.`;
        successEl.textContent = message;
        successEl.classList.remove("d-none");
        confirmBtn.disabled = false;
        fileInput.value = "";
        fileName.textContent = "Todavía no seleccionaste ningún archivo.";
        showToast(message);
      }, 850);
    });

    function showBulkUploadError(message) {
      errorEl.textContent = message;
      errorEl.classList.remove("d-none");
      successEl.classList.add("d-none");
    }
  }

  function openBulkUploadModal(type) {
    state.bulkUploadSource = type;
    state.bulkUploadType = type === "generic" ? null : type;
    resetBulkUploadFields();
    updateBulkUploadUi();
  }

  function resetBulkUploadFields() {
    document.getElementById("massUploadFile").value = "";
    document.getElementById("massUploadFileName").textContent = "Todavía no seleccionaste ningún archivo.";
    document.getElementById("massUploadError").classList.add("d-none");
    document.getElementById("massUploadSuccess").classList.add("d-none");
    document.getElementById("massUploadSuccess").textContent = "";
    document.getElementById("confirmMassUploadBtn").disabled = false;
  }

  function resetBulkUploadModal() {
    state.bulkUploadType = null;
    state.bulkUploadSource = "generic";
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
      hint.textContent = "Seleccioná primero qué querés cargar.";
    }

    document.querySelectorAll("[data-bulk-type-option]").forEach((button) => {
      const isActive = button.dataset.bulkTypeOption === state.bulkUploadType;
      button.classList.toggle("btn-primary", isActive);
      button.classList.toggle("btn-outline-primary", !isActive);
    });
  }

  function renderTable() {
    const filteredProducts = getFilteredProducts();
    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));

    if (state.currentPage > totalPages) {
      state.currentPage = 1;
    }

    const startIndex = (state.currentPage - 1) * PAGE_SIZE;
    const pagedProducts = filteredProducts.slice(startIndex, startIndex + PAGE_SIZE);

    tableBody.innerHTML = pagedProducts
      .map((product) => `
        <tr>
          <td>${product.tipo}</td>
          <td>${product.codigo}</td>
          <td>${product.producto}</td>
          <td><span class="badge ${statusBadgeClass(product.estado)}">${product.estado}</span></td>
          <td>${product.marca}</td>
          <td>${product.variedad}</td>
          <td>${product.origen}</td>
          <td>${product.fechaModificacion}</td>
          <td>${product.fechaAlta}</td>
          <td class="text-end">
            <div class="dropdown">
              <button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">Acciones</button>
              <ul class="dropdown-menu dropdown-menu-end">
                <li><button type="button" class="dropdown-item" data-row-action="copy" data-product-id="${product.id}">Copiar</button></li>
                <li><a class="dropdown-item" href="${product.modifyHref}">Modificar</a></li>
                <li><a class="dropdown-item" href="${product.detailHref}">Detalle</a></li>
                <li><button type="button" class="dropdown-item" data-row-action="logs" data-product-id="${product.id}">Logs</button></li>
                <li><button type="button" class="dropdown-item" data-row-action="image" data-product-id="${product.id}">Imagen</button></li>
              </ul>
            </div>
          </td>
        </tr>
      `)
      .join("");

    const firstVisible = filteredProducts.length ? startIndex + 1 : 0;
    const lastVisible = filteredProducts.length ? Math.min(startIndex + PAGE_SIZE, filteredProducts.length) : 0;
    paginationStatus.textContent = `Mostrando ${firstVisible}-${lastVisible} de ${filteredProducts.length} productos`;

    renderPagination(totalPages);
    bindRowActions();
    updateFilterIndicators();
  }

  function renderPagination(totalPages) {
    const buttons = [];
    const prevDisabled = state.currentPage === 1 ? "disabled" : "";
    const nextDisabled = state.currentPage === totalPages ? "disabled" : "";

    buttons.push(`
      <li class="page-item ${prevDisabled}">
        <button class="page-link" type="button" data-page="${state.currentPage - 1}" ${state.currentPage === 1 ? "disabled" : ""}>Anterior</button>
      </li>
    `);

    for (let page = 1; page <= totalPages; page += 1) {
      buttons.push(`
        <li class="page-item ${page === state.currentPage ? "active" : ""}">
          <button class="page-link" type="button" data-page="${page}">${page}</button>
        </li>
      `);
    }

    buttons.push(`
      <li class="page-item ${nextDisabled}">
        <button class="page-link" type="button" data-page="${state.currentPage + 1}" ${state.currentPage === totalPages ? "disabled" : ""}>Siguiente</button>
      </li>
    `);

    paginationControls.innerHTML = buttons.join("");
    paginationControls.querySelectorAll("[data-page]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextPage = Number(button.dataset.page);
        if (!Number.isNaN(nextPage) && nextPage > 0) {
          state.currentPage = nextPage;
          renderTable();
        }
      });
    });
  }

  function getFilteredProducts() {
    const filtered = state.products.filter((product) => {
      return Object.entries(state.filters).every(([column, values]) => {
        if (!values || !values.length) {
          return true;
        }
        return values.includes(String(product[column]));
      });
    });

    if (!state.sort.column) {
      return filtered;
    }

    const { column, direction } = state.sort;
    return [...filtered].sort((left, right) => {
      const leftValue = normalizeSortValue(left, column);
      const rightValue = normalizeSortValue(right, column);
      const compareResult = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
      return direction === "asc" ? compareResult : compareResult * -1;
    });
  }

  function normalizeSortValue(product, column) {
    if (column === "fechaAlta") {
      return product.fechaAltaIso;
    }
    if (column === "fechaModificacion") {
      return product.fechaModificacionIso;
    }
    return String(product[column]).toLowerCase();
  }

  function initFilterMenus() {
    document.querySelectorAll(".column-filter-toggle").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        const column = button.dataset.column;
        const menu = document.querySelector(`[data-column-menu="${column}"]`);
        const isSameMenu = state.activeFilterMenu === menu;
        closeFilterMenus();

        if (!isSameMenu) {
          renderFilterMenu(column);
          menu.classList.add("show");
          const rect = button.getBoundingClientRect();
          menu.style.position = "fixed";
          menu.style.left = `${Math.max(12, rect.left - 220)}px`;
          menu.style.top = `${rect.bottom + 6}px`;
          state.activeFilterMenu = menu;
        }
      });
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".column-filter-menu") && !event.target.closest(".column-filter-toggle")) {
        closeFilterMenus();
      }
    });
  }

  function renderFilterMenu(column) {
    const menu = document.querySelector(`[data-column-menu="${column}"]`);
    const availableValues = getUniqueValues(column);
    const activeValues = state.filters[column] ? new Set(state.filters[column]) : new Set(availableValues);
    const searchTerm = state.filterSearch[column].toLowerCase();
    const visibleValues = availableValues.filter((value) => value.toLowerCase().includes(searchTerm));
    const hasActiveFilter = state.filters[column] && state.filters[column].length;

    menu.innerHTML = `
      <div class="column-filter-card">
        <div class="column-filter-actions">
          <button type="button" class="dropdown-item" data-filter-sort="${column}:asc">Orden ascendente</button>
          <button type="button" class="dropdown-item" data-filter-sort="${column}:desc">Orden descendente</button>
        </div>
        <div class="p-3 border-top">
          <input type="search" class="form-control form-control-sm" data-filter-search="${column}" placeholder="Buscar valor" value="${escapeHtml(state.filterSearch[column])}">
        </div>
        <div class="column-filter-checklist">
          <label class="column-filter-option fw-semibold">
            <input type="checkbox" data-select-all="${column}" ${visibleValues.every((value) => activeValues.has(value)) ? "checked" : ""}>
            Seleccionar todo
          </label>
          ${visibleValues.map((value) => `
            <label class="column-filter-option">
              <input type="checkbox" data-filter-option="${column}" value="${escapeHtml(value)}" ${activeValues.has(value) ? "checked" : ""}>
              ${escapeHtml(value)}
            </label>
          `).join("")}
        </div>
        <div class="column-filter-footer">
          <button type="button" class="btn btn-sm btn-outline-secondary" data-filter-clear="${column}" ${hasActiveFilter ? "" : "disabled"}>Limpiar filtro</button>
          <button type="button" class="btn btn-sm btn-primary" data-filter-apply="${column}">Aplicar</button>
        </div>
      </div>
    `;

    menu.querySelector(`[data-filter-search="${column}"]`).addEventListener("input", (event) => {
      state.filterSearch[column] = event.target.value;
      renderFilterMenu(column);
      menu.classList.add("show");
      state.activeFilterMenu = menu;
    });

    menu.querySelector(`[data-select-all="${column}"]`).addEventListener("change", (event) => {
      menu.querySelectorAll(`[data-filter-option="${column}"]`).forEach((checkbox) => {
        checkbox.checked = event.target.checked;
      });
    });

    menu.querySelector(`[data-filter-apply="${column}"]`).addEventListener("click", () => {
      const selectedValues = Array.from(menu.querySelectorAll(`[data-filter-option="${column}"]:checked`)).map((checkbox) => checkbox.value);
      state.filters[column] = selectedValues.length === availableValues.length ? null : selectedValues;
      state.currentPage = 1;
      closeFilterMenus();
      renderTable();
    });

    menu.querySelector(`[data-filter-clear="${column}"]`).addEventListener("click", () => {
      state.filters[column] = null;
      state.filterSearch[column] = "";
      state.currentPage = 1;
      closeFilterMenus();
      renderTable();
    });

    menu.querySelectorAll("[data-filter-sort]").forEach((sortButton) => {
      sortButton.addEventListener("click", () => {
        const [, direction] = sortButton.dataset.filterSort.split(":");
        state.sort = { column, direction };
        state.currentPage = 1;
        closeFilterMenus();
        renderTable();
      });
    });
  }

  function closeFilterMenus() {
    document.querySelectorAll(".column-filter-menu.show").forEach((menu) => {
      menu.classList.remove("show");
    });
    state.activeFilterMenu = null;
  }

  function getUniqueValues(column) {
    const values = state.products.map((product) => String(product[column]));
    return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right, "es"));
  }

  function updateFilterIndicators() {
    document.querySelectorAll(".column-filter-toggle").forEach((button) => {
      const column = button.dataset.column;
      const header = button.closest("th");
      header.classList.toggle("column-has-filter", Boolean(state.filters[column] && state.filters[column].length));
      header.classList.toggle("column-has-sort", state.sort.column === column);
      if (state.sort.column === column) {
        button.textContent = state.sort.direction === "asc" ? "▲" : "▼";
      } else {
        button.textContent = "▼";
      }
    });
  }

  function bindRowActions() {
    document.querySelectorAll("[data-row-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = state.products.find((item) => item.id === button.dataset.productId);
        if (!product) {
          return;
        }

        state.selectedProduct = product;
        const action = button.dataset.rowAction;
        if (action === "copy") {
          document.getElementById("copyProductSummary").innerHTML = `
            <div><strong>${product.producto}</strong></div>
            <div>Código original: ${product.codigo}</div>
            <div>La próxima vista permitirá ajustar marca, variedad y datos complementarios.</div>
          `;
          copyProductModal.show();
        }

        if (action === "logs") {
          renderLogs(product);
          logsModal.show();
        }

        if (action === "image") {
          document.getElementById("productImagePreview").src = product.imageSrc;
          document.getElementById("productImageCaption").textContent = `${product.producto} (${product.codigo})`;
          imageModal.show();
        }
      });
    });
  }

  function renderLogs(product) {
    const entries = [
      { title: "Alta creada", detail: `Se generó el registro inicial para ${product.codigo}.`, timestamp: "12/07/2026 09:15" },
      { title: "Validación comercial", detail: `La marca ${product.marca} quedó disponible para publicación.`, timestamp: "12/07/2026 11:40" },
      { title: "Última modificación", detail: `Se actualizó la variedad ${product.variedad}.`, timestamp: `${product.fechaModificacion} 14:10` },
    ];
    document.getElementById("logsTimeline").innerHTML = entries
      .map((entry) => `
        <div class="notification-card">
          <div class="fw-semibold">${entry.title}</div>
          <div class="small text-secondary">${entry.detail}</div>
          <div class="small text-secondary mt-1">${entry.timestamp}</div>
        </div>
      `)
      .join("");
  }

  function initUserSwitcher() {}

  function renderUserSelector() {
    const selector = document.getElementById("userSelector");
    selector.innerHTML = users
      .map((user) => `
        <button type="button" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-user-id="${user.id}">
          <span>
            <strong>${user.name}</strong><br>
            <small>${user.email}</small>
          </span>
          ${state.currentUser.id === user.id ? '<span class="badge text-bg-success">Activo</span>' : ""}
        </button>
      `)
      .join("");

    selector.querySelectorAll("[data-user-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const user = users.find((item) => item.id === button.dataset.userId);
        state.currentUser = user;
        updateAccountContext();
        renderUserSelector();
        showToast(`Usuario activo: ${user.name}`);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("userSwitchModal")).hide();
      });
    });
  }

  function initLicenseSwitcher() {}

  function renderLicenseSelector() {
    const selector = document.getElementById("licenseSelector");
    selector.innerHTML = licenses
      .map((license) => `
        <div class="license-card ${state.currentLicense.id === license.id ? "license-card-active" : ""}">
          <div>
            <div class="fw-semibold">${license.name}</div>
            <div class="small text-secondary">CUIT ${license.cuit}</div>
          </div>
          <div class="d-flex align-items-center gap-2">
            <span class="badge ${state.currentLicense.id === license.id ? "text-bg-success" : "text-bg-light"}">${state.currentLicense.id === license.id ? "Activa" : "Disponible"}</span>
            <button type="button" class="btn btn-sm ${state.currentLicense.id === license.id ? "btn-outline-secondary" : "btn-primary"}" data-license-id="${license.id}" ${state.currentLicense.id === license.id ? "disabled" : ""}>Cambiar</button>
          </div>
        </div>
      `)
      .join("");

    selector.querySelectorAll("[data-license-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextLicense = licenses.find((item) => item.id === button.dataset.licenseId);
        state.currentLicense = nextLicense;
        updateAccountContext();
        renderLicenseSelector();
        showToast(`Licencia activa: ${nextLicense.name}`);
        bootstrap.Modal.getOrCreateInstance(document.getElementById("licenseModal")).hide();
      });
    });
  }

  function updateAccountContext() {
    document.getElementById("currentUserName").textContent = state.currentUser.name;
    document.getElementById("currentUserEmail").textContent = state.currentUser.email;
    document.getElementById("accountLicenseName").textContent = state.currentLicense.name;
    document.getElementById("accountLicenseCuit").textContent = state.currentLicense.cuit;
    document.getElementById("accountMembershipName").textContent = state.currentLicense.membership;
    document.getElementById("currentLicenseNameMenu").textContent = state.currentLicense.name;
  }

  function renderNotifications() {
    const list = document.getElementById("notificationList");
    list.innerHTML = notifications
      .map((notification) => `
        <div class="notification-card">
          <div class="d-flex justify-content-between align-items-start gap-3">
            <div>
              <div class="fw-semibold">${notification.title}</div>
              <div class="small text-secondary">${notification.description}</div>
            </div>
            ${notification.unread ? '<span class="badge text-bg-danger">Nuevo</span>' : ""}
          </div>
          <div class="small text-secondary mt-2">${notification.timestamp}</div>
        </div>
      `)
      .join("");
    document.getElementById("notificationBadge").textContent = String(notifications.filter((item) => item.unread).length);
  }

  function initFloatingBar() {
    const floatingBar = document.getElementById("barra-codificar");
    const scrollTopBtn = document.getElementById("scrollTopBtn");

    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        floatingBar.classList.add("mostrar");
      } else {
        floatingBar.classList.remove("mostrar");
      }
    });

    scrollTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  function initTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
      new bootstrap.Tooltip(element);
    });
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

  function loadShortcutIds() {
    const raw = localStorage.getItem(STORAGE_KEYS.shortcuts);
    if (!raw) {
      return [...defaultShortcutIds];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...defaultShortcutIds];
    } catch (error) {
      return [...defaultShortcutIds];
    }
  }


  function setShortcutIds(shortcutIds) {
    state.shortcutIds = shortcutsCatalog
      .filter((shortcut) => shortcutIds.includes(shortcut.id))
      .map((shortcut) => shortcut.id);
  }

  function saveShortcutIds() {
    localStorage.setItem(STORAGE_KEYS.shortcuts, JSON.stringify(state.shortcutIds));
  }

  function getShortcutIcon(iconName) {
    const icons = {
      "upc-scan": '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-upc-scan" viewBox="0 0 16 16"><path d="M1.5 1a.5.5 0 0 0-.5.5v3a.5.5 0 0 1-1 0v-3A1.5 1.5 0 0 1 1.5 0h3a.5.5 0 0 1 0 1zM11 .5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 16 1.5v3a.5.5 0 0 1-1 0v-3a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 1-.5-.5M.5 11a.5.5 0 0 1 .5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 1 0 1h-3A1.5 1.5 0 0 1 0 14.5v-3a.5.5 0 0 1 .5-.5m15 0a.5.5 0 0 1 .5.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a.5.5 0 0 1 0-1h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 1 .5-.5M3 4.5a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0zm2 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0zm2 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0zm2 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 1 0v7a.5.5 0 0 1-1 0z"/></svg>',
      gear: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-gear" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"></path><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"></path></svg>',
      "person-add": '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-person-add" viewBox="0 0 16 16"><path d="M12.5 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7m.5-5v1h1a.5.5 0 0 1 0 1h-1v1a.5.5 0 0 1-1 0v-1h-1a.5.5 0 0 1 0-1h1v-1a.5.5 0 0 1 1 0m-2-6a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4"></path><path d="M8.256 14a4.5 4.5 0 0 1-.229-1.004H3c.001-.246.154-.986.832-1.664C4.484 10.68 5.711 10 8 10q.39 0 .74.025c.226-.341.496-.65.804-.918Q8.844 9.002 8 9c-5 0-6 3-6 4s1 1 1 1z"></path></svg>',
      "qr-code": '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-qr-code" viewBox="0 0 16 16"><path d="M2 2h2v2H2z"/><path d="M6 0v6H0V0zM5 1H1v4h4zM4 12H2v2h2z"/><path d="M6 10v6H0v-6zm-5 1v4h4v-4zm11-9h2v2h-2z"/><path d="M10 0v6h6V0zm5 1v4h-4V1zM8 1V0h1v2H8v2H7V1zm0 5V4h1v2zM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8zm0 0v1H2V8H1v1H0V7h3v1zm10 1h-1V7h1zm-1 0h-1v2h2v-1h-1zm-4 0h2v1h-1v1h-1zm2 3v-1h-1v1h-1v1H9v1h3v-2zm0 0h3v1h-2v1h-1zm-4-1v1h1v-2H7v1z"/><path d="M7 12h1v3h4v1H7zm9 2v2h-3v-1h2v-1z"/></svg>',
      cart2: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-cart2" viewBox="0 0 16 16"><path d="M0 2.5A.5.5 0 0 1 .5 2H2a.5.5 0 0 1 .485.379L2.89 4H14.5a.5.5 0 0 1 .485.621l-1.5 6A.5.5 0 0 1 13 11H4a.5.5 0 0 1-.485-.379L1.61 3H.5a.5.5 0 0 1-.5-.5M3.14 5l1.25 5h8.22l1.25-5zM5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0m9-1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m-2 1a2 2 0 1 1 4 0 2 2 0 0 1-4 0"></path></svg>',
      truck: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-truck" viewBox="0 0 16 16"><path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h9A1.5 1.5 0 0 1 12 3.5V5h1.02a1.5 1.5 0 0 1 1.17.563l1.481 1.85a1.5 1.5 0 0 1 .329.938V10.5a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 1 1-4 0H5a2 2 0 1 1-3.998-.085A1.5 1.5 0 0 1 0 10.5zm1.294 7.456A2 2 0 0 1 4.732 11h5.536a2 2 0 0 1 .732-.732V3.5a.5.5 0 0 0-.5-.5h-9a.5.5 0 0 0-.5.5v7a.5.5 0 0 0 .294.456M12 10a2 2 0 0 1 1.732 1h.768a.5.5 0 0 0 .5-.5V8.35a.5.5 0 0 0-.11-.312l-1.48-1.85A.5.5 0 0 0 13.02 6H12zm-9 1a1 1 0 1 0 0 2 1 1 0 0 0 0-2m9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2"></path></svg>',
      "plus-circle-dotted": '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" class="bi bi-plus-circle-dotted" viewBox="0 0 16 16"><path d="M8 0q-.264 0-.523.017l.064.998a7 7 0 0 1 .918 0l.064-.998A8 8 0 0 0 8 0M6.44.152q-.52.104-1.012.27l.321.948q.43-.147.884-.237L6.44.153zm4.132.271a8 8 0 0 0-1.011-.27l-.194.98q.453.09.884.237zm1.873.925a8 8 0 0 0-.906-.524l-.443.896q.413.205.793.459zM4.46.824q-.471.233-.905.524l.556.83a7 7 0 0 1 .793-.458zM2.725 1.985q-.394.346-.74.74l.752.66q.303-.345.648-.648zm11.29.74a8 8 0 0 0-.74-.74l-.66.752q.346.303.648.648zm1.161 1.735a8 8 0 0 0-.524-.905l-.83.556q.254.38.458.793l.896-.443zM1.348 3.555q-.292.433-.524.906l.896.443q.205-.413.459-.793zM.423 5.428a8 8 0 0 0-.27 1.011l.98.194q.09-.453.237-.884zM15.848 6.44a8 8 0 0 0-.27-1.012l-.948.321q.147.43.237.884zM.017 7.477a8 8 0 0 0 0 1.046l.998-.064a7 7 0 0 1 0-.918zM16 8a8 8 0 0 0-.017-.523l-.998.064a7 7 0 0 1 0 .918l.998.064A8 8 0 0 0 16 8M.152 9.56q.104.52.27 1.012l.948-.321a7 7 0 0 1-.237-.884l-.98.194zm15.425 1.012q.168-.493.27-1.011l-.98-.194q-.09.453-.237.884zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a7 7 0 0 1-.458-.793zm13.828.905q.292-.434.524-.906l-.896-.443q-.205.413-.459.793zm-12.667.83q.346.394.74.74l.66-.752a7 7 0 0 1-.648-.648zm11.29.74q.394-.346.74-.74l-.752-.66q-.302.346-.648.648zm-1.735 1.161q.471-.233.905-.524l-.556-.83a7 7 0 0 1-.793.458zm-7.985-.524q.434.292.906.524l.443-.896a7 7 0 0 1-.793-.459zm1.873.925q.493.168 1.011.27l.194-.98a7 7 0 0 1-.884-.237zm4.132.271a8 8 0 0 0 1.012-.27l-.321-.948a7 7 0 0 1-.884.237l.194.98zm-2.083.135a8 8 0 0 0 1.046 0l-.064-.998a7 7 0 0 1-.918 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z"></path></svg>',
    };

    return icons[iconName] || "";
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

  function showToast(message) {
    if (!toast) {
      return;
    }
    toastBody.textContent = message;
    toast.show();
  }

  function formatDate(isoDate) {
    const [year, month, day] = isoDate.split("-");
    return `${day}/${month}/${year}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
