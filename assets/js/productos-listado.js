(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const mount = document.getElementById("catalogListMount");
    if (!mount || !window.GS1ProductTable) return;
    const mode = mount.dataset.listMode === "dispatchUnits" ? "dispatchUnits" : "products";
    const isDispatchList = mode === "dispatchUnits";
    ensureLogsModal();
    const downloadLabel = isDispatchList ? "Descargar unidades de despacho a Excel" : "Descargar Productos a Excel";
    window.GS1ProductTable.mount({
      mount,
      mode,
      persistenceKey: `gs1.products.columnVisibility.list.${mode}.v4`,
      eyebrow: "Catálogo GS1",
      heading: mode === "products" ? "Productos comerciales" : "Unidades de despacho DUN 14",
      description: "Consultá y administrá los registros desde un listado responsive.",
      headerActions: `<div class="d-flex flex-wrap gap-2"><button type="button" class="btn btn-outline-primary" id="downloadProductsListBtn">${downloadLabel}</button><a class="btn btn-outline-primary" href="${isDispatchList ? "productos.html?mode=dispatchUnits" : "productos.html"}">Vista resumida</a><a class="btn btn-primary" href="${isDispatchList ? "producto-nuevo-dun14.html" : "producto-nuevo.html"}">${isDispatchList ? "Generar DUN 14" : "Nuevo producto"}</a></div>`,
      onAction(action, record) {
        if (action === "detail") window.location.href = `producto-ficha.html?id=${encodeURIComponent(record.id)}`;
        if (action === "copy") window.location.href = record.mode === "dispatchUnits" ? `producto-alta-dun14.html?mode=copy&id=${encodeURIComponent(record.id)}` : `producto-nuevo.html?mode=copy&id=${encodeURIComponent(record.id)}`;
        if (action === "edit") window.location.href = getEditUrl(record);
        if (action === "logs") showLogsModal(record);
        if (action === "image") window.location.href = `producto-ficha.html?id=${encodeURIComponent(record.id)}#imagen`;
        if (action === "digital-link") window.location.href = `qr-digital-link.html?id=${encodeURIComponent(record.id)}`;
        if (action === "symbol") window.location.href = `generador-simbologia.html?id=${encodeURIComponent(record.id)}`;
      },
    });
    const downloadButton = document.getElementById("downloadProductsListBtn");
    downloadButton?.addEventListener("click", () => {
      const count = isDispatchList
        ? window.GS1ProductCatalog.getDispatchUnits().length
        : window.GS1ProductCatalog.getCommercialProducts().length;
      const label = isDispatchList ? "unidades de despacho" : "productos";
      window.GS1Utils.showSimulationToast(`Descarga preparada para ${count} ${label}.`, "success");
    });
  });

  function ensureLogsModal() {
    if (document.getElementById("logsModal")) return;
    document.body.insertAdjacentHTML("beforeend", `<div class="modal fade" id="logsModal" tabindex="-1" aria-labelledby="logsModalLabel" aria-hidden="true"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h2 class="modal-title fs-5" id="logsModalLabel">Historial del producto</h2><button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body"><div id="logsTimeline" class="notification-list"></div></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button></div></div></div></div>`);
  }

  function showLogsModal(record) {
    const entries = Array.isArray(record.logs) ? record.logs : [];
    document.getElementById("logsModalLabel").textContent = record.mode === "dispatchUnits"
      ? `Logs de la unidad de despacho: DUN 14 ${record.code}`
      : `Logs del producto: GTIN ${record.code}`;
    document.getElementById("logsTimeline").innerHTML = entries.length ? entries.map((entry) => `
      <div class="notification-card"><div class="fw-semibold">${escapeHtml(entry.title)}</div><div class="small text-secondary">${escapeHtml(entry.detail)}</div><div class="small text-secondary mt-2">${escapeHtml(entry.date)} ${escapeHtml(entry.time)} | ${escapeHtml(entry.actor)}</div></div>
    `).join("") : `<div class="notification-card text-center"><div class="fw-semibold mb-1">No hay eventos registrados</div><div class="small text-secondary">Este registro todavÃ­a no tiene logs disponibles en la simulaciÃ³n.</div></div>`;
    bootstrap.Modal.getOrCreateInstance(document.getElementById("logsModal")).show();
  }

  function escapeHtml(value) {
    return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  }

  function getEditUrl(record) {
    if (record.mode === "dispatchUnits") return `producto-editar-dun14.html?id=${encodeURIComponent(record.id)}`;
    if (record.status === "Activo") return `producto-editar.html?id=${encodeURIComponent(record.id)}`;
    if (record.graceStatus === "exception-open") return `producto-solicitud-modificacion.html?id=${encodeURIComponent(record.id)}&view=open`;
    if (record.graceStatus === "exception-required") return `producto-solicitud-modificacion.html?id=${encodeURIComponent(record.id)}&view=new`;
    return `producto-editar.html?id=${encodeURIComponent(record.id)}`;
  }
})();
