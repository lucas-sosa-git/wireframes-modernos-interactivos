(function () {
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const mount = document.getElementById("dispatchNewMount");
    if (!mount || !window.GS1ProductTable || !window.GS1ProductCatalog) return;
    mount.innerHTML = `<section class="card shadow-sm mb-4"><div class="card-body"><div class="d-flex flex-wrap justify-content-between gap-2"><div><div class="text-secondary small">Selecci&oacute;n inicial</div><h1 class="h3">Seleccionar producto contenido</h1><p class="text-secondary mb-0">Primero seleccion&aacute; el producto comercial que quedar&aacute; contenido en la unidad de despacho.</p></div></div></div></section><div id="dispatchProductTable"></div>${detailModal()}`;
    const outerCard = mount.querySelector("section");
    const tableMount = mount.querySelector("#dispatchProductTable");
    outerCard?.classList.add("dispatch-new-card");
    if (outerCard && tableMount) outerCard.appendChild(tableMount);

    const headerRow = mount.querySelector("section .card-body > .d-flex");
    const headerCopy = headerRow?.firstElementChild;
    headerRow?.classList.add("dispatch-new-card__header");
    headerCopy?.classList.add("dispatch-new-card__copy");
    const headerTitle = headerRow?.querySelector("h1");
    if (headerTitle) headerTitle.textContent = "Alta de unidad de despacho";
    if (headerRow) {
      const helpGroup = document.createElement("div");
      helpGroup.className = "btn-group align-self-start";
      helpGroup.setAttribute("role", "group");
      helpGroup.setAttribute("aria-label", "Material de ayuda para el alta de unidad de despacho");
      helpGroup.innerHTML = `<a class="btn btn-outline-primary" href="../assets/archivos/Instructivo_ABM.pdf" download>Descargar instructivo Alta de unidad de despacho</a><button type="button" class="btn btn-outline-primary">Video de ayuda Alta de unidad de despacho</button>`;
      const headerActions = document.createElement("div");
      headerActions.className = "dispatch-new-card__actions d-flex flex-column align-items-end gap-2";
      headerActions.appendChild(helpGroup);
      headerRow.appendChild(headerActions);
    }
    window.GS1ProductTable.mount({
      mount: tableMount,
      mode: "products",
      actions: "dun14-selection",
      persistenceKey: "gs1.products.columnVisibility.dun14Selection.v2",
      eyebrow: "Selecci&oacute;n inicial",
      heading: "Productos comerciales",
      description: "Buscá por GTIN, producto, marca, variedad, origen, estado o fechas.",
      onAction(action, record, trigger) {
        if (action === "create-dun14") {
          const url = new URL("producto-alta-unidad-de-despacho.html", document.baseURI);
          url.searchParams.set("id", record.id);
          window.location.assign(url.href);
          return;
        }
        if (action === "detail" || action === "image") showDetail(record, trigger);
      },
    });
    const tableCard = tableMount?.querySelector(".product-table-component");
    tableCard?.classList.add("dispatch-new-card__table");
    const tableHeader = tableCard?.querySelector(":scope > .card-body.border-bottom");
    const tableIntro = tableHeader?.querySelector(":scope > .d-flex.align-items-start");
    const tableTools = tableHeader?.querySelector(":scope > .d-flex.mt-3");
    tableIntro?.remove();
    tableTools?.classList.remove("mt-3");
    tableHeader?.classList.add("dispatch-new-card__table-tools");
  }

  function showDetail(record, trigger) {
    const image = window.GS1ProductCatalog.resolveImagePath(record.image);
    const typeLabel = window.GS1ProductCatalog.formatProductType
      ? window.GS1ProductCatalog.formatProductType(record.type)
      : record.type;
    document.getElementById("containedDetailBody").innerHTML = `<div class="row g-3"><div class="col-md-4">${image ? `<img class="img-fluid rounded" src="${escapeHtml(image)}" alt="${escapeHtml(record.name)}">` : "Sin imagen"}</div><div class="col-md-8"><h3 class="h5">${escapeHtml(record.name)}</h3><dl><dt>GTIN</dt><dd>${escapeHtml(record.code)}</dd><dt>Tipo de código</dt><dd>${escapeHtml(typeLabel)}</dd><dt>Verify GS1</dt><dd>${verifyGs1Markup(record.gs1Verify)}</dd><dt>Marca</dt><dd>${escapeHtml(record.brand)}</dd><dt>Descripción</dt><dd>${escapeHtml(record.shortDescription)}</dd></dl></div></div>`;
    const modalElement = document.getElementById("containedDetailModal");
    bootstrap.Modal.getOrCreateInstance(modalElement).show();
    modalElement.addEventListener("hidden.bs.modal", () => trigger?.focus(), { once: true });
  }

  function detailModal() { return `<div class="modal fade" id="containedDetailModal" tabindex="-1"><div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-header"><h2 class="modal-title h5">Detalle del producto contenido</h2><button class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button></div><div class="modal-body" id="containedDetailBody"></div><div class="modal-footer"><button class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button></div></div></div></div>`; }
  function verifyGs1Markup(value) {
    const isValid = Boolean(value);
    const label = isValid ? "Sí" : "No";
    const path = isValid
      ? "M13.854 3.646a.5.5 0 0 0-.708 0L6.5 10.293 2.854 6.646a.5.5 0 1 0-.708.708l4 4a.5.5 0 0 0 .708 0l7-7a.5.5 0 0 0 0-.708"
      : "M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z";
    return `<span class="data-quality-indicator ${isValid ? "text-success" : "text-danger"}" role="img" aria-label="Verify GS1: ${label}" title="Verify GS1: ${label}"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="${path}"/></svg></span>`;
  }
  function escapeHtml(value) { return window.GS1Utils.escapeHtml(String(value || "")); }
})();
