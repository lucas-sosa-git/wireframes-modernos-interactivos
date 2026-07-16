(function () {
  document.addEventListener("DOMContentLoaded", function () {
    if (!window.GS1ProductCatalog) {
      return;
    }
    const id = window.GS1Utils.getUrlParam("id");
    const record = id ? window.GS1ProductCatalog.getById(id) : null;
    if (!record) {
      return;
    }
    const destination = record.mode === "dispatchUnits"
      ? `producto-nuevo-dun14.html?mode=copy&id=${encodeURIComponent(record.id)}`
      : `producto-nuevo.html?mode=copy&id=${encodeURIComponent(record.id)}`;
    window.location.replace(destination);
  });
})();
