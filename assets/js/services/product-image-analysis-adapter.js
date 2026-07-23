(function () {
  "use strict";

  /**
   * Contrato de integración para el análisis asistido de imágenes.
   *
   * No existe un endpoint real en este proyecto. En producción el adapter
   * informa esa limitación y el wizard conserva el flujo manual. El fixture
   * solo se habilita de forma explícita con ?wizardDemo=suggestions.
   */
  window.GS1ProductImageAnalysisAdapter = {
    async analyze(images) {
      const demoMode = new URLSearchParams(window.location.search).get("wizardDemo");
      if (demoMode !== "suggestions") {
        throw new Error("El servicio de análisis todavía no está integrado.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, 650));
      const sourceImageId = images[0]?.id || "";
      return {
        suggestions: [
          suggestion("product-name", 4, "Producto", "Yogur bebible descremado", "high", sourceImageId),
          suggestion("brand", 4, "marca", "Marca 1", "medium", sourceImageId),
          suggestion("net-content", 4, "contenidoneto", "190", "high", sourceImageId),
          suggestion("category", 6, "buscarconf", "Yogures y leches fermentadas", "medium", sourceImageId),
        ],
        warnings: ["Fixture de demostración activo: estas sugerencias no provienen de un servicio real."],
      };
    },
  };

  function suggestion(id, targetStepId, targetFieldId, proposedValue, confidence, sourceImageId) {
    return {
      id,
      targetStepId,
      targetFieldId,
      proposedValue,
      confidence,
      sourceImageId,
      decision: "pending",
    };
  }
})();
