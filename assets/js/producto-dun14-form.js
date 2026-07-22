(function () {
  const EDITABLE_FIELDS = [
    "packagingLevel",
    "containedGtin",
    "containedDescription",
    "code",
    "unitsContained",
    "name",
    "packaging",
    "image",
    "baseQuantity",
    "modifiedAt",
  ];

  document.addEventListener("DOMContentLoaded", initDispatchFormPage);

  function initDispatchFormPage() {
    if (!window.GS1ProductCatalog) {
      return;
    }

    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const record = params.get("id") ? window.GS1ProductCatalog.getById(params.get("id")) : null;
    if (!record || record.mode !== "dispatchUnits") {
      return;
    }

    if (/producto-nuevo-dun14\.html$/i.test(path) && params.get("mode") === "copy") {
      preloadDispatchFields(record, true);
    }

    if (/producto-editar-dun14\.html$/i.test(path)) {
      const mount = document.getElementById("dispatchEditMount");
      if (!mount) {
        return;
      }
      mountDispatchEditor({
        mount,
        record,
        context: "page",
      });
    }
  }

  function mountDispatchEditor({ mount, record, context = "page", onSave, onCancel } = {}) {
    if (!mount || !record) {
      return null;
    }

    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell dispatch-editor dispatch-editor--${escapeAttribute(context)}">
        <div class="card-body">
          <div class="gs1-tool-header">
            <div>
              <div class="text-secondary small">GTIN-14</div>
              <h1 class="h4 mb-1">${context === "modal" ? "Modificar unidad de despacho" : "Edición de unidad de despacho"}</h1>
              <div class="text-secondary">${escapeHtml(record.name)} | ${escapeHtml(record.code)}</div>
            </div>
            ${context === "page" ? '<a href="productos.html" class="btn btn-outline-secondary">Volver al listado</a>' : ""}
          </div>
          <form class="row g-3 dispatch-editor__form" novalidate>
            ${renderField("Variable logística", "packagingLevel", record.packagingLevel)}
            ${renderField("GTIN contenido", "containedGtin", record.containedGtin, { required: true })}
            ${renderField("Descripción del GTIN contenido", "containedDescription", record.containedDescription)}
            ${renderField("GTIN-14", "code", record.code, { required: true })}
            ${renderField("Unidades contenidas", "unitsContained", record.unitsContained, { required: true, inputMode: "numeric" })}
            ${renderField("Descripción de la unidad de despacho", "name", record.name, { required: true })}
            ${renderField("Envase agrupador", "packaging", record.packaging)}
            <div class="col-12 col-lg-6">
              <label class="form-label" for="dispatchImage">Imagen</label>
              <input class="form-control" id="dispatchImage" name="imageFile" type="file" accept="image/*">
            </div>
            <div class="col-12 col-lg-6">
              <div class="dispatch-editor__preview">
                ${renderImagePreview(record)}
              </div>
            </div>
            <div class="col-12 d-none" data-dispatch-feedback></div>
            <div class="col-12 d-flex flex-wrap gap-2 dispatch-editor__actions">
              <button type="submit" class="btn btn-primary">Confirmar modificación</button>
              <button type="button" class="btn btn-outline-secondary" data-dispatch-cancel>${context === "modal" ? "Cancelar" : "Volver"}</button>
            </div>
          </form>
        </div>
      </section>
    `;

    const form = mount.querySelector("form");
    const feedback = mount.querySelector("[data-dispatch-feedback]");
    const cancelButton = mount.querySelector("[data-dispatch-cancel]");
    const imageInput = mount.querySelector("#dispatchImage");
    const preview = mount.querySelector("[data-dispatch-preview]");
    let currentImage = record.image || "";

    cancelButton.addEventListener("click", () => {
      if (typeof onCancel === "function") {
        onCancel();
      } else if (context === "page") {
        window.location.href = "productos.html";
      }
    });

    imageInput.addEventListener("change", () => {
      const file = imageInput.files && imageInput.files[0];
      if (!file || !preview) {
        return;
      }
      const nextUrl = URL.createObjectURL(file);
      preview.innerHTML = `<img src="${escapeAttribute(nextUrl)}" alt="Vista previa de la unidad de despacho" class="img-fluid rounded border">`;
      currentImage = nextUrl;
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const payload = {
        packagingLevel: form.elements.packagingLevel.value.trim(),
        containedGtin: form.elements.containedGtin.value.trim(),
        containedDescription: form.elements.containedDescription.value.trim(),
        code: form.elements.code.value.trim(),
        unitsContained: form.elements.unitsContained.value.trim(),
        name: form.elements.name.value.trim(),
        packaging: form.elements.packaging.value.trim(),
        image: currentImage,
      };
      const errors = validatePayload(payload);
      if (errors.length) {
        renderFeedback(feedback, "danger", errors.join(" "));
        return;
      }

      const updatedRecord = persistDispatchRecord(record.id, payload);
      if (!updatedRecord) {
        renderFeedback(feedback, "danger", "No se pudo guardar la modificación simulada.");
        return;
      }

      renderFeedback(feedback, "success", "La modificación se guardó correctamente en la simulación.");
      if (window.GS1Utils) {
        window.GS1Utils.showSimulationToast("Modificación de unidad de despacho simulada correctamente.", "success");
      }
      if (typeof onSave === "function") {
        onSave(updatedRecord);
      }
    });

    return {
      unmount() {
        mount.innerHTML = "";
      },
    };
  }

  function renderField(label, name, value, options = {}) {
    const requiredBadge = options.required
      ? ' <span class="text-danger" aria-label="obligatorio">*</span>'
      : "";
    const inputMode = options.inputMode ? ` inputmode="${escapeAttribute(options.inputMode)}"` : "";

    return `
      <div class="col-12 col-md-6">
        <label class="form-label" for="dispatch-${name}">${label}${requiredBadge}</label>
        <input class="form-control" id="dispatch-${name}" name="${name}" value="${escapeAttribute(value || "")}"${inputMode}>
      </div>
    `;
  }

  function renderImagePreview(record) {
    if (record.image) {
      return `<div data-dispatch-preview><img src="${escapeAttribute(record.image)}" alt="Imagen de ${escapeAttribute(record.name)}" class="img-fluid rounded border"></div>`;
    }

    return `
      <div class="product-image-placeholder" data-dispatch-preview>
        <span>Sin imagen disponible</span>
      </div>
    `;
  }

  function validatePayload(payload) {
    const errors = [];
    if (!payload.containedGtin) {
      errors.push("El GTIN contenido es obligatorio.");
    }
    if (!payload.code) {
      errors.push("El GTIN-14 es obligatorio.");
    }
    if (!payload.unitsContained || Number(payload.unitsContained) <= 0) {
      errors.push("Las unidades contenidas deben ser mayores que cero.");
    }
    if (!payload.name) {
      errors.push("La descripción de la unidad de despacho es obligatoria.");
    }
    return errors;
  }

  function persistDispatchRecord(id, payload) {
    if (!window.GS1ProductCatalog || typeof window.GS1ProductCatalog.updateById !== "function") {
      return null;
    }

    const patch = EDITABLE_FIELDS.reduce((accumulator, field) => {
      if (Object.prototype.hasOwnProperty.call(payload, field)) {
        accumulator[field] = payload[field];
      }
      return accumulator;
    }, {});

    patch.baseQuantity = `${payload.unitsContained} unidades base`;
    patch.modifiedAt = "2026-07-16";
    return window.GS1ProductCatalog.updateById(id, patch);
  }

  function renderFeedback(feedback, tone, message) {
    if (!feedback) {
      return;
    }
    feedback.className = `col-12 alert alert-${tone}`;
    feedback.textContent = message;
  }

  function preloadDispatchFields(record, isCopy) {
    const host = document.getElementById("card-nuevo-producto");
    if (!host || host.querySelector(".gs1-inline-banner")) {
      return;
    }
    host.insertAdjacentHTML("afterbegin", `
      <div class="alert alert-primary gs1-inline-banner" role="status">
        <div class="fw-semibold">Copia de unidad de despacho</div>
        <div class="small">Se precargaron los datos logísticos de <strong>${escapeHtml(record.name)}</strong>. El nuevo GTIN-14 debe asignarse nuevamente. GTIN-14 original: <span class="fw-semibold">${escapeHtml(record.code)}</span>.</div>
      </div>
    `);
    setValue("#Producto", record.name);
    setValue("#codigo", isCopy ? "" : record.code);
    setValue("#codigointerno", record.containedGtin || "");
  }

  function setValue(selector, value) {
    const field = document.querySelector(selector);
    if (field) {
      field.value = value || "";
    }
  }

  function escapeHtml(value) {
    return window.GS1Utils ? window.GS1Utils.escapeHtml(value) : String(value || "");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }

  window.GS1DispatchEditor = {
    mount: mountDispatchEditor,
  };
})();
