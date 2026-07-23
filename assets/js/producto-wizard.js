(function () {
  "use strict";

  const IMAGE_RULES = Object.freeze({
    acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 8 * 1024 * 1024,
    maxFiles: 6,
  });
  const STEP_DEFINITIONS = [
    { id: 0, title: "Carga asistida por imágenes", meta: "Opcional" },
    { id: 1, title: "Tipo de GTIN", meta: "Estándar de codificación" },
    { id: 2, title: "Tipo de distribución", meta: "Alcance comercial" },
    { id: 3, title: "Línea de negocio", meta: "Rubro principal" },
    { id: 4, title: "Detalles del producto", meta: "Datos descriptivos" },
    { id: 5, title: "Atributos", meta: "Características obligatorias" },
    { id: 6, title: "Categoría", meta: "Clasificación global" },
    { id: 7, title: "Imagen", meta: "Foto principal" },
    { id: 8, title: "Campos extra", meta: "Datos complementarios" },
    { id: 9, title: "Confirmación", meta: "Revisión final" },
  ];
  const STEP_PANEL_IDS = {
    1: "paso10a",
    2: "paso20a",
    3: "paso30a",
    4: "paso40a",
    5: "paso50a",
    6: "paso60a",
    7: "paso70a",
    8: "paso80a",
    9: "paso90a",
  };
  const STEP_INTROS = {
    1: "Elegí el estándar que corresponda al producto y al mercado donde se comercializará.",
    2: "Indicá si el producto se comercializa dentro de Argentina o también en otros países.",
    3: "Buscá y seleccioná el rubro principal del artículo.",
    4: "Completá la información descriptiva y comercial del producto.",
    5: "Revisá los atributos obligatorios definidos para el producto.",
    6: "Buscá o elegí la clasificación global que mejor represente al producto.",
    7: "Agregá la imagen principal y, si corresponde, imágenes adicionales.",
    8: "Seleccioná las leyendas, sellos y microsellos que correspondan.",
    9: "Revisá la información antes de crear el producto.",
  };
  const DEPENDENCIES = {
    1: [4, 9],
    2: [6, 9],
    3: [5, 6, 9],
  };

  const state = {
    currentStep: 0,
    highestAvailable: 1,
    steps: Object.fromEntries(STEP_DEFINITIONS.map((step) => [step.id, {
      status: step.id === 0 ? "optional" : "pending",
      isDirty: false,
      errors: {},
    }])),
    values: {
      gtinType: "",
      distributionType: "",
      lineOfBusiness: "",
      category: "",
    },
    uploadedImages: [],
    imageSuggestions: [],
    imageAnalysisStatus: "idle",
    step0Skipped: false,
  };

  let root;
  let panelBody;
  let actions;
  let originalFinalize;
  let completionHost;

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    if (!/\/producto-nuevo\.html$/i.test(window.location.pathname)) return;
    root = document.getElementById("producto-nuevo-wizard");
    if (!root) return;

    originalFinalize = window.validar_paso90;
    buildShell();
    prepareLegacyPanels();
    bindSelections();
    bindFields();
    overrideLegacyNavigation();
    clearLegacyDraft();
    render();
  }

  function buildShell() {
    const card = document.getElementById("card-nuevo-producto");
    const pasos = document.getElementById("pasos");
    if (!card || !pasos) return;

    card.classList.add("product-wizard-modern");
    card.querySelector(":scope > .progress")?.setAttribute("aria-hidden", "true");

    const header = document.createElement("header");
    header.className = "product-wizard-modern__header";
    header.innerHTML = `
      <div>
        <div class="product-wizard-modern__eyebrow">Productos</div>
        <h1 class="product-wizard-modern__title">Nuevo producto</h1>
        <p class="product-wizard-modern__lead">Completá los pasos para registrar el producto y obtener su código GTIN. Esta pantalla es de prueba: al refrescar, el formulario se reinicia.</p>
      </div>
    `;

    const layout = document.createElement("div");
    layout.className = "product-wizard-modern__layout";
    layout.innerHTML = `
      <nav aria-label="Pasos del alta de producto">
        <ol class="product-wizard-stepper"></ol>
      </nav>
      <section class="product-wizard-panel" aria-live="polite">
        <div class="product-wizard-panel__body"></div>
        <div class="product-wizard-actions">
          <button type="button" class="btn btn-link text-decoration-none" data-wizard-previous>← Anterior</button>
          <button type="button" class="btn btn-outline-secondary d-none" data-wizard-skip>Omitir y completar manualmente</button>
          <span class="product-wizard-actions__spacer"></span>
          <button type="button" class="btn btn-outline-primary" data-wizard-save>Guardar borrador</button>
          <button type="button" class="btn btn-primary" data-wizard-next>Continuar →</button>
        </div>
      </section>
    `;

    card.insertBefore(header, card.querySelector(":scope > .progress") || card.firstChild);
    pasos.parentNode.insertBefore(layout, pasos);
    panelBody = layout.querySelector(".product-wizard-panel__body");
    panelBody.appendChild(pasos);
    actions = layout.querySelector(".product-wizard-actions");

    const finalCard = document.getElementById("ficha-final");
    if (finalCard) {
      completionHost = document.createElement("section");
      completionHost.className = "product-wizard-completion";
      completionHost.hidden = true;
      completionHost.setAttribute("aria-live", "polite");
      layout.insertAdjacentElement("afterend", completionHost);
      completionHost.appendChild(finalCard);
    }

    buildStepper(layout.querySelector(".product-wizard-stepper"));
    setupAiValidation();
    actions.querySelector("[data-wizard-previous]").addEventListener("click", previousStep);
    actions.querySelector("[data-wizard-skip]").addEventListener("click", skipAssistedUpload);
    actions.querySelector("[data-wizard-save]").addEventListener("click", () => saveDraft(true));
    actions.querySelector("[data-wizard-next]").addEventListener("click", nextStep);
  }

  function buildStepper(host) {
    host.innerHTML = STEP_DEFINITIONS.map((step) => `
      <li class="product-wizard-stepper__item" data-stepper-item="${step.id}" data-status="${step.id === 0 ? "optional" : "pending"}">
        <button type="button" class="product-wizard-stepper__button" data-stepper-button="${step.id}" aria-current="${step.id === 0 ? "step" : "false"}">
          <span class="product-wizard-stepper__marker" aria-hidden="true">${step.id}</span>
          <span class="product-wizard-stepper__title">${step.title}</span>
          <span class="product-wizard-stepper__meta">${step.meta}</span>
        </button>
      </li>
    `).join("");

    host.querySelectorAll("[data-stepper-button]").forEach((button) => {
      button.addEventListener("click", () => goToStep(Number(button.dataset.stepperButton)));
    });
  }

  function prepareLegacyPanels() {
    const assisted = document.createElement("div");
    assisted.id = "paso00a";
    assisted.innerHTML = assistedUploadMarkup();
    root.insertBefore(assisted, root.firstChild);

    Object.entries(STEP_PANEL_IDS).forEach(([stepId, panelId]) => {
      const panel = document.getElementById(panelId);
      if (!panel) return;
      panel.dataset.wizardStep = stepId;
      panel.hidden = true;
      const heading = panel.querySelector(":scope > h2");
      if (heading) {
        heading.textContent = `${String(stepId).padStart(2, "0")} · ${STEP_DEFINITIONS[Number(stepId)].title}`;
        heading.setAttribute("tabindex", "-1");
        heading.insertAdjacentHTML("afterend", `<p class="product-wizard-step-intro">${STEP_INTROS[stepId]}</p>`);
      }
    });

    assisted.dataset.wizardStep = "0";
    assisted.hidden = true;
    assisted.querySelector("h2").setAttribute("tabindex", "-1");

    ["40", "50", "70", "80", "90"].forEach((number) => {
      const panel = document.getElementById(`paso${number}a`);
      const selector = `[onclick*="validar_paso${number}"]`;
      const candidates = panel ? Array.from(panel.querySelectorAll(selector)) : [];
      if (candidates.length === 1) candidates[0].classList.add("legacy-step-action-hidden");
    });

    setupUpload();
  }

  function assistedUploadMarkup() {
    return `
      <section class="assisted-upload">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-1">
          <h2 class="assisted-upload__heading mb-0">00 · Carga asistida por imágenes</h2>
          <span class="badge rounded-pill text-bg-light border">Opcional</span>
        </div>
        <p class="product-wizard-step-intro">Cargá una o varias imágenes para obtener sugerencias sobre campos existentes. Siempre vas a poder revisarlas, editarlas o descartarlas antes de aplicarlas.</p>
        <div class="assisted-upload__dropzone" data-assisted-dropzone>
          <div>
            <div class="assisted-upload__icon" aria-hidden="true">↑</div>
            <p class="fw-semibold mb-1">Arrastrá imágenes acá</p>
            <p class="small text-secondary mb-3">JPG, PNG o WebP · hasta 8 MB por archivo · máximo 6 imágenes</p>
            <label class="btn btn-outline-primary mb-0" for="assistedImageInput">Cargar imágenes</label>
            <input class="visually-hidden" id="assistedImageInput" type="file" accept="image/jpeg,image/png,image/webp" multiple>
          </div>
        </div>
        <div class="assisted-upload__thumbs" data-assisted-thumbs aria-live="polite"></div>
        <div class="assisted-upload__status" data-assisted-status aria-live="polite"></div>
        <div class="image-suggestions" data-image-suggestions></div>
        <div class="mt-3">
          <button type="button" class="btn btn-outline-primary" data-analyze-images disabled>Analizar imágenes</button>
        </div>
      </section>
    `;
  }

  function setupUpload() {
    const input = document.getElementById("assistedImageInput");
    const dropzone = root.querySelector("[data-assisted-dropzone]");
    const analyzeButton = root.querySelector("[data-analyze-images]");
    input.addEventListener("change", (event) => addImages(event.target.files));
    analyzeButton.addEventListener("click", analyzeImages);

    ["dragenter", "dragover"].forEach((type) => dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.add("is-dragging");
    }));
    ["dragleave", "drop"].forEach((type) => dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      dropzone.classList.remove("is-dragging");
    }));
    dropzone.addEventListener("drop", (event) => addImages(event.dataTransfer.files));
  }

  function addImages(fileList) {
    const files = Array.from(fileList || []);
    const errors = [];
    files.forEach((file) => {
      if (state.uploadedImages.length >= IMAGE_RULES.maxFiles) {
        errors.push(`Solo podés cargar hasta ${IMAGE_RULES.maxFiles} imágenes.`);
        return;
      }
      if (!IMAGE_RULES.acceptedTypes.includes(file.type)) {
        errors.push(`${file.name}: formato no admitido.`);
        return;
      }
      if (file.size > IMAGE_RULES.maxBytes) {
        errors.push(`${file.name}: supera el máximo de 8 MB.`);
        return;
      }
      state.uploadedImages.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
      });
    });
    state.steps[0].isDirty = true;
    state.step0Skipped = false;
    state.steps[0].status = "current";
    renderImages(errors);
  }

  function removeImage(id) {
    const image = state.uploadedImages.find((item) => item.id === id);
    if (image?.previewUrl) URL.revokeObjectURL(image.previewUrl);
    state.uploadedImages = state.uploadedImages.filter((item) => item.id !== id);
    state.imageSuggestions = state.imageSuggestions.filter((item) => item.sourceImageId !== id);
    renderImages([]);
    renderSuggestions();
  }

  function renderImages(errors) {
    const host = root.querySelector("[data-assisted-thumbs]");
    const status = root.querySelector("[data-assisted-status]");
    const analyzeButton = root.querySelector("[data-analyze-images]");
    host.innerHTML = state.uploadedImages.map((image) => `
      <article class="assisted-upload__thumb">
        <img src="${escapeAttribute(image.previewUrl)}" alt="Vista previa de ${escapeHtml(image.name)}">
        <button type="button" class="assisted-upload__remove" data-remove-assisted-image="${escapeAttribute(image.id)}" aria-label="Eliminar ${escapeAttribute(image.name)}">×</button>
        <div class="assisted-upload__thumb-meta">
          <span class="assisted-upload__thumb-name" title="${escapeAttribute(image.name)}">${escapeHtml(image.name)}</span>
          <span class="text-secondary">${formatBytes(image.size)}</span>
        </div>
      </article>
    `).join("");
    host.querySelectorAll("[data-remove-assisted-image]").forEach((button) => {
      button.addEventListener("click", () => removeImage(button.dataset.removeAssistedImage));
    });
    analyzeButton.disabled = state.uploadedImages.length === 0 || state.imageAnalysisStatus === "analyzing";
    status.innerHTML = errors.length ? `<div class="alert alert-danger py-2 mb-0" role="alert">${errors.map(escapeHtml).join("<br>")}</div>` : "";
  }

  async function analyzeImages() {
    const status = root.querySelector("[data-assisted-status]");
    const analyzeButton = root.querySelector("[data-analyze-images]");
    state.imageAnalysisStatus = "analyzing";
    analyzeButton.disabled = true;
    analyzeButton.textContent = "Analizando…";
    status.innerHTML = `<div class="alert alert-light border py-2 mb-0" role="status"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Analizando las imágenes cargadas…</div>`;

    try {
      const result = await window.GS1ProductImageAnalysisAdapter.analyze(state.uploadedImages);
      state.imageSuggestions = result.suggestions || [];
      state.imageAnalysisStatus = "success";
      status.innerHTML = result.warnings?.length
        ? `<div class="alert alert-warning py-2 mb-0">${result.warnings.map(escapeHtml).join("<br>")}</div>`
        : `<div class="alert alert-success py-2 mb-0">El análisis terminó. Revisá las sugerencias antes de continuar.</div>`;
      renderSuggestions();
    } catch (error) {
      state.imageAnalysisStatus = "error";
      status.innerHTML = `<div class="alert alert-warning py-2 mb-0" role="alert"><strong>No pudimos analizar las imágenes.</strong> ${escapeHtml(error.message)} Podés continuar con la carga manual.</div>`;
    } finally {
      analyzeButton.disabled = state.uploadedImages.length === 0;
      analyzeButton.textContent = "Analizar imágenes";
      renderActions();
    }
  }

  function renderSuggestions() {
    const host = root.querySelector("[data-image-suggestions]");
    const pending = state.imageSuggestions.filter((item) => item.decision !== "discarded");
    if (!pending.length) {
      host.innerHTML = "";
      return;
    }
    const groups = pending.reduce((result, suggestion) => {
      (result[suggestion.targetStepId] ||= []).push(suggestion);
      return result;
    }, {});
    host.innerHTML = Object.entries(groups).map(([stepId, suggestions]) => `
      <section class="image-suggestions__group">
        <h3 class="image-suggestions__group-title">Paso ${stepId} · ${escapeHtml(STEP_DEFINITIONS[Number(stepId)].title)}</h3>
        ${suggestions.map((suggestion) => `
          <div class="image-suggestion" data-suggestion="${escapeAttribute(suggestion.id)}">
            <div>
              <span class="image-suggestion__label">${escapeHtml(fieldLabel(suggestion.targetFieldId))} · Confianza ${confidenceLabel(suggestion.confidence)}</span>
              <span class="image-suggestion__value">${escapeHtml(suggestion.proposedValue)}</span>
            </div>
            <div class="image-suggestion__actions">
              <button type="button" class="btn btn-sm btn-outline-secondary" data-edit-suggestion="${escapeAttribute(suggestion.id)}">Editar</button>
              <button type="button" class="btn btn-sm btn-outline-secondary" data-discard-suggestion="${escapeAttribute(suggestion.id)}">Descartar</button>
              <button type="button" class="btn btn-sm btn-primary" data-accept-suggestion="${escapeAttribute(suggestion.id)}">${suggestion.decision === "accepted" ? "Aplicada" : "Aplicar"}</button>
            </div>
          </div>
        `).join("")}
      </section>
    `).join("");
    host.querySelectorAll("[data-accept-suggestion]").forEach((button) => button.addEventListener("click", () => acceptSuggestion(button.dataset.acceptSuggestion)));
    host.querySelectorAll("[data-edit-suggestion]").forEach((button) => button.addEventListener("click", () => editSuggestion(button.dataset.editSuggestion)));
    host.querySelectorAll("[data-discard-suggestion]").forEach((button) => button.addEventListener("click", () => discardSuggestion(button.dataset.discardSuggestion)));
  }

  function acceptSuggestion(id) {
    const suggestion = state.imageSuggestions.find((item) => item.id === id);
    const field = document.getElementById(suggestion?.targetFieldId);
    if (!suggestion || !field) return;
    const currentValue = field.tagName === "SELECT" ? field.selectedOptions[0]?.textContent.trim() : field.value.trim();
    if (currentValue && currentValue !== "-" && normalize(currentValue) !== normalize(suggestion.proposedValue)) {
      const replace = window.confirm(`El campo “${fieldLabel(suggestion.targetFieldId)}” ya tiene un valor. ¿Querés reemplazarlo?`);
      if (!replace) return;
    }
    setFieldValue(field, suggestion.proposedValue);
    suggestion.decision = "accepted";
    state.steps[suggestion.targetStepId].status = "needs-review";
    state.steps[suggestion.targetStepId].isDirty = true;
    renderSuggestions();
    renderStepper();
  }

  function editSuggestion(id) {
    const suggestion = state.imageSuggestions.find((item) => item.id === id);
    if (!suggestion) return;
    const nextValue = window.prompt(`Editar sugerencia para ${fieldLabel(suggestion.targetFieldId)}`, suggestion.proposedValue);
    if (nextValue === null || !nextValue.trim()) return;
    suggestion.proposedValue = nextValue.trim();
    suggestion.decision = "pending";
    renderSuggestions();
  }

  function discardSuggestion(id) {
    const suggestion = state.imageSuggestions.find((item) => item.id === id);
    if (!suggestion) return;
    suggestion.decision = "discarded";
    renderSuggestions();
  }

  function bindSelections() {
    const gtinCards = Array.from(document.querySelectorAll("#paso10a > .row a"));
    gtinCards.forEach((card) => {
      const value = card.querySelector(".card-title")?.textContent.trim() || "";
      makeChoice(card, () => {
        const previous = state.values.gtinType;
        state.values.gtinType = value;
        selectOnly(gtinCards, card);
        markDirty(1, previous !== value);
      });
    });

    const distributionCards = Array.from(document.querySelectorAll("#paso20a [data-distribution-value]"));
    distributionCards.forEach((card) => makeChoice(card, () => {
      const value = card.dataset.distributionValue;
      const previous = state.values.distributionType;
      state.values.distributionType = value;
      selectOnly(distributionCards, card);
      markDirty(2, previous !== value);
    }));

    const businessCards = Array.from(document.querySelectorAll("#paso30a [data-business-line]"));
    businessCards.forEach((card) => makeChoice(card, () => {
      const value = card.dataset.businessLine;
      const previous = state.values.lineOfBusiness;
      state.values.lineOfBusiness = value;
      selectOnly(businessCards, card);
      markDirty(3, previous !== value);
    }));

    const categoryChoices = Array.from(document.querySelectorAll('#paso60a [onclick*="validar_paso60"]'));
    categoryChoices.forEach((choice) => makeChoice(choice, () => {
      state.values.category = choice.textContent.replace(/\s+/g, " ").trim();
      selectOnly(categoryChoices, choice);
      state.steps[6].isDirty = true;
    }));
  }

  function makeChoice(element, handler) {
    element.removeAttribute("onclick");
    element.href && element.setAttribute("href", "#");
    element.dataset.modernChoice = "";
    element.setAttribute("role", "radio");
    element.setAttribute("aria-checked", "false");
    element.setAttribute("tabindex", "0");
    element.addEventListener("click", (event) => {
      event.preventDefault();
      handler();
    });
    element.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        handler();
      }
    });
  }

  function selectOnly(collection, active) {
    collection.forEach((item) => {
      const selected = item === active;
      item.classList.toggle("is-selected", selected);
      item.setAttribute("aria-checked", String(selected));
    });
  }

  function bindFields() {
    root.addEventListener("input", handleFieldChange);
    root.addEventListener("change", handleFieldChange);
  }

  function handleFieldChange(event) {
    const panel = event.target.closest("[data-wizard-step]");
    if (!panel) return;
    const stepId = Number(panel.dataset.wizardStep);
    state.steps[stepId].isDirty = true;
    event.target.classList.remove("is-invalid");
  }

  function overrideLegacyNavigation() {
    window.validar_paso10 = () => completeStep(1);
    window.validar_paso11 = () => completeStep(1);
    window.validar_paso12 = () => completeStep(1);
    window.validar_paso20 = () => completeStep(2);
    window.validar_paso30 = () => completeStep(3);
    window.validar_paso40 = () => completeStep(4);
    window.validar_paso50 = () => completeStep(5);
    window.validar_paso60 = () => completeStep(6);
    window.validar_paso70 = () => completeStep(7);
    window.validar_paso80 = () => completeStep(8);
    window.validar_paso90 = () => completeStep(9);
    for (let stepId = 1; stepId <= 9; stepId += 1) {
      const legacyNumber = stepId * 10;
      window[`editar_paso${legacyNumber}`] = () => goToStep(stepId);
    }
  }

  function nextStep() {
    if (state.currentStep === 0) {
      completeStep(0);
      return;
    }
    completeStep(state.currentStep);
  }

  function completeStep(stepId) {
    if (!validateStep(stepId)) {
      state.steps[stepId].status = "error";
      render();
      return;
    }
    state.steps[stepId].status = "completed";
    state.steps[stepId].isDirty = false;
    state.highestAvailable = Math.max(state.highestAvailable, Math.min(9, stepId + 1));
    if (stepId === 9) {
      saveDraft(false);
      if (typeof originalFinalize === "function") originalFinalize();
      showCompletion();
      return;
    }
    goToStep(stepId + 1);
  }

  function validateStep(stepId) {
    // Este prototipo permite recorrer el flujo sin bloquear por campos incompletos.
    return true;
  }

  function showStepError(stepId, message) {
    const panel = document.getElementById(stepId === 0 ? "paso00a" : STEP_PANEL_IDS[stepId]);
    if (!panel) return false;
    let alert = panel.querySelector("[data-step-error]");
    if (!alert) {
      alert = document.createElement("div");
      alert.className = "alert alert-danger py-2";
      alert.setAttribute("role", "alert");
      alert.dataset.stepError = "";
      panel.insertBefore(alert, panel.querySelector(".product-wizard-step-intro")?.nextSibling || panel.firstChild);
    }
    alert.textContent = message;
    return false;
  }

  function clearStepError(panel) {
    panel?.querySelector("[data-step-error]")?.remove();
  }

  function previousStep() {
    if (state.currentStep <= 0) return;
    goToStep(state.currentStep - 1);
  }

  function skipAssistedUpload() {
    state.step0Skipped = true;
    state.steps[0].status = "skipped";
    state.highestAvailable = Math.max(state.highestAvailable, 1);
    goToStep(1);
  }

  function goToStep(stepId) {
    if (stepId !== 0 && stepId > state.highestAvailable && state.steps[stepId].status === "pending") return;
    if (state.currentStep !== stepId && state.steps[state.currentStep].status === "current") {
      state.steps[state.currentStep].status = state.currentStep === 0 && state.step0Skipped ? "skipped" : "pending";
    }
    state.currentStep = stepId;
    if (state.steps[stepId].status !== "completed" && state.steps[stepId].status !== "needs-review") {
      state.steps[stepId].status = "current";
    }
    if (stepId === 9) renderConfirmation();
    render();
    panelBody.scrollTop = 0;
    window.setTimeout(() => currentPanel()?.querySelector("h2")?.focus({ preventScroll: true }), 220);
  }

  function render() {
    Object.entries(STEP_PANEL_IDS).forEach(([stepId, panelId]) => {
      const panel = document.getElementById(panelId);
      if (panel) {
        const visible = Number(stepId) === state.currentStep;
        panel.hidden = !visible;
        panel.style.display = visible ? "block" : "none";
      }
    });
    const assisted = document.getElementById("paso00a");
    if (assisted) {
      assisted.hidden = state.currentStep !== 0;
      assisted.style.display = state.currentStep === 0 ? "block" : "none";
    }
    renderStepper();
    renderActions();
  }

  function renderStepper() {
    document.querySelectorAll("[data-stepper-item]").forEach((item) => {
      const stepId = Number(item.dataset.stepperItem);
      let status = state.steps[stepId].status;
      if (stepId === state.currentStep) status = "current";
      item.dataset.status = status;
      const button = item.querySelector("[data-stepper-button]");
      const marker = item.querySelector(".product-wizard-stepper__marker");
      const meta = item.querySelector(".product-wizard-stepper__meta");
      const accessible = stepId === 0 || stepId <= state.highestAvailable || ["completed", "needs-review", "error", "skipped"].includes(state.steps[stepId].status);
      button.disabled = !accessible;
      button.setAttribute("aria-current", stepId === state.currentStep ? "step" : "false");
      marker.textContent = status === "completed" ? "✓" : status === "needs-review" || status === "error" ? "!" : String(stepId);
      if (status === "skipped") meta.textContent = "Omitido";
      else if (status === "needs-review") meta.textContent = "Requiere revisión";
      else if (status === "error") meta.textContent = "Revisar errores";
      else meta.textContent = STEP_DEFINITIONS[stepId].meta;
    });
  }

  function renderActions() {
    const previous = actions.querySelector("[data-wizard-previous]");
    const skip = actions.querySelector("[data-wizard-skip]");
    const next = actions.querySelector("[data-wizard-next]");
    previous.disabled = state.currentStep === 0;
    skip.classList.toggle("d-none", state.currentStep !== 0);
    next.textContent = state.currentStep === 9
      ? "Confirmar y dar de alta"
      : state.currentStep === 0 && state.imageSuggestions.some((item) => item.decision === "accepted")
        ? "Continuar con sugerencias →"
        : "Continuar →";
  }

  function markDirty(stepId, changed) {
    state.steps[stepId].isDirty = true;
    if (!changed) return;
    (DEPENDENCIES[stepId] || []).forEach((dependentStep) => {
      if (state.steps[dependentStep].status === "completed") state.steps[dependentStep].status = "needs-review";
    });
    renderStepper();
  }

  function renderConfirmation() {
    const panel = document.getElementById("paso90a");
    if (!panel) return;
    let summary = panel.querySelector("[data-modern-confirmation]");
    if (!summary) {
      summary = document.createElement("section");
      summary.dataset.modernConfirmation = "";
      summary.className = "row g-3 mb-3";
      panel.querySelector(".product-wizard-step-intro")?.insertAdjacentElement("afterend", summary);
    }
    const product = document.getElementById("Producto")?.value || "Sin completar";
    const brand = document.getElementById("marca")?.selectedOptions[0]?.textContent.trim() || "Sin completar";
    const imageName = state.uploadedImages[0]?.name || document.getElementById("imagen-producto")?.files[0]?.name || "Sin imagen cargada";
    const rows = [
      ["Tipo de GTIN", state.values.gtinType || "Sin completar"],
      ["Distribución", state.values.distributionType || "Sin completar"],
      ["Línea de negocio", state.values.lineOfBusiness || "Sin completar"],
      ["Producto", product],
      ["Marca", brand],
      ["Categoría", state.values.category || document.getElementById("buscarconf")?.value || "Sin completar"],
      ["Imagen", imageName],
      ["Carga asistida", state.step0Skipped ? "Omitida" : state.uploadedImages.length ? `${state.uploadedImages.length} imagen(es)` : "No utilizada"],
    ];
    summary.innerHTML = rows.map(([label, value]) => `
      <div class="col-md-6">
        <div class="border rounded-3 p-3 h-100">
          <div class="small text-secondary">${escapeHtml(label)}</div>
          <div class="fw-semibold">${escapeHtml(value)}</div>
        </div>
      </div>
    `).join("");
  }

  function showCompletion() {
    const card = document.getElementById("card-nuevo-producto");
    const layout = card?.querySelector(".product-wizard-modern__layout");
    const header = card?.querySelector(".product-wizard-modern__header");
    if (!card || !completionHost) return;

    card.classList.add("product-wizard-modern--complete");
    header.hidden = true;
    layout.hidden = true;
    completionHost.hidden = false;
    const finalCard = completionHost.querySelector("#ficha-final");
    if (finalCard) finalCard.style.display = "block";
    completionHost.scrollIntoView({ behavior: "smooth", block: "start" });
    completionHost.querySelector(".h1, h1, h2")?.setAttribute("tabindex", "-1");
    completionHost.querySelector(".h1, h1, h2")?.focus({ preventScroll: true });
  }

  function setupAiValidation() {
    const trigger = document.getElementById("aiValidateButton");
    if (!trigger || document.getElementById("aiValidationModal")) return;

    document.body.insertAdjacentHTML("beforeend", `
      <div class="modal fade" id="aiValidationModal" tabindex="-1" aria-labelledby="aiValidationTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-body text-center p-4">
              <div class="spinner-border text-primary mb-3" role="status" data-ai-validation-spinner><span class="visually-hidden">Validando…</span></div>
              <h2 class="h5 mb-2" id="aiValidationTitle" data-ai-validation-title>Validando con IA</h2>
              <p class="text-secondary mb-0" data-ai-validation-copy>Estamos revisando la información del producto.</p>
              <div class="d-none" data-ai-validation-success>
                <div class="fs-2 text-success mb-2" aria-hidden="true">✓</div>
                <p class="text-success fw-semibold mb-0">Validación completada.</p>
              </div>
            </div>
            <div class="modal-footer justify-content-center d-none" data-ai-validation-footer>
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal">OK</button>
            </div>
          </div>
        </div>
      </div>
    `);

    const modalElement = document.getElementById("aiValidationModal");
    const modal = new window.bootstrap.Modal(modalElement);
    trigger.addEventListener("click", () => {
      const spinner = modalElement.querySelector("[data-ai-validation-spinner]");
      const title = modalElement.querySelector("[data-ai-validation-title]");
      const copy = modalElement.querySelector("[data-ai-validation-copy]");
      const success = modalElement.querySelector("[data-ai-validation-success]");
      const footer = modalElement.querySelector("[data-ai-validation-footer]");
      spinner.classList.remove("d-none");
      title.textContent = "Validando con IA";
      copy.classList.remove("d-none");
      success.classList.add("d-none");
      footer.classList.add("d-none");
      modal.show();
      window.setTimeout(() => {
        spinner.classList.add("d-none");
        title.textContent = "Validación completa";
        copy.classList.add("d-none");
        success.classList.remove("d-none");
        footer.classList.remove("d-none");
      }, 3000);
    });
  }

  function saveDraft(showFeedback) {
    if (showFeedback) showToast("El borrador se mantiene solo mientras esta página permanezca abierta.", "info");
  }

  function clearLegacyDraft() {
    try {
      localStorage.removeItem("gs1.productWizard.draft.v1");
    } catch (error) {
      // El flujo sigue funcionando aunque el navegador no permita almacenamiento local.
    }
  }

  function currentPanel() {
    return document.getElementById(state.currentStep === 0 ? "paso00a" : STEP_PANEL_IDS[state.currentStep]);
  }

  function setFieldValue(field, value) {
    if (field.tagName === "SELECT") {
      let option = Array.from(field.options).find((item) => normalize(item.textContent) === normalize(value));
      if (!option) {
        option = new Option(value, value);
        field.add(option);
      }
      field.value = option.value;
    } else {
      field.value = value;
    }
    field.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function fieldLabel(fieldId) {
    const field = document.getElementById(fieldId);
    const label = field ? document.querySelector(`label[for="${cssEscape(fieldId)}"]`) : null;
    return label?.textContent.replace(/\s+/g, " ").trim() || {
      Producto: "Producto",
      marca: "Marca",
      contenidoneto: "Contenido neto",
      buscarconf: "Categoría",
    }[fieldId] || fieldId;
  }

  function confidenceLabel(value) {
    return { high: "alta", medium: "media", low: "baja" }[value] || "sin informar";
  }

  function formatBytes(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function showToast(message, variant) {
    if (window.GS1Utils?.showSimulationToast) {
      window.GS1Utils.showSimulationToast(message, variant);
      return;
    }
    window.alert(message);
  }

  function normalize(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function escapeHtml(value) {
    return window.GS1Utils?.escapeHtml ? window.GS1Utils.escapeHtml(value) : String(value || "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    })[character]);
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function cssEscape(value) {
    return window.CSS?.escape ? window.CSS.escape(value) : String(value).replace(/["\\]/g, "\\$&");
  }
})();
