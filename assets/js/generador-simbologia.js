(function () {
  const TYPES = ["GTIN-13", "GTIN-14", "UPC-A", "GS1-128", "SSCC", "GS1 DataMatrix", "QR Code Digital Link", "DataMatrix Digital Link"];
  document.addEventListener("DOMContentLoaded", initSymbolGenerator);

  function initSymbolGenerator() {
    const mount = document.getElementById("symbolGeneratorMount");
    if (!mount) {
      return;
    }
    const record = resolveRecord();
    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <div class="row g-4">
            <div class="col-lg-4">
              <div class="gs1-side-panel">
                <label class="form-label" for="symbolType">Simbología</label>
                <div class="btn-group w-100 mb-3" role="group" aria-label="Selector de simbología">
                  <button type="button" class="btn btn-outline-primary symbol-type-button is-active" data-symbol-type="GTIN-13">EAN-13</button>
                  <button type="button" class="btn btn-outline-primary symbol-type-button" data-symbol-type="GTIN-14">ITF-14</button>
                  <button type="button" class="btn btn-outline-primary symbol-type-button" data-symbol-type="Otros" data-bs-toggle="collapse" data-bs-target="#otherSymbolTypes">Otros</button>
                </div>
                <div class="collapse mb-3" id="otherSymbolTypes">
                  <select class="form-select" id="symbolTypeOther">${TYPES.slice(2).map((type) => `<option value="${type}">${type}</option>`).join("")}</select>
                </div>
                <select class="visually-hidden" id="symbolType">${TYPES.map((type) => `<option>${type}</option>`).join("")}</select>
                <label class="form-label" for="symbolCode">Ingres&aacute; el c&oacute;digo</label>
                <input class="form-control mb-3" id="symbolCode" value="${escapeHtml(record ? record.code : "")}">
                <div class="row g-2">
                  ${numberField("Alto", "symbolHeight", "60")}
                  ${numberField("Ancho", "symbolWidth", "100")}
                  ${numberField("Giro", "symbolRotation", "0")}
                </div>
                <div class="form-check mt-3">
                  <input class="form-check-input" id="symbolFitHeight" type="checkbox">
                  <label class="form-check-label" for="symbolFitHeight">Ajustar alto</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" id="symbolFitWidth" type="checkbox" checked>
                  <label class="form-check-label" for="symbolFitWidth">Ajustar ancho</label>
                </div>
                <label class="form-label mt-3" for="symbolFormat">Formato</label>
                <select class="form-select" id="symbolFormat"><option>PNG</option><option>JPG</option><option>JPEG</option></select>
              </div>
            </div>
            <div class="col-lg-8">
              <div class="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div>
                  <h1 class="h3 mb-1">Generador de Simbolog&iacute;a</h1>
                  <div class="text-secondary">${escapeHtml(record ? `${record.type} | ${record.name}` : "Herramienta de simulacion local")}</div>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-primary" id="generateSymbolBtn" type="button">Generar c&oacute;digo</button>
                  <button class="btn btn-outline-secondary" id="resetSymbolBtn" type="button">Restablecer</button>
                  <button class="btn btn-outline-secondary" id="downloadSymbolBtn" type="button">Descargar</button>
                </div>
              </div>
              <div class="gs1-code-preview" id="symbolPreview"></div>
            </div>
          </div>
        </div>
      </section>
    `;
    if (record) {
      const inferredType = inferType(record.type);
      document.getElementById("symbolType").value = inferredType;
      document.querySelectorAll("[data-symbol-type]").forEach((button) => {
        button.classList.toggle("is-active", button.dataset.symbolType === inferredType);
      });
    }
    bindGenerator();
    renderPreview();
  }

  function bindGenerator() {
    document.querySelectorAll("[data-symbol-type]").forEach((button) => button.addEventListener("click", () => {
      const type = button.dataset.symbolType === "Otros" ? document.getElementById("symbolTypeOther").value : button.dataset.symbolType;
      document.getElementById("symbolType").value = type;
      document.querySelectorAll("[data-symbol-type]").forEach((item) => item.classList.toggle("is-active", item === button));
      renderPreview();
    }));
    document.getElementById("symbolTypeOther").addEventListener("change", (event) => {
      document.getElementById("symbolType").value = event.target.value;
      document.querySelectorAll("[data-symbol-type]").forEach((item) => item.classList.toggle("is-active", item.dataset.symbolType === "Otros"));
      renderPreview();
    });
    document.getElementById("generateSymbolBtn").addEventListener("click", renderPreview);
    document.getElementById("resetSymbolBtn").addEventListener("click", () => window.location.reload());
    document.getElementById("downloadSymbolBtn").addEventListener("click", () => window.GS1Utils.showSimulationToast("Descarga simulada correctamente.", "success"));
  }

  function renderPreview() {
    const type = document.getElementById("symbolType").value;
    const code = document.getElementById("symbolCode").value.trim();
    const preview = document.getElementById("symbolPreview");
    const numericTypes = ["GTIN-13", "GTIN-14", "UPC-A", "SSCC"];
    if (!code || (numericTypes.includes(type) && !/^\d+$/.test(code))) {
      preview.innerHTML = `<div class="alert alert-warning mb-0">Ingres&aacute; un c&oacute;digo v&aacute;lido para generar la previsualizaci&oacute;n.</div>`;
      return;
    }
    const imageByType = {
      "GTIN-13": "../GTIN-13 imagen.png",
      "GTIN-14": "../GENERADOR DE SIMBOLOGIA.png",
      "UPC-A": "../UPC-12 Imagen.png",
      "GS1-128": "../GENERADOR DE SIMBOLOGIA.png",
      "SSCC": "../GENERADOR DE SIMBOLOGIA.png",
      "GS1 DataMatrix": "../QR-DATAMATRIX.png",
      "DataMatrix Digital Link": "../QR-DATAMATRIX.png",
      "QR Code Digital Link": "../assets/img/qr_gs1.jpg",
    };
    preview.innerHTML = type.includes("QR") || type.includes("DataMatrix")
      ? `<div class="gs1-matrix-preview"><img src="${imageByType[type]}" alt="Previsualización ${escapeHtml(type)}"><div class="small mt-2">${escapeHtml(code)}</div></div>`
      : `<div class="gs1-linear-preview"><img src="${imageByType[type]}" alt="Previsualización ${escapeHtml(type)}"><div class="small mt-3">${escapeHtml(type)} | ${escapeHtml(code)}</div></div>`;
  }

  function resolveRecord() {
    const id = window.GS1Utils.getUrlParam("id");
    return id ? window.GS1ProductCatalog.getById(id) : null;
  }

  function inferType(type) {
    if (type === "GTIN-14") {
      return "GTIN-14";
    }
    if (type === "UPC-12") {
      return "UPC-A";
    }
    return "GTIN-13";
  }

  function numberField(label, id, value) {
    return `<div class="col-md-4"><label class="form-label" for="${id}">${label}</label><input class="form-control" id="${id}" type="number" value="${value}"></div>`;
  }

  function escapeHtml(value) {
    return window.GS1Utils.escapeHtml(value);
  }
})();
