(function () {
  document.addEventListener("DOMContentLoaded", initProductForm);

  function initProductForm() {
    const path = window.location.pathname;
    if (!/producto-(nuevo|editar)\.html$/i.test(path) || !window.GS1ProductCatalog) {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const id = params.get("id");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;

    repurposeCommercialTypeCards();

    if (path.endsWith("producto-editar.html") && record) {
      preloadCommercialFields(record);
      injectEditNotice(record);
    }

    if (mode === "copy" && record && record.mode === "products") {
      preloadCommercialFields(record);
      injectCopyNotice(record);
    }
  }

  function repurposeCommercialTypeCards() {
    const cards = Array.from(document.querySelectorAll("#paso10a .card-title"));
    const descriptions = Array.from(document.querySelectorAll("#paso10a .card-body p"));
    if (cards[2]) {
      cards[2].textContent = "UPC-12";
    }
    if (descriptions[2]) {
      descriptions[2].textContent = "El UPC-12 identifica productos para mercados compatibles con UPC-A.";
    }
    const step = document.getElementById("paso12b");
    if (step) {
      step.innerHTML = '<h4 class="mb-0"><img src="../assets/img/check-verde.png" class="imagen-indicador">01 - Tipo de GTIN: UPC-12</h4>';
    }
  }

  function preloadCommercialFields(record) {
    setValue("#Producto", record.name);
    setValue("#variedad", record.variety);
    setValue("#contenidoneto", extractNumber(record.content));
    setValue("#codigo", "");
    setValue("#codigointerno", `${record.code}-COPIA`);
    setValue("#buscarconf", record.classification);
    setSelectByText(0, record.brand);
    setSelectByText(1, record.subBrand);
    setSelectByText(2, record.packaging);
    setSelectByText(3, extractUnit(record.content));
    setSelectByText(4, record.origin);
    const image = document.querySelector("#imagen-1 img");
    if (image && record.image) {
      image.src = record.image;
      image.alt = record.name;
    }
  }

  function injectCopyNotice(record) {
    injectBanner(`
      <div class="alert alert-primary gs1-inline-banner" role="status">
        <div class="fw-semibold">Copia de producto</div>
        <div class="small">Se precargaron los datos de <strong>${escapeHtml(record.name)}</strong>. Deb&eacute;s asignar un GTIN nuevo. GTIN de origen: <span class="fw-semibold">${escapeHtml(record.code)}</span>.</div>
      </div>
    `);
  }

  function injectEditNotice(record) {
    injectBanner(`
      <div class="alert alert-info gs1-inline-banner" role="status">
        <div class="fw-semibold">Edici&oacute;n habilitada</div>
        <div class="small">El producto <strong>${escapeHtml(record.name)}</strong> est&aacute; dentro del per&iacute;odo de gracia y puede modificarse directamente.</div>
      </div>
    `);
  }

  function injectBanner(markup) {
    const host = document.getElementById("card-nuevo-producto");
    if (host && !host.querySelector(".gs1-inline-banner")) {
      host.insertAdjacentHTML("afterbegin", markup);
    }
  }

  function setValue(selector, value) {
    const field = document.querySelector(selector);
    if (field) {
      field.value = value || "";
    }
  }

  function setSelectByText(index, text) {
    const select = document.querySelectorAll("#paso40a select")[index];
    if (!select || !text) {
      return;
    }
    let option = Array.from(select.options).find((item) => item.textContent.trim().toLowerCase() === String(text).trim().toLowerCase());
    if (!option) {
      option = document.createElement("option");
      option.value = String(select.options.length + 1);
      option.textContent = text;
      select.appendChild(option);
    }
    option.selected = true;
  }

  function extractNumber(content) {
    const match = String(content || "").match(/[\d,.]+/);
    return match ? match[0] : "";
  }

  function extractUnit(content) {
    return String(content || "").replace(/[\d\s,.]+/g, "").trim() || "Unidad";
  }

  function escapeHtml(value) {
    return window.GS1Utils ? window.GS1Utils.escapeHtml(value) : String(value || "");
  }
})();
