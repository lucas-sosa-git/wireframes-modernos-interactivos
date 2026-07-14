(function () {
  const PROFILE_NAME = "Maria Alejandra Lopez";
  const PROFILE_EMAIL = "maria.lopez@empresa.com";
  const LICENSE_NAME = "GS1 Alimentos del Sur";

  document.addEventListener("DOMContentLoaded", initPortalChrome);

  function initPortalChrome() {
    const legacyTransformed = transformLegacyLayout();
    const sidebarMount = document.querySelector("[data-portal-sidebar]");
    const headerMount = document.querySelector("[data-portal-header]");

    if (!sidebarMount || !headerMount) {
      return;
    }

    if (sidebarMount.dataset.portalChromeMounted === "true" && headerMount.dataset.portalChromeMounted === "true") {
      return;
    }

    renderSidebar(sidebarMount);
    renderHeader(headerMount);
    ensureSharedPanels();
    updateNotificationBadge();

    if (legacyTransformed) {
      document.body.classList.add("portal-chrome-ready");
    }
  }

  function transformLegacyLayout() {
    if (document.querySelector("[data-portal-sidebar]") && document.querySelector("[data-portal-header]")) {
      return false;
    }

    const main = document.querySelector("main.d-flex.flex-nowrap");
    if (!main || main.classList.contains("layout-shell")) {
      return false;
    }

    const contentShell = main.children[1];
    if (!contentShell) {
      return false;
    }

    const sidebarMount = document.createElement("div");
    sidebarMount.setAttribute("data-portal-sidebar", "");
    sidebarMount.setAttribute("data-active-section", "productos");

    main.className = "layout-shell d-flex flex-nowrap";
    main.removeAttribute("style");
    main.replaceChild(sidebarMount, main.children[0]);

    contentShell.classList.add("content-shell", "d-flex", "flex-column", "flex-shrink-0", "p-0", "bg-body-tertiary");
    contentShell.style.marginLeft = "";
    contentShell.style.width = "";

    const headerCandidate = contentShell.querySelector(".p-3.bg-body-secondary.border-1.border-light.text-end");
    const directWrapper = headerCandidate ? headerCandidate.parentElement : null;
    if (directWrapper) {
      const titleText = extractLegacyTitle(headerCandidate);
      const headerMount = document.createElement("header");
      headerMount.setAttribute("data-portal-header", "");
      headerMount.setAttribute("data-page-title", titleText);
      directWrapper.replaceWith(headerMount);
    }

    return true;
  }

  function extractLegacyTitle(container) {
    const titleNode = container.querySelector(".fs-4");
    if (!titleNode) {
      return "Productos";
    }
    return titleNode.textContent.replace(/\s+/g, " ").trim();
  }

  function renderSidebar(mount) {
    mount.dataset.portalChromeMounted = "true";
    mount.innerHTML = `
      <div class="sidebar-fixed p-3 bg-body-secondary position-fixed">
        <a href="#" class="d-flex align-items-center pb-3 mb-3 link-body-emphasis text-decoration-none border-bottom">
          <img class="mb-2" src="../assets/img/gs1.png" alt="" height="61">
        </a>

        <ul class="list-unstyled ps-0 nav nav-pills flex-column">
          <li class="mb-2 pb-2 border-bottom">
            <a class="btn d-inline-flex align-items-center rounded border-0 collapsed p-2 text-success" href="micuenta.html">
              ${icon("window-dock", 22)}
              Mi escritorio
            </a>
          </li>
          <li class="mb-2 pb-2 border-bottom">
            <button class="btn dropdown-toggle d-inline-flex align-items-center rounded border-0 collapsed p-2" data-bs-toggle="collapse" data-bs-target="#portalUsersCollapse" aria-expanded="false">
              ${icon("people", 22)}
              Usuarios
            </button>
            <div class="collapse" id="portalUsersCollapse">
              <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><a href="#" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3">Mis Usuarios</a></li>
                <li><a href="#" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3">Alta de Usuarios</a></li>
                <li><a href="#" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3">Modificar Datos</a></li>
              </ul>
            </div>
          </li>
          <li class="mb-2 pb-2 border-bottom">
            <button class="btn dropdown-toggle d-inline-flex align-items-center rounded border-0 collapsed p-2" data-bs-toggle="collapse" data-bs-target="#portalCompaniesCollapse" aria-expanded="false">
              ${icon("building", 22)}
              Empresas
            </button>
            <div class="collapse" id="portalCompaniesCollapse">
              <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><a href="#" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3">Lista de Empresas</a></li>
                <li><a href="#" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3">Asignacion de GLN</a></li>
              </ul>
            </div>
          </li>
          <li class="mb-2 pb-2 border-bottom">
            <button class="btn dropdown-toggle d-inline-flex align-items-center rounded border-0 collapsed p-2 ${isActiveSection(mount, "productos") ? "text-success" : ""}" data-bs-toggle="collapse" data-bs-target="#portalProductsCollapse" aria-expanded="true">
              ${icon("box-seam", 22)}
              Productos
            </button>
            <div class="collapse show" id="portalProductsCollapse">
              <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><a href="producto-nuevo.html" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3">Alta de productos</a></li>
                <li><a href="productos.html" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3">Mis productos</a></li>
                <li><a href="productos-carga-masiva.html" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3">Carga Masiva</a></li>
              </ul>
            </div>
          </li>
          <li class="mb-2 pb-2 border-bottom">
            <button class="btn dropdown-toggle d-inline-flex align-items-center rounded border-0 collapsed p-2" data-bs-toggle="collapse" data-bs-target="#portalGuidesCollapse" aria-expanded="false">
              ${icon("file-earmark-medical", 22)}
              Instructivos
            </button>
            <div class="collapse" id="portalGuidesCollapse">
              <ul class="btn-toggle-nav list-unstyled fw-normal pb-1 small">
                <li><a href="../assets/archivos/Instructivo_ABM.pdf" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3" target="_blank">Instructivo ABM</a></li>
                <li><a href="../assets/archivos/Instructivo_ABM_Senasa.pdf" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3" target="_blank">Instructivo Senasa</a></li>
                <li><a href="../assets/archivos/terminos.pdf" class="link-body-emphasis d-inline-flex text-decoration-none rounded p-2 px-3" target="_blank">Terminos y condiciones</a></li>
              </ul>
            </div>
          </li>
        </ul>

        <div class="sidebar-footer">
          <a class="btn d-inline-flex align-items-center rounded border-0 p-2" href="../b03/preferencias.html" data-bs-toggle="tooltip" data-bs-title="Ajustes">
            ${icon("gear", 22)}
            Ajustes
          </a>
        </div>
      </div>
    `;
  }

  function renderHeader(mount) {
    const title = mount.dataset.pageTitle || "Productos";
    mount.dataset.portalChromeMounted = "true";
    mount.innerHTML = `
      <div class="p-3 bg-body-secondary border-1 border-light text-end">
        <div class="fs-4 ms-1 me-2 float-start text-secondary">
          ${icon("box-seam", 32)}
          ${escapeHtml(title)}
        </div>

        <a href="producto-nuevo.html" class="btn btn-outline-success ms-1 me-2">
          ${icon("plus-lg", 16)}
          Nuevo Producto
        </a>

        <button class="btn btn-outline-secondary p-1 me-2 border-0" type="button" data-bs-toggle="tooltip" data-bs-title="Ayuda del modulo">
          ${icon("question-circle", 32)}
        </button>

        <button id="notificationToggle" class="btn btn-outline-secondary p-1 position-relative me-2 border-0" type="button" data-bs-toggle="offcanvas" data-bs-target="#notificationsPanel" aria-controls="notificationsPanel">
          ${icon("bell", 32)}
          <span id="notificationBadge" class="notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">3</span>
        </button>

        <div class="btn-group">
          <button type="button" class="btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            ${icon("person", 32)}
            <span id="currentUserName">${PROFILE_NAME}</span>
          </button>
          <ul class="profile-menu dropdown-menu dropdown-menu-end">
            <li class="bg-white p-3">
              <a href="micuenta.html" class="text-decoration-none link-body-emphasis">
                <div class="bg-white">
                  <img src="../assets/img/usuario-sin-imagen.jpg" width="45" class="profile-avatar-sm me-2 float-start" alt="">
                  <strong>Mi cuenta</strong><br>
                  <small id="currentUserEmail">${PROFILE_EMAIL}</small><br>
                  <small class="text-secondary">Licencia: <span id="currentLicenseNameMenu">${LICENSE_NAME}</span></small>
                </div>
              </a>
            </li>
            <li class="border-top"><button type="button" class="dropdown-item p-3" data-bs-toggle="modal" data-bs-target="#licenseModal">Cambiar empresa o licencia</button></li>
            <li class="border-top"><a class="dropdown-item p-3" href="micuenta.html#ModalEditarMisDatos">Editar usuario</a></li>
            <li class="border-top"><button type="button" class="dropdown-item dropdown-item-danger p-3 d-flex align-items-center gap-2" data-bs-toggle="modal" data-bs-target="#logoutConfirmModal">
              ${icon("box-arrow-right", 18)}
              Cerrar sesion
            </button></li>
          </ul>
        </div>
      </div>
    `;
  }

  function ensureSharedPanels() {
    if (!document.getElementById("notificationsPanel")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div class="offcanvas offcanvas-end" tabindex="-1" id="notificationsPanel" aria-labelledby="notificationsPanelLabel">
            <div class="offcanvas-header">
              <h2 class="offcanvas-title h5" id="notificationsPanelLabel">Notificaciones</h2>
              <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Cerrar"></button>
            </div>
            <div class="offcanvas-body">
              <div class="notification-list">
                <div class="notification-card">
                  <div class="fw-semibold">Revision pendiente</div>
                  <div class="small text-secondary">Hay productos con observaciones por revisar.</div>
                </div>
                <div class="notification-card">
                  <div class="fw-semibold">Factura disponible</div>
                  <div class="small text-secondary">La factura del plan estandar ya puede descargarse.</div>
                </div>
              </div>
            </div>
          </div>
        `,
      );
    }

    if (!document.getElementById("licenseModal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div class="modal fade" id="licenseModal" tabindex="-1" aria-labelledby="licenseModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
              <div class="modal-content">
                <div class="modal-header">
                  <h2 class="modal-title fs-5" id="licenseModalLabel">Cambiar empresa o licencia</h2>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                  <div class="license-card license-card-active">
                    <div>
                      <div class="fw-semibold">${LICENSE_NAME}</div>
                      <div class="small text-secondary">CUIT 30-71234567-8</div>
                    </div>
                    <span class="badge text-bg-success">Activa</span>
                  </div>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
              </div>
            </div>
          </div>
        `,
      );
    }

    if (!document.getElementById("logoutConfirmModal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div class="modal fade" id="logoutConfirmModal" tabindex="-1" aria-labelledby="logoutConfirmModalLabel" aria-hidden="true">
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h2 class="modal-title fs-5" id="logoutConfirmModalLabel">Cerrar sesion</h2>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                  <p class="mb-0">Queres cerrar la sesion?</p>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                  <a href="../b04/ingresar.html" class="btn btn-danger">Cerrar sesion</a>
                </div>
              </div>
            </div>
          </div>
        `,
      );
    }
  }

  function updateNotificationBadge() {
    const badge = document.getElementById("notificationBadge");
    if (badge) {
      badge.textContent = "3";
    }
  }

  function isActiveSection(mount, section) {
    return (mount.dataset.activeSection || "") === section;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function icon(name, size) {
    const icons = {
      "window-dock": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-window-dock me-2" viewBox="0 0 16 16"><path d="M3.5 11a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm3.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm4.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/><path d="M14 1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zM2 14h12a1 1 0 0 0 1-1V5H1v8a1 1 0 0 0 1 1M2 2a1 1 0 0 0-1 1v1h14V3a1 1 0 0 0-1-1z"/></svg>`,
      people: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-people me-2" viewBox="0 0 16 16"><path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/></svg>`,
      building: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-building me-2" viewBox="0 0 16 16"><path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5z"/><path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3z"/></svg>`,
      "box-seam": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-box-seam me-2 mb-1" viewBox="0 0 16 16"><path d="M8.186 1.113a.5.5 0 0 0-.372 0L1.846 3.5l2.404.961L10.404 2zm3.564 1.426L5.596 5 8 5.961 14.154 3.5zm3.25 1.7-6.5 2.6v7.922l6.5-2.6V4.24zM7.5 14.762V6.838L1 4.239v7.923zM7.443.184a1.5 1.5 0 0 1 1.114 0l7.129 2.852A.5.5 0 0 1 16 3.5v8.662a1 1 0 0 1-.629.928l-7.185 2.874a.5.5 0 0 1-.372 0L.63 13.09a1 1 0 0 1-.63-.928V3.5a.5.5 0 0 1 .314-.464z"/></svg>`,
      "file-earmark-medical": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-file-earmark-medical me-2" viewBox="0 0 16 16"><path d="M7.5 5.5a.5.5 0 0 0-1 0v.634l-.549-.317a.5.5 0 1 0-.5.866L6 7l-.549.317a.5.5 0 1 0 .5.866l.549-.317V8.5a.5.5 0 1 0 1 0v-.634l.549.317a.5.5 0 1 0 .5-.866L8 7l.549-.317a.5.5 0 1 0-.5-.866l-.549.317zm-2 4.5a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1zm0 2a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1z"/><path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2M9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/></svg>`,
      gear: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-gear me-2" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492M5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115z"/></svg>`,
      "plus-lg": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/></svg>`,
      "question-circle": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-question-circle" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/><path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/></svg>`,
      bell: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-bell" viewBox="0 0 16 16"><path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2M8 1.918l-.797.161A4 4 0 0 0 4 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4 4 0 0 0-3.203-3.92zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 1 1 1.99 0A5 5 0 0 1 13 6c0 .88.32 4.2 1.22 6"/></svg>`,
      person: `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-person" viewBox="0 0 16 16"><path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z"/></svg>`,
      "box-arrow-right": `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" fill="currentColor" class="bi bi-box-arrow-right" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/><path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/></svg>`,
    };
    return icons[name] || "";
  }
})();
