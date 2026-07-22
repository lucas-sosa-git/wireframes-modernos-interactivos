(function () {
  const CONFIG = {
    products: {
      title: "Productos comerciales", label: "productos", empty: "No hay productos comerciales para mostrar con los filtros activos.",
      columns: [
        ["image", "Imagen", false], ["type", "Tipo de código"], ["code", "Código"], ["name", "Producto"], ["status", "Estado"],
        ["brand", "Marca"], ["variety", "Variedad"], ["origin", "Origen"], ["modifiedAt", "Fecha de modificación"], ["createdAt", "Fecha de alta"],
      ],
    },
    dispatchUnits: {
      title: "Unidades de despacho", label: "unidades de despacho", empty: "No hay unidades de despacho para mostrar con los filtros activos.",
      columns: [
        ["image", "Imagen", false], ["type", "Tipo de código"], ["code", "Código"], ["name", "Unidad de despacho"], ["status", "Estado"],
        ["brand", "Marca"], ["packagingLevel", "Nivel"], ["baseQuantity", "Contenido"], ["destination", "Destino"], ["modifiedAt", "Fecha de modificación"],
      ],
    },
  };
  const LAYOUT = { image: 72, type: 110, code: 140, name: 210, status: 100, brand: 120, variety: 120, origin: 120, packagingLevel: 120, baseQuantity: 160, destination: 140, modifiedAt: 140, createdAt: 140, actions: 230 };
  let sequence = 0;

  function mount(options) {
    const target = options && options.mount;
    const mode = options && CONFIG[options.mode] ? options.mode : "products";
    if (!target) throw new Error("GS1ProductTable.mount requiere un elemento mount.");
    const config = CONFIG[mode];
    const instance = createInstance(target, { ...options, mode, config, id: `gs1-product-table-${++sequence}` });
    return instance;
  }

  function createInstance(target, options) {
    const records = (options.records || getRecords(options.mode)).map((record) => ({ ...record }));
    const columns = options.config.columns.map(([key, label, filterable]) => ({ key, label, filterable: filterable !== false }));
    const storageKey = options.persistenceKey || `gs1.products.columnVisibility.${options.mode}.v2`;
    const stored = read(storageKey);
    const state = { page: 1, search: "", sort: null, filters: {}, visible: validVisible(stored, columns), selectedId: options.selectedId || null, draft: null, filterSearch: "" };
    const menu = document.createElement("div");
    menu.className = "column-filter-menu dropdown-menu p-0";
    menu.id = `${options.id}-filter-menu`;
    document.body.appendChild(menu);

    target.innerHTML = shell(options, columns);
    const refs = {
      search: target.querySelector("[data-product-table-search]"), clear: target.querySelector("[data-product-table-clear]"),
      columns: target.querySelector("[data-product-table-columns]"), head: target.querySelector("thead"), body: target.querySelector("tbody"),
      table: target.querySelector("table"), pagination: target.querySelector("[data-product-table-pagination]"), status: target.querySelector("[data-product-table-status]"),
    };
    const api = { refresh, select, getSelected: () => records.find((record) => record.id === state.selectedId) || null, destroy: () => { menu.remove(); target.innerHTML = ""; } };

    refs.search?.addEventListener("input", (event) => { state.search = normalize(event.target.value); state.page = 1; render(); });
    refs.clear?.addEventListener("click", () => { state.search = ""; refs.search.value = ""; state.page = 1; render(); refs.search.focus(); });
    target.addEventListener("click", (event) => handleClick(event));
    document.addEventListener("click", (event) => { if (!menu.contains(event.target) && !event.target.closest("[data-product-table-filter]")) closeMenu(); });
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    render();
    return api;

    function refresh(nextRecords) { if (Array.isArray(nextRecords)) { records.splice(0, records.length, ...nextRecords); } render(); }
    function select(id, trigger) {
      const record = records.find((item) => item.id === id);
      if (!record) return;
      if (options.onSelectionChange?.(record, trigger) === false) return;
      state.selectedId = id;
      render();
    }
    function handleClick(event) {
      const page = event.target.closest("[data-product-table-page]");
      if (page) { state.page = Number(page.dataset.productTablePage); render(); return; }
      const visibility = event.target.closest("[data-product-table-visibility]");
      if (visibility) { toggleVisibility(visibility.dataset.productTableVisibility); return; }
      const filter = event.target.closest("[data-product-table-filter]");
      if (filter) { event.stopPropagation(); openMenu(filter.dataset.productTableFilter, filter); return; }
      const action = event.target.closest("[data-product-table-action]");
      if (action) {
        const record = records.find((item) => item.id === action.dataset.productId);
        if (!record) return;
        const kind = action.dataset.productTableAction;
        options.onAction?.(kind, record, action, api);
      }
    }
    function render() {
      const visible = columns.filter((column) => state.visible.includes(column.key));
      const items = filtered(); const pages = Math.max(1, Math.ceil(items.length / 10));
      state.page = Math.min(state.page, pages);
      refs.table.style.minWidth = `${visible.reduce((sum, column) => sum + (LAYOUT[column.key] || 120), LAYOUT.actions)}px`;
      refs.table.querySelector("colgroup").innerHTML = [...visible.map((column) => `<col style="min-width:${LAYOUT[column.key] || 120}px">`), `<col style="min-width:${actionWidth()}px">`].join("");
      refs.head.innerHTML = `<tr>${visible.map(header).join("")}<th class="text-end product-grid__actions-head">Acciones</th></tr>`;
      const pageItems = items.slice((state.page - 1) * 10, state.page * 10);
      refs.body.innerHTML = pageItems.length ? pageItems.map((record) => row(record, visible)).join("") : `<tr><td colspan="${visible.length + 1}" class="text-center py-4 text-secondary">${escape(options.config.empty)}</td></tr>`;
      refs.status.textContent = `Mostrando ${items.length ? (state.page - 1) * 10 + 1 : 0}-${Math.min(state.page * 10, items.length)} de ${items.length} ${options.config.label}`;
      refs.pagination.innerHTML = renderPagination(pages);
      refs.body.querySelectorAll(".product-thumb-image").forEach((image) => image.addEventListener("error", () => {
        const host = image.closest(".product-thumbnail");
        if (host) host.innerHTML = placeholderMarkup(records.find((item) => item.id === host.dataset.productId));
      }, { once: true }));
      renderColumns(); refreshTooltips(target);
    }
    function filtered() {
      const searchable = options.searchKeys || columns.filter((column) => column.key !== "image").map((column) => column.key);
      let items = records.filter((record) => (!state.search || searchable.some((key) => normalize(record[key]).includes(state.search))) && Object.entries(state.filters).every(([key, values]) => !values || values.includes(String(record[key] || ""))));
      if (state.sort) items = [...items].sort((a, b) => String(a[state.sort.key] || "").localeCompare(String(b[state.sort.key] || ""), "es", { sensitivity: "base" }) * (state.sort.direction === "asc" ? 1 : -1));
      return items;
    }
    function renderPagination(totalPages) {
      const button = (page, label, disabled, active) => `<li class="page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}"><button type="button" class="page-link" data-product-table-page="${page}" ${disabled ? "disabled" : ""}>${label}</button></li>`;
      const items = [button(state.page - 1, "Anterior", state.page === 1, false)];
      for (let page = 1; page <= totalPages; page += 1) items.push(button(page, page, false, page === state.page));
      items.push(button(state.page + 1, "Siguiente", state.page === totalPages, false));
      return items.join("");
    }
    function header(column) {
      if (!column.filterable) return `<th>${escape(column.label)}</th>`;
      const active = state.filters[column.key] || (state.sort && state.sort.key === column.key);
      return `<th class="${active ? "column-has-filter" : ""}"><div class="column-filter-header"><span>${escape(column.label)}</span><button type="button" class="btn btn-sm btn-light column-filter-toggle" data-product-table-filter="${column.key}" aria-label="Filtrar ${escapeAttr(column.label)}">${sortIcon(column.key)}</button></div></th>`;
    }
    function row(record, visible) {
      const cells = visible.map((column) => cell(record, column));
      const selected = state.selectedId === record.id;
      return `<tr class="${selected ? "product-table-row--selected" : ""}" aria-selected="${selected}">${cells.join("")}<td class="text-end product-cell-nowrap product-grid__actions-cell"><div class="btn-group btn-group-sm product-row-actions" role="group" aria-label="Acciones del registro">${actions(record)}</div></td></tr>`;
    }
    function cell(record, column) {
      if (column.key === "image") return `<td>${thumbnail(record)}</td>`;
      if (column.key === "status") return `<td class="product-cell-nowrap"><span class="badge ${badge(record.status)}">${escape(record.status)}</span></td>`;
      return `<td class="${["code", "createdAt", "modifiedAt"].includes(column.key) ? "product-cell-nowrap" : "product-cell-break"}">${escape(record[column.key] || "")}</td>`;
    }
    function actions(record) {
      if (options.actions === "dun14-selection") return `${button("create-dun14", record, "Generar nuevo DUN-14", "", "btn-primary product-table-generate-dun14")}${button("detail", record, "Detalle", "eye")}`;
      return [button("detail", record, "Detalle", "eye"), button("copy", record, "Editar copia", "files"), button("edit", record, "Modificar", "pencil-square"), button("logs", record, "Logs", "clock-history"), button("image", record, "Ver imagen", "image"), button("digital-link", record, "QR / Digital Link", "../QR-DATAMATRIX.png"), button("symbol", record, "Generador de simbología", "../GENERADOR DE SIMBOLOGIA.png")].join("");
    }
    function button(action, record, label, icon, className = "btn-outline-secondary") { const mark = icon ? iconMarkup(icon) : escape(label); return `<button type="button" class="btn ${className}" data-product-table-action="${action}" data-product-id="${escapeAttr(record.id)}" aria-label="${escapeAttr(label)}" title="${escapeAttr(label)}" data-bs-toggle="tooltip" data-bs-title="${escapeAttr(label)}">${mark}</button>`; }
    function placeholderMarkup(record) { return `<span class="product-thumb-placeholder" aria-label="Sin imagen para ${escapeAttr(record?.name || "producto")}">${iconMarkup("image")}<span>Sin imagen</span></span>`; }
    function thumbnail(record) { const image = window.GS1ProductCatalog?.resolveImagePath?.(record.image) || null; return `<button type="button" class="product-thumbnail" data-product-table-action="image" data-product-id="${escapeAttr(record.id)}" aria-label="Ver imagen de ${escapeAttr(record.name)}" title="Ver imagen" data-bs-toggle="tooltip">${image ? `<img class="product-thumb-image" src="${escapeAttr(image)}" alt="${escapeAttr(record.name)}" loading="lazy" decoding="async">` : placeholderMarkup(record)}</button>`; }
    function renderColumns() { if (!refs.columns) return; refs.columns.innerHTML = `<div class="columns-menu__panel"><div class="columns-menu__header"><div class="fw-semibold">Atributos visibles</div><div class="small text-secondary">Preferencia guardada para esta tabla.</div></div><div class="columns-menu__list">${columns.map((column) => `<button type="button" class="dropdown-item columns-menu__item ${state.visible.includes(column.key) ? "is-selected" : ""}" data-product-table-visibility="${column.key}"><span class="columns-menu__item-main"><span class="form-check-input columns-menu__indicator ${state.visible.includes(column.key) ? "checked" : ""}" aria-hidden="true"></span><span>${escape(column.label)}</span></span></button>`).join("")}</div></div>`; }
    function toggleVisibility(key) { const next = state.visible.includes(key) ? state.visible.filter((item) => item !== key) : [...state.visible, key]; state.visible = validVisible(next, columns); write(storageKey, state.visible); render(); }
    function openMenu(key, trigger) {
      const values = [...new Set(records.map((record) => String(record[key] || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
      state.draft = { key, values, selected: new Set(state.filters[key] || values) };
      const draw = () => { const shown = values.filter((value) => normalize(value).includes(normalize(state.filterSearch))); menu.innerHTML = `<div class="column-filter-card"><div class="column-filter-actions"><button type="button" class="dropdown-item" data-sort="asc">Orden ascendente</button><button type="button" class="dropdown-item" data-sort="desc">Orden descendente</button></div><div class="column-filter-toolbar p-3 border-top border-bottom"><input type="search" class="form-control form-control-sm" data-filter-search placeholder="Buscar valor" value="${escapeAttr(state.filterSearch)}"></div><div class="filter-panel__body column-filter-checklist"><label class="column-filter-option fw-semibold"><input type="checkbox" data-all ${shown.length && shown.every((value) => state.draft.selected.has(value)) ? "checked" : ""}>Seleccionar todo</label>${shown.map((value) => `<label class="column-filter-option"><input type="checkbox" data-value="${escapeAttr(value)}" ${state.draft.selected.has(value) ? "checked" : ""}>${escape(value)}</label>`).join("") || '<div class="small text-secondary py-2">No hay coincidencias.</div>'}</div><div class="filter-panel__footer column-filter-footer"><button type="button" class="btn btn-sm btn-outline-secondary" data-clear>Limpiar</button><button type="button" class="btn btn-sm btn-outline-secondary" data-cancel>Cancelar</button><button type="button" class="btn btn-sm btn-primary" data-apply>Aplicar</button></div></div>`; bindMenu(shown); };
      draw(); menu.classList.add("show"); place(trigger); menu.querySelector("[data-filter-search]")?.focus();
    }
    function bindMenu(shown) { menu.querySelector("[data-filter-search]").addEventListener("input", (event) => { state.filterSearch = event.target.value; openMenu(state.draft.key, state.trigger); }); menu.querySelector("[data-all]")?.addEventListener("change", (event) => { shown.forEach((value) => event.target.checked ? state.draft.selected.add(value) : state.draft.selected.delete(value)); openMenu(state.draft.key, state.trigger); }); menu.querySelectorAll("[data-value]").forEach((input) => input.addEventListener("change", () => input.checked ? state.draft.selected.add(input.dataset.value) : state.draft.selected.delete(input.dataset.value))); menu.querySelectorAll("[data-sort]").forEach((button) => button.addEventListener("click", () => { state.sort = { key: state.draft.key, direction: button.dataset.sort }; state.page = 1; closeMenu(); render(); })); menu.querySelector("[data-apply]").addEventListener("click", () => { const selected = [...state.draft.selected]; state.filters[state.draft.key] = selected.length === state.draft.values.length ? null : selected; state.page = 1; closeMenu(); render(); }); menu.querySelector("[data-clear]").addEventListener("click", () => { state.filters[state.draft.key] = null; state.page = 1; closeMenu(); render(); }); menu.querySelector("[data-cancel]").addEventListener("click", closeMenu); }
    function place(trigger) { state.trigger = trigger; const rect = trigger.getBoundingClientRect(); menu.style.cssText = `position:fixed;z-index:1095;width:${Math.min(320, innerWidth - 24)}px;max-height:${Math.min(500, innerHeight - 24)}px;left:${Math.max(12, Math.min(innerWidth - 332, rect.right - 320))}px;top:${Math.min(innerHeight - 20, rect.bottom + 6)}px`; }
    function reposition() { if (state.trigger && menu.classList.contains("show")) place(state.trigger); }
    function closeMenu() { menu.classList.remove("show"); menu.innerHTML = ""; state.draft = null; state.trigger = null; state.filterSearch = ""; }
    function actionWidth() { return options.actions === "dun14-selection" ? 270 : LAYOUT.actions; }
  }

  function shell(options) { const heading = options.heading || CONFIG[options.mode].title; return `<section class="card shadow-sm overflow-hidden product-table-component"><div class="card-body border-bottom"><div class="d-flex flex-wrap justify-content-between align-items-start gap-3"><div>${options.eyebrow ? `<div class="text-secondary small">${escape(options.eyebrow)}</div>` : ""}<h1 class="h3 mb-1">${escape(heading)}</h1>${options.description ? `<p class="text-secondary mb-0">${escape(options.description)}</p>` : ""}</div>${options.headerActions || ""}</div><div class="d-flex flex-wrap justify-content-between gap-2 mt-3"><div class="input-group" style="max-width:520px"><span class="input-group-text">Buscar</span><input type="search" class="form-control" data-product-table-search placeholder="Buscar en todos los atributos" aria-label="Buscar en todos los atributos"><button type="button" class="btn btn-outline-secondary" data-product-table-clear>Limpiar</button></div><div class="dropdown"><button type="button" class="btn btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">Atributos</button><div class="dropdown-menu dropdown-menu-end columns-menu" data-product-table-columns></div></div></div></div><div class="table-responsive product-table-wrap"><table class="table table-sm table-hover align-middle productos product-grid products-table mb-0"><colgroup></colgroup><thead></thead><tbody></tbody></table></div><div class="card-footer d-flex flex-wrap justify-content-between align-items-center gap-2"><span class="text-secondary small" data-product-table-status></span><nav aria-label="Paginación de productos"><ul class="pagination pagination-sm product-pagination mb-0" data-product-table-pagination></ul></nav></div></section>`; }
  function badge(status) { return status === "Activo" ? "text-bg-success" : status === "Pendiente" || status === "Borrador" ? "text-bg-warning" : "text-bg-secondary"; }
  function sortIcon(key) { return `<svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="m8 11 4-5H4z"/></svg>`; }
  function iconMarkup(name) { if (name.includes(".")) return `<img class="action-image" src="${escapeAttr(name)}" alt="">`; const paths = { eye: "M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z", files: "M13 0a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-1v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1V2a2 2 0 0 1 2-2z", "pencil-square": "M15.502 1.94a.5.5 0 0 1 0 .706l-1.793 1.793-2.647-2.647L12.855.5a.5.5 0 0 1 .707 0zM1 13.5V16h2.5l7.372-7.372-2.647-2.647z", "clock-history": "M8.515 3.879a.5.5 0 0 0-1 0v4.182l3.182 1.909a.5.5 0 1 0 .516-.857L8.515 7.494zM8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .91-.414A6 6 0 1 1 8 2z", image: "M.5 1A1.5 1.5 0 0 0-1 2.5v11A1.5 1.5 0 0 0 .5 15h15a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 15.5 1zm0 1h15a.5.5 0 0 1 .5.5v6.248l-3.37-3.37a1 1 0 0 0-1.415 0L6.5 10.293 4.354 8.146a.5.5 0 0 0-.708 0L0 11.793V2.5A.5.5 0 0 1 .5 2" }; return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="${paths[name] || ""}"/></svg>`; }
  function getRecords(mode) { if (!window.GS1ProductCatalog) return []; return mode === "dispatchUnits" ? window.GS1ProductCatalog.getDispatchUnits().map((record) => ({ ...record, type: "GTIN-14", status: record.status || "Activo" })) : window.GS1ProductCatalog.getCommercialProducts(); }
  function validVisible(value, columns) { const available = columns.map((column) => column.key); const selected = Array.isArray(value) ? value.filter((key, index) => available.includes(key) && value.indexOf(key) === index) : available; return selected.length ? available.filter((key) => selected.includes(key)) : available; }
  function read(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* persistence is optional */ } }
  function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function escape(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
  function escapeAttr(value) { return escape(value).replaceAll("'", "&#39;"); }
  function refreshTooltips(root) { if (!window.bootstrap?.Tooltip) return; root.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => bootstrap.Tooltip.getOrCreateInstance(element)); }
  window.GS1ProductTable = { mount };
})();
