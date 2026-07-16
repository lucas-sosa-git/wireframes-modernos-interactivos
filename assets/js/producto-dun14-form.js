(function () {
  document.addEventListener("DOMContentLoaded", initDispatchForm);

  function initDispatchForm() {
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
      renderDispatchEditor(record);
    }
  }

  function preloadDispatchFields(record, isCopy) {
    const host = document.getElementById("card-nuevo-producto");
    if (!host || host.querySelector(".gs1-inline-banner")) {
      return;
    }
    host.insertAdjacentHTML("afterbegin", `
      <div class="alert alert-primary gs1-inline-banner" role="status">
        <div class="fw-semibold">Copia de unidad de despacho</div>
        <div class="small">Se precargaron los datos log&iacute;sticos de <strong>${escapeHtml(record.name)}</strong>. El nuevo GTIN-14 debe asignarse nuevamente. GTIN-14 original: <span class="fw-semibold">${escapeHtml(record.code)}</span>.</div>
      </div>
    `);
    setValue("#Producto", record.name);
    setValue("#codigo", isCopy ? "" : record.code);
    setValue("#codigointerno", record.containedGtin || "");
  }

  function renderDispatchEditor(record) {
    const mount = document.getElementById("dispatchEditMount");
    if (!mount) {
      return;
    }
    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between gap-3 align-items-start mb-4">
            <div>
              <div class="text-secondary small">GTIN-14</div>
              <h1 class="h3 mb-1">Modificar unidad de despacho</h1>
              <div class="text-secondary">${escapeHtml(record.name)}</div>
            </div>
            <a href="productos.html" class="btn btn-outline-secondary">Volver al listado</a>
          </div>
          <form id="dispatchEditForm" class="row g-3">
            ${field("Variable logistica", "dispatchVariable", record.packagingLevel)}
            ${field("GTIN contenido", "dispatchContainedGtin", record.containedGtin)}
            ${field("Descripcion del GTIN contenido", "dispatchContainedDescription", record.containedDescription)}
            ${field("GTIN-14", "dispatchCode", record.code)}
            ${field("Unidades contenidas", "dispatchUnits", record.unitsContained)}
            ${field("Descripcion de la unidad de despacho", "dispatchName", record.name)}
            ${field("Envase agrupador", "dispatchPackaging", record.packagingLevel)}
            <div class="col-12">
              <label class="form-label" for="dispatchImage">Imagen</label>
              <input class="form-control" id="dispatchImage" type="file" accept="image/*">
            </div>
            <div class="col-12 d-flex flex-wrap gap-2">
              <button type="submit" class="btn btn-primary">Confirmar modificacion</button>
              <a href="productos.html" class="btn btn-outline-secondary">Volver al listado</a>
            </div>
            <div class="col-12 d-none" id="dispatchEditSuccess">
              <div class="alert alert-success mb-0">La modificacion se guardo correctamente en la simulacion.</div>
            </div>
          </form>
        </div>
      </section>
    `;

    document.getElementById("dispatchEditForm").addEventListener("submit", (event) => {
      event.preventDefault();
      document.getElementById("dispatchEditSuccess").classList.remove("d-none");
      if (window.GS1Utils) {
        window.GS1Utils.showSimulationToast("Modificacion de unidad de despacho simulada correctamente.", "success");
      }
    });
  }

  function field(label, id, value) {
    return `
      <div class="col-md-6">
        <label class="form-label" for="${id}">${label}</label>
        <input class="form-control" id="${id}" value="${escapeHtml(value || "")}">
      </div>
    `;
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
})();
