(function () {
  let selected = null;
  document.addEventListener("DOMContentLoaded", init);
  function init() {
    const id = new URLSearchParams(location.search).get("id");
    const candidate = id ? window.GS1ProductCatalog.getById(id) : null;
    selected = candidate && candidate.mode === "products" ? candidate : candidate && candidate.mode === "dispatchUnits"
      ? window.GS1ProductCatalog.getCommercialProducts().find((product) => product.code === candidate.containedGtin) || null
      : null;
    render();
  }
  function render() {
    const mount = document.getElementById("dispatchNewMount");
    const products = window.GS1ProductCatalog.getCommercialProducts();
    mount.innerHTML = `<section class="card shadow-sm"><div class="card-body"><div class="d-flex flex-wrap justify-content-between gap-2"><div><div class="text-secondary small">Paso 1 de 2</div><h1 class="h3">Seleccionar producto contenido</h1><p class="text-secondary">Todo DUN-14 se genera a partir de un producto comercial existente.</p></div><a class="btn btn-outline-secondary align-self-start" href="productos-listado-dun14.html">Volver al listado</a></div>
      <div class="input-group mb-3"><span class="input-group-text">Producto</span><select class="form-select" id="containedProduct"><option value="">Elegí un producto…</option>${products.map((p) => `<option value="${p.id}" ${selected && p.id === selected.id ? "selected" : ""}>${p.code} — ${escapeHtml(p.name)}</option>`).join("")}</select><button class="btn btn-outline-primary" id="viewContainedDetail" type="button" ${selected ? "" : "disabled"}>Ver detalle</button></div>
      <div id="dispatchFormHost">${selected ? formHtml(selected) : '<div class="alert alert-info mb-0">Seleccioná y confirmá el producto que quedará contenido.</div>'}</div></div></section>
      <div class="modal fade" id="containedDetailModal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h2 class="modal-title h5">Detalle del producto contenido</h2><button class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body" id="containedDetailBody"></div><div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button><button class="btn btn-primary" id="confirmContainedProduct" data-bs-dismiss="modal">Generar nuevo DUN-14</button></div></div></div></div>`;
    bind();
  }
  function formHtml(p) { return `<hr><div class="text-secondary small">Paso 2 de 2</div><h2 class="h4">Datos de la unidad de despacho</h2><div class="alert alert-light border"><strong>${escapeHtml(p.name)}</strong><span class="d-block small text-secondary">GTIN contenido: ${p.code}</span></div><form class="row g-3" id="dispatchNewForm"><div class="col-md-6"><label class="form-label">Unidad contenida <span class="text-danger">*</span></label><input class="form-control" name="units" type="number" min="1" required></div><div class="col-md-6"><label class="form-label">Tipo de envase <span class="text-danger">*</span></label><input class="form-control" name="packaging" required></div><div class="col-md-6"><label class="form-label">Cantidad <span class="text-danger">*</span></label><input class="form-control" name="quantity" type="number" min="1" required></div><div class="col-md-6"><label class="form-label">Indicador logístico <span class="text-danger">*</span></label><select class="form-select" name="indicator" required><option value="">Elegir…</option>${[1,2,3,4,5,6,7,8].map((i) => `<option>${i}</option>`).join("")}</select></div><div class="col-12"><div class="small text-secondary">// TODO: pendiente de definición (Lucas): atributos adicionales del Excel DUN-14.</div></div><div class="col-12 d-none" id="dispatchResult"></div><div class="col-12 d-flex gap-2"><button class="btn btn-primary" type="submit">Generar GTIN-14</button><button class="btn btn-outline-success d-none" id="confirmDispatch" type="button">Confirmar alta</button></div></form>`; }
  function bind() {
    const select = document.getElementById("containedProduct");
    select.addEventListener("change", () => { selected = select.value ? window.GS1ProductCatalog.getById(select.value) : null; render(); });
    document.getElementById("viewContainedDetail").addEventListener("click", () => { if (!selected) return; document.getElementById("containedDetailBody").innerHTML = `<div class="row g-3"><div class="col-md-4">${selected.image ? `<img class="img-fluid rounded" src="${selected.image}" alt="${escapeHtml(selected.name)}">` : "Sin imagen"}</div><div class="col-md-8"><h3 class="h5">${escapeHtml(selected.name)}</h3><dl><dt>GTIN</dt><dd>${selected.code}</dd><dt>Marca</dt><dd>${escapeHtml(selected.brand)}</dd><dt>Descripción</dt><dd>${escapeHtml(selected.shortDescription)}</dd></dl></div></div>`; bootstrap.Modal.getOrCreateInstance(document.getElementById("containedDetailModal")).show(); });
    document.getElementById("confirmContainedProduct").addEventListener("click", () => document.getElementById("dispatchNewForm")?.scrollIntoView({ behavior: "smooth" }));
    const form = document.getElementById("dispatchNewForm"); if (!form) return;
    let generated = "";
    form.addEventListener("submit", (event) => { event.preventDefault(); if (!form.reportValidity()) return; const containedBody = selected.code.padStart(13, "0").slice(0, 12); const body = `${form.elements.indicator.value}${containedBody}`; generated = `${body}${window.GS1Utils.computeCheckDigit(body)}`; const result = document.getElementById("dispatchResult"); result.className = "col-12 alert alert-success"; result.innerHTML = `GTIN-14 generado: <strong>${generated}</strong>`; document.getElementById("confirmDispatch").classList.remove("d-none"); });
    document.getElementById("confirmDispatch").addEventListener("click", () => { window.GS1Utils.showSimulationToast(`Alta DUN-14 ${generated} confirmada.`, "success"); document.getElementById("confirmDispatch").disabled = true; });
  }
  function escapeHtml(value) { return window.GS1Utils.escapeHtml(String(value || "")); }
})();
