(function () {
  document.addEventListener("DOMContentLoaded", initDigitalLinkPage);

  function initDigitalLinkPage() {
    const mount = document.getElementById("digitalLinkMount");
    if (!mount) {
      return;
    }
    const record = resolveRecord();
    const gtin = record ? window.GS1Utils.normalizeDigitalLinkGtin(record.code) : "";
    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <div class="alert alert-info">Esta herramienta genera un GS1 QR Code con Digital Link en modo simulaci&oacute;n.</div>
          <div class="row g-4">
            <div class="col-lg-7">
              <h1 class="h3 mb-3">Generador de GS1 QR Code (Digital Link)</h1>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label" for="digitalLinkGtin">GTIN</label>
                  <input class="form-control" id="digitalLinkGtin" value="${escapeHtml(gtin)}">
                </div>
                <div class="col-md-6"><label class="form-label" for="digitalLinkBrand">Marca</label><input class="form-control" id="digitalLinkBrand" value="${escapeHtml(record ? record.brand : "")}"></div>
                <div class="col-md-6"><label class="form-label" for="digitalLinkImage">Imagen</label><input class="form-control" id="digitalLinkImage" value="${escapeHtml(record ? record.image : "")}"></div>
                <div class="col-md-6">
                  <label class="form-label" for="digitalLinkName">Nombre del producto</label>
                  <input class="form-control" id="digitalLinkName" value="${escapeHtml(record ? record.name : "")}">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="digitalLinkDescription">Descripción</label>
                  <input class="form-control" id="digitalLinkDescription" value="${escapeHtml(record ? record.shortDescription : "")}">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="digitalLinkTargetUrl">URL del producto</label>
                  <input class="form-control" id="digitalLinkTargetUrl" value="${escapeHtml(record ? `https://id.gs1.org/01/${gtin}` : "")}">
                </div>
                <div class="col-12">
                  <label class="form-label">Digital Link calculado</label>
                  <div class="input-group">
                    <input class="form-control" id="digitalLinkValue" readonly value="https://id.gs1.org/01/${escapeHtml(gtin)}">
                    <button class="btn btn-outline-secondary" id="copyDigitalLinkBtn" type="button">Copiar</button>
                  </div>
                </div>
              </div>
              <div class="gs1-links-panel mt-4">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h2 class="h5 mb-0">Links asociados</h2>
                  <button class="btn btn-outline-primary btn-sm" id="addLinkRowBtn" type="button">Agregar nuevo link</button>
                </div>
                <div id="digitalLinkRows"></div>
              </div>
            </div>
            <div class="col-lg-5">
              <div class="gs1-side-panel">
                <div class="gs1-code-preview mb-3" id="digitalLinkPreview"></div>
                <div class="row g-2">
                  ${field("Escala horizontal", "dlScaleX", "number", "2")}
                  ${field("Escala vertical", "dlScaleY", "number", "2")}
                  ${field("Rotacion", "dlRotation", "number", "0")}
                </div>
                <label class="form-label mt-3" for="dlType">Tipo de link</label>
                <select class="form-select" id="dlType" disabled><option>Tipos pendientes de definición</option></select>
                <div class="small text-secondary mt-2">// TODO: pendiente de definición (Lucas): incorporar únicamente los tipos definidos en el Excel de referencia.</div>
                <label class="form-label mt-3" for="dlFormat">Formato</label>
                <select class="form-select" id="dlFormat"><option>PNG</option><option>JPG</option><option>JPEG</option></select>
                <div class="d-flex flex-wrap gap-2 mt-4">
                  <button class="btn btn-outline-secondary" id="saveDigitalLinkBtn" type="button">Guardar cambios</button>
                  <button class="btn btn-primary" id="generateDigitalLinkBtn" type="button">Generar c&oacute;digo</button>
                  <button class="btn btn-outline-secondary" id="downloadDigitalLinkBtn" type="button">Descargar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    bindDigitalLinkEvents();
    renderPreview();
  }

  function bindDigitalLinkEvents() {
    document.getElementById("addLinkRowBtn").addEventListener("click", () => addRow());
    document.getElementById("copyDigitalLinkBtn").addEventListener("click", copyDigitalLink);
    document.getElementById("saveDigitalLinkBtn").addEventListener("click", () => window.GS1Utils.showSimulationToast("Cambios guardados correctamente.", "success"));
    document.getElementById("generateDigitalLinkBtn").addEventListener("click", renderPreview);
    document.getElementById("downloadDigitalLinkBtn").addEventListener("click", () => window.GS1Utils.showSimulationToast("Descarga simulada correctamente.", "success"));
  }

  function addRow(values) {
    const host = document.getElementById("digitalLinkRows");
    const row = document.createElement("div");
    row.className = "gs1-link-row";
    row.innerHTML = `
      <input class="form-control" placeholder="https://..." value="${escapeHtml(values && values.url || "")}">
      <input class="form-control" placeholder="Tipo de link" value="${escapeHtml(values && values.type || "")}">
      <div class="form-check d-flex align-items-center gap-2">
        <input class="form-check-input gs1-link-principal" name="digitalLinkPrincipal" type="radio" ${values && values.principal ? "checked" : ""}>
        <label class="form-check-label">Principal</label>
      </div>
      <button class="btn btn-outline-danger" type="button">Eliminar</button>
    `;
    row.querySelector("button").addEventListener("click", () => row.remove());
    host.appendChild(row);
  }

  async function copyDigitalLink() {
    const value = document.getElementById("digitalLinkValue").value;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const helper = document.createElement("textarea");
        helper.value = value;
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        helper.remove();
      }
      window.GS1Utils.showSimulationToast("Digital Link copiado correctamente.", "success");
    } catch (error) {
      window.GS1Utils.showSimulationToast("No fue posible copiar el Digital Link.", "danger");
    }
  }

  function renderPreview() {
    const gtin = window.GS1Utils.normalizeDigitalLinkGtin(document.getElementById("digitalLinkGtin").value);
    document.getElementById("digitalLinkValue").value = `https://id.gs1.org/01/${gtin}`;
    document.getElementById("digitalLinkPreview").innerHTML = `<div class="gs1-matrix-preview"><img src="../assets/img/qr_gs1.jpg" alt="Previsualización QR Digital Link" class="img-fluid rounded"><div class="small mt-2">https://id.gs1.org/01/${escapeHtml(gtin)}</div></div>`;
  }

  function resolveRecord() {
    const id = window.GS1Utils.getUrlParam("id");
    return id ? window.GS1ProductCatalog.getById(id) : null;
  }

  function field(label, id, type, value) {
    return `<div class="col-md-4"><label class="form-label" for="${id}">${label}</label><input class="form-control" id="${id}" type="${type}" value="${value}"></div>`;
  }

  function escapeHtml(value) {
    return window.GS1Utils.escapeHtml(value);
  }
})();
