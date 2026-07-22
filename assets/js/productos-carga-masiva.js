(function () {
  const TYPES = {
    "product-13": "Alta masiva GTIN-13",
    "product-12": "Alta masiva GTIN-12 (UPC)",
    "product-8": "Alta masiva GTIN-8",
    dun14: "Alta masiva DUN-14 (GTIN-14)",
    urls: "Generador de URLs masivo (de imágenes)",
  };
  const HISTORY = [
    { name: "alta_productos_2026-07-18.xlsx", date: "18/07/2026", time: "11:42", type: "Productos comerciales", rows: 120, errors: 2 },
    { name: "alta_dun14_2026-07-21.xlsx", date: "21/07/2026", time: "09:15", type: "DUN-14", rows: 48, errors: 0 },
  ];
  document.addEventListener("DOMContentLoaded", init);

  function init() {
    const mount = document.getElementById("bulkUploadMount");
    const queryType = new URLSearchParams(location.search).get("type");
    const initial = queryType === "dun14" ? "dun14" : "product-13";
    mount.innerHTML = `
      <section class="card shadow-sm mb-4"><div class="card-body text-center py-4">
        <h1 class="h3 mb-1">Alta masiva</h1><p class="text-secondary">Seleccioná el tipo de proceso antes de cargar el archivo.</p>
        <select class="form-select mx-auto" id="bulkType" style="max-width:340px">${Object.entries(TYPES).map(([value, label]) => `<option value="${value}" ${value === initial ? "selected" : ""}>${label}</option>`).join("")}</select>
        <div class="d-flex flex-wrap justify-content-center gap-2 mt-4"><a class="btn btn-primary" href="../assets/archivos/Instructivo_ABM.pdf" target="_blank">Ver instructivo alta masiva DUN-14</a><a class="btn btn-primary" href="../assets/archivos/Instructivo_ABM.pdf" download>Descargar instructivo alta masiva DUN-14</a></div>
        <div class="d-flex flex-wrap justify-content-center gap-2 mt-3"><button class="btn btn-warning" id="downloadExcel" type="button">Descargar Excel</button><button class="btn btn-warning" id="uploadExcel" type="button">Subir Excel</button></div>
        <input class="d-none" id="excelFile" type="file" accept=".xlsx,.xls,.csv">
        <div class="small text-secondary mt-3" id="bulkHint">Las reglas exactas de columnas están pendientes de definición.</div>
      </div></section>
      <section class="card shadow-sm mb-4" id="bulkFlowCard"><div class="card-body"><h2 class="h5">Flujo de procesamiento</h2><div class="row g-2 small" id="bulkFlowSteps">${["1. Tipo de alta", "2. Carga del archivo", "3. Validación de columnas", "4. URLs de imágenes", "5. Revisión de errores", "6. Confirmación del alta", "7. Resultado final"].map((step, index) => `<div class="col-12 col-md-6 col-xl"><div class="border rounded p-2 h-100 ${index === 0 ? "border-primary bg-primary-subtle" : "text-secondary"}" data-flow-step="${index + 1}">${step}</div></div>`).join("")}</div><div class="alert alert-info mt-3 mb-3" id="bulkFlowFeedback">Seleccioná el tipo de alta y cargá un archivo para iniciar.</div><div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-primary" id="reviewBulkFile" type="button" disabled>Revisar archivo</button><button class="btn btn-success" id="confirmBulkUpload" type="button" disabled>Confirmar alta</button></div></div></section>
      <section class="card shadow-sm mb-4"><div class="card-body"><h2 class="h5">Control de archivos procesados</h2><div class="table-responsive"><table class="table align-middle"><thead><tr><th>Nombre del archivo subido</th><th>Fecha de subida</th><th>Hora de subida</th><th>Tipo de carga</th><th>Cantidad de filas leídas</th><th>Cantidad de productos con error</th><th>Acción</th></tr></thead><tbody>${HISTORY.map(historyRow).join("")}</tbody></table></div></div></section>
      <section class="card shadow-sm"><div class="card-body"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><h2 class="h5 mb-1">Generador de URLs — Alta masiva</h2><p class="text-secondary mb-0">Importá las imágenes para preparar URLs temporales.</p></div><a class="btn btn-primary btn-sm" href="../assets/archivos/Instructivo_ABM.pdf" target="_blank">Ver instructivo</a></div>
        <label class="bulk-drop-zone d-block border border-2 border-primary border-opacity-25 rounded-3 p-5 text-center mt-3" id="urlDropZone" for="urlFile"><strong>Arrastrá un archivo aquí</strong><span class="d-block text-secondary small mt-1">o hacé clic para seleccionarlo</span><input class="visually-hidden" id="urlFile" type="file" accept=".xlsx,.xls,.csv"></label>
        <div class="d-flex flex-wrap gap-2 align-items-center mt-3"><button class="btn btn-primary" id="downloadUrls" type="button">Descargar URLs temporales</button><span class="small text-secondary" id="urlFileName">Ningún archivo seleccionado.</span></div>
      </div></section>`;
    bind();
  }

  function bind() {
    const file = document.getElementById("excelFile");
    document.getElementById("uploadExcel").addEventListener("click", () => file.click());
    file.addEventListener("change", () => {
      if (!file.files.length) return;
      const family = document.getElementById("bulkType").value === "dun14" ? "DUN-14" : "Productos comerciales";
      setFlowStep(3);
      document.getElementById("bulkFlowFeedback").textContent = `Archivo ${file.files[0].name} cargado como ${family}. La estructura queda preparada para aplicar las reglas de columnas cuando Lucas entregue el Excel de referencia.`;
      document.getElementById("reviewBulkFile").disabled = false;
      toast(`Archivo ${file.files[0].name} preparado como ${family}. Revisá los errores antes de confirmar.`);
    });
    document.getElementById("downloadExcel").addEventListener("click", () => { const date = window.prompt("Fecha del archivo procesado (DD/MM/AAAA)", HISTORY[0].date); if (date) toast(`Descarga del archivo procesado del ${date} preparada.`); });
    document.querySelectorAll("[data-download-row]").forEach((button) => button.addEventListener("click", () => toast(`Descarga de ${button.dataset.downloadRow} preparada.`)));
    const urlFile = document.getElementById("urlFile");
    urlFile.addEventListener("change", () => { document.getElementById("urlFileName").textContent = urlFile.files[0] ? urlFile.files[0].name : "Ningún archivo seleccionado."; });
    document.getElementById("downloadUrls").addEventListener("click", () => toast("Archivo de URLs temporales preparado."));
    document.getElementById("reviewBulkFile").addEventListener("click", () => {
      setFlowStep(5);
      document.getElementById("bulkFlowFeedback").textContent = "Revisión simulada disponible: 24 filas OK y 2 filas con error. Las reglas de columnas específicas continúan pendientes de definición.";
      document.getElementById("confirmBulkUpload").disabled = false;
    });
    document.getElementById("confirmBulkUpload").addEventListener("click", () => {
      setFlowStep(7);
      const feedback = document.getElementById("bulkFlowFeedback");
      feedback.className = "alert alert-success mt-3 mb-3";
      feedback.textContent = "Alta confirmada en la simulación: 24 filas OK y 2 filas con error para corregir.";
      document.getElementById("confirmBulkUpload").disabled = true;
    });
    // TODO: pendiente de definición (Lucas): reglas exactas de validación de columnas por tipo de carga.
  }
  function setFlowStep(active) { document.querySelectorAll("[data-flow-step]").forEach((step) => { const reached = Number(step.dataset.flowStep) <= active; step.classList.toggle("border-primary", reached); step.classList.toggle("bg-primary-subtle", Number(step.dataset.flowStep) === active); step.classList.toggle("text-secondary", !reached); }); }
  function historyRow(item) { return `<tr><td>${item.name}</td><td>${item.date}</td><td>${item.time}</td><td>${item.type}</td><td>${item.rows}</td><td><span class="badge ${item.errors ? "text-bg-danger" : "text-bg-success"}">${item.errors}</span></td><td><button class="btn btn-sm btn-outline-primary" type="button" data-download-row="${item.name}" title="Descargar archivo procesado" aria-label="Descargar archivo procesado">⇩</button></td></tr>`; }
  function toast(message) { window.GS1Utils.showSimulationToast(message, "success"); }
})();
