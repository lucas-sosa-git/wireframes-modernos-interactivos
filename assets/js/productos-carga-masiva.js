(function () {
  const TYPES = {
    "product-13": "Alta masiva GTIN 13",
    "product-12": "Alta masiva UPC 12",
    "product-8": "Alta masiva GTIN 8",
    dun14: "Alta masiva DUN 14",
  };
  const PRODUCT_TEMPLATE_COLUMNS = {
    Alimentos: ["gtin", "marca", "descripcion_producto", "contenido_neto", "unidad_medida", "clasificacion_gpc"],
    Salud: ["gtin", "marca", "descripcion_producto", "volumen_neto", "unidad_medida", "tipo_bebida"],
    Electro: ["gtin", "marca", "descripcion_producto", "contenido_neto", "unidad_medida", "categoria_hogar"],
    Textil: ["gtin", "marca", "descripcion_producto", "contenido_neto", "unidad_medida", "categoria_despensa"],
    Otros: ["gtin", "marca", "descripcion_producto", "contenido_neto", "unidad_medida", "categoria"],
  };
  const HISTORY = [
    { name: "Alta UPC 12 - Linea Electro 30/07", start: "30/07/2026 10:00", end: "30/07/2026 10:30", type: "UPC 12 Linea Electro", newProducts: 118, errors: 2 },
    { name: "Alta GTIN 8 - Linea Alimentos_2026", start: "30/07/2026 11:00", end: "30/07/2026 11:15", type: "GTIN 8 Linea Alimentos", newProducts: 48, errors: 0 },
    { name: "Alta GTIN 13- Linea Alimentos_2026 v.2", start: "30/07/2026 11:20", end: "30/07/2026 11:35", type: "GTIN 13 - Linea Alimentos", newProducts: 23, errors: 2 },
  ];
  const state = { fileName: "", validated: false, processing: false, completed: false };

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const mount = document.getElementById("bulkUploadMount");
    if (!mount) return;
    const queryType = new URLSearchParams(location.search).get("type");
    const initial = queryType === "dun14" ? "dun14" : "product-13";
    mount.innerHTML = renderPage(initial);
    bind();
    updateBulkType();
    setFlowStep(1);
  }

  function renderPage(initial) {
    return `
      <section class="card shadow-sm mb-4">
        <div class="card-body text-center py-4">
          <h1 class="h3 mb-1">Alta masiva</h1>
          <p class="text-secondary">Seleccion&aacute; el tipo de proceso antes de cargar el archivo.</p>
          <select class="form-select mx-auto" id="bulkType" style="max-width: 340px">${Object.entries(TYPES).map(([value, label]) => `<option value="${value}" ${value === initial ? "selected" : ""}>${label}</option>`).join("")}</select>
          <div class="d-flex flex-wrap justify-content-center gap-2 mt-4">
            <a class="btn btn-primary" id="viewInstructions" href="../assets/archivos/Instructivo_ABM.pdf" target="_blank" rel="noopener">Ver instructivo Alta masiva GTIN 13</a>
            <a class="btn btn-primary" id="downloadInstructions" href="../assets/archivos/Instructivo_ABM.pdf" download>Descargar instructivo Alta masiva GTIN 13</a>
          </div>
          <div class="d-flex flex-wrap justify-content-center gap-2 mt-3">
            <div class="dropdown" id="templateDownloadMenu">
              <button class="btn btn-warning dropdown-toggle" id="templateDownloadButton" type="button" data-bs-toggle="dropdown" aria-expanded="false">Descargar plantilla</button>
              <ul class="dropdown-menu text-start" aria-labelledby="templateDownloadButton">
                ${Object.keys(PRODUCT_TEMPLATE_COLUMNS).map((line) => `<li><button class="dropdown-item" type="button" data-template-line="${line}">${line}</button></li>`).join("")}
              </ul>
            </div>
            <button class="btn btn-warning" id="uploadExcel" type="button">Subir Excel</button>
          </div>
          <div class="small text-secondary mt-2" id="templateDownloadHint">Seleccion&aacute; la l&iacute;nea de negocio para descargar la plantilla con sus campos correspondientes.</div>
          <input class="d-none" id="excelFile" type="file" accept=".xlsx,.xls,.csv">
          <div class="small text-secondary mt-3" id="bulkHint">Las reglas exactas de columnas est&aacute;n pendientes de definici&oacute;n.</div>
        </div>
      </section>

      <section class="card shadow-sm mb-4" id="bulkFlowCard">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <div class="text-secondary small">Alta Masiva</div>
              <h2 class="h5 mb-1">Flujo de procesamiento</h2>
              <p class="text-secondary mb-0">Carg&aacute; y valid&aacute; el archivo para iniciar el procesamiento.</p>
            </div>
            <span class="badge text-bg-light border" id="bulkFlowStatus">Archivo pendiente</span>
          </div>
          <div class="row g-2 mt-3" id="bulkFlowSteps">
            ${["Archivo Cargado", "Proceso en progreso", "Proceso finalizado"].map((step, index) => `<div class="col-12 col-md-4"><div class="border rounded-3 p-3 h-100 ${index === 0 ? "border-primary bg-primary-subtle" : "text-secondary"}" data-flow-step="${index + 1}"><div class="small fw-semibold">${index + 1}</div><div>${step}</div></div></div>`).join("")}
          </div>
          <div class="alert alert-info mt-3 mb-3" id="bulkFlowFeedback" role="status">Seleccion&aacute; el tipo de proceso y carg&aacute; un archivo para iniciar.</div>
          <div class="d-flex flex-wrap gap-2" id="bulkFlowActions">
            <button class="btn btn-outline-primary" id="reviewBulkFile" type="button" disabled>Validar archivo</button>
            <button class="btn btn-warning d-none" id="uploadNewBulkExcel" type="button">Subir nuevo Excel</button>
          </div>
        </div>
      </section>

      <section class="card shadow-sm mb-4">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <div>
              <div class="text-secondary small">Historial</div>
              <h2 class="h5 mb-1">Control de archivos procesados - Alta Masiva</h2>
              <p class="text-secondary mb-0">Consult&aacute; los resultados de tus cargas anteriores.</p>
            </div>
          </div>
          <div class="table-responsive">
            <table class="table table-sm table-hover align-middle mb-0">
              <thead><tr><th>Nombre del archivo subido</th><th>Inicio</th><th>Fin</th><th>Tipo de Carga</th><th>Producto con error</th><th>Nuevos productos cargados</th><th class="text-end">Acci&oacute;n</th></tr></thead>
              <tbody>${HISTORY.map(historyRow).join("")}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="card shadow-sm">
        <div class="card-body">
          <div class="d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
              <div class="text-secondary small">Herramienta complementaria</div>
              <h2 class="h5 mb-1">Generador de URLs - Alta Masiva DUN 14</h2>
              <p class="text-secondary mb-0">Import&aacute; las im&aacute;genes para preparar URLs temporales.</p>
            </div>
            <a class="btn btn-outline-primary btn-sm" href="../assets/archivos/Instructivo_ABM.pdf" target="_blank" rel="noopener">Instructivo para carga</a>
          </div>
          <label class="bulk-drop-zone d-block border border-2 border-primary border-opacity-25 rounded-3 p-4 text-center mt-3" id="urlDropZone" for="urlFile">
            <strong>Importar</strong><span class="d-block text-secondary small mt-1">o arrastr&aacute; un archivo aqu&iacute;</span>
            <input class="visually-hidden" id="urlFile" type="file" accept=".xlsx,.xls,.csv">
          </label>
          <div class="d-flex flex-wrap gap-2 align-items-center mt-3">
            <button class="btn btn-primary" id="downloadUrls" type="button">Descargar URLs temporales</button>
            <span class="small text-secondary" id="urlFileName">Ning&uacute;n archivo seleccionado.</span>
          </div>
        </div>
      </section>`;
  }

  function bind() {
    const file = document.getElementById("excelFile");
    const review = document.getElementById("reviewBulkFile");
    const uploadNew = document.getElementById("uploadNewBulkExcel");
    const flowActions = document.getElementById("bulkFlowActions");
    document.getElementById("uploadExcel").addEventListener("click", () => { file.value = ""; file.click(); });
    uploadNew.addEventListener("click", () => { file.value = ""; file.click(); });
    file.addEventListener("change", () => {
      if (!file.files.length) return;
      state.fileName = file.files[0].name;
      state.validated = false;
      state.processing = false;
      state.completed = false;
      setFlowStep(1);
      setFlowFeedback(`Archivo ${escapeHtml(state.fileName)} cargado como ${escapeHtml(getSelectedTypeLabel())}. Valid&aacute; el archivo para continuar.`, "info");
      flowActions.classList.remove("d-none");
      review.classList.remove("d-none");
      review.disabled = false;
      uploadNew.classList.add("d-none");
      document.getElementById("bulkFlowStatus").textContent = "Archivo cargado";
      toast(`Archivo ${state.fileName} preparado para validar.`);
    });
    document.getElementById("bulkType").addEventListener("change", updateBulkType);
    document.querySelectorAll("[data-template-line]").forEach((button) => button.addEventListener("click", () => downloadTemplate(button.dataset.templateLine)));
    review.addEventListener("click", validateFile);
    document.querySelectorAll("[data-history-download]").forEach((button) => button.addEventListener("click", () => toast(`Reporte de ${button.dataset.historyDownload} preparado para descargar.`)));
    const urlFile = document.getElementById("urlFile");
    urlFile.addEventListener("change", () => { document.getElementById("urlFileName").textContent = urlFile.files[0] ? urlFile.files[0].name : "Ningún archivo seleccionado."; });
    document.getElementById("downloadUrls").addEventListener("click", () => toast("Archivo de URLs temporales preparado."));
  }

  function updateBulkType() {
    const type = document.getElementById("bulkType").value;
    const label = TYPES[type];
    document.getElementById("viewInstructions").textContent = `Ver instructivo ${label}`;
    document.getElementById("downloadInstructions").textContent = `Descargar instructivo ${label}`;
    const isCommercialProduct = ["product-13", "product-12", "product-8"].includes(type);
    document.getElementById("templateDownloadMenu").classList.toggle("d-none", !isCommercialProduct);
    document.getElementById("templateDownloadHint").classList.toggle("d-none", !isCommercialProduct);
    document.getElementById("bulkHint").textContent = "Las reglas exactas de columnas est&aacute;n pendientes de definici&oacute;n.";
  }

  function validateFile() {
    if (!state.fileName || state.processing) return;
    state.validated = true;
    state.processing = true;
    setFlowStep(2);
    setFlowFeedback("Archivo validado correctamente. Estamos procesando la carga. Esper&aacute; unos segundos...", "info");
    document.getElementById("bulkFlowActions").classList.add("d-none");
    document.getElementById("bulkFlowStatus").textContent = "Proceso en progreso";
    window.setTimeout(() => {
      if (state.processing) setFlowFeedback("Procesando archivo y registrando productos...", "info");
    }, 1500);
    window.setTimeout(finishBulkProcessing, 3000);
  }

  function finishBulkProcessing() {
    if (!state.processing) return;
    state.processing = false;
    state.completed = true;
    setFlowStep(3);
    setFlowFeedback("Proceso finalizado. La carga fue procesada correctamente.", "success");
    document.getElementById("bulkFlowActions").classList.remove("d-none");
    document.getElementById("reviewBulkFile").classList.add("d-none");
    document.getElementById("uploadNewBulkExcel").classList.remove("d-none");
    document.getElementById("bulkFlowStatus").textContent = "Proceso finalizado";
  }

  function downloadTemplate(line) {
    if (!line || !PRODUCT_TEMPLATE_COLUMNS[line]) {
      toast("Seleccion&aacute; una l&iacute;nea de negocio para descargar la plantilla.", "warning");
      return;
    }
    const type = document.getElementById("bulkType").value;
    const gtin = { "product-13": "GTIN 13", "product-12": "UPC 12", "product-8": "GTIN 8" }[type] || "GTIN";
    const content = `${PRODUCT_TEMPLATE_COLUMNS[line].join(",")}\n`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    link.download = `plantilla-alta-masiva-${gtin.toLowerCase().replace(/\s+/g, "-")}-${line.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => { URL.revokeObjectURL(link.href); link.remove(); }, 0);
    toast(`Plantilla ${gtin} para ${line} descargada.`);
  }

  function setFlowStep(active) {
    document.querySelectorAll("[data-flow-step]").forEach((step) => {
      const stepNumber = Number(step.dataset.flowStep);
      const reached = stepNumber <= active;
      step.classList.toggle("border-primary", stepNumber === active);
      step.classList.toggle("bg-primary-subtle", stepNumber === active);
      step.classList.toggle("border-success", reached && stepNumber !== active);
      step.classList.toggle("bg-success-subtle", reached && stepNumber !== active);
      step.classList.toggle("text-secondary", !reached);
    });
  }

  function setFlowFeedback(message, tone) {
    const feedback = document.getElementById("bulkFlowFeedback");
    feedback.className = `alert alert-${tone} mt-3 mb-3`;
    feedback.innerHTML = message;
  }

  function getSelectedTypeLabel() {
    return TYPES[document.getElementById("bulkType").value] || "Alta Masiva";
  }

  function historyRow(item) {
    return `<tr><td>${escapeHtml(item.name)}</td><td class="text-nowrap">${escapeHtml(item.start)}</td><td class="text-nowrap">${escapeHtml(item.end)}</td><td>${escapeHtml(item.type)}</td><td><span class="badge ${item.errors ? "text-bg-danger" : "text-bg-success"}">${item.errors}</span></td><td>${item.newProducts}</td><td class="text-end"><button class="btn btn-sm btn-outline-primary" type="button" data-history-download="${escapeAttribute(item.name)}">Descargar</button></td></tr>`;
  }

  function toast(message, tone = "success") { window.GS1Utils.showSimulationToast(message, tone); }
  function escapeHtml(value) { return window.GS1Utils.escapeHtml(String(value ?? "")); }
  function escapeAttribute(value) { return escapeHtml(value).replaceAll("'", "&#39;"); }
})();
