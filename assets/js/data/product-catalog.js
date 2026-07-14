(function () {
  const PRODUCT_IMAGES = [
    "../assets/img/producto-1c.jpg",
    "../assets/img/producto-2c.jpg",
    "../assets/img/producto-3c.jpg",
    "../assets/img/producto-4c.jpg",
    "../assets/img/producto-5c.jpg",
    "../assets/img/producto-6.jpg",
    null,
  ];

  const DISPATCH_IMAGES = [
    "../assets/img/caja-1.jpg",
    "../assets/img/caja-2.jpg",
    "../assets/img/gtin-masivo.jpg",
    null,
  ];

  const BRANDS = ["La Huella", "Verde Norte", "Campo Vivo", "Origen Uno", "Gran Molino", "Del Valle"];
  const VARIETIES = ["Clasico", "Integral", "Light", "Premium", "Organico", "Sin TACC"];
  const ORIGINS = ["Argentina", "Uruguay", "Chile", "Paraguay", "Bolivia", "Peru"];
  const STATUSES = ["Activo", "Pendiente", "Borrador"];
  const CLASSIFICATIONS = [
    "Alimentos / Desayuno / Cereales",
    "Alimentos / Conservas / Dulces",
    "Bebidas / Jugos / Frutales",
    "Limpieza / Hogar / Multiuso",
    "Alimentos / Galletitas / Dulces",
    "Alimentos / Pastas / Secas",
  ];
  const CONTENTS = ["150 g", "250 g", "500 g", "750 ml", "1 kg", "2 l"];
  const DISTRIBUTIONS = ["Nacional", "Regional", "Exportacion"];
  const PACKAGING_LEVELS = ["Caja", "Pack", "Pallet", "Bandeja"];
  const DESTINATIONS = ["Centro de distribucion", "Retail", "Mayorista", "Exportacion"];

  function computeGs1CheckDigit(body) {
    const digits = String(body).split("").map(Number);
    const total = digits.reduce((sum, digit, index) => {
      const weight = (digits.length - index) % 2 === 0 ? 3 : 1;
      return sum + digit * weight;
    }, 0);
    return String((10 - (total % 10)) % 10);
  }

  function buildCode(prefix, totalLength) {
    const bodyLength = totalLength - 1;
    const body = String(prefix).replace(/\D/g, "").slice(0, bodyLength).padStart(bodyLength, "0");
    return `${body}${computeGs1CheckDigit(body)}`;
  }

  function buildCommercialCode(type, index) {
    if (type === "UPC-12") {
      return buildCode(`049${String(10000000 + index).slice(-8)}`, 12);
    }
    if (type === "GTIN-8") {
      return buildCode(String(2345000 + index).slice(-7), 8);
    }
    return buildCode(`779${String(123400000 + index).slice(-9)}`, 13);
  }

  function buildDispatchCode(index) {
    return buildCode(`1${String(779123400000 + index).slice(-12)}`, 14);
  }

  function toDateString(month, day) {
    const normalizedMonth = String(month).padStart(2, "0");
    const normalizedDay = String(day).padStart(2, "0");
    return `2026-${normalizedMonth}-${normalizedDay}`;
  }

  function normalizeDispatchType(type) {
    const normalized = String(type || "")
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace("ITF14", "GTIN-14")
      .replace("ITF-14", "GTIN-14")
      .replace("DUN14", "GTIN-14")
      .replace("DUN-14", "GTIN-14")
      .replace("GTIN14", "GTIN-14");
    return normalized === "GTIN-14" ? "GTIN-14" : "GTIN-14";
  }

  function createCommercialProducts() {
    return Array.from({ length: 48 }, (_, index) => {
      const type = ["UPC-12", "GTIN-8", "GTIN-13"][index % 3];
      const brand = BRANDS[index % BRANDS.length];
      const variety = VARIETIES[index % VARIETIES.length];
      const createdAt = toDateString((index % 12) + 1, (index % 28) + 1);
      const modifiedAt = toDateString(((index + 2) % 12) + 1, ((index + 8) % 28) + 1);
      return {
        id: `product-${String(index + 1).padStart(3, "0")}`,
        mode: "products",
        type,
        code: buildCommercialCode(type, index + 1),
        name: `${brand} ${variety} ${index + 1}`,
        status: STATUSES[index % STATUSES.length],
        brand,
        variety,
        origin: ORIGINS[index % ORIGINS.length],
        modifiedAt,
        createdAt,
        image: PRODUCT_IMAGES[index % PRODUCT_IMAGES.length],
        classification: CLASSIFICATIONS[index % CLASSIFICATIONS.length],
        content: CONTENTS[index % CONTENTS.length],
        distributionType: DISTRIBUTIONS[index % DISTRIBUTIONS.length],
        shortDescription: `${brand} ${variety} con registro comercial activo en GS1.`,
      };
    });
  }

  function createDispatchUnits() {
    return Array.from({ length: 24 }, (_, index) => {
      const createdAt = toDateString((index % 12) + 1, (index % 28) + 1);
      const modifiedAt = toDateString(((index + 3) % 12) + 1, ((index + 5) % 28) + 1);
      const typeSeed = ["GTIN-14", "GTIN 14", "ITF-14", "DUN 14"][index % 4];
      const brand = BRANDS[index % BRANDS.length];
      const unitsPerCase = (index + 2) * 6;
      return {
        id: `dispatch-${String(index + 1).padStart(3, "0")}`,
        mode: "dispatchUnits",
        type: normalizeDispatchType(typeSeed),
        code: buildDispatchCode(index + 1),
        name: `Unidad de despacho ${brand} ${index + 1}`,
        status: STATUSES[index % STATUSES.length],
        brand,
        variety: PACKAGING_LEVELS[index % PACKAGING_LEVELS.length],
        origin: ORIGINS[index % ORIGINS.length],
        modifiedAt,
        createdAt,
        image: DISPATCH_IMAGES[index % DISPATCH_IMAGES.length],
        classification: "Logistica / Distribucion / Unidad de despacho",
        content: `${unitsPerCase} unidades base`,
        distributionType: DESTINATIONS[index % DESTINATIONS.length],
        packagingLevel: PACKAGING_LEVELS[index % PACKAGING_LEVELS.length],
        destination: DESTINATIONS[index % DESTINATIONS.length],
        baseQuantity: `${unitsPerCase} unidades base`,
        shortDescription: `Unidad logistica preparada para ${DESTINATIONS[index % DESTINATIONS.length].toLowerCase()}.`,
      };
    });
  }

  const commercialProducts = createCommercialProducts();
  const dispatchUnits = createDispatchUnits();
  const allRecords = [...commercialProducts, ...dispatchUnits];

  function getCommercialProducts() {
    return commercialProducts.map((record) => ({ ...record }));
  }

  function getDispatchUnits() {
    return dispatchUnits.map((record) => ({ ...record, type: normalizeDispatchType(record.type) }));
  }

  function getById(id) {
    const record = allRecords.find((item) => item.id === id);
    if (!record) {
      return null;
    }
    return {
      ...record,
      type: record.mode === "dispatchUnits" ? normalizeDispatchType(record.type) : record.type,
    };
  }

  window.GS1ProductCatalog = {
    getCommercialProducts,
    getDispatchUnits,
    getById,
  };
})();
