(function () {
  const STORAGE_KEY = "gs1-symbol-verification-comments";
  document.addEventListener("DOMContentLoaded", initVerificationPage);

  function initVerificationPage() {
    const mount = document.getElementById("symbolVerificationMount");
    if (!mount) {
      return;
    }
    renderHome(mount);
  }

  function renderHome(mount) {
    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <h1 class="h3 mb-3">Verificaci&oacute;n de Simbolog&iacute;a</h1>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-primary" id="openVerificationNew" type="button">Generar solicitud</button>
            <button class="btn btn-outline-secondary" id="openVerificationOpen" type="button">Solicitud abierta</button>
          </div>
        </div>
      </section>
    `;
    document.getElementById("openVerificationNew").addEventListener("click", () => renderNew(mount));
    document.getElementById("openVerificationOpen").addEventListener("click", () => renderOpen(mount));
  }

  function renderNew(mount) {
    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <h1 class="h3 mb-3">Generar solicitud</h1>
          <form id="verificationNewForm" class="row g-3">
            <div class="col-12"><label class="form-label" for="verificationDescription">Descripci&oacute;n o consulta</label><textarea class="form-control" id="verificationDescription" rows="4"></textarea></div>
            <div class="col-md-6"><label class="form-label" for="verificationGtin">GTIN relacionado</label><input class="form-control" id="verificationGtin"></div>
            <div class="col-md-6"><label class="form-label" for="verificationType">Tipo de simbolog&iacute;a</label><select class="form-select" id="verificationType"><option>EAN-13</option><option>ITF-14</option><option>QR Digital Link</option><option>GS1 DataMatrix</option></select></div>
            <div class="col-12"><label class="form-label" for="verificationFiles">Archivos adjuntos</label><input class="form-control" id="verificationFiles" type="file" multiple></div>
            <div class="col-12" id="verificationFileList"></div>
            <div class="col-12 d-none" id="verificationError"><div class="alert alert-danger mb-0"></div></div>
            <div class="col-12 d-flex flex-wrap gap-2">
              <button class="btn btn-primary" type="submit">Enviar formulario</button>
              <button class="btn btn-outline-secondary" id="backVerificationHome" type="button">Volver</button>
            </div>
          </form>
        </div>
      </section>
    `;
    document.getElementById("verificationFiles").addEventListener("change", (event) => {
      document.getElementById("verificationFileList").innerHTML = Array.from(event.target.files).map((file) => `<div class="gs1-attachment-item"><div>${escapeHtml(file.name)}</div><button class="btn btn-sm btn-outline-secondary" type="button">Quitar</button></div>`).join("");
    });
    document.getElementById("backVerificationHome").addEventListener("click", () => renderHome(mount));
    document.getElementById("verificationNewForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const description = document.getElementById("verificationDescription").value.trim();
      const hasFiles = document.getElementById("verificationFiles").files.length > 0;
      const error = document.querySelector("#verificationError .alert");
      if (!description || !hasFiles) {
        document.getElementById("verificationError").classList.remove("d-none");
        error.textContent = "Ingres&aacute; una descripci&oacute;n y adjunt&aacute; al menos un archivo.";
        return;
      }
      renderSuccess(mount);
    });
  }

  function renderOpen(mount) {
    const comments = readComments();
    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-start gap-2 mb-4">
            <div>
              <div class="text-secondary small">Solicitud abierta</div>
              <h1 class="h3 mb-1">VS-2026-0012</h1>
              <div class="text-secondary">En revision</div>
            </div>
            <button class="btn btn-outline-secondary" id="backVerificationHome" type="button">Volver</button>
          </div>
          <div class="row g-3">
            <div class="col-lg-5">
              <div class="gs1-side-panel">
                <div class="gs1-attachment-item"><div><div class="fw-semibold">etiqueta_frente.pdf</div><div class="small text-secondary">1.1 MB</div></div><button class="btn btn-sm btn-outline-secondary" type="button" id="downloadVerificationBtn">Descargar</button></div>
                <label class="form-label mt-3" for="verificationOpenFile">Adjuntar nuevo archivo</label>
                <input class="form-control" id="verificationOpenFile" type="file">
              </div>
            </div>
            <div class="col-lg-7">
              <div class="gs1-comments-thread" id="verificationComments">
                ${comments.map((comment) => `<div class="gs1-comment-card"><div class="fw-semibold">${escapeHtml(comment.author)}</div><div class="small text-secondary">${escapeHtml(comment.date)}</div><div class="small mt-2">${escapeHtml(comment.message)}</div></div>`).join("")}
              </div>
              <form id="verificationCommentForm" class="mt-3">
                <label class="form-label" for="verificationComment">Agregar comentario</label>
                <textarea class="form-control mb-3" id="verificationComment" rows="3"></textarea>
                <button class="btn btn-primary" type="submit">Enviar comentario</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    `;
    document.getElementById("backVerificationHome").addEventListener("click", () => renderHome(mount));
    document.getElementById("downloadVerificationBtn").addEventListener("click", () => window.GS1Utils.showSimulationToast("Descarga simulada correctamente.", "success"));
    document.getElementById("verificationCommentForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const textarea = document.getElementById("verificationComment");
      const message = textarea.value.trim();
      if (!message) {
        return;
      }
      const next = { author: "Socio", date: "2026-07-16 10:15", message };
      const commentsList = readComments();
      commentsList.push(next);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(commentsList));
      renderOpen(mount);
    });
  }

  function renderSuccess(mount) {
    mount.innerHTML = `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body text-center py-5">
          <h1 class="h3 mb-2">Solicitud enviada</h1>
          <p class="text-secondary mb-4">Su solicitud de verificaci&oacute;n de simbolog&iacute;a fue enviada con &eacute;xito. Un administrador de GS1 Argentina estar&aacute; revisando el formulario.</p>
          <button class="btn btn-primary" id="backVerificationHome" type="button">Volver al inicio</button>
        </div>
      </section>
    `;
    document.getElementById("backVerificationHome").addEventListener("click", () => renderHome(mount));
  }

  function readComments() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [
        { author: "Socio", date: "2026-07-10 09:10", message: "Adjuntamos la etiqueta para verificaci&oacute;n." },
        { author: "GS1 Argentina", date: "2026-07-11 11:40", message: "La solicitud se encuentra en an&aacute;lisis." },
      ];
    } catch (error) {
      return [];
    }
  }

  function escapeHtml(value) {
    return window.GS1Utils.escapeHtml(value);
  }
})();
