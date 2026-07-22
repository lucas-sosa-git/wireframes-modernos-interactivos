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

    const id = window.GS1Utils ? window.GS1Utils.getUrlParam("id") : new URLSearchParams(window.location.search).get("id");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;

    if (!record) {
      renderNotFound(mount);
      return;
    }

    const pageTitle = document.querySelector("[data-portal-header]");
    if (pageTitle) {
      pageTitle.dataset.pageTitle = record.mode === "dispatchUnits" ? `Ficha de la unidad de despacho ${record.code}` : `Ficha del producto ${record.code}`;
    }

    const title = record.mode === "dispatchUnits" ? "Ficha de la unidad de despacho" : "Ficha del producto";
    mount.innerHTML = `
      <section class="card shadow-sm product-detail-card">
        <div class="card-body">
          <div class="row g-4 align-items-start">
            <div class="col-lg-4">
              <div class="product-detail-media">
                ${renderProductGallery(record)}
              </div>
            </div>
            <div class="col-lg-8">
              <div class="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                <div>
                  <div class="text-secondary small">${escapeHtml(record.type)}</div>
                  <h1 class="h3 mb-2">${title}</h1>
                  <div class="fw-semibold mb-2">${escapeHtml(record.name)}</div>
                  <div class="d-flex flex-wrap gap-2 align-items-center">
                    <span class="badge text-bg-primary">${escapeHtml(record.code)}</span>
                    <span class="badge ${statusBadgeClass(record.status)}">${escapeHtml(record.status)}</span>
                  </div>
                  <div class="product-detail-note mt-3">
                    <div class="text-secondary small mb-1">Descripción</div>
                    <div>${escapeHtml(record.shortDescription || "Sin descripción disponible.")}</div>
                  </div>
                </div>
                <div class="d-flex flex-wrap gap-2 justify-content-end">
                  <a href="${getEditUrl(record)}" class="btn btn-outline-primary">Modificar</a>
                  <a href="${getCopyUrl(record)}" class="btn btn-outline-primary">Copiar datos</a>
                  <a href="productos.html" class="btn btn-outline-secondary">Volver al listado</a>
                  <a href="${record.mode === "dispatchUnits" ? "producto-nuevo-dun14.html" : "producto-nuevo.html"}" class="btn btn-primary">Nueva alta</a>
                </div>
              </div>

              <div class="row g-3">
                ${buildFields(record).map((field) => renderField(field.label, field.value)).join("")}
              </div>

            </div>
          </div>
        </div>
      </section>
    `;
    bindProductGallery(mount, record);
  }

  function getRecordImages(record) {
    return (Array.isArray(record.imageGallery) && record.imageGallery.length ? record.imageGallery : [record.image]).filter(Boolean);
  }

  function renderProductGallery(record) {
    const images = getRecordImages(record);
    if (!images.length) return renderImage(record);
    return `<div class="product-gallery" data-gallery-index="0">
      <div class="product-gallery__stage">
        ${images.length > 1 ? `<button type="button" class="product-gallery__control product-gallery__control--prev" data-gallery-prev aria-label="Imagen anterior">‹</button>` : ""}
        <img data-gallery-main src="${escapeAttribute(images[0])}" alt="Imagen de ${escapeAttribute(record.name)}">
        ${images.length > 1 ? `<button type="button" class="product-gallery__control product-gallery__control--next" data-gallery-next aria-label="Imagen siguiente">›</button>` : ""}
      </div>
      ${images.length > 1 ? `<div class="product-gallery__thumbs" role="tablist">${images.map((image, index) => `<button type="button" class="product-gallery__thumb${index === 0 ? " is-active" : ""}" data-gallery-thumb="${index}" aria-label="Ver imagen ${index + 1}"><img src="${escapeAttribute(image)}" alt=""></button>`).join("")}</div>` : ""}
    </div>`;
  }

  function bindProductGallery(host, record) {
    const gallery = host.querySelector(".product-gallery");
    if (!gallery) return;
    const images = getRecordImages(record);
    const update = (index) => {
      const nextIndex = (index + images.length) % images.length;
      gallery.dataset.galleryIndex = String(nextIndex);
      gallery.querySelector("[data-gallery-main]").src = images[nextIndex];
      gallery.querySelectorAll("[data-gallery-thumb]").forEach((thumb) => thumb.classList.toggle("is-active", Number(thumb.dataset.galleryThumb) === nextIndex));
    };
    gallery.querySelector("[data-gallery-prev]")?.addEventListener("click", () => update(Number(gallery.dataset.galleryIndex) - 1));
    gallery.querySelector("[data-gallery-next]")?.addEventListener("click", () => update(Number(gallery.dataset.galleryIndex) + 1));
    gallery.querySelectorAll("[data-gallery-thumb]").forEach((thumb) => thumb.addEventListener("click", () => update(Number(thumb.dataset.galleryThumb))));
  }

  function buildFields(record) {
    if (record.mode === "dispatchUnits") {
      return [
        { label: "GTIN-14", value: record.code },
        { label: "GTIN contenido", value: record.containedGtin },
        { label: "Descripcion", value: record.containedDescription || record.name },
        { label: "Unidades contenidas", value: record.unitsContained },
        { label: "Envase agrupador", value: record.packagingLevel || record.packaging },
        { label: "Destino", value: record.destination },
        { label: "Origen", value: record.origin },
        { label: "Fecha de alta", value: formatDate(record.createdAt) },
        { label: "Fecha de modificacion", value: formatDate(record.modifiedAt) },
      ];
    }

    return [
      { label: "Tipo", value: record.type },
      { label: "GTIN", value: record.code },
      { label: "Marca", value: record.brand },
      { label: "Submarca", value: record.subBrand },
      { label: "Clasificacion", value: record.classification },
      { label: "Contenido neto", value: record.content },
      { label: "Envase", value: record.packaging },
      { label: "Distribucion", value: record.distributionType },
      { label: "Mercados", value: (record.markets || []).join(", ") },
      { label: "Linea de negocio", value: record.lineOfBusiness },
      { label: "Origen", value: record.origin },
      { label: "Fecha de alta", value: formatDate(record.createdAt) },
      { label: "Fecha de modificacion", value: formatDate(record.modifiedAt) },
    ];
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

  function getCopyUrl(record) {
    return record.mode === "dispatchUnits"
      ? `producto-nuevo-dun14.html?mode=copy&id=${encodeURIComponent(record.id)}`
      : `producto-nuevo.html?mode=copy&id=${encodeURIComponent(record.id)}`;
  }

  function getEditUrl(record) {
    if (record.mode === "dispatchUnits") {
      return `producto-editar-dun14.html?id=${encodeURIComponent(record.id)}`;
    }
    if (record.graceStatus === "exception-required") {
      return `producto-solicitud-modificacion.html?id=${encodeURIComponent(record.id)}&view=new`;
    }
    if (record.graceStatus === "exception-open") {
      return `producto-solicitud-modificacion.html?id=${encodeURIComponent(record.id)}&view=open`;
    }
    return `producto-editar.html?id=${encodeURIComponent(record.id)}`;
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
    return window.GS1Utils ? window.GS1Utils.formatDate(value) : value || "-";
  }

  function escapeHtml(value) {
    return window.GS1Utils ? window.GS1Utils.escapeHtml(value) : String(value || "");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replaceAll("'", "&#39;");
  }

  function imageIcon(size) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-image" viewBox="0 0 16 16" aria-hidden="true"><path d="M.5 1A1.5 1.5 0 0 0-1 2.5v11A1.5 1.5 0 0 0 .5 15h15a1.5 1.5 0 0 0 1.5-1.5v-11A1.5 1.5 0 0 0 15.5 1zm0 1h15a.5.5 0 0 1 .5.5v6.248l-3.37-3.37a1 1 0 0 0-1.415 0L6.5 10.293 4.354 8.146a.5.5 0 0 0-.708 0L0 11.793V2.5A.5.5 0 0 1 .5 2m15 12H.5a.5.5 0 0 1-.5-.5v-.293l4-4 2.146 2.147a1 1 0 0 0 1.415 0l4.793-4.793L16 10.207V13.5a.5.5 0 0 1-.5.5M4.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/></svg>`;
  }
})();
