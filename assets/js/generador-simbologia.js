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
                  <button type="button" class="btn btn-outline-primary symbol-type-button is-active" aria-pressed="true" data-symbol-type="GTIN-13">EAN-13</button>
                  <button type="button" class="btn btn-outline-primary symbol-type-button" aria-pressed="false" data-symbol-type="GTIN-14">ITF-14</button>
                  <button type="button" class="btn btn-outline-primary symbol-type-button" aria-pressed="false" data-symbol-type="Otros" data-bs-toggle="collapse" data-bs-target="#otherSymbolTypes">Otros</button>
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
                <div class="d-grid mt-3">
                  <button class="btn btn-outline-secondary" id="resetSymbolBtn" type="button">Restablecer</button>
                </div>
              </div>
            </div>
            <div class="col-lg-8">
              <div class="gs1-tool-header">
                <div>
                  <h1 class="h3 mb-1">Generador de Simbolog&iacute;a</h1>
                  <div class="text-secondary">${escapeHtml(record ? `${record.type} | ${record.name}` : "Herramienta de simulacion local")}</div>
                </div>
                <div class="btn-group gs1-tool-help-actions" role="group" aria-label="Material de ayuda para el generador de simbología">
                  <a class="btn btn-outline-primary" href="../assets/archivos/Instructivo_ABM.pdf" download>Descargar instructivo Generador de simbología</a>
                  <button class="btn btn-outline-primary" type="button">Video de ayuda Generador de simbología</button>
                </div>
              </div>
              <div class="d-flex flex-wrap justify-content-end gap-2 mb-3">
                <button class="btn btn-primary" id="generateSymbolBtn" type="button">Generar c&oacute;digo</button>
                <button class="btn btn-outline-secondary" id="downloadSymbolBtn" type="button">Descargar</button>
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
      setActiveSymbolButton(inferredType === "GTIN-13" || inferredType === "GTIN-14" ? inferredType : "Otros");
    }
    bindGenerator();
    renderPreview();
  }

  function bindGenerator() {
    document.querySelectorAll("[data-symbol-type]").forEach((button) => button.addEventListener("click", () => {
      const type = button.dataset.symbolType === "Otros" ? document.getElementById("symbolTypeOther").value : button.dataset.symbolType;
      document.getElementById("symbolType").value = type;
      setActiveSymbolButton(button.dataset.symbolType);
      renderPreview();
    }));
    document.getElementById("symbolTypeOther").addEventListener("change", (event) => {
      const selectedType = event.target.value;
      if (selectedType === "QR Code Digital Link" || selectedType === "DataMatrix Digital Link") {
        const url = new URL("qr-digital-link.html", window.location.href);
        const id = new URLSearchParams(window.location.search).get("id");
        const gtin = document.getElementById("symbolCode").value.trim();
        if (id) url.searchParams.set("id", id);
        if (gtin) url.searchParams.set("gtin", gtin);
        window.location.assign(url.toString());
        return;
      }
      document.getElementById("symbolType").value = selectedType;
      setActiveSymbolButton("Otros");
      renderPreview();
    });
    document.getElementById("symbolCode").addEventListener("input", renderPreview);
    document.getElementById("generateSymbolBtn").addEventListener("click", generateFinalSymbol);
    document.getElementById("resetSymbolBtn").addEventListener("click", () => window.location.reload());
    document.getElementById("downloadSymbolBtn").addEventListener("click", () => window.GS1Utils.showSimulationToast("Descarga simulada correctamente.", "success"));
  }

  function setActiveSymbolButton(symbolType) {
    document.querySelectorAll("[data-symbol-type]").forEach((item) => {
      const isActive = item.dataset.symbolType === symbolType;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });
  }

  function generateFinalSymbol() {
    const code = document.getElementById("symbolCode").value.trim();
    const type = document.getElementById("symbolType").value;
    if (!isValidPreviewCode(type, code)) {
      renderPreview();
      return;
    }
    window.GS1Utils.showSimulationToast("Generación definitiva simulada correctamente.", "success");
  }

  function renderPreview() {
    const type = document.getElementById("symbolType").value;
    const code = document.getElementById("symbolCode").value.trim();
    const preview = document.getElementById("symbolPreview");
    if (!isValidPreviewCode(type, code)) {
      preview.innerHTML = `<div class="alert alert-warning mb-0">Ingres&aacute; un c&oacute;digo v&aacute;lido para generar la previsualizaci&oacute;n.</div>`;
      return;
    }
    const imageByType = {
      "GTIN-13": "../assets/img/GTIN-13 imagen.png",
      "GTIN-14": "../assets/img/GENERADOR DE SIMBOLOGIA.png",
      "UPC-A": "../assets/img/UPC-12 Imagen.png",
      "GS1-128": "../assets/img/GENERADOR DE SIMBOLOGIA.png",
      "SSCC": "../assets/img/GENERADOR DE SIMBOLOGIA.png",
      "GS1 DataMatrix": "../assets/img/QR-DATAMATRIX.png",
      "DataMatrix Digital Link": "../assets/img/QR-DATAMATRIX.png",
      "QR Code Digital Link": "../assets/img/qr_gs1.jpg",
    };
    preview.innerHTML = type.includes("QR") || type.includes("DataMatrix")
      ? `<div class="gs1-matrix-preview"><img src="${imageByType[type]}" alt="Previsualización ${escapeHtml(type)}"><div class="small mt-2">${escapeHtml(code)}</div></div>`
      : `<div class="gs1-linear-preview"><img src="${imageByType[type]}" alt="Previsualización ${escapeHtml(type)}"><div class="small mt-3">${escapeHtml(type)} | ${escapeHtml(code)}</div></div>`;
  }

  function isValidPreviewCode(type, code) {
    const numericTypes = ["GTIN-13", "GTIN-14", "UPC-A", "SSCC"];
    return Boolean(code) && (!numericTypes.includes(type) || /^\d+$/.test(code));
  }

  function resolveRecord() {
    const id = window.GS1Utils.getUrlParam("id");
    return id ? window.GS1ProductCatalog.getById(id) : null;
  }

  function inferType(type) {
    if (type === "GTIN-14" || type === "DUN 14") {
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
