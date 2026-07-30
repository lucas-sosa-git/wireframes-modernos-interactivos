(function () {
  const TYPES = {
    "product-13": "Alta masiva GTIN-13",
    "product-12": "Alta masiva GTIN-12 (UPC)",
    "product-8": "Alta masiva GTIN-8",
    dun14: "Alta masiva DUN-14",
  };
  const PRODUCT_TEMPLATE_COLUMNS = {
    Alimentos: ["gtin", "marca", "descripcion_producto", "contenido_neto", "unidad_medida", "clasificacion_gpc"],
    Salud: ["gtin", "marca", "descripcion_producto", "volumen_neto", "unidad_medida", "tipo_bebida"],
    Electro: ["gtin", "marca", "descripcion_producto", "contenido_neto", "unidad_medida", "categoria_hogar"],
    Textil: ["gtin", "marca", "descripcion_producto", "contenido_neto", "unidad_medida", "categoria_despensa"],
    Otros: ["gtin", "marca", "descripcion_producto", "contenido_neto", "unidad_medida", "categoria"],
  };
  const HISTORY = [
    { name: "alta_productos_2026-07-18.xlsx", start: "18/07/2026 11:42", end: "18/07/2026 11:48", type: "GTIN-13", newProducts: 118, errors: 2 },
    { name: "alta_dun14_2026-07-21.xlsx", start: "21/07/2026 09:15", end: "21/07/2026 09:19", type: "DUN-14", newProducts: 48, errors: 0 },
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
        <div class="d-flex flex-wrap justify-content-center gap-2 mt-4"><a class="btn btn-primary" id="viewInstructions" href="../assets/archivos/Instructivo_ABM.pdf" target="_blank">Ver instructivo alta masiva GTIN-13</a><a class="btn btn-primary" id="downloadInstructions" href="../assets/archivos/Instructivo_ABM.pdf" download>Descargar instructivo alta masiva GTIN-13</a></div>
        <div class="d-flex flex-wrap justify-content-center gap-2 mt-3"><div class="dropdown" id="templateDownloadMenu"><button class="btn btn-warning dropdown-toggle" id="templateDownloadButton" type="button" data-bs-toggle="dropdown" aria-expanded="false">Descargar plantilla</button><ul class="dropdown-menu text-start" aria-labelledby="templateDownloadButton">${Object.keys(PRODUCT_TEMPLATE_COLUMNS).map((line) => `<li><button class="dropdown-item" type="button" data-template-line="${line}">${line}</button></li>`).join("")}</ul></div><button class="btn btn-warning" id="uploadExcel" type="button">Subir Excel</button></div>
        <div class="small text-secondary mt-2" id="templateDownloadHint">Seleccioná la línea de negocio para descargar la plantilla con sus campos correspondientes.</div>
        <input class="d-none" id="excelFile" type="file" accept=".xlsx,.xls,.csv">
        <div class="small text-secondary mt-3" id="bulkHint">Las reglas exactas de columnas están pendientes de definición.</div>
      </div></section>
      <section class="card shadow-sm mb-4" id="bulkFlowCard"><div class="card-body"><h2 class="h5">Flujo de procesamiento</h2><div class="row g-2 small" id="bulkFlowSteps">${["1. Archivo cargado", "2. Proceso en progreso", "3. Proceso finalizado"].map((step, index) => `<div class="col-12 col-md-6 col-xl"><div class="border rounded p-2 h-100 ${index === 0 ? "border-primary bg-primary-subtle" : "text-secondary"}" data-flow-step="${index + 1}">${step}</div></div>`).join("")}</div><div class="alert alert-info mt-3 mb-3" id="bulkFlowFeedback">Seleccioná el tipo de alta y cargá un archivo para iniciar.</div><div class="d-flex flex-wrap gap-2"><button class="btn btn-outline-primary" id="reviewBulkFile" type="button" disabled>Revisar archivo</button><button class="btn btn-success" id="confirmBulkUpload" type="button" disabled>Confirmar alta</button></div></div></section>
      <section class="card shadow-sm mb-4"><div class="card-body"><h2 class="h5">Control de archivos procesados — Alta masiva</h2><div class="table-responsive"><table class="table align-middle"><thead><tr><th>Nombre del archivo subido</th><th>Inicio</th><th>Fin</th><th>Tipo de carga</th><th>Productos con error</th><th>Nuevos productos ingresados</th></tr></thead><tbody>${HISTORY.map(historyRow).join("")}</tbody></table></div></div></section>
      <section class="card shadow-sm"><div class="card-body"><div class="d-flex flex-wrap justify-content-between align-items-center gap-2"><div><h2 class="h5 mb-1">Generador de URLs — Alta masiva</h2><p class="text-secondary mb-0">Importá las imágenes para preparar URLs temporales.</p></div><a class="btn btn-primary btn-sm" href="../assets/archivos/Instructivo_ABM.pdf" target="_blank">Ver instructivo</a></div>
        <label class="bulk-drop-zone d-block border border-2 border-primary border-opacity-25 rounded-3 p-5 text-center mt-3" id="urlDropZone" for="urlFile"><strong>Arrastrá un archivo aquí</strong><span class="d-block text-secondary small mt-1">o hacé clic para seleccionarlo</span><input class="visually-hidden" id="urlFile" type="file" accept=".xlsx,.xls,.csv"></label>
        <div class="d-flex flex-wrap gap-2 align-items-center mt-3"><button class="btn btn-primary" id="downloadUrls" type="button">Descargar URLs temporales</button><span class="small text-secondary" id="urlFileName">Ningún archivo seleccionado.</span></div>
      </div></section>`;
    bind();
    updateBulkType();
  }

  function bind() {
    const file = document.getElementById("excelFile");
    document.getElementById("uploadExcel").addEventListener("click", () => file.click());
    file.addEventListener("change", () => {
      if (!file.files.length) return;
      const family = document.getElementById("bulkType").value === "dun14" ? "DUN-14" : "Productos comerciales";
      setFlowStep(2);
      document.getElementById("bulkFlowFeedback").textContent = `Archivo ${file.files[0].name} cargado como ${family}. La estructura queda preparada para aplicar las reglas de columnas cuando Lucas entregue el Excel de referencia.`;
      document.getElementById("reviewBulkFile").disabled = false;
      toast(`Archivo ${file.files[0].name} preparado como ${family}. Revisá los errores antes de confirmar.`);
    });
    document.getElementById("bulkType").addEventListener("change", updateBulkType);
    document.querySelectorAll("[data-template-line]").forEach((button) => button.addEventListener("click", () => downloadTemplate(button.dataset.templateLine)));
    const urlFile = document.getElementById("urlFile");
    urlFile.addEventListener("change", () => { document.getElementById("urlFileName").textContent = urlFile.files[0] ? urlFile.files[0].name : "Ningún archivo seleccionado."; });
    document.getElementById("downloadUrls").addEventListener("click", () => toast("Archivo de URLs temporales preparado."));
    document.getElementById("reviewBulkFile").addEventListener("click", () => {
      setFlowStep(2);
      document.getElementById("bulkFlowFeedback").textContent = "Revisión simulada disponible: 24 filas OK y 2 filas con error. Las reglas de columnas específicas continúan pendientes de definición.";
      document.getElementById("confirmBulkUpload").disabled = false;
    });
    document.getElementById("confirmBulkUpload").addEventListener("click", () => {
      setFlowStep(3);
      const feedback = document.getElementById("bulkFlowFeedback");
      feedback.className = "alert alert-success mt-3 mb-3";
      feedback.textContent = "Alta confirmada en la simulación: 24 filas OK y 2 filas con error para corregir.";
      document.getElementById("confirmBulkUpload").disabled = true;
    });
    // TODO: pendiente de definición (Lucas): reglas exactas de validación de columnas por tipo de carga.
  }
  function updateBulkType() {
    const type = document.getElementById("bulkType").value;
    const label = TYPES[type];
    const isCommercialProduct = ["product-13", "product-12", "product-8"].includes(type);
    document.getElementById("viewInstructions").textContent = `Ver instructivo ${label}`;
    document.getElementById("downloadInstructions").textContent = `Descargar instructivo ${label}`;
    document.getElementById("templateDownloadMenu").classList.toggle("d-none", !isCommercialProduct);
    document.getElementById("templateDownloadHint").classList.toggle("d-none", !isCommercialProduct);
  }
  function downloadTemplate(line) {
    const type = document.getElementById("bulkType").value;
    const gtin = type.replace("product-", "GTIN-");
    const content = `${PRODUCT_TEMPLATE_COLUMNS[line].join(",")}\n`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    link.download = `plantilla-alta-masiva-${gtin.toLowerCase()}-${line.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(link.href);
      link.remove();
    }, 0);
    toast(`Plantilla ${gtin} para ${line} descargada.`);
  }
  function setFlowStep(active) { document.querySelectorAll("[data-flow-step]").forEach((step) => { const reached = Number(step.dataset.flowStep) <= active; step.classList.toggle("border-primary", reached); step.classList.toggle("bg-primary-subtle", Number(step.dataset.flowStep) === active); step.classList.toggle("text-secondary", !reached); }); }
  function historyRow(item) { return `<tr><td>${item.name}</td><td>${item.start}</td><td>${item.end}</td><td>${item.type}</td><td><span class="badge ${item.errors ? "text-bg-danger" : "text-bg-success"}">${item.errors}</span></td><td>${item.newProducts}</td></tr>`; }
  function toast(message) { window.GS1Utils.showSimulationToast(message, "success"); }
})();
