(function () {
  let product = null;
  let state = null;
  let pendingImages = [];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const id = new URLSearchParams(location.search).get("id");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;
    product = record && record.mode === "products" ? record : null;
    const mount = document.getElementById("dispatchAltaMount");
    if (!mount) return;
    if (!product) {
      mount.innerHTML = '<div class="alert alert-warning"><h1 class="h4">No se encontr&oacute; el producto comercial seleccionado.</h1><p>Eleg&iacute; un producto comercial antes de completar el alta.</p><a class="btn btn-primary" href="producto-nuevo-dun14.html">Volver a seleccionar producto</a></div>';
      return;
    }

    state = {
      logisticVariable: "",
      code: "",
      units: "",
      packaging: "",
      finalDescription: "",
      images: getProductImages(product),
      galleryIndex: 0,
    };
    pendingImages = [];
    renderAlta();
    bindAlta();
    updateDerivedFields();
  }

  function getProductImages(record) {
    const candidates = [
      ...(Array.isArray(record.imageGallery) ? record.imageGallery : []),
      record.image,
    ].map((path) => window.GS1ProductCatalog.resolveImagePath(path)).filter(Boolean);
    return [...new Set(candidates)];
  }

  function renderAlta() {
    const mount = document.getElementById("dispatchAltaMount");
    const containedType = window.GS1ProductCatalog.formatProductType
      ? window.GS1ProductCatalog.formatProductType(product.type)
      : product.type;

    mount.innerHTML = `
      <section class="card shadow-sm">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
            <div>
              <div class="text-secondary small">Alta de GTIN 14</div>
              <h1 class="h3 mb-1">Alta de unidad de despacho</h1>
              <p class="text-secondary mb-0">Complet&aacute; los datos de la unidad de despacho y confirm&aacute; el alta.</p>
            </div>
            <a class="btn btn-outline-secondary" href="producto-nuevo-dun14.html">Cambiar producto contenido</a>
          </div>
          <form id="dispatchAltaForm" novalidate>
            <div class="row g-4 align-items-start">
              <div class="col-lg-6">
                <div class="dispatch-alta-fields border rounded p-3">
                  <div class="mb-3">
                    <label class="form-label" for="dispatchLogisticVariable">Variable log&iacute;stica</label>
                    <select class="form-select" id="dispatchLogisticVariable" name="logisticVariable" required>
                      <option value="">Elegir&hellip;</option>
                      ${Array.from({ length: 10 }, (_, value) => `<option value="${value}">${value}</option>`).join("")}
                    </select>
                  </div>
                  <div class="mb-3">
                    <label class="form-label" for="dispatchContainedGtin">GTIN Contenido</label>
                    <input class="form-control" id="dispatchContainedGtin" value="${escapeHtml(product.code)}" readonly>
                  </div>
                  <div class="mb-3">
                    <label class="form-label" for="dispatchContainedDescription">Descripci&oacute;n GTIN Contenido</label>
                    <input class="form-control" id="dispatchContainedDescription" value="${escapeHtml(product.name)}" readonly>
                  </div>
                  <div class="mb-3">
                    <label class="form-label" for="dispatchCode">GTIN 14</label>
                    <input class="form-control" id="dispatchCode" value="" readonly aria-describedby="dispatchCodeHelp">
                    <div class="form-text" id="dispatchCodeHelp">Se calcula con la variable log&iacute;stica y el GTIN contenido.</div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label" for="dispatchUnits">Unidades Contenidas</label>
                    <input class="form-control" id="dispatchUnits" name="units" type="number" min="1" step="1" required>
                  </div>
                  <div class="mb-3">
                    <label class="form-label" for="dispatchFinalDescription">Descripci&oacute;n GTIN 14</label>
                    <input class="form-control" id="dispatchFinalDescription" value="" readonly aria-describedby="dispatchDescriptionHelp">
                    <div class="form-text" id="dispatchDescriptionHelp">Se concatena autom&aacute;ticamente con las unidades y el envase agrupador.</div>
                  </div>
                  <div>
                    <label class="form-label" for="dispatchPackaging">Envase Agrupador</label>
                    <input class="form-control" id="dispatchPackaging" name="packaging" required>
                  </div>
                </div>
              </div>
              <div class="col-lg-6">
                <div class="dispatch-image-panel border rounded p-3">
                  <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div>
                      <div class="fw-semibold">Im&aacute;genes del alta</div>
                      <div class="small text-secondary">Pod&eacute;s importar m&aacute;s de una imagen.</div>
                    </div>
                    <button class="btn btn-primary btn-sm" type="button" data-dispatch-import-image>Importar Imagen</button>
                  </div>
                  <div data-dispatch-gallery>${renderGallery()}</div>
                </div>
              </div>
            </div>
            <div class="d-flex justify-content-start mt-4">
              <button class="btn btn-primary px-4" type="submit">Confirmar Alta DUN 14</button>
            </div>
          </form>
          ${imageImportModal()}
        </div>
      </section>`;
  }

  function imageImportModal() {
    return `<div class="modal fade" id="dispatchImageModal" tabindex="-1" aria-labelledby="dispatchImageModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h5" id="dispatchImageModalLabel">Importar im&aacute;genes</h2>
            <button class="btn-close" type="button" data-bs-dismiss="modal" aria-label="Cerrar"></button>
          </div>
          <div class="modal-body">
            <label class="form-label" for="dispatchImageInput">Seleccion&aacute; una o m&aacute;s im&aacute;genes</label>
            <input class="form-control" id="dispatchImageInput" type="file" accept="image/*" multiple>
            <div class="small text-secondary mt-2">Las im&aacute;genes seleccionadas se incorporan a la galer&iacute;a del alta.</div>
            <div class="row g-2 mt-3" data-dispatch-image-preview></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline-secondary" type="button" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" type="button" data-dispatch-add-images disabled>Agregar im&aacute;genes</button>
          </div>
        </div>
      </div>
    </div>`;
  }

  function bindAlta() {
    const mount = document.getElementById("dispatchAltaMount");
    const form = document.getElementById("dispatchAltaForm");
    form.addEventListener("input", () => {
      collectFormState(form);
      updateDerivedFields();
    });
    form.addEventListener("change", () => {
      collectFormState(form);
      updateDerivedFields();
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      collectFormState(form);
      updateDerivedFields();
      if (!form.reportValidity()) return;
      confirmAlta();
    });
    mount.querySelector("[data-dispatch-import-image]")?.addEventListener("click", () => {
      bootstrap.Modal.getOrCreateInstance(document.getElementById("dispatchImageModal")).show();
    });
    bindGallery(mount);
    bindImageImport(mount);
  }

  function collectFormState(form) {
    state.logisticVariable = String(form.elements.logisticVariable?.value || "");
    state.units = String(form.elements.units?.value || "").trim();
    state.packaging = String(form.elements.packaging?.value || "").trim();
  }

  function updateDerivedFields() {
    state.code = state.logisticVariable ? calculateCode() : "";
    state.finalDescription = composeDescription();
    const codeInput = document.getElementById("dispatchCode");
    const descriptionInput = document.getElementById("dispatchFinalDescription");
    if (codeInput) codeInput.value = state.code;
    if (descriptionInput) descriptionInput.value = state.finalDescription;
  }

  function calculateCode() {
    const body = `${String(state.logisticVariable)}${String(product.code).padStart(13, "0").slice(0, 12)}`;
    return `${body}${window.GS1Utils.computeCheckDigit(body)}`;
  }

  function composeDescription() {
    if (!state.units) return "";
    return `${product.name}${state.packaging ? ` ${state.packaging}` : ""} x ${state.units} unidades`;
  }

  function bindGallery(mount) {
    const gallery = mount.querySelector("[data-dispatch-gallery]");
    if (!gallery) return;
    gallery.addEventListener("click", (event) => {
      const control = event.target.closest("[data-dispatch-gallery-prev], [data-dispatch-gallery-next], [data-dispatch-gallery-thumb]");
      if (!control || !state.images.length) return;
      if (control.hasAttribute("data-dispatch-gallery-prev")) state.galleryIndex -= 1;
      if (control.hasAttribute("data-dispatch-gallery-next")) state.galleryIndex += 1;
      if (control.hasAttribute("data-dispatch-gallery-thumb")) state.galleryIndex = Number(control.dataset.dispatchGalleryThumb);
      state.galleryIndex = (state.galleryIndex + state.images.length) % state.images.length;
      gallery.innerHTML = renderGallery();
    });
  }

  function bindImageImport(mount) {
    const modal = document.getElementById("dispatchImageModal");
    const input = modal?.querySelector("#dispatchImageInput");
    const preview = modal?.querySelector("[data-dispatch-image-preview]");
    const addButton = modal?.querySelector("[data-dispatch-add-images]");
    if (!modal || !input || !preview || !addButton) return;
    input.addEventListener("change", async () => {
      pendingImages = await readImageFiles(input.files);
      preview.innerHTML = pendingImages.map((image) => `<div class="col-4"><img class="img-fluid rounded border" src="${escapeHtml(image.dataUrl)}" alt="${escapeHtml(image.name)}"></div>`).join("");
      addButton.disabled = pendingImages.length === 0;
    });
    addButton.addEventListener("click", () => {
      if (!pendingImages.length) return;
      state.images.push(...pendingImages.map((image) => image.dataUrl));
      state.galleryIndex = state.images.length - pendingImages.length;
      pendingImages = [];
      input.value = "";
      preview.innerHTML = "";
      addButton.disabled = true;
      mount.querySelector("[data-dispatch-gallery]").innerHTML = renderGallery();
      bootstrap.Modal.getOrCreateInstance(modal).hide();
    });
    modal.addEventListener("hidden.bs.modal", () => {
      pendingImages = [];
      input.value = "";
      preview.innerHTML = "";
      addButton.disabled = true;
    });
  }

  function readImageFiles(fileList) {
    return Promise.all(Array.from(fileList || [])
      .filter((file) => file.type.startsWith("image/"))
      .map((file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve({ name: file.name, dataUrl: String(reader.result || "") }));
        reader.addEventListener("error", () => resolve(null));
        reader.readAsDataURL(file);
      }))).then((images) => images.filter((image) => image?.dataUrl));
  }

  function renderGallery() {
    if (!state.images.length) return '<div class="product-image-placeholder dispatch-image-placeholder"><span>No hay im&aacute;genes cargadas</span></div>';
    const index = Math.min(Math.max(state.galleryIndex, 0), state.images.length - 1);
    state.galleryIndex = index;
    return `<div class="product-gallery dispatch-image-gallery">
      <div class="product-gallery__stage">
        ${state.images.length > 1 ? '<button class="product-gallery__control product-gallery__control--prev" type="button" data-dispatch-gallery-prev aria-label="Imagen anterior">&lsaquo;</button>' : ""}
        <img data-dispatch-gallery-main src="${escapeHtml(state.images[index])}" alt="Imagen ${index + 1} del alta" decoding="async">
        ${state.images.length > 1 ? '<button class="product-gallery__control product-gallery__control--next" type="button" data-dispatch-gallery-next aria-label="Imagen siguiente">&rsaquo;</button>' : ""}
      </div>
      ${state.images.length > 1 ? `<div class="product-gallery__thumbs" role="tablist">${state.images.map((image, imageIndex) => `<button class="product-gallery__thumb${imageIndex === index ? " is-active" : ""}" type="button" data-dispatch-gallery-thumb="${imageIndex}" aria-label="Ver imagen ${imageIndex + 1}"><img src="${escapeHtml(image)}" alt=""></button>`).join("")}</div>` : ""}
      <div class="small text-secondary text-center mt-2">Imagen ${index + 1} de ${state.images.length}</div>
    </div>`;
  }

  function confirmAlta() {
    const payload = {
      mode: "dispatchUnits",
      code: state.code,
      name: state.finalDescription,
      containedGtin: String(product.code),
      containedDescription: String(product.name),
      unitsContained: state.units,
      packaging: state.packaging,
      packagingLevel: state.logisticVariable,
      brand: product.brand,
      image: state.images[0] || product.image,
      imageGallery: [...state.images],
      shortDescription: state.finalDescription,
    };
    const token = window.GS1Utils.saveQrHandoff(payload);
    window.GS1Utils.showSimulationToast(`Alta DUN 14 ${state.code} confirmada.`, "success");
    renderAltaSuccess(payload, token);
  }

  function renderAltaSuccess(payload, token) {
    const mount = document.getElementById("dispatchAltaMount");
    if (!mount) return;
    const image = window.GS1ProductCatalog.resolveImagePath(payload.image);
    const qrAction = token
      ? `<a class="btn btn-primary" href="qr-digital-link.html?handoff=${encodeURIComponent(token)}">Imprim&iacute; tu QR</a>`
      : '<button class="btn btn-primary" type="button" disabled aria-disabled="true">Imprim&iacute; tu QR</button>';
    mount.innerHTML = `
      <section class="card shadow-sm product-detail-card">
        <div class="card-body">
          <div class="text-center border-bottom pb-3 mb-4">
            <div class="display-6 text-success" aria-hidden="true">&#10003;</div>
            <div class="text-secondary small">Alta de GTIN 14</div>
            <h1 class="h2 mb-2">&iexcl;Alta exitosa!</h1>
            <p class="text-secondary mb-0">El GTIN 14 fue creado con &eacute;xito.</p>
          </div>
          <div class="row g-4 align-items-start">
            <div class="col-lg-4">
              <div class="product-detail-media">
                ${image ? `<img src="${escapeHtml(image)}" alt="Imagen de ${escapeHtml(payload.name)}" class="img-fluid rounded border">` : '<div class="product-image-placeholder"><span>No hay imagen disponible</span></div>'}
              </div>
            </div>
            <div class="col-lg-8">
              <div class="mb-4">
                <div class="text-secondary small">DUN 14</div>
                <h2 class="h3 mb-2">${escapeHtml(payload.name)}</h2>
                <div class="d-flex flex-wrap gap-2 align-items-center">
                  <span class="badge text-bg-primary">${escapeHtml(payload.code)}</span>
                  <span class="badge text-bg-success">Nuevo</span>
                </div>
                <div class="product-detail-note mt-3">
                  <div class="text-secondary small mb-1">Descripci&oacute;n</div>
                  <div>${escapeHtml(payload.shortDescription || payload.name)}</div>
                </div>
              </div>
              <div class="row g-3">
                ${renderSuccessField("DUN 14", payload.code)}
                ${renderSuccessField("GTIN contenido", payload.containedGtin)}
                ${renderSuccessField("Unidades contenidas", payload.unitsContained)}
                ${renderSuccessField("Envase agrupador", payload.packaging)}
                ${renderSuccessField("Variable log&iacute;stica", payload.packagingLevel)}
                ${renderSuccessField("Marca", payload.brand)}
              </div>
              <div class="d-flex flex-wrap gap-2 mt-4">
                ${qrAction}
                <a class="btn btn-primary" href="generador-simbologia.html">Generar Simbolog&iacute;a</a>
                <a class="btn btn-primary" href="producto-nuevo-dun14.html">Dar de Alta Nuevo Producto</a>
                <a class="btn btn-primary" href="producto-nuevo-dun14.html">Copiar</a>
                <a class="btn btn-primary" href="productos-listado-dun14.html">Ver Listado DUN 14</a>
                <a class="btn btn-primary" href="producto-editar-dun14.html">Modificar este producto</a>
              </div>
            </div>
          </div>
        </div>
      </section>`;
  }

  function renderSuccessField(label, value) {
    return `<div class="col-md-6"><div class="product-detail-field"><div class="text-secondary small">${label}</div><div class="fw-semibold">${escapeHtml(value || "-")}</div></div></div>`;
  }

  function escapeHtml(value) { return window.GS1Utils.escapeHtml(String(value ?? "")); }
})();
