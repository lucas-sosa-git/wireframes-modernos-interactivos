(function () {
  const MOUNT_SELECTOR = "[data-account-tools-card]";

  document.addEventListener("DOMContentLoaded", () => {
    mountAll();
  });

  function mountAll(root = document) {
    root.querySelectorAll(MOUNT_SELECTOR).forEach(mountCard);
  }

  function mountCard(mount) {
    if (!mount) {
      return;
    }

    if (mount.dataset.accountToolsCardMounted !== "true") {
      mount.dataset.accountToolsCardMounted = "true";
      mount.innerHTML = `
        <section class="account-tools-card card shadow-sm" aria-label="Atajos y datos de la cuenta">
          <div class="card-body">
            <div data-account-summary></div>
            <hr class="account-tools-card__divider">
            <section class="shortcuts-section shortcuts-section--account" aria-label="Atajos rápidos">
              <div data-shortcuts data-shortcuts-context="${escapeHtml(mount.dataset.accountToolsContext || "portal")}"></div>
            </section>
          </div>
        </section>
      `;
    }

    if (window.GS1AccountSummary) {
      window.GS1AccountSummary.mountAll(mount);
    }
    if (window.GS1Shortcuts) {
      window.GS1Shortcuts.initAll();
    }
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  window.GS1AccountToolsCard = {
    mountAll,
  };
})();
