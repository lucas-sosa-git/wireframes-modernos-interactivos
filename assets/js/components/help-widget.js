(function () {
  const STORAGE_KEY = "gs1.helpWidget.position";
  const DRAG_THRESHOLD = 6;
  const SAFE_MARGIN = 16;
  const SAFE_BOTTOM = 96;
  const MOUNT_SELECTOR = "[data-help-widget]";

  function initAll() {
    document.querySelectorAll(MOUNT_SELECTOR).forEach((mount) => {
      if (mount.dataset.helpWidgetMounted === "true") {
        return;
      }
      mount.dataset.helpWidgetMounted = "true";
      mount.innerHTML = createMarkup();
      initWidget(mount);
    });
  }

  function createMarkup() {
    return `
      <div class="help-widget help-widget-shell" data-help-widget-root>
        <div class="help-widget__tooltip" role="tooltip">¿En qué podemos ayudarte?</div>
        <button type="button" class="help-widget__button" data-help-widget-button aria-label="¿En qué podemos ayudarte?" aria-expanded="false" aria-controls="helpWidgetPanel">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 12.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5M3 8.062C3 6.76 4.235 5.765 5.53 5.886a26.6 26.6 0 0 0 4.94 0C11.765 5.765 13 6.76 13 8.062v1.157a.93.93 0 0 1-.765.935c-.845.147-2.34.346-4.235.346s-3.39-.2-4.235-.346A.93.93 0 0 1 3 9.219zM8.5 1.866a1 1 0 1 0-1 0V3h-2A4.5 4.5 0 0 0 1 7.5V8a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1v-.5A4.5 4.5 0 0 0 10.5 3h-2z"/>
          </svg>
        </button>
        <section class="help-widget__panel d-none" id="helpWidgetPanel" data-help-widget-panel aria-label="Asistente GS1">
          <div class="help-widget__panel-header">
            <div>
              <div class="fw-semibold">Asistente GS1</div>
              <div class="small text-secondary">Soporte contextual del wireframe</div>
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-sm btn-outline-secondary" data-help-widget-minimize>Minimizar</button>
              <button type="button" class="btn-close" data-help-widget-close aria-label="Cerrar"></button>
            </div>
          </div>
          <div class="help-widget__panel-body" data-help-widget-messages>
            <div class="help-widget__message help-widget__message--bot">Podemos ayudarte con filtros, licencias, tablas y acciones del portal.</div>
            <div class="help-widget__message help-widget__message--bot">Esta versión simula respuestas para mantener una experiencia consistente entre vistas.</div>
          </div>
          <div class="help-widget__panel-footer">
            <textarea class="form-control" rows="2" placeholder="Escribí tu consulta de ejemplo" data-help-widget-input></textarea>
            <button type="button" class="btn btn-success mt-2 w-100" data-help-widget-submit>Preguntar</button>
          </div>
        </section>
      </div>
    `;
  }

  function initWidget(mount) {
    const root = mount.querySelector("[data-help-widget-root]");
    const button = mount.querySelector("[data-help-widget-button]");
    const panel = mount.querySelector("[data-help-widget-panel]");
    const minimize = mount.querySelector("[data-help-widget-minimize]");
    const close = mount.querySelector("[data-help-widget-close]");
    const submit = mount.querySelector("[data-help-widget-submit]");
    const input = mount.querySelector("[data-help-widget-input]");
    const messages = mount.querySelector("[data-help-widget-messages]");
    const drag = {
      pointerId: null,
      startX: 0,
      startY: 0,
      originX: 0,
      originY: 0,
      offsetX: 0,
      offsetY: 0,
      nextX: 0,
      nextY: 0,
      moved: false,
      frameRequested: false,
    };

    restorePosition(root);

    button.addEventListener("pointerdown", (event) => {
      const current = readPosition(root);
      drag.pointerId = event.pointerId;
      drag.startX = event.clientX;
      drag.startY = event.clientY;
      drag.originX = current.x;
      drag.originY = current.y;
      drag.offsetX = event.clientX - current.x;
      drag.offsetY = event.clientY - current.y;
      drag.nextX = current.x;
      drag.nextY = current.y;
      drag.moved = false;
      button.setPointerCapture(event.pointerId);
    });

    button.addEventListener("pointermove", (event) => {
      if (event.pointerId !== drag.pointerId) {
        return;
      }

      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      if (!drag.moved && Math.max(Math.abs(deltaX), Math.abs(deltaY)) >= DRAG_THRESHOLD) {
        drag.moved = true;
        root.classList.add("help-widget--dragging");
        document.body.classList.add("help-widget--dragging");
      }

      if (!drag.moved) {
        return;
      }

      const next = constrainPosition(
        event.clientX - drag.offsetX,
        event.clientY - drag.offsetY,
        button
      );
      drag.nextX = next.x;
      drag.nextY = next.y;

      if (!drag.frameRequested) {
        drag.frameRequested = true;
        window.requestAnimationFrame(() => {
          drag.frameRequested = false;
          applyPosition(root, drag.nextX, drag.nextY);
        });
      }
    });

    const endDrag = (event) => {
      if (event.pointerId !== drag.pointerId) {
        return;
      }

      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }

      drag.pointerId = null;
      root.classList.remove("help-widget--dragging");
      document.body.classList.remove("help-widget--dragging");

      if (drag.moved) {
        persistPosition(root);
        return;
      }

      togglePanel(root, !panel.classList.contains("d-none"));
    };

    button.addEventListener("pointerup", endDrag);
    button.addEventListener("pointercancel", (event) => {
      if (event.pointerId !== drag.pointerId) {
        return;
      }
      if (button.hasPointerCapture(event.pointerId)) {
        button.releasePointerCapture(event.pointerId);
      }
      drag.pointerId = null;
      root.classList.remove("help-widget--dragging");
      document.body.classList.remove("help-widget--dragging");
    });

    minimize.addEventListener("click", () => togglePanel(root, true));
    close.addEventListener("click", () => togglePanel(root, true));
    submit.addEventListener("click", () => {
      const question = input.value.trim() || "Necesito ayuda con esta pantalla.";
      appendMessage(messages, question, "user");
      appendMessage(messages, "Estamos listos para integrar respuestas reales en una siguiente etapa.", "bot");
      input.value = "";
      messages.scrollTop = messages.scrollHeight;
    });

    window.addEventListener("resize", () => {
      const constrained = constrainPosition(readPosition(root).x, readPosition(root).y, button);
      applyPosition(root, constrained.x, constrained.y);
      persistPosition(root);
    });
  }

  function togglePanel(root, forceClose) {
    const panel = root.querySelector("[data-help-widget-panel]");
    const button = root.querySelector("[data-help-widget-button]");
    const shouldHide = typeof forceClose === "boolean" ? forceClose : !panel.classList.contains("d-none");
    panel.classList.toggle("d-none", shouldHide);
    button.setAttribute("aria-expanded", shouldHide ? "false" : "true");
  }

  function appendMessage(container, text, role) {
    const message = document.createElement("div");
    message.className = `help-widget__message help-widget__message--${role}`;
    message.textContent = text;
    container.appendChild(message);
  }

  function defaultPosition(button) {
    return constrainPosition(
      SAFE_MARGIN,
      window.innerHeight - (button.offsetHeight || 64) - SAFE_BOTTOM,
      button
    );
  }

  function restorePosition(root) {
    const button = root.querySelector("[data-help-widget-button]");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const fallback = defaultPosition(button);
      applyPosition(root, fallback.x, fallback.y);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null || typeof parsed.x !== "number" || typeof parsed.y !== "number") {
        throw new Error("invalid-position");
      }
      const constrained = constrainPosition(parsed.x, parsed.y, button);
      applyPosition(root, constrained.x, constrained.y);
    } catch (error) {
      localStorage.removeItem(STORAGE_KEY);
      const fallback = defaultPosition(button);
      applyPosition(root, fallback.x, fallback.y);
    }
  }

  function persistPosition(root) {
    const position = readPosition(root);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        x: position.x,
        y: position.y,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      })
    );
  }

  function readPosition(root) {
    return {
      x: Number(root.dataset.helpX || 0),
      y: Number(root.dataset.helpY || 0),
    };
  }

  function applyPosition(root, x, y) {
    root.dataset.helpX = String(x);
    root.dataset.helpY = String(y);
    root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  function constrainPosition(x, y, button) {
    const width = button.offsetWidth || 64;
    const height = button.offsetHeight || 64;
    const maxX = Math.max(SAFE_MARGIN, window.innerWidth - width - SAFE_MARGIN);
    const maxY = Math.max(SAFE_MARGIN, window.innerHeight - height - SAFE_MARGIN);

    return {
      x: Math.min(Math.max(x, SAFE_MARGIN), maxX),
      y: Math.min(Math.max(y, SAFE_MARGIN), maxY),
    };
  }

  window.HelpWidget = { initAll };
  document.addEventListener("DOMContentLoaded", initAll);
})();
