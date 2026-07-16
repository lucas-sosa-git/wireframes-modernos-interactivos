(function () {
  const STORAGE_PREFIX = "gs1-product-exception-comments:";
  document.addEventListener("DOMContentLoaded", initExceptionPage);

  function initExceptionPage() {
    const mount = document.getElementById("exceptionRequestMount");
    if (!mount || !window.GS1ProductCatalog) {
      return;
    }
    const id = window.GS1Utils.getUrlParam("id");
    const view = window.GS1Utils.getUrlParam("view", "new");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;
    if (!record) {
      mount.innerHTML = renderEmptyState("No encontramos el producto solicitado.");
      return;
    }
    renderView(mount, record, view);
  }

  function renderView(mount, record, view) {
    if (view === "success") {
      mount.innerHTML = renderSuccess();
      return;
    }
    if (view === "open") {
      mount.innerHTML = renderOpen(record);
      bindOpenView(record);
      return;
    }
    mount.innerHTML = renderNew(record);
    bindNewView(record);
  }

  function renderNew(record) {
    return `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <div class="gs1-tool-header">
            <div>
              <div class="text-secondary small">Solicitud de modificacion</div>
              <h1 class="h3 mb-1">${escapeHtml(record.name)}</h1>
              <div class="text-secondary">${escapeHtml(record.code)} | ${escapeHtml(record.status)}</div>
            </div>
          </div>
          <form id="exceptionNewForm" class="row g-3 mt-1">
            <div class="col-12">
              <label class="form-label" for="exceptionReason">¿Por qu&eacute; necesita modificar el producto?</label>
              <textarea class="form-control" id="exceptionReason" rows="4"></textarea>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="exceptionCommercialized">¿El producto ya se ha comercializado?</label>
              <select class="form-select" id="exceptionCommercialized">
                <option value="">Seleccionar</option>
                <option value="si">Si</option>
                <option value="no">No</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label" for="exceptionNewImage">Nueva imagen</label>
              <input class="form-control" id="exceptionNewImage" type="file" accept="image/*">
            </div>
            <div class="col-12">
              <label class="form-label" for="exceptionFiles">¿Desea agregar documentos relacionados con el cambio?</label>
              <input class="form-control" id="exceptionFiles" type="file" multiple>
            </div>
            <div class="col-12" id="exceptionFileList"></div>
            <div class="col-12">
              <div class="alert alert-danger d-none" id="exceptionError"></div>
            </div>
            <div class="col-12 d-flex flex-wrap gap-2">
              <button type="submit" class="btn btn-primary">Enviar formulario</button>
              <a href="productos.html" class="btn btn-outline-secondary">Volver a productos</a>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  function renderOpen(record) {
    const request = record.exceptionRequest || { id: "-", status: "En revision", reason: "-", files: [], comments: [] };
    const comments = request.comments.concat(readStoredComments(record.id));
    return `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body">
          <div class="gs1-tool-header">
            <div>
              <div class="text-secondary small">Solicitud abierta</div>
              <h1 class="h3 mb-1">${escapeHtml(request.id)}</h1>
              <div class="text-secondary">${escapeHtml(record.name)} | ${escapeHtml(request.status)}</div>
            </div>
          </div>
          <div class="row g-3">
            <div class="col-lg-5">
              <div class="gs1-side-panel">
                <div class="small text-secondary">Motivo enviado</div>
                <div class="fw-semibold mb-3">${escapeHtml(request.reason)}</div>
                <div class="small text-secondary">Archivos adjuntos</div>
                <div class="gs1-attachments-list mb-3">
                  ${request.files.map((file, index) => `
                    <div class="gs1-attachment-item">
                      <div>
                        <div class="fw-semibold">${escapeHtml(file.name)}</div>
                        <div class="small text-secondary">${escapeHtml(file.size)}</div>
                      </div>
                      <button class="btn btn-sm btn-outline-secondary" type="button" data-download-index="${index}">Descargar</button>
                    </div>
                  `).join("")}
                </div>
                <label class="form-label" for="exceptionExtraFile">Adjuntar nuevo archivo</label>
                <input class="form-control" id="exceptionExtraFile" type="file">
              </div>
            </div>
            <div class="col-lg-7">
              <div class="gs1-comments-thread" id="exceptionComments">
                ${comments.map(renderComment).join("")}
              </div>
              <form id="exceptionCommentForm" class="mt-3">
                <label class="form-label" for="exceptionComment">Agregar comentario</label>
                <textarea class="form-control mb-3" id="exceptionComment" rows="3"></textarea>
                <button type="submit" class="btn btn-primary">Enviar</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderSuccess() {
    return `
      <section class="card shadow-sm gs1-tool-shell">
        <div class="card-body text-center py-5">
          <h1 class="h3 mb-2">Solicitud enviada</h1>
          <p class="text-secondary mb-4">La solicitud de modificacion fue registrada correctamente para esta demostracion.</p>
          <a href="productos.html" class="btn btn-primary">Volver a productos</a>
        </div>
      </section>
    `;
  }

  function bindNewView(record) {
    const filesInput = document.getElementById("exceptionFiles");
    filesInput.addEventListener("change", () => renderSelectedFiles(filesInput, "exceptionFileList"));
    document.getElementById("exceptionNewForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const reason = document.getElementById("exceptionReason").value.trim();
      const commercialized = document.getElementById("exceptionCommercialized").value.trim();
      const error = document.getElementById("exceptionError");
      if (!reason || !commercialized) {
        error.textContent = "Completa el motivo y si el producto ya fue comercializado.";
        error.classList.remove("d-none");
        return;
      }
      error.classList.add("d-none");
      const params = new URLSearchParams(window.location.search);
      params.set("id", record.id);
      params.set("view", "success");
      window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
      renderView(document.getElementById("exceptionRequestMount"), record, "success");
    });
  }

  function bindOpenView(record) {
    document.querySelectorAll("[data-download-index]").forEach((button) => {
      button.addEventListener("click", () => window.GS1Utils.showSimulationToast("Descarga simulada correctamente.", "success"));
    });
    document.getElementById("exceptionCommentForm").addEventListener("submit", (event) => {
      event.preventDefault();
      const textarea = document.getElementById("exceptionComment");
      const message = textarea.value.trim();
      if (!message) {
        return;
      }
      const comment = {
        author: "Socio",
        date: "2026-07-16 10:00",
        message,
      };
      const stored = readStoredComments(record.id);
      stored.push(comment);
      localStorage.setItem(`${STORAGE_PREFIX}${record.id}`, JSON.stringify(stored));
      document.getElementById("exceptionComments").insertAdjacentHTML("beforeend", renderComment(comment));
      textarea.value = "";
    });
  }

  function renderSelectedFiles(input, targetId) {
    const target = document.getElementById(targetId);
    target.innerHTML = Array.from(input.files).map((file, index) => `
      <div class="gs1-attachment-item">
        <div>${escapeHtml(file.name)}</div>
        <button type="button" class="btn btn-sm btn-outline-secondary" data-remove-file="${index}">Quitar</button>
      </div>
    `).join("");
  }

  function readStoredComments(productId) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${productId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (error) {
      return [];
    }
  }

  function renderComment(comment) {
    return `
      <div class="gs1-comment-card">
        <div class="d-flex justify-content-between gap-2">
          <div class="fw-semibold">${escapeHtml(comment.author)}</div>
          <div class="small text-secondary">${escapeHtml(comment.date)}</div>
        </div>
        <div class="small mt-2">${escapeHtml(comment.message)}</div>
      </div>
    `;
  }

  function renderEmptyState(message) {
    return `<section class="card shadow-sm"><div class="card-body text-center py-5">${escapeHtml(message)}</div></section>`;
  }

  function escapeHtml(value) {
    return window.GS1Utils.escapeHtml(value);
  }
})();
