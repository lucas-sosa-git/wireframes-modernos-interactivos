(function () {
  document.addEventListener("DOMContentLoaded", initProductFicha);

  function initProductFicha() {
    if (!window.GS1ProductCatalog) {
      return;
    }

    const mount = document.getElementById("productDetailMount");
    if (!mount) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;

    if (!record) {
      renderNotFound(mount);
      return;
    }

    const pageTitle = document.querySelector("[data-portal-header]");
    if (pageTitle) {
      pageTitle.dataset.pageTitle = `Ficha del Producto ${record.code}`;
    }

    mount.innerHTML = `
      <section class="card shadow-sm product-detail-card">
        <div class="card-body">
          <div class="row g-4 align-items-start">
            <div class="col-lg-4">
              <div class="product-detail-media">
                ${renderImage(record)}
              </div>
            </div>
            <div class="col-lg-8">
              <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                  <div class="text-secondary small">${record.type}</div>
                  <h1 class="h3 mb-2">${escapeHtml(record.name)}</h1>
                  <div class="d-flex flex-wrap gap-2 align-items-center">
                    <span class="badge text-bg-primary">${escapeHtml(record.code)}</span>
                    <span class="badge ${statusBadgeClass(record.status)}">${escapeHtml(record.status)}</span>
                  </div>
                </div>
                <div class="btn-group">
                  <a href="producto-editar.html?id=${encodeURIComponent(record.id)}" class="btn btn-outline-primary">Modificar</a>
                  <a href="producto-copiar.html?id=${encodeURIComponent(record.id)}" class="btn btn-outline-primary">Copiar</a>
                  <a href="productos.html" class="btn btn-primary">Volver al listado</a>
                </div>
              </div>

              <div class="row g-3">
                ${renderField("Marca", record.brand)}
                ${renderField("Variedad", record.variety)}
                ${renderField("Origen", record.origin)}
                ${renderField("Clasificacion", record.classification)}
                ${renderField("Contenido", record.content)}
                ${renderField("Tipo de distribucion", record.distributionType)}
                ${renderField("Fecha de alta", formatDate(record.createdAt))}
                ${renderField("Fecha de modificacion", formatDate(record.modifiedAt))}
                ${record.mode === "dispatchUnits" ? renderField("Nivel logistico", record.packagingLevel) : ""}
                ${record.mode === "dispatchUnits" ? renderField("Destino", record.destination) : ""}
              </div>

              <div class="product-detail-note mt-4">
                <div class="text-secondary small mb-1">Descripcion</div>
                <div>${escapeHtml(record.shortDescription)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderNotFound(mount) {
    mount.innerHTML = `
      <section class="card shadow-sm product-detail-card">
        <div class="card-body text-center py-5">
          <h1 class="h4 mb-2">No encontramos el registro solicitado</h1>
          <p class="text-secondary mb-4">Verifica el identificador del producto o vuelve al listado principal.</p>
          <a href="productos.html" class="btn btn-primary">Volver a productos</a>
        </div>
      </section>
    `;
  }

  function renderImage(record) {
    if (record.image) {
      return `<img src="${escapeAttribute(record.image)}" alt="Imagen de ${escapeAttribute(record.name)}" class="img-fluid rounded border">`;
    }
    return `
      <div class="product-image-placeholder">
        ${imageIcon(28)}
        <span>No hay imagen disponible</span>
      </div>
    `;
  }

  function renderField(label, value) {
    return `
      <div class="col-md-6">
        <div class="product-detail-field">
          <div class="text-secondary small">${escapeHtml(label)}</div>
          <div class="fw-semibold">${escapeHtml(value || "-")}</div>
        </div>
      </div>
    `;
  }

  function statusBadgeClass(status) {
    if (status === "Activo") {
      return "text-bg-success";
    }
    if (status === "Pendiente") {
      return "text-bg-warning";
    }
    return "text-bg-secondary";
  }

  function formatDate(value) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value || "-";
    }
    const [year, month, day] = value.split("-");
    return `${day}/${month}/${year}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }

  function imageIcon(size) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16" aria-hidden="true"><path d="M.5 1A1.5 1.5 0 0 0-1 2.5v11A1.5 1.5 0 0 0 .5 15h15a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 15.5 1zm0 1h15a.5.5 0 0 1 .5.5v6.248l-3.37-3.37a1 1 0 0 0-1.415 0L6.5 10.293 4.354 8.146a.5.5 0 0 0-.708 0L0 11.793V2.5A.5.5 0 0 1 .5 2m15 12H.5a.5.5 0 0 1-.5-.5v-.293l4-4 2.146 2.147a1 1 0 0 0 1.415 0l4.793-4.793L16 10.207V13.5a.5.5 0 0 1-.5.5M4.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/></svg>`;
  }
})();
