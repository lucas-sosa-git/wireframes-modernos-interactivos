(function () {
  const MOUNT_SELECTOR = "[data-account-summary]";
  const DEFAULT_MEMBERSHIP_TIER = "standard";

  document.addEventListener("DOMContentLoaded", () => {
    mountAll();
  });

  function mountAll(root = document) {
    root.querySelectorAll(MOUNT_SELECTOR).forEach((mount) => {
      renderMount(mount);
    });
  }

  function updateMount(mount, data = {}) {
    if (!mount) {
      return;
    }

    if (Object.prototype.hasOwnProperty.call(data, "cuit")) {
      mount.dataset.accountCuit = data.cuit || "";
    }
    if (Object.prototype.hasOwnProperty.call(data, "license")) {
      mount.dataset.accountLicense = data.license || "";
    }
    if (Object.prototype.hasOwnProperty.call(data, "membership")) {
      mount.dataset.accountMembership = data.membership || "";
    }
    if (Object.prototype.hasOwnProperty.call(data, "membershipTier")) {
      mount.dataset.accountMembershipTier = data.membershipTier || DEFAULT_MEMBERSHIP_TIER;
    }

    renderMount(mount);
  }

  function renderMount(mount) {
    if (!mount) {
      return;
    }

    const cuit = escapeHtml(mount.dataset.accountCuit || "");
    const license = escapeHtml(mount.dataset.accountLicense || "");
    const membership = escapeHtml(mount.dataset.accountMembership || "");
    const membershipTier = normalizeTier(mount.dataset.accountMembershipTier);

    mount.dataset.accountSummaryMounted = "true";
    mount.innerHTML = `
      <section class="account-summary card shadow-sm">
        <div class="card-body">
          <div class="account-summary__grid">
            <div class="account-summary__item">
              <div class="account-summary__label">CUIT</div>
              <div class="account-summary__value">${cuit || "-"}</div>
            </div>
            <div class="account-summary__item">
              <div class="account-summary__label">Licencia</div>
              <div class="account-summary__value">${license || "-"}</div>
            </div>
            <div class="account-summary__item">
              <div class="account-summary__label">Membresía</div>
              <div class="account-summary__value">
                <span class="membership-badge membership-badge--${membershipTier}">${membership || "-"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function normalizeTier(value) {
    const normalized = String(value || DEFAULT_MEMBERSHIP_TIER)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-");

    return normalized || DEFAULT_MEMBERSHIP_TIER;
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  window.GS1AccountSummary = {
    mountAll,
    updateMount,
  };
})();
