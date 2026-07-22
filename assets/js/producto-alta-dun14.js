(function () {
  let product = null;
  let generated = "";
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const id = new URLSearchParams(location.search).get("id");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;
    product = record && record.mode === "products" ? record : null;
    const mount = document.getElementById("dispatchAltaMount");
    if (!product) {
      mount.innerHTML = '<div class="alert alert-warning"><h1 class="h4">No se encontró el producto comercial seleccionado.</h1><p>Elegí un producto comercial antes de completar el alta.</p><a class="btn btn-primary" href="producto-nuevo-dun14.html">Volver a seleccionar producto</a></div>';
      return;
    }
    const image = window.GS1ProductCatalog.resolveImagePath(product.image);
    mount.innerHTML = `<section class="card shadow-sm"><div class="card-body"><div class="d-flex flex-wrap justify-content-between align-items-start gap-3"><div><div class="text-secondary small">Paso 2 de 2</div><h1 class="h3">Alta de unidad de despacho</h1><p class="text-secondary">Completá los datos de la unidad para generar su GTIN-14.</p></div><a class="btn btn-outline-secondary" href="producto-nuevo-dun14.html">Cambiar producto contenido</a></div><div class="alert alert-light border d-flex flex-wrap align-items-center gap-3 mt-4"><div class="product-thumbnail">${image ? `<img class="product-thumb-image product-alta-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async">` : '<span class="product-thumb-placeholder"><span>Sin imagen</span></span>'}</div><div><h2 class="h5 mb-1">${escapeHtml(product.name)}</h2><div class="small text-secondary">GTIN contenido: ${escapeHtml(product.code)} · ${escapeHtml(product.type)} · Marca: ${escapeHtml(product.brand)}</div><div class="small mt-1">${escapeHtml(product.shortDescription)}</div></div></div>${formHtml()}</div></section>`;
    bindForm();
    const imageEl = mount.querySelector(".product-alta-image");
    imageEl?.addEventListener("error", () => {
      const host = imageEl.closest(".product-thumbnail");
      if (host) host.innerHTML = '<span class="product-thumb-placeholder"><span>Sin imagen</span></span>';
    }, { once: true });
  }

  function formHtml() { return `<h2 class="h4 mt-4">Datos de la unidad de despacho</h2><form class="row g-3" id="dispatchAltaForm"><div class="col-md-6"><label class="form-label" for="dispatchUnits">Unidad contenida <span class="text-danger">*</span></label><input class="form-control" id="dispatchUnits" name="units" type="number" min="1" required></div><div class="col-md-6"><label class="form-label" for="dispatchPackaging">Tipo de envase <span class="text-danger">*</span></label><input class="form-control" id="dispatchPackaging" name="packaging" required></div><div class="col-md-6"><label class="form-label" for="dispatchQuantity">Cantidad <span class="text-danger">*</span></label><input class="form-control" id="dispatchQuantity" name="quantity" type="number" min="1" required></div><div class="col-md-6"><label class="form-label" for="dispatchIndicator">Indicador logístico <span class="text-danger">*</span></label><select class="form-select" id="dispatchIndicator" name="indicator" required><option value="">Elegir…</option>${[1,2,3,4,5,6,7,8].map((value) => `<option value="${value}">${value}</option>`).join("")}</select></div><div class="col-12 d-none" id="dispatchAltaResult"></div><div class="col-12 d-flex flex-wrap gap-2"><button class="btn btn-primary" type="submit">Generar GTIN-14</button><button class="btn btn-outline-success d-none" id="confirmDispatch" type="button">Confirmar alta</button></div></form>`; }

  function bindForm() {
    const form = document.getElementById("dispatchAltaForm");
    form.addEventListener("submit", (event) => { event.preventDefault(); if (!form.reportValidity()) return; const body = `${String(form.elements.indicator.value)}${String(product.code).padStart(13, "0").slice(0, 12)}`; generated = `${body}${window.GS1Utils.computeCheckDigit(body)}`; const result = document.getElementById("dispatchAltaResult"); result.className = "col-12 alert alert-success"; result.innerHTML = `GTIN-14 generado: <strong>${generated}</strong>`; document.getElementById("confirmDispatch").classList.remove("d-none"); });
    document.getElementById("confirmDispatch").addEventListener("click", () => { if (!generated) return; const values = form.elements; const payload = { mode: "dispatchUnits", code: generated, name: `Unidad de despacho de ${product.name}`, containedGtin: String(product.code), unitsContained: String(values.units.value), packaging: String(values.packaging.value), brand: product.brand, image: product.image, shortDescription: `${values.units.value} unidades de ${product.name} en ${values.packaging.value}` }; const token = window.GS1Utils.saveQrHandoff(payload); const result = document.getElementById("dispatchAltaResult"); window.GS1Utils.showSimulationToast(`Alta DUN-14 ${generated} confirmada.`, "success"); result.className = "col-12 alert alert-success"; result.innerHTML = `<h2 class="h5">Unidad de despacho creada</h2><p>GTIN-14: <strong>${generated}</strong></p><a class="btn btn-primary ${token ? "" : "disabled"}" ${token ? `href="qr-digital-link.html?handoff=${encodeURIComponent(token)}"` : 'aria-disabled="true"'}>Imprimí tu QR</a> <a class="btn btn-outline-secondary" href="productos-listado-dun14.html">Volver al listado de DUN-14</a>`; document.getElementById("confirmDispatch").disabled = true; });
  }
  function escapeHtml(value) { return window.GS1Utils.escapeHtml(String(value || "")); }
})();
