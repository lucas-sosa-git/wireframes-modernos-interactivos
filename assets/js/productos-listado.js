(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const mount = document.getElementById("catalogListMount");
    if (!mount || !window.GS1ProductTable) return;
    const mode = mount.dataset.listMode === "dispatchUnits" ? "dispatchUnits" : "products";
    window.GS1ProductTable.mount({
      mount,
      mode,
      persistenceKey: `gs1.products.columnVisibility.list.${mode}.v2`,
      eyebrow: "Catálogo GS1",
      heading: mode === "products" ? "Productos comerciales" : "Unidades de despacho GTIN-14",
      description: "Consultá y administrá los registros desde un listado responsive.",
      headerActions: `<div class="d-flex flex-wrap gap-2"><a class="btn btn-outline-primary" href="productos.html">Vista resumida</a><a class="btn btn-primary" href="${mode === "products" ? "producto-nuevo.html" : "producto-nuevo-dun14.html"}">${mode === "products" ? "Nuevo producto" : "Generar DUN-14"}</a></div>`,
      onAction(action, record) {
        if (action === "detail") window.location.href = `producto-ficha.html?id=${encodeURIComponent(record.id)}`;
        if (action === "copy") window.location.href = record.mode === "dispatchUnits" ? `producto-nuevo-dun14.html?mode=copy&id=${encodeURIComponent(record.id)}` : `producto-nuevo.html?mode=copy&id=${encodeURIComponent(record.id)}`;
        if (action === "edit") window.location.href = record.mode === "dispatchUnits" ? `producto-editar-dun14.html?id=${encodeURIComponent(record.id)}` : `producto-editar.html?id=${encodeURIComponent(record.id)}`;
        if (action === "logs") window.location.href = `productos.html?mode=${mode}&logs=${encodeURIComponent(record.id)}`;
        if (action === "image") window.location.href = `producto-ficha.html?id=${encodeURIComponent(record.id)}#imagen`;
        if (action === "digital-link") window.location.href = `qr-digital-link.html?id=${encodeURIComponent(record.id)}`;
        if (action === "symbol") window.location.href = `generador-simbologia.html?id=${encodeURIComponent(record.id)}`;
      },
    });
  });
})();
