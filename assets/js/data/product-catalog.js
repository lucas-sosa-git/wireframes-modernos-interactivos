(function () {
  const PRODUCT_IMAGES = [
    "../assets/img/producto-1c.jpg",
    "../assets/img/producto-2c.jpg",
    "../assets/img/producto-3c.jpg",
    "../assets/img/producto-4c.jpg",
    "../assets/img/producto-5c.jpg",
    "../assets/img/producto-6.jpg",
    "../assets/img/producto-mermelada.jpg",
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
  const MARKETS = [
    ["Argentina", "Uruguay"],
    ["Argentina"],
    ["Argentina", "Chile", "Paraguay"],
    ["Argentina", "Bolivia"],
  ];
  const LINES_OF_BUSINESS = ["Alimentos", "Bebidas", "Hogar", "Despensa"];
  const PACKAGING = ["Frasco", "Botella", "Caja", "Bolsa", "Lata", "Blister"];

  function computeGs1CheckDigit(body) {
    return window.GS1Utils ? window.GS1Utils.computeCheckDigit(body) : "0";
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
    return `2026-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
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

  function getGraceStatus(index) {
    if (index % 3 === 0) {
      return "active";
    }
    if (index % 3 === 1) {
      return "exception-required";
    }
    return "exception-open";
  }

  function buildExceptionRequest(index) {
    const serial = String(index + 1).padStart(4, "0");
    const createdDay = ((index % 18) + 10);
    return {
      id: `EXC-2026-${serial}`,
      status: "En revision",
      createdAt: toDateString(6, createdDay),
      reason: `Actualizacion de datos comerciales del producto ${index + 1}.`,
      files: [
        { name: `etiqueta_actual_${serial}.pdf`, size: "1.2 MB" },
        { name: `ficha_tecnica_${serial}.pdf`, size: "840 KB" },
      ],
      comments: [
        {
          author: "Socio",
          date: `${toDateString(6, createdDay)} 10:20`,
          message: "Adjuntamos la documentacion para revision.",
        },
        {
          author: "GS1 Argentina",
          date: `${toDateString(6, createdDay + 1)} 09:15`,
          message: "La solicitud se encuentra en analisis.",
        },
      ],
    };
  }

  function buildProductLogs(record, index) {
    return [
      {
        title: "Modificacion de estado",
        detail: `El producto fue marcado como ${index % 2 === 0 ? "Activo" : "Inactivo"}.`,
        date: toDateString(7, (index % 12) + 1),
        time: "11:35",
        actor: "GS1 Argentina",
      },
      {
        title: "Solicitud de modificacion aprobada con exito",
        detail: `Se aprobo una actualizacion para ${record.code}.`,
        date: toDateString(6, (index % 12) + 15),
        time: "15:10",
        actor: "GS1 Argentina",
      },
      {
        title: "Solicitud de modificacion generada con exito",
        detail: `El socio inicio una solicitud de cambios para ${record.name}.`,
        date: toDateString(6, (index % 12) + 12),
        time: "09:42",
        actor: "Socio",
      },
      {
        title: "Alta de producto generada con exito",
        detail: `Se dio de alta el GTIN ${record.code}.`,
        date: record.createdAt,
        time: "08:20",
        actor: "Socio",
      },
    ];
  }

  function buildDispatchLogs(record, index) {
    return [
      {
        title: "Modificacion de estado",
        detail: `La unidad de despacho paso a estado ${record.status}.`,
        date: toDateString(7, (index % 14) + 2),
        time: "14:10",
        actor: "GS1 Argentina",
      },
      {
        title: "Modificacion de datos logisticos",
        detail: `Se actualizaron las unidades contenidas a ${record.unitsContained}.`,
        date: toDateString(6, (index % 14) + 20),
        time: "11:05",
        actor: "Socio",
      },
      {
        title: "Alta de unidad de despacho generada con exito",
        detail: `Se dio de alta el GTIN-14 ${record.code}.`,
        date: record.createdAt,
        time: "08:45",
        actor: "Socio",
      },
    ];
  }

  function createCommercialProducts() {
    return Array.from({ length: 48 }, (_, index) => {
      const type = ["GTIN-13", "UPC-12", "GTIN-8"][index % 3];
      const brand = BRANDS[index % BRANDS.length];
      const variety = VARIETIES[index % VARIETIES.length];
      const createdAt = toDateString((index % 12) + 1, (index % 28) + 1);
      const modifiedAt = toDateString(((index + 2) % 12) + 1, ((index + 8) % 28) + 1);
      const graceStatus = getGraceStatus(index);
      const record = {
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
        graceStatus,
        markets: MARKETS[index % MARKETS.length],
        packaging: PACKAGING[index % PACKAGING.length],
        subBrand: `${brand} ${["Seleccion", "Origen", "Vital", "Max"][index % 4]}`,
        lineOfBusiness: LINES_OF_BUSINESS[index % LINES_OF_BUSINESS.length],
        extraFields: {
          atributoA: `Segmento ${String.fromCharCode(65 + (index % 4))}`,
          atributoB: `Familia ${index % 5 + 1}`,
          atributoC: `Canal ${["Retail", "Mayorista", "E-commerce"][index % 3]}`,
          atributoD: `Sello ${index % 2 === 0 ? "Controlado" : "General"}`,
        },
      };
      if (graceStatus === "exception-open") {
        record.exceptionRequest = buildExceptionRequest(index);
      }
      record.logs = buildProductLogs(record, index);
      return record;
    });
  }

  function createDispatchUnits(commercialProducts) {
    return Array.from({ length: 24 }, (_, index) => {
      const createdAt = toDateString((index % 12) + 1, (index % 28) + 1);
      const modifiedAt = toDateString(((index + 3) % 12) + 1, ((index + 5) % 28) + 1);
      const typeSeed = ["GTIN-14", "GTIN 14", "ITF-14", "DUN 14"][index % 4];
      const brand = BRANDS[index % BRANDS.length];
      const unitsContained = (index + 2) * 6;
      const containedProduct = commercialProducts[index % commercialProducts.length];
      const record = {
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
        content: `${unitsContained} unidades base`,
        distributionType: DESTINATIONS[index % DESTINATIONS.length],
        packagingLevel: PACKAGING_LEVELS[index % PACKAGING_LEVELS.length],
        destination: DESTINATIONS[index % DESTINATIONS.length],
        baseQuantity: `${unitsContained} unidades base`,
        shortDescription: `Unidad logistica preparada para ${DESTINATIONS[index % DESTINATIONS.length].toLowerCase()}.`,
        containedGtin: containedProduct.code,
        containedDescription: containedProduct.name,
        unitsContained: String(unitsContained),
        packaging: PACKAGING_LEVELS[index % PACKAGING_LEVELS.length],
      };
      record.logs = buildDispatchLogs(record, index);
      return record;
    });
  }

  const commercialProducts = createCommercialProducts();
  const dispatchUnits = createDispatchUnits(commercialProducts);
  const allRecords = [...commercialProducts, ...dispatchUnits];

  function cloneRecord(record) {
    return JSON.parse(JSON.stringify(record));
  }

  function getCommercialProducts() {
    return commercialProducts.map(cloneRecord);
  }

  function getDispatchUnits() {
    return dispatchUnits.map((record) => {
      const copy = cloneRecord(record);
      copy.type = normalizeDispatchType(copy.type);
      return copy;
    });
  }

  function getById(id) {
    const record = allRecords.find((item) => item.id === id);
    if (!record) {
      return null;
    }
    const copy = cloneRecord(record);
    if (copy.mode === "dispatchUnits") {
      copy.type = normalizeDispatchType(copy.type);
    }
    return copy;
  }

  function updateById(id, patch) {
    const record = allRecords.find((item) => item.id === id);
    if (!record || !patch || typeof patch !== "object") {
      return null;
    }

    Object.keys(patch).forEach((key) => {
      record[key] = patch[key];
    });

    return cloneRecord(record);
  }

  window.GS1ProductCatalog = {
    getCommercialProducts,
    getDispatchUnits,
    getById,
    updateById,
  };
})();
