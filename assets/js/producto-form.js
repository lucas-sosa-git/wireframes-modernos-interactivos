(function () {
  const BUSINESS_LINE_OPTIONS = [
    "Alimentos",
    "Medicamentos",
    "Electro",
    "Textil",
    "Cuidado personal",
    "Hogar",
  ];
  const DISTRIBUTION_VALUES = ["Nacional", "Internacional"];
  const SCROLLABLE_ACTIONS = [
    { name: "validar_paso40", target: "#paso50a" },
    { name: "editar_paso40", target: "#paso40a" },
    { name: "validar_paso50", target: "#paso60a" },
    { name: "editar_paso50", target: "#paso50a" },
    { name: "validar_paso60", target: "#paso70a" },
    { name: "editar_paso60", target: "#paso60a" },
    { name: "validar_paso70", target: "#paso80a" },
    { name: "editar_paso70", target: "#paso70a" },
    { name: "validar_paso80", target: "#paso90a" },
    { name: "editar_paso80", target: "#paso80a" },
    { name: "validar_paso90", target: "#paso100a" },
    { name: "editar_paso90", target: "#paso90a" },
  ];

  const wizardState = {
    gtinType: null,
    distributionType: null,
    lineOfBusiness: null,
  };

  let scrollToken = 0;

  document.addEventListener("DOMContentLoaded", initProductForm);

  function initProductForm() {
    const path = window.location.pathname;
    if (!/producto-(nuevo|editar)\.html$/i.test(path) || !window.GS1ProductCatalog) {
      return;
    }

    document.body.classList.toggle("product-edit-page", /producto-editar\.html$/i.test(path));
    const card = document.getElementById("card-nuevo-producto");
    if (card) {
      card.classList.add("product-edit-form-shell");
    }

    setupSharedChrome();
    bindWizard();
    wrapLegacyStepActions();

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const id = params.get("id");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;

    if (/producto-editar\.html$/i.test(path) && record) {
      preloadCommercialFields(record);
      injectEditNotice(record);
    }

    if (mode === "copy" && record && record.mode === "products") {
      preloadCommercialFields(record);
      preloadWizardSelections(record);
      injectCopyNotice(record);
    }
  }

  function setupSharedChrome() {
    replaceLegacyShortcuts();
    replaceLegacyAccountSummary();
  }

  function replaceLegacyShortcuts() {
    const legacy = document.getElementById("contenedor-atajos");
    if (!legacy) {
      return;
    }

    legacy.outerHTML = `
      <section class="shortcuts-section shortcuts-section--top mb-3" aria-label="Atajos rápidos">
        <div data-shortcuts data-shortcuts-context="producto-nuevo"></div>
      </section>
    `;

    if (window.GS1Shortcuts && typeof window.GS1Shortcuts.initAll === "function") {
      window.GS1Shortcuts.initAll();
    }
  }

  function replaceLegacyAccountSummary() {
    const host = document.getElementById("contenedor-empresa");
    if (!host) {
      return;
    }

    host.innerHTML = `
      <div
        data-account-summary
        data-account-cuit="30-71234567-8"
        data-account-license="GS1 Alimentos del Sur"
        data-account-membership="Plan Estándar"
        data-account-membership-tier="standard"
      ></div>
    `;

    if (window.GS1AccountSummary) {
      window.GS1AccountSummary.mountAll(host);
    }
  }

  function bindWizard() {
    setupBusinessLineSearch();
    bindBusinessLineCards();
    bindDistributionCards();
    updateWizardSummaries();

    window.validar_paso10 = () => selectGtinType("GTIN-13", "#paso10b");
    window.validar_paso11 = () => selectGtinType("UPC-12", "#paso11b");
    window.validar_paso12 = () => selectGtinType("GTIN-8", "#paso12b");
    window.editar_paso10 = () => reopenStep("#paso10a", ["#paso10b", "#paso11b", "#paso12b"], "#paso10c");

    window.validar_paso20 = function validarPaso20() {
      const selectedButton = getActiveDistributionButton();
      const value = selectedButton ? selectedButton.dataset.distributionValue : wizardState.distributionType || "Nacional";
      wizardState.distributionType = value;
      setSummaryText("#paso20b h4", `02 - Tipo de distribución: ${value}`);
      animateWizardStep({
        hide: ["#paso20a", "#paso20c"],
        show: ["#paso20b", "#paso30a"],
        scrollTarget: "#paso30a",
      });
    };

    window.editar_paso20 = function editarPaso20() {
      animateWizardStep({
        hide: ["#paso20b", "#paso20c"],
        show: ["#paso20a"],
        scrollTarget: "#paso20a",
      });
    };

    window.validar_paso30 = function validarPaso30() {
      const selectedButton = getActiveBusinessLineButton();
      const value = selectedButton ? selectedButton.dataset.businessLine : wizardState.lineOfBusiness || "Alimentos";
      wizardState.lineOfBusiness = value;
      setSummaryText("#paso30b h4", `03 - Línea de Negocio: ${value}`);
      animateWizardStep({
        hide: ["#paso30a", "#paso30c"],
        show: ["#paso30b", "#paso40a"],
        scrollTarget: "#paso40a",
      });
    };

    window.editar_paso30 = function editarPaso30() {
      animateWizardStep({
        hide: ["#paso30b", "#paso30c"],
        show: ["#paso30a"],
        scrollTarget: "#paso30a",
      });
    };
  }

  function setupBusinessLineSearch() {
    const step = document.getElementById("paso30a");
    if (!step || step.querySelector("[data-business-line-search]")) {
      return;
    }

    const optionsRow = step.querySelector(".row");
    if (!optionsRow) {
      return;
    }

    Array.from(optionsRow.querySelectorAll("a")).forEach((button, index) => {
      const label = BUSINESS_LINE_OPTIONS[index] || `Línea ${index + 1}`;
      button.dataset.businessLine = label;
      const textNode = Array.from(button.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
      if (textNode) {
        textNode.textContent = `\n\t\t${label}\n`;
      }
      button.classList.add("wizard-choice");
    });

    step.insertAdjacentHTML(
      "afterbegin",
      `
        <div class="mb-3">
          <input type="search" class="form-control" placeholder="Buscar línea de negocio" data-business-line-search>
        </div>
        <div class="alert alert-light border d-none" data-business-line-empty>No hay coincidencias para la búsqueda actual.</div>
      `,
    );

    step.querySelector("[data-business-line-search]").addEventListener("input", handleBusinessLineSearch);
  }

  function bindBusinessLineCards() {
    const step = document.getElementById("paso30a");
    if (!step) {
      return;
    }
    step.querySelectorAll("[data-business-line]").forEach((button) => {
      button.addEventListener("click", () => {
        setActiveButton(step.querySelectorAll("[data-business-line]"), button);
        wizardState.lineOfBusiness = button.dataset.businessLine;
      });
    });
  }

  function bindDistributionCards() {
    const step = document.getElementById("paso20a");
    if (!step) {
      return;
    }

    step.querySelectorAll("a").forEach((button, index) => {
      const value = DISTRIBUTION_VALUES[index] || DISTRIBUTION_VALUES[0];
      button.dataset.distributionValue = value;
      button.classList.add("wizard-choice");
      button.addEventListener("click", () => {
        setActiveButton(step.querySelectorAll("[data-distribution-value]"), button);
        wizardState.distributionType = button.dataset.distributionValue;
      });
    });
  }

  function handleBusinessLineSearch(event) {
    const query = normalizeText(event.target.value);
    const step = document.getElementById("paso30a");
    const emptyState = step.querySelector("[data-business-line-empty]");
    let visible = 0;

    step.querySelectorAll("[data-business-line]").forEach((button) => {
      const match = normalizeText(button.dataset.businessLine).includes(query);
      const column = button.closest('[class*="col-"]');
      if (column) {
        column.classList.toggle("d-none", !match);
      }
      if (match) {
        visible += 1;
      }
    });

    emptyState.classList.toggle("d-none", visible > 0);
  }

  function selectGtinType(label, summarySelector) {
    wizardState.gtinType = label;
    ["#paso10b", "#paso11b", "#paso12b"].forEach((selector) => slideUp(selector));
    setSummaryText(`${summarySelector} h4`, `01 - Tipo de GTIN: ${label}`);
    animateWizardStep({
      hide: ["#paso10a", "#paso10c"],
      show: [summarySelector, "#paso20a"],
      scrollTarget: "#paso20a",
    });
  }

  function reopenStep(stepSelector, summarySelectors, pendingSelector) {
    animateWizardStep({
      hide: [...summarySelectors, pendingSelector].filter(Boolean),
      show: [stepSelector],
      scrollTarget: stepSelector,
    });
  }

  function animateWizardStep({ hide = [], show = [], scrollTarget }) {
    hide.forEach((selector) => slideUp(selector));

    let pending = show.length;
    if (!pending) {
      scrollToWizardStep(document.querySelector(scrollTarget));
      return;
    }

    show.forEach((selector) => {
      slideDown(selector, () => {
        pending -= 1;
        if (pending === 0) {
          scrollToWizardStep(document.querySelector(scrollTarget));
        }
      });
    });
  }

  function slideDown(selector, callback) {
    const element = typeof selector === "string" ? window.jQuery(selector) : window.jQuery(selector);
    if (!element.length) {
      if (typeof callback === "function") {
        callback();
      }
      return;
    }
    element.stop(true, true).slideDown(500, callback);
  }

  function slideUp(selector, callback) {
    const element = typeof selector === "string" ? window.jQuery(selector) : window.jQuery(selector);
    if (!element.length) {
      if (typeof callback === "function") {
        callback();
      }
      return;
    }
    element.stop(true, true).slideUp(500, callback);
  }

  function scrollToWizardStep(element) {
    if (!element) {
      return;
    }

    const token = ++scrollToken;
    window.requestAnimationFrame(() => {
      if (token !== scrollToken) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const header = document.querySelector(".bg-body-secondary.position-fixed, .p-3.bg-body-secondary.border-1");
      const headerHeight = header ? header.getBoundingClientRect().height : 0;
      const margin = 16;
      const viewportTop = headerHeight + margin;
      const viewportBottom = window.innerHeight - margin;
      const topVisible = rect.top >= viewportTop;
      const bottomVisible = rect.bottom <= viewportBottom;
      if (topVisible && bottomVisible) {
        return;
      }

      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const target = Math.min(
        Math.max(window.scrollY + rect.top - headerHeight - margin, 0),
        Math.max(maxScroll, 0),
      );

      window.scrollTo({
        top: target,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    });
  }

  function wrapLegacyStepActions() {
    SCROLLABLE_ACTIONS.forEach(({ name, target }) => {
      const original = window[name];
      if (typeof original !== "function") {
        return;
      }
      window[name] = function wrappedLegacyStepAction() {
        original.apply(this, arguments);
        scrollToWizardStep(document.querySelector(target));
      };
    });
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

  function preloadWizardSelections(record) {
    const distribution = normalizeDistributionValue(record.distributionType);
    const line = record.lineOfBusiness || "Alimentos";
    wizardState.distributionType = distribution;
    wizardState.lineOfBusiness = line;
    markDistribution(distribution);
    markBusinessLine(line);
    updateWizardSummaries();
  }

  function updateWizardSummaries() {
    if (wizardState.distributionType) {
      setSummaryText("#paso20b h4", `02 - Tipo de distribución: ${wizardState.distributionType}`);
    }
    if (wizardState.lineOfBusiness) {
      setSummaryText("#paso30b h4", `03 - Línea de Negocio: ${wizardState.lineOfBusiness}`);
    }
  }

  function markDistribution(value) {
    const step = document.getElementById("paso20a");
    if (!step) {
      return;
    }
    const match = Array.from(step.querySelectorAll("[data-distribution-value]")).find((button) => button.dataset.distributionValue === value);
    if (match) {
      setActiveButton(step.querySelectorAll("[data-distribution-value]"), match);
    }
  }

  function markBusinessLine(value) {
    const step = document.getElementById("paso30a");
    if (!step) {
      return;
    }
    const match = Array.from(step.querySelectorAll("[data-business-line]")).find((button) => normalizeText(button.dataset.businessLine) === normalizeText(value));
    if (match) {
      setActiveButton(step.querySelectorAll("[data-business-line]"), match);
    }
  }

  function getActiveDistributionButton() {
    return document.querySelector("#paso20a [data-distribution-value].btn-secondary");
  }

  function getActiveBusinessLineButton() {
    return document.querySelector("#paso30a [data-business-line].btn-secondary");
  }

  function setActiveButton(buttons, activeButton) {
    Array.from(buttons).forEach((button) => {
      button.classList.toggle("btn-secondary", button === activeButton);
      button.classList.toggle("btn-outline-secondary", button !== activeButton);
    });
  }

  function normalizeDistributionValue(value) {
    return normalizeText(value) === "nacional" ? "Nacional" : "Internacional";
  }

  function injectCopyNotice(record) {
    injectBanner(`
      <div class="alert alert-primary gs1-inline-banner" role="status">
        <div class="fw-semibold">Copia de producto</div>
        <div class="small">Se precargaron los datos de <strong>${escapeHtml(record.name)}</strong>. Debés asignar un GTIN nuevo. GTIN de origen: <span class="fw-semibold">${escapeHtml(record.code)}</span>.</div>
      </div>
    `);
  }

  function injectEditNotice(record) {
    injectBanner(`
      <div class="alert alert-info gs1-inline-banner" role="status">
        <div class="fw-semibold">Edición habilitada</div>
        <div class="small">El producto <strong>${escapeHtml(record.name)}</strong> está dentro del período de gracia y puede modificarse directamente.</div>
      </div>
    `);
  }

  function injectBanner(markup) {
    const host = document.getElementById("card-nuevo-producto");
    if (host && !host.querySelector(".gs1-inline-banner")) {
      host.insertAdjacentHTML("afterbegin", markup);
    }
  }

  function setSummaryText(selector, text) {
    const heading = document.querySelector(selector);
    if (!heading) {
      return;
    }
    const buttonMarkup = heading.querySelector("a") ? heading.querySelector("a").outerHTML : "";
    heading.innerHTML = `<img src="../assets/img/check-verde.png" class="imagen-indicador">${escapeHtml(text)} ${buttonMarkup}`.trim();
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
    let option = Array.from(select.options).find((item) => normalizeText(item.textContent) === normalizeText(text));
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

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function escapeHtml(value) {
    return window.GS1Utils ? window.GS1Utils.escapeHtml(value) : String(value || "");
  }
})();
