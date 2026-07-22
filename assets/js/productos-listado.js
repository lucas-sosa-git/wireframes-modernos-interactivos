(function () {
  document.addEventListener("DOMContentLoaded", initCatalogList);

  function initCatalogList() {
    const mount = document.getElementById("catalogListMount");
    if (!mount || !window.GS1ProductCatalog) return;
    const mode = mount.dataset.listMode;
    const isDispatch = mode === "dispatchUnits";
    const records = isDispatch
      ? window.GS1ProductCatalog.getDispatchUnits().map((record, index) => ({ ...record, status: index % 4 === 3 ? "Inactivo" : "Activo" }))
      : window.GS1ProductCatalog.getCommercialProducts();

    mount.innerHTML = `
      <section class="card shadow-sm overflow-hidden">
        <div class="card-body border-bottom">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div><div class="text-secondary small">Catálogo GS1</div><h1 class="h3 mb-1">${isDispatch ? "Unidades de despacho GTIN-14" : "Productos comerciales"}</h1><p class="text-secondary mb-0">Consultá y administrá los registros desde un listado responsive.</p></div>
            <div class="d-flex flex-wrap gap-2"><a class="btn btn-outline-primary" href="productos.html">Vista resumida</a><a class="btn btn-primary" href="${isDispatch ? "producto-nuevo-dun14.html" : "producto-nuevo.html"}">${isDispatch ? "Generar DUN-14" : "Nuevo producto"}</a></div>
          </div>
          <div class="row g-2 mt-3">
            <div class="col-12 col-lg-6"><div class="input-group"><span class="input-group-text">Buscar</span><input class="form-control" id="catalogSearch" placeholder="GTIN, producto, marca, estado…"><button class="btn btn-outline-secondary" id="clearCatalogSearch" type="button">Limpiar</button></div></div>
            <div class="col-12 col-sm-6 col-lg-3"><select class="form-select" id="catalogStatus"><option value="">Todos los estados</option>${(isDispatch ? ["Activo", "Inactivo"] : ["Activo", "Pendiente", "Borrador"]).map((status) => `<option>${status}</option>`).join("")}</select></div>
          </div>
        </div>
        <div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="table-light"><tr>${headers(isDispatch).map((label) => `<th>${label}</th>`).join("")}</tr></thead><tbody id="catalogListBody"></tbody></table></div>
        <div class="card-footer text-secondary small" id="catalogListCount"></div>
      </section>`;

    const search = document.getElementById("catalogSearch");
    const status = document.getElementById("catalogStatus");
    const render = () => {
      const term = normalize(search.value);
      const filtered = records.filter((record) => (!status.value || record.status === status.value) && (!term || Object.values(record).filter((value) => typeof value !== "object").some((value) => normalize(value).includes(term))));
      document.getElementById("catalogListBody").innerHTML = filtered.length ? filtered.map((record) => row(record, isDispatch)).join("") : `<tr><td colspan="${headers(isDispatch).length}" class="text-center text-secondary py-5">No hay resultados para los filtros elegidos.</td></tr>`;
      document.getElementById("catalogListCount").textContent = `${filtered.length} de ${records.length} registros`;
    };
    search.addEventListener("input", render);
    status.addEventListener("change", render);
    document.getElementById("clearCatalogSearch").addEventListener("click", () => { search.value = ""; render(); search.focus(); });
    render();
  }

  function headers(isDispatch) {
    return isDispatch
      ? ["GTIN-14", "GTIN contenido", "Producto", "Estado", "Unidad contenida", "Envase", "Fecha de modificación", "Fecha de alta", "Acciones"]
      : ["GTIN", "Producto", "Marca", "Tipo", "Estado", "Fecha de modificación", "Fecha de alta", "Acciones"];
  }

  function row(record, isDispatch) {
    const action = (label, href, icon) => `<a class="btn btn-sm btn-outline-secondary" href="${href}" title="${label}" aria-label="${label}">${icon}</a>`;
    const actions = [
      action("Copiar y editar", isDispatch ? `producto-nuevo-dun14.html?id=${record.id}&mode=copy` : `producto-nuevo.html?id=${record.id}&mode=copy`, "⧉"),
      action("Modificar", isDispatch ? `producto-editar-dun14.html?id=${record.id}` : `producto-editar.html?id=${record.id}`, "✎"),
      action("Ver detalle", `producto-ficha.html?id=${record.id}`, "◉"),
      action("Logs / historial", `productos.html?mode=${isDispatch ? "dispatchUnits" : "products"}&logs=${record.id}`, "☷"),
      action("Generar Datamatrix/QR", `qr-digital-link.html?id=${record.id}`, "▦"),
      action("Simbología", `generador-simbologia.html?id=${record.id}&gtin=${record.code}`, "▥"),
    ].join("");
    const badge = `<span class="badge ${record.status === "Activo" ? "text-bg-success" : record.status === "Inactivo" ? "text-bg-secondary" : record.status === "Borrador" ? "text-bg-warning" : "text-bg-info"}">${escapeHtml(record.status)}</span>`;
    if (isDispatch) return `<tr><td class="fw-semibold text-nowrap">${escapeHtml(record.code)}</td><td>${escapeHtml(record.containedGtin)}</td><td><div class="fw-semibold">${escapeHtml(record.containedDescription || record.name)}</div></td><td>${badge}</td><td>${escapeHtml(record.unitsContained)}</td><td>${escapeHtml(record.packaging)}</td><td class="text-nowrap">${formatDate(record.modifiedAt)}</td><td class="text-nowrap">${formatDate(record.createdAt)}</td><td><div class="d-flex flex-wrap gap-1">${actions}</div></td></tr>`;
    return `<tr><td class="fw-semibold text-nowrap">${escapeHtml(record.code)}</td><td>${escapeHtml(record.name)}</td><td>${escapeHtml(record.brand)}</td><td>${escapeHtml(record.type)}</td><td>${badge}</td><td class="text-nowrap">${formatDate(record.modifiedAt)}</td><td class="text-nowrap">${formatDate(record.createdAt)}</td><td><div class="d-flex flex-wrap gap-1">${actions}</div></td></tr>`;
  }

  function formatDate(value) { const parts = String(value || "").split("-"); return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : escapeHtml(value); }
  function normalize(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
  function escapeHtml(value) { return window.GS1Utils.escapeHtml(String(value == null ? "" : value)); }
})();
