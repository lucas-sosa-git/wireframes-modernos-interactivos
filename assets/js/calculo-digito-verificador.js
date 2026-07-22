(function () {
  const TYPE_CONFIG = {
    "GTIN-8": { base: 7, full: 8 },
    "UPC-12": { base: 11, full: 12 },
    "GTIN-13": { base: 12, full: 13 },
    "GTIN-14": { base: 13, full: 14 },
    GLN: { base: 12, full: 13 },
  };
  document.addEventListener("DOMContentLoaded", initCheckDigitPage);

  function initCheckDigitPage() {
    const mount = document.getElementById("checkDigitMount");
    if (!mount) {
      return;
    }
    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <div class="row g-4">
            <div class="col-lg-7">
              <h1 class="h3 mb-3">C&aacute;lculo del D&iacute;gito Verificador</h1>
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label" for="checkDigitType">Tipo</label>
                  <select class="form-select" id="checkDigitType">${Object.keys(TYPE_CONFIG).map((type) => `<option>${type}</option>`).join("")}</select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="checkDigitInput">C&oacute;digo base o completo</label>
                  <input class="form-control" id="checkDigitInput">
                </div>
              </div>
              <div class="d-flex flex-wrap gap-2 mt-3">
                <button class="btn btn-primary" id="calculateCheckDigitBtn" type="button">Calcular</button>
                <button class="btn btn-outline-secondary" id="resetCheckDigitBtn" type="button">Restablecer</button>
              </div>
              <div class="gs1-result-panel mt-4" id="checkDigitResult"></div>
            </div>
            <div class="col-lg-5">
              <div class="gs1-side-panel">
                <h2 class="h5 mb-3">Importaci&oacute;n masiva</h2>
                <input class="form-control mb-3" id="bulkCheckDigitFile" type="file" accept=".xlsx,.xls,.csv">
                <div class="small text-secondary mb-3" id="bulkCheckDigitName">Todav&iacute;a no seleccionaste ning&uacute;n archivo.</div>
                <button class="btn btn-outline-secondary" id="bulkCheckDigitBtn" type="button">Calcular</button>
                <div class="gs1-result-panel mt-3 d-none" id="bulkCheckDigitResult"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
    bindCheckDigitEvents();
  }

  function bindCheckDigitEvents() {
    document.getElementById("calculateCheckDigitBtn").addEventListener("click", calculate);
    document.getElementById("resetCheckDigitBtn").addEventListener("click", () => window.location.reload());
    document.getElementById("bulkCheckDigitFile").addEventListener("change", (event) => {
      document.getElementById("bulkCheckDigitName").textContent = event.target.files[0] ? event.target.files[0].name : "Todav&iacute;a no seleccionaste ning&uacute;n archivo.";
    });
    document.getElementById("bulkCheckDigitBtn").addEventListener("click", () => {
      const panel = document.getElementById("bulkCheckDigitResult");
      panel.classList.remove("d-none");
      panel.innerHTML = "<div class='fw-semibold'>Resultado simulado</div><div class='small text-secondary mt-2'>Registros procesados: 120 | Registros v&aacute;lidos: 116</div>";
    });
  }

  function calculate() {
    const type = document.getElementById("checkDigitType").value;
    const input = window.GS1Utils.digitsOnly(document.getElementById("checkDigitInput").value);
    const config = TYPE_CONFIG[type];
    const panel = document.getElementById("checkDigitResult");
    if (!input) {
      panel.innerHTML = "<div class='alert alert-warning mb-0'>Ingres&aacute; un c&oacute;digo para continuar.</div>";
      return;
    }
    if (!/^\d+$/.test(input)) {
      panel.innerHTML = "<div class='alert alert-danger mb-0'>Solo se permiten caracteres num&eacute;ricos.</div>";
      return;
    }
    if (![config.base, config.full].includes(input.length)) {
      panel.innerHTML = `<div class='alert alert-danger mb-0'>La longitud esperada para ${type} es ${config.base} o ${config.full} d&iacute;gitos.</div>`;
      return;
    }
    const base = input.length === config.full ? input.slice(0, -1) : input;
    const digit = window.GS1Utils.computeCheckDigit(base);
    const fullCode = `${base}${digit}`;
    panel.innerHTML = `
      <div class="fw-semibold mb-2">Resultado</div>
      <div>D&iacute;gito calculado: <strong>${digit}</strong></div>
      <div>C&oacute;digo completo: <strong>${fullCode}</strong></div>
    `;
  }
})();
