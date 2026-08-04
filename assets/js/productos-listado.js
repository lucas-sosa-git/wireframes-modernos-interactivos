(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const mount = document.getElementById("catalogListMount");
    if (!mount || !window.GS1ProductTable) return;
    const mode = mount.dataset.listMode === "dispatchUnits" ? "dispatchUnits" : "products";
    const isDispatchList = mode === "dispatchUnits";
    const downloadLabel = isDispatchList ? "Descargar unidades de despacho a Excel" : "Descargar Productos a Excel";
    window.GS1ProductTable.mount({
      mount,
      mode,
      persistenceKey: `gs1.products.columnVisibility.list.${mode}.v4`,
      eyebrow: "Catálogo GS1",
      heading: mode === "products" ? "Productos comerciales" : "Unidades de despacho DUN 14",
      description: "Consultá y administrá los registros desde un listado responsive.",
      headerActions: `<div class="d-flex flex-wrap gap-2"><button type="button" class="btn btn-outline-primary" id="downloadProductsListBtn">${downloadLabel}</button><a class="btn btn-outline-primary" href="${isDispatchList ? "productos.html?mode=dispatchUnits" : "productos.html"}">Vista resumida</a><a class="btn btn-primary" href="${isDispatchList ? "producto-nuevo-dun14.html" : "producto-nuevo.html"}">${isDispatchList ? "Generar DUN 14" : "Nuevo producto"}</a></div>`,
      onAction(action, record) {
        if (action === "detail") window.location.href = `producto-ficha.html?id=${encodeURIComponent(record.id)}`;
        if (action === "copy") window.location.href = record.mode === "dispatchUnits" ? `producto-alta-dun14.html?mode=copy&id=${encodeURIComponent(record.id)}` : `producto-nuevo.html?mode=copy&id=${encodeURIComponent(record.id)}`;
        if (action === "edit") window.location.href = getEditUrl(record);
        if (action === "logs") window.location.href = `productos.html?mode=${mode}&logs=${encodeURIComponent(record.id)}`;
        if (action === "image") window.location.href = `producto-ficha.html?id=${encodeURIComponent(record.id)}#imagen`;
        if (action === "digital-link") window.location.href = `qr-digital-link.html?id=${encodeURIComponent(record.id)}`;
        if (action === "symbol") window.location.href = `generador-simbologia.html?id=${encodeURIComponent(record.id)}`;
      },
    });
    const downloadButton = document.getElementById("downloadProductsListBtn");
    downloadButton?.addEventListener("click", () => {
      const count = isDispatchList
        ? window.GS1ProductCatalog.getDispatchUnits().length
        : window.GS1ProductCatalog.getCommercialProducts().length;
      const label = isDispatchList ? "unidades de despacho" : "productos";
      window.GS1Utils.showSimulationToast(`Descarga preparada para ${count} ${label}.`, "success");
    });
  });

  function getEditUrl(record) {
    if (record.mode === "dispatchUnits") return `producto-editar-dun14.html?id=${encodeURIComponent(record.id)}`;
    if (record.status === "Activo") return `producto-editar.html?id=${encodeURIComponent(record.id)}`;
    if (record.graceStatus === "exception-open") return `producto-solicitud-modificacion.html?id=${encodeURIComponent(record.id)}&view=open`;
    if (record.graceStatus === "exception-required") return `producto-solicitud-modificacion.html?id=${encodeURIComponent(record.id)}&view=new`;
    return `producto-editar.html?id=${encodeURIComponent(record.id)}`;
  }
})();
