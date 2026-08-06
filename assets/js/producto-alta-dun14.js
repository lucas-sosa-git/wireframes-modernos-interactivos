(function () {
  let product = null;
  let state = null;
  let pendingImages = [];
  let currentStep = 1;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const params = new URLSearchParams(location.search);
    const id = params.get("id");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;
    const copyRecord = params.get("mode") === "copy" && record?.mode === "dispatchUnits" ? record : null;
    product = copyRecord ? findContainedProduct(copyRecord.containedGtin) : record && record.mode === "products" ? record : null;
    const mount = document.getElementById("dispatchAltaMount");
    if (!mount) return;
    if (!product) {
      mount.innerHTML = '<div class="alert alert-warning"><h1 class="h4">No se encontr&oacute; el producto comercial seleccionado.</h1><p>Eleg&iacute; un producto comercial antes de completar el alta.</p><a class="btn btn-primary" href="alta-unidad-de-despacho.html">Volver a seleccionar producto</a></div>';
      return;
    }

    state = {
      gtinType: copyRecord ? "dun14" : "",
      logisticVariable: copyRecord ? String(copyRecord.code || "").charAt(0) : "",
      code: "",
      units: copyRecord ? String(copyRecord.unitsContained || "") : "",
      packaging: copyRecord ? String(copyRecord.packaging || "") : "",
      finalDescription: "",
      images: getProductImages(copyRecord || product),
      galleryIndex: 0,
    };
    pendingImages = [];
    renderAlta();
    bindAlta();
    renderStep();
  }

  function findContainedProduct(containedGtin) {
    return window.GS1ProductCatalog.getCommercialProducts().find((record) => String(record.code) === String(containedGtin)) || null;
  }

  function setInitialFormValues() {
    const form = document.getElementById("dispatchAltaForm");
    if (!form) return;
    form.elements.logisticVariable.value = state.logisticVariable;
    form.elements.units.value = state.units;
    form.elements.packaging.value = state.packaging;
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
      <section class="card shadow-sm product-wizard-modern" data-dispatch-wizard>
        <header class="product-wizard-modern__header">
          <div>
            <div class="product-wizard-modern__eyebrow">Alta de unidad de despacho</div>
            <h1 class="product-wizard-modern__title">Alta de unidad de despacho</h1>
            <p class="product-wizard-modern__lead">Complet&aacute; los pasos para definir el tipo de GTIN, cargar los atributos y confirmar el alta.</p>
          </div>
          <div>
            <div class="product-wizard-modern__help btn-group" role="group" aria-label="Material de ayuda para el alta de unidad de despacho">
              <a class="btn btn-outline-primary" href="../assets/archivos/Instructivo_ABM.pdf" download>Descargar instructivo Alta de unidad de despacho</a>
              <button class="btn btn-outline-primary" type="button">Video de ayuda Alta de unidad de despacho</button>
            </div>
          </div>
        </header>
        <div class="product-wizard-modern__layout">
          <nav aria-label="Pasos del alta de unidad de despacho">
            <ol class="product-wizard-stepper" data-dispatch-stepper></ol>
          </nav>
          <section class="product-wizard-panel" aria-live="polite">
            <div class="product-wizard-panel__body" data-dispatch-step-content></div>
            <div class="product-wizard-actions">
              <button type="button" class="btn btn-link text-decoration-none" data-dispatch-previous>&larr; Anterior</button>
              <span class="product-wizard-actions__spacer"></span>
              <button type="button" class="btn btn-primary" data-dispatch-next>Continuar &rarr;</button>
            </div>
          </section>
        </div>
      </section>`;
  }

  function renderStep() {
    const mount = document.getElementById("dispatchAltaMount");
    const content = mount?.querySelector("[data-dispatch-step-content]");
    const stepper = mount?.querySelector("[data-dispatch-stepper]");
    if (!content || !stepper) return;

    stepper.innerHTML = [
      [1, "Tipo de GTIN", "Est&aacute;ndar de codificaci&oacute;n"],
      [2, "Atributos", "Datos de la unidad"],
      [3, "Confirmaci&oacute;n", "Revisi&oacute;n final"],
    ].map(([id, title, meta]) => `
      <li class="product-wizard-stepper__item" data-status="${id < currentStep ? "completed" : id === currentStep ? "current" : "pending"}">
        <button type="button" class="product-wizard-stepper__button" data-dispatch-step="${id}" ${id > currentStep ? "disabled" : ""} aria-current="${id === currentStep ? "step" : "false"}">
          <span class="product-wizard-stepper__marker" aria-hidden="true">${id}</span>
          <span class="product-wizard-stepper__title">${title}</span>
          <span class="product-wizard-stepper__meta">${meta}</span>
        </button>
      </li>`).join("");

    if (currentStep === 1) content.innerHTML = renderGtinStep();
    if (currentStep === 2) content.innerHTML = renderAttributesStep();
    if (currentStep === 3) content.innerHTML = renderConfirmationStep();

    const previous = mount.querySelector("[data-dispatch-previous]");
    const next = mount.querySelector("[data-dispatch-next]");
    previous.disabled = currentStep === 1;
    next.textContent = currentStep === 3 ? "Confirmar alta" : "Continuar →";
    mount.querySelectorAll("[data-dispatch-step]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = Number(button.dataset.dispatchStep);
        if (target <= currentStep) {
          currentStep = target;
          renderStep();
        }
      });
    });
    if (currentStep === 1) bindGtinSelection(mount);
    if (currentStep === 2 && state.gtinType === "dun14") bindDispatchForm(mount);
  }

  function renderGtinStep() {
    return `
      <div class="product-wizard-step-intro">
        <h2 class="h4 mb-1">01 &middot; Seleccion&aacute; el tipo de GTIN</h2>
        <p class="mb-0">Eleg&iacute; el est&aacute;ndar que vas a utilizar para la unidad de despacho.</p>
      </div>
      <div class="mb-4 p-3 rounded border bg-body-tertiary">
        <div class="text-secondary small">Producto contenido</div>
        <div class="fw-semibold">${escapeHtml(product.name)}</div>
        <div class="small text-secondary">GTIN ${escapeHtml(product.code)}</div>
        <a class="btn btn-outline-secondary btn-sm mt-3" href="alta-unidad-de-despacho.html">Cambiar producto contenido</a>
      </div>
      <div class="row g-3" role="radiogroup" aria-label="Tipo de GTIN">
        ${gtinChoice("gtin13", "GTIN 13", "La validaci&oacute;n de atributos se completar&aacute; con Identificaci&oacute;n.")}
        ${gtinChoice("dun14", "DUN 14", "Permite completar los datos log&iacute;sticos de la unidad de despacho.")}
      </div>`;
  }

  function gtinChoice(value, title, description) {
    const selected = state.gtinType === value;
    return `<div class="col-md-6">
      <button type="button" class="wizard-choice w-100 h-100 text-start border-0 bg-transparent p-0 ${selected ? "is-selected" : ""}" data-modern-choice data-dispatch-gtin="${value}" aria-pressed="${selected}">
        <span class="card h-100 p-3">
          <span class="d-block fw-semibold fs-5">${title}</span>
          <span class="d-block text-secondary mt-2">${description}</span>
        </span>
      </button>
    </div>`;
  }

  function renderAttributesStep() {
    if (state.gtinType === "gtin13") {
      return `
        <div class="product-wizard-step-intro">
          <h2 class="h4 mb-1">02 &middot; Atributos</h2>
          <p class="mb-0">Valid&aacute; la informaci&oacute;n que corresponde al tipo de GTIN elegido.</p>
        </div>
        <div class="alert alert-info mb-0" role="status">
          <h3 class="h5">Validar atributos con Identificaci&oacute;n</h3>
          <p class="mb-2">En esta etapa se definir&aacute; con el equipo de Identificaci&oacute;n qu&eacute; atributos corresponden al GTIN 13.</p>
          <p class="mb-0">Por ahora no se solicita un formulario adicional. Pod&eacute;s continuar para revisar y confirmar el alta.</p>
        </div>`;
    }

    return `
      <div class="product-wizard-step-intro">
        <h2 class="h4 mb-1">02 &middot; Atributos DUN 14</h2>
        <p class="mb-0">Complet&aacute; los datos log&iacute;sticos de la unidad de despacho.</p>
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
                <label class="form-label" for="dispatchContainedGtin">GTIN contenido</label>
                <input class="form-control form-control--locked" id="dispatchContainedGtin" value="${escapeHtml(product.code)}" readonly>
              </div>
              <div class="mb-3">
                <label class="form-label" for="dispatchContainedDescription">Descripci&oacute;n GTIN contenido</label>
                <input class="form-control form-control--locked" id="dispatchContainedDescription" value="${escapeHtml(product.name)}" readonly>
              </div>
              <div class="mb-3">
                <label class="form-label" for="dispatchCode">DUN 14</label>
                <input class="form-control" id="dispatchCode" value="" readonly aria-describedby="dispatchCodeHelp">
                <div class="form-text" id="dispatchCodeHelp">Se calcula con la variable log&iacute;stica y el GTIN contenido.</div>
              </div>
              <div class="mb-3">
                <label class="form-label" for="dispatchUnits">Unidades contenidas</label>
                <input class="form-control" id="dispatchUnits" name="units" type="number" min="1" step="1" required>
              </div>
              <div class="mb-3">
                <label class="form-label" for="dispatchFinalDescription">Descripci&oacute;n DUN 14</label>
                <input class="form-control form-control--locked" id="dispatchFinalDescription" value="" readonly aria-describedby="dispatchDescriptionHelp">
                <div class="form-text" id="dispatchDescriptionHelp">Se concatena autom&aacute;ticamente con las unidades y el envase agrupador.</div>
              </div>
              <div>
                <label class="form-label" for="dispatchPackaging">Envase agrupador</label>
                <input class="form-control" id="dispatchPackaging" name="packaging" required>
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="dispatch-image-panel border rounded p-3">
              <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div>
                  <div class="fw-semibold">Im&aacute;genes del alta</div>
                  <div class="small text-secondary">Im&aacute;genes disponibles del producto contenido.</div>
                </div>
              </div>
              <div data-dispatch-gallery>${renderGallery()}</div>
            </div>
          </div>
        </div>
      </form>`;
  }

  function renderConfirmationStep() {
    const isDun14 = state.gtinType === "dun14";
    return `
      <div class="product-wizard-step-intro">
        <h2 class="h4 mb-1">03 &middot; Confirmaci&oacute;n</h2>
        <p class="mb-0">Revis&aacute; la informaci&oacute;n antes de confirmar el alta.</p>
      </div>
      <div class="border rounded p-3">
        <div class="row g-3">
          ${renderSuccessField("Producto contenido", product.name)}
          ${renderSuccessField("GTIN contenido", product.code)}
          ${renderSuccessField("Tipo de GTIN", isDun14 ? "DUN 14" : "GTIN 13")}
          ${isDun14 ? renderSuccessField("DUN 14", state.code || "Pendiente de completar") : renderSuccessField("Atributos", "Validar con Identificación")}
          ${isDun14 ? renderSuccessField("Unidades contenidas", state.units || "Pendiente de completar") : ""}
          ${isDun14 ? renderSuccessField("Envase agrupador", state.packaging || "Pendiente de completar") : ""}
        </div>
      </div>`;
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
    mount.querySelector("[data-dispatch-previous]")?.addEventListener("click", previousStep);
    mount.querySelector("[data-dispatch-next]")?.addEventListener("click", nextStep);
  }

  function bindGtinSelection(mount) {
    mount.querySelectorAll("[data-dispatch-gtin]").forEach((choice) => {
      choice.addEventListener("click", () => {
        state.gtinType = choice.dataset.dispatchGtin;
        renderStep();
      });
    });
  }

  function bindDispatchForm(mount) {
    const form = mount.querySelector("#dispatchAltaForm");
    if (!form) return;
    setInitialFormValues();
    updateDerivedFields();
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
      nextStep();
    });
    mount.querySelector("[data-dispatch-import-image]")?.addEventListener("click", () => {
      bootstrap.Modal.getOrCreateInstance(document.getElementById("dispatchImageModal")).show();
    });
    bindGallery(mount);
    bindImageImport(mount);
  }

  function previousStep() {
    if (currentStep === 1) return;
    currentStep -= 1;
    renderStep();
  }

  function nextStep() {
    if (currentStep === 1) {
      if (!state.gtinType) {
        showStepFeedback("Seleccion&aacute; un tipo de GTIN para continuar.");
        return;
      }
      currentStep = 2;
      renderStep();
      return;
    }

    if (currentStep === 2) {
      const form = document.getElementById("dispatchAltaForm");
      if (state.gtinType === "dun14" && form) {
        collectFormState(form);
        updateDerivedFields();
        if (!form.reportValidity()) return;
      }
      currentStep = 3;
      renderStep();
      return;
    }

    if (state.gtinType === "dun14") {
      confirmAlta();
      return;
    }
    renderGtin13Success();
  }

  function showStepFeedback(message) {
    const content = document.querySelector("[data-dispatch-step-content]");
    if (!content) return;
    content.querySelector("[data-dispatch-feedback]")?.remove();
    content.insertAdjacentHTML("afterbegin", `<div class="alert alert-warning" data-dispatch-feedback role="alert">${message}</div>`);
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
    window.GS1Utils.showSimulationToast(`Alta de unidad de despacho ${state.code} confirmada.`, "success");
    renderAltaSuccess(payload);
  }

  function renderGtin13Success() {
    const mount = document.getElementById("dispatchAltaMount");
    if (!mount) return;
    mount.innerHTML = `
      <section class="card shadow-sm product-detail-card">
        <div class="card-body">
          <div class="text-center border-bottom pb-3 mb-4">
            <div class="display-6 text-success" aria-hidden="true">&#10003;</div>
            <div class="text-secondary small">Alta de unidad de despacho</div>
            <h1 class="h2 mb-2">Validar felicitaci&oacute;n con Identificaci&oacute;n</h1>
            <p class="text-secondary mb-0">La felicitaci&oacute;n del alta para GTIN 13 queda pendiente de validaci&oacute;n con el equipo de Identificaci&oacute;n.</p>
          </div>
          <div class="row g-3">
            ${renderSuccessField("Producto contenido", product.name)}
            ${renderSuccessField("GTIN contenido", product.code)}
            ${renderSuccessField("Tipo seleccionado", "GTIN 13")}
            ${renderSuccessField("Pr&oacute;ximo paso", "Definir la felicitaci&oacute;n con Identificaci&oacute;n")}
          </div>
          <div class="d-flex flex-wrap gap-2 mt-4">
            <a class="btn btn-primary" href="alta-unidad-de-despacho.html">Dar de alta otra unidad de despacho</a>
            <a class="btn btn-outline-secondary" href="productos-listado-dun14.html">Volver al listado</a>
          </div>
        </div>
      </section>`;
  }

  function renderAltaSuccess(payload) {
    const mount = document.getElementById("dispatchAltaMount");
    if (!mount) return;
    const image = window.GS1ProductCatalog.resolveImagePath(payload.image);
    mount.innerHTML = `
      <section class="card shadow-sm product-detail-card">
        <div class="card-body">
          <div class="text-center border-bottom pb-3 mb-4">
            <div class="display-6 text-success" aria-hidden="true">&#10003;</div>
            <div class="text-secondary small">Alta de unidad de despacho</div>
            <h1 class="h2 mb-2">&iexcl;Alta exitosa!</h1>
            <p class="text-secondary mb-0">La unidad de despacho se cre&oacute; con &eacute;xito.</p>
          </div>
          <div class="row g-4 align-items-start">
            <div class="col-lg-4">
              <div class="product-detail-media">
                ${image ? `<img src="${escapeHtml(image)}" alt="Imagen de ${escapeHtml(payload.name)}" class="img-fluid rounded border">` : '<div class="product-image-placeholder"><span>No hay imagen disponible</span></div>'}
              </div>
            </div>
            <div class="col-lg-8">
              <div class="mb-4">
                <div class="text-secondary small">Unidad de despacho</div>
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
                ${renderSuccessField("C&oacute;digo de unidad de despacho", payload.code)}
                ${renderSuccessField("GTIN contenido", payload.containedGtin)}
                ${renderSuccessField("Unidades contenidas", payload.unitsContained)}
                ${renderSuccessField("Envase agrupador", payload.packaging)}
                ${renderSuccessField("Variable log&iacute;stica", payload.packagingLevel)}
                ${renderSuccessField("Marca", payload.brand)}
              </div>
              <div class="d-flex flex-wrap gap-2 mt-4">
                <a class="btn btn-primary" href="generador-simbologia.html">Generar Simbolog&iacute;a</a>
                <a class="btn btn-primary" href="alta-unidad-de-despacho.html">Dar de alta nueva unidad de despacho</a>
                <a class="btn btn-primary" href="alta-unidad-de-despacho.html">Copiar</a>
                <a class="btn btn-primary" href="productos-listado-dun14.html">Ver listado de unidades de despacho</a>
                <a class="btn btn-primary" href="producto-editar-dun14.html">Modificar esta unidad de despacho</a>
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
