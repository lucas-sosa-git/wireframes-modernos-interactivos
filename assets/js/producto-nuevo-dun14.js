(function () {
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const mount = document.getElementById("dispatchNewMount");
    if (!mount || !window.GS1ProductTable || !window.GS1ProductCatalog) return;
    mount.innerHTML = `<section class="card shadow-sm mb-4"><div class="card-body"><div class="d-flex flex-wrap justify-content-between gap-2"><div><div class="text-secondary small">Paso 1 de 2</div><h1 class="h3">Seleccionar producto contenido</h1><p class="text-secondary mb-0">Primero seleccioná el producto comercial que quedará contenido en la unidad de despacho.</p></div><a class="btn btn-outline-secondary align-self-start" href="productos-listado-dun14.html">Volver al listado</a></div></div></section><div id="dispatchProductTable"></div>${detailModal()}`;
    window.GS1ProductTable.mount({
      mount: document.getElementById("dispatchProductTable"),
      mode: "products",
      actions: "dun14-selection",
      persistenceKey: "gs1.products.columnVisibility.dun14Selection.v2",
      eyebrow: "Paso 1 de 2",
      heading: "Productos comerciales",
      description: "Buscá por GTIN, producto, marca, variedad, origen, estado o fechas.",
      onAction(action, record, trigger) {
        if (action === "create-dun14") {
          const url = new URL("producto-alta-dun14.html", document.baseURI);
          url.searchParams.set("id", record.id);
          window.location.assign(url.href);
          return;
        }
        if (action === "detail" || action === "image") showDetail(record, trigger);
      },
    });
  }

  function showDetail(record, trigger) {
    const image = window.GS1ProductCatalog.resolveImagePath(record.image);
    document.getElementById("containedDetailBody").innerHTML = `<div class="row g-3"><div class="col-md-4">${image ? `<img class="img-fluid rounded" src="${escapeHtml(image)}" alt="${escapeHtml(record.name)}">` : "Sin imagen"}</div><div class="col-md-8"><h3 class="h5">${escapeHtml(record.name)}</h3><dl><dt>GTIN</dt><dd>${escapeHtml(record.code)}</dd><dt>Tipo de código</dt><dd>${escapeHtml(record.type)}</dd><dt>Marca</dt><dd>${escapeHtml(record.brand)}</dd><dt>Descripción</dt><dd>${escapeHtml(record.shortDescription)}</dd></dl></div></div>`;
    const modalElement = document.getElementById("containedDetailModal");
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
    modalElement.addEventListener("hidden.bs.modal", () => trigger?.focus(), { once: true });
  }

  function detailModal() { return `<div class="modal fade" id="containedDetailModal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h2 class="modal-title h5">Detalle del producto contenido</h2><button class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body" id="containedDetailBody"></div><div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button></div></div></div></div>`; }
  function escapeHtml(value) { return window.GS1Utils.escapeHtml(String(value || "")); }
})();
