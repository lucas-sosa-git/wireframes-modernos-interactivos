(function () {
  const STEPS = [
    { id: "00", title: "Datos preseleccionados", meta: "Descripci&oacute;n + GTIN contenido" },
    { id: "01", title: "Variable log&iacute;stica", meta: "Completar variable" },
    { id: "02", title: "C&aacute;lculo GTIN 14", meta: "Generar c&oacute;digo" },
    { id: "03", title: "Descripci&oacute;n GTIN 14", meta: "Armar descripci&oacute;n" },
    { id: "05", title: "Unidades contenidas", meta: "Completar unidades" },
    { id: "06", title: "Descripci&oacute;n final", meta: "A&ntilde;adir unidades" },
    { id: "07", title: "Envase", meta: "Completar envase" },
    { id: "08", title: "Confirmar alta", meta: "Revisar y confirmar" },
  ];
  let product = null;
  let state = null;

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
      currentIndex: 0,
      highestIndex: 0,
      logisticVariable: "",
      code: "",
      baseDescription: product.name || product.shortDescription || "",
      units: "",
      finalDescription: "",
      packaging: "",
    };
    renderFlow();
    bindFlow();
    renderCurrentStep();
  }

  function renderFlow() {
    const mount = document.getElementById("dispatchAltaMount");
    const image = window.GS1ProductCatalog.resolveImagePath(product.image);
    const containedType = window.GS1ProductCatalog.formatProductType
      ? window.GS1ProductCatalog.formatProductType(product.type)
      : product.type;
    mount.innerHTML = `
      <section class="card shadow-sm">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div class="text-secondary small">Alta de GTIN 14</div>
              <h1 class="h3">Alta de unidad de despacho</h1>
              <p class="text-secondary mb-0">Complet&aacute; el proceso paso a paso para generar y confirmar el GTIN 14.</p>
            </div>
            <a class="btn btn-outline-secondary" href="producto-nuevo-dun14.html">Cambiar producto contenido</a>
          </div>
          <div class="alert alert-light border d-flex flex-wrap align-items-center gap-3 mt-4 mb-4">
            <div class="product-thumbnail">${image ? `<img class="product-thumb-image product-alta-image" src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" loading="lazy" decoding="async">` : '<span class="product-thumb-placeholder"><span>Sin imagen</span></span>'}</div>
            <div>
              <h2 class="h5 mb-1">${escapeHtml(product.name)}</h2>
              <div class="small text-secondary">GTIN contenido: ${escapeHtml(product.code)} &middot; ${escapeHtml(containedType)} &middot; Marca: ${escapeHtml(product.brand)}</div>
              <div class="small mt-1">${escapeHtml(product.shortDescription)}</div>
            </div>
          </div>
          <ol class="row row-cols-2 row-cols-md-4 g-2 list-unstyled mb-4" aria-label="Pasos del alta" data-flow-stepper></ol>
          <form id="dispatchAltaForm" novalidate>
            <section class="border rounded p-3 p-md-4" aria-live="polite" data-flow-panel>
              <div data-flow-content></div>
            </section>
            <div class="d-flex flex-wrap justify-content-between gap-2 mt-4" data-flow-actions>
              <button class="btn btn-link text-decoration-none px-0" type="button" data-flow-previous>&larr; Anterior</button>
              <button class="btn btn-primary" type="submit" data-flow-next>Continuar &rarr;</button>
            </div>
          </form>
        </div>
      </section>`;
    const imageEl = mount.querySelector(".product-alta-image");
    imageEl?.addEventListener("error", () => {
      const host = imageEl.closest(".product-thumbnail");
      if (host) host.innerHTML = '<span class="product-thumb-placeholder"><span>Sin imagen</span></span>';
    }, { once: true });
  }

  function bindFlow() {
    const mount = document.getElementById("dispatchAltaMount");
    const form = document.getElementById("dispatchAltaForm");
    mount.querySelector("[data-flow-stepper]").addEventListener("click", (event) => {
      const button = event.target.closest("[data-flow-step]");
      if (!button || button.disabled) return;
      goToStep(Number(button.dataset.flowStep));
    });
    mount.querySelector("[data-flow-previous]").addEventListener("click", () => goToStep(state.currentIndex - 1));
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      advanceStep();
    });
  }

  function renderCurrentStep() {
    const step = STEPS[state.currentIndex];
    if (step.id === "02" && state.logisticVariable && !state.code) calculateCode();
    if (step.id === "06") state.finalDescription = composeDescription();
    const mount = document.getElementById("dispatchAltaMount");
    mount.querySelector("[data-flow-content]").innerHTML = stepMarkup(step.id);
    mount.querySelector("[data-flow-stepper]").innerHTML = STEPS.map((item, index) => `
      <li class="col">
        <button type="button" class="w-100 h-100 text-start border rounded p-2 bg-body ${index === state.currentIndex ? "border-primary bg-primary-subtle" : ""}" data-flow-step="${index}" ${index > state.highestIndex ? "disabled" : ""} aria-current="${index === state.currentIndex ? "step" : "false"}">
          <span class="d-block small fw-semibold">Paso ${item.id}</span>
          <span class="d-block small">${item.title}</span>
          <span class="d-block text-secondary small">${item.meta}</span>
        </button>
      </li>`).join("");
    const previous = mount.querySelector("[data-flow-previous]");
    const next = mount.querySelector("[data-flow-next]");
    previous.classList.toggle("invisible", state.currentIndex === 0);
    next.textContent = step.id === "08" ? "Confirmar alta" : `Continuar al paso ${STEPS[state.currentIndex + 1]?.id || ""} â†’`;
    next.classList.toggle("btn-success", step.id === "08");
    next.classList.toggle("btn-primary", step.id !== "08");
  }

  function stepMarkup(id) {
    switch (id) {
      case "00":
        return `<div class="text-secondary small">Paso 00</div><h2 class="h4">Datos preseleccionados</h2><p class="text-secondary">La descripci&oacute;n y el GTIN contenido vienen seleccionados desde el producto comercial elegido.</p><div class="row g-3"><div class="col-md-6"><label class="form-label" for="dispatchContainedDescription">Descripci&oacute;n</label><input class="form-control" id="dispatchContainedDescription" value="${escapeHtml(product.name)}" readonly></div><div class="col-md-6"><label class="form-label" for="dispatchContainedGtin">GTIN contenido</label><input class="form-control" id="dispatchContainedGtin" value="${escapeHtml(product.code)}" readonly></div></div>`;
      case "01":
        return `<div class="text-secondary small">Paso 01</div><h2 class="h4">Complet&aacute; la variable log&iacute;stica</h2><p class="text-secondary">Eleg&iacute; la variable que identifica el nivel de la unidad de despacho.</p><label class="form-label" for="dispatchLogisticVariable">Variable log&iacute;stica <span class="text-danger">*</span></label><select class="form-select" id="dispatchLogisticVariable" name="logisticVariable" required><option value="">Elegir&hellip;</option>${Array.from({ length: 10 }, (_, value) => `<option value="${value}" ${String(state.logisticVariable) === String(value) ? "selected" : ""}>${value}</option>`).join("")}</select>`;
      case "02":
        return `<div class="text-secondary small">Paso 02</div><h2 class="h4">Calcul&aacute; el GTIN 14</h2><p class="text-secondary">El c&oacute;digo se calcula con la variable log&iacute;stica y el GTIN contenido.</p><div class="row g-3"><div class="col-md-6"><label class="form-label" for="dispatchCode">GTIN 14 calculado</label><input class="form-control form-control-lg fw-semibold" id="dispatchCode" value="${escapeHtml(state.code)}" readonly></div><div class="col-md-6"><label class="form-label">Variable log&iacute;stica aplicada</label><div class="form-control-plaintext fw-semibold">${escapeHtml(state.logisticVariable)}</div></div></div><div class="alert alert-success mt-3 mb-0">El GTIN 14 queda listo para continuar con su descripci&oacute;n.</div>`;
      case "03":
        return `<div class="text-secondary small">Paso 03</div><h2 class="h4">Arm&aacute; la descripci&oacute;n del GTIN 14</h2><p class="text-secondary">Defin&iacute; la descripci&oacute;n base de la unidad de despacho. En el paso 06 se incorporar&aacute;n las unidades contenidas.</p><label class="form-label" for="dispatchName">Descripci&oacute;n del GTIN 14 <span class="text-danger">*</span></label><input class="form-control" id="dispatchName" name="name" value="${escapeHtml(state.baseDescription)}" required>`;
      case "05":
        return `<div class="text-secondary small">Paso 05</div><h2 class="h4">Complet&aacute; las unidades contenidas</h2><p class="text-secondary">Indic&aacute; cu&aacute;ntas unidades del producto seleccionado contiene la unidad de despacho.</p><label class="form-label" for="dispatchUnits">Unidades contenidas <span class="text-danger">*</span></label><input class="form-control" id="dispatchUnits" name="units" type="number" min="1" step="1" value="${escapeHtml(state.units)}" required>`;
      case "06":
        return `<div class="text-secondary small">Paso 06</div><h2 class="h4">A&ntilde;ad&iacute; las unidades a la descripci&oacute;n</h2><p class="text-secondary">La descripci&oacute;n del GTIN 14 se actualiza autom&aacute;ticamente con el valor cargado en el paso 05.</p><label class="form-label" for="dispatchFinalDescription">Descripci&oacute;n final del GTIN 14</label><input class="form-control" id="dispatchFinalDescription" value="${escapeHtml(state.finalDescription)}" readonly><div class="alert alert-light border mt-3 mb-0">Se agregar&aacute; <strong>${escapeHtml(state.units)} unidades</strong>. El envase se completar&aacute; luego y no se sumar&aacute; a esta descripci&oacute;n.</div>`;
      case "07":
        return `<div class="text-secondary small">Paso 07</div><h2 class="h4">Complet&aacute; el envase</h2><p class="text-secondary">Inform&aacute; el envase agrupador. Este dato se guardar&aacute; por separado y no se agregar&aacute; a la descripci&oacute;n del GTIN 14.</p><label class="form-label" for="dispatchPackaging">Envase <span class="text-danger">*</span></label><input class="form-control" id="dispatchPackaging" name="packaging" value="${escapeHtml(state.packaging)}" required>`;
      case "08":
        return `<div class="text-secondary small">Paso 08</div><h2 class="h4">Confirm&aacute; el alta</h2><p class="text-secondary">Revis&aacute; los datos antes de crear el GTIN 14.</p><div class="row g-3"><div class="col-md-6"><div class="text-secondary small">GTIN 14</div><div class="fw-semibold">${escapeHtml(state.code)}</div></div><div class="col-md-6"><div class="text-secondary small">GTIN contenido</div><div class="fw-semibold">${escapeHtml(product.code)}</div></div><div class="col-md-6"><div class="text-secondary small">Descripci&oacute;n</div><div class="fw-semibold">${escapeHtml(state.finalDescription)}</div></div><div class="col-md-6"><div class="text-secondary small">Unidades contenidas</div><div class="fw-semibold">${escapeHtml(state.units)}</div></div><div class="col-md-6"><div class="text-secondary small">Envase</div><div class="fw-semibold">${escapeHtml(state.packaging)}</div></div><div class="col-md-6"><div class="text-secondary small">Variable log&iacute;stica</div><div class="fw-semibold">${escapeHtml(state.logisticVariable)}</div></div></div>`;
      default:
        return "";
    }
  }

  function advanceStep() {
    collectCurrentStep();
    const form = document.getElementById("dispatchAltaForm");
    if (!form.reportValidity()) return;
    if (STEPS[state.currentIndex].id === "08") {
      confirmAlta();
      return;
    }
    if (state.currentIndex === 1) state.code = "";
    if (state.currentIndex < STEPS.length - 1) {
      state.currentIndex += 1;
      state.highestIndex = Math.max(state.highestIndex, state.currentIndex);
      renderCurrentStep();
    }
  }

  function goToStep(index) {
    if (index < 0 || index > state.highestIndex) return;
    collectCurrentStep();
    state.currentIndex = index;
    renderCurrentStep();
  }

  function collectCurrentStep() {
    const form = document.getElementById("dispatchAltaForm");
    if (!form) return;
    const stepId = STEPS[state.currentIndex].id;
    if (stepId === "01") state.logisticVariable = String(form.elements.logisticVariable?.value || "");
    if (stepId === "03") state.baseDescription = String(form.elements.name?.value || "").trim();
    if (stepId === "05") state.units = String(form.elements.units?.value || "").trim();
    if (stepId === "07") state.packaging = String(form.elements.packaging?.value || "").trim();
    if (state.baseDescription && state.units) state.finalDescription = composeDescription();
  }

  function calculateCode() {
    const body = `${String(state.logisticVariable)}${String(product.code).padStart(13, "0").slice(0, 12)}`;
    state.code = `${body}${window.GS1Utils.computeCheckDigit(body)}`;
  }

  function composeDescription() {
    return state.baseDescription && state.units ? `${state.baseDescription} - ${state.units} unidades` : state.baseDescription;
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
      image: product.image,
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
            <div class="display-6 text-success" aria-hidden="true">âœ“</div>
            <div class="text-secondary small">Alta de GTIN 14</div>
            <h1 class="h2 mb-2">Â¡Alta exitosa!</h1>
            <p class="text-secondary mb-0">El GTIN 14 fue creado con Ã©xito.</p>
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
      </section>
    `;
  }

  function renderSuccessField(label, value) {
    return `<div class="col-md-6"><div class="product-detail-field"><div class="text-secondary small">${label}</div><div class="fw-semibold">${escapeHtml(value || "-")}</div></div></div>`;
  }

  function escapeHtml(value) { return window.GS1Utils.escapeHtml(String(value ?? "")); }
})();
