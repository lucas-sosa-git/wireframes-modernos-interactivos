# AGENTS.md — Wireframes interactivos GS1

## Objetivo

Trabajar sobre este repositorio con cambios pequeños, verificables y limitados al alcance solicitado.
La prioridad es evitar exploraciones completas del proyecto, no editar versiones históricas por error y conservar el comportamiento compartido entre vistas.

Este archivo es la guía operativa del repositorio. No es una especificación funcional eterna: la solicitud actual del usuario y el código vigente tienen prioridad sobre documentación histórica.

## Fuente de verdad y alcance

- La versión activa del módulo es `b05/`.
- `b03/` y `b04/` son versiones históricas o referencias. No modificarlas ni copiarlas como implementación salvo pedido explícito.
- Los assets funcionales vigentes están principalmente en:
  - `assets/styles.css`
  - `assets/js/`
  - `assets/js/components/`
  - `assets/js/data/`
  - `assets/js/services/`
  - `assets/b05/css/`
- `memory.md` contiene contexto histórico de una etapa anterior y puede estar desactualizado. No cargarlo por defecto ni tratarlo como aceptación vigente.
- Los archivos Repomix son snapshots de lectura. Nunca editarlos ni usarlos como sustituto de los archivos reales del repositorio.
- `manifests/agent-view-context.json` es un índice de descubrimiento, no la fuente de verdad. Si difiere del HTML real, prevalece el HTML y se debe actualizar el índice.
- No modificar archivos vendor o minificados: `bootstrap*.js`, `bootstrap*.css`, `jquery*.js`, `chart.js`, `dragula.js`, `feather.min.js`, `example.min.js`.

## Política obligatoria de contexto mínimo

Cuando el usuario solicite un cambio sobre una vista concreta, no escanear el repositorio completo.

### Secuencia de inspección

1. Identificar la vista exacta dentro de `b05/`.
2. Consultar `manifests/agent-view-context.json` para conocer sus dependencias directas.
3. Abrir únicamente:
   - la vista solicitada;
   - su controlador JS específico;
   - los componentes compartidos directamente importados por esa vista;
   - fragmentos puntuales de `assets/styles.css` encontrados por selector.
4. Buscar por nombres exactos de `id`, `class`, atributos `data-*`, funciones o variables antes de abrir archivos adicionales.
5. Ampliar el alcance solo cuando exista una dependencia demostrable. Registrar brevemente por qué fue necesario.

### Límites de exploración

- No listar ni leer todos los archivos para una modificación localizada.
- No abrir completos archivos grandes cuando alcanza con una búsqueda y un rango de líneas.
- Antes de leer más de 8 archivos de código no vendor, revisar si el cambio se está convirtiendo en un refactor global no solicitado.
- No abrir `manifests/mapa-navegacion.json` completo. Tiene miles de líneas; consultarlo con filtros.
- No abrir `assets/styles.css` completo. Buscar primero los selectores afectados.
- No abrir `producto-nuevo.html`, `producto-editar.html` o `producto-copiar.html` completos salvo que sean la vista objetivo. Son vistas legacy extensas.

### Comandos de búsqueda recomendados

```bash
# Encontrar un selector o comportamiento concreto
rg -n "selector|data-atributo|nombreFuncion" b05 assets/js assets/styles.css

# Ver consumidores de un componente compartido
rg -l "components/nombre-componente.js|nombreGlobal" b05 assets/js

# Consultar navegación solo para una vista
jq --arg view "b05/productos.html" \
  '.included[] | select(.from == $view or .to == $view)' \
  manifests/mapa-navegacion.json

# Consultar la URL canónica de una vista b05
jq --arg file "b05/productos.html" \
  '.b05[] | select(.file == $file)' \
  manifests/urls-canonicas.json
```

## Arquitectura vigente

El proyecto es un conjunto de wireframes HTML con Bootstrap y JavaScript nativo. No hay backend real; los datos y procesos pueden estar simulados, pero las interacciones visibles deben funcionar.

### Capas principales

- `b05/*.html`: estructura de la vista y puntos de montaje.
- `assets/js/<vista>.js`: controlador específico de una vista.
- `assets/js/components/*.js`: UI y comportamiento reutilizable.
- `assets/js/data/product-catalog.js`: catálogo y datos mock compartidos.
- `assets/js/services/*.js`: adaptadores o simulaciones de servicios.
- `assets/styles.css`: estilos propios compartidos del módulo b05.
- `assets/b05/css/bootstrap.min.css`: Bootstrap personalizado del módulo; tratar como vendor.

### Componentes compartidos importantes

- `portal-chrome.js`: sidebar, header, paneles compartidos y transformación de layouts legacy.
- `account-summary.js`: tarjeta de CUIT, licencia y membresía.
- `shortcuts-manager.js`: atajos configurables y persistencia.
- `help-widget.js`: botón y panel flotante de ayuda.
- `product-table.js`: render y comportamiento reusable de tablas/listados.
- `product-catalog.js`: datos compartidos de productos y unidades de despacho.

Si el pedido afecta navbar, sidebar, encabezado, cuenta, atajos, ayuda o tablas reutilizadas, inspeccionar primero el componente propietario. No duplicar su HTML o lógica dentro de una vista.

## Enrutamiento rápido por familia de vistas

Usar `manifests/agent-view-context.json` como detalle exacto. Esta tabla indica el punto de partida.

| Vista o familia | Archivos principales a inspeccionar |
|---|---|
| `b05/productos.html` | `assets/js/productos.js`, `product-table.js`, `product-catalog.js`; componentes de cuenta/atajos solo si el pedido los afecta |
| `productos-listado*.html` | `assets/js/productos-listado.js`, `product-table.js`, `product-catalog.js`, `portal-chrome.js` solo para chrome compartido |
| `producto-nuevo-dun14.html` | `assets/js/producto-nuevo-dun14.js`, `product-table.js`, `product-catalog.js` |
| `producto-alta-dun14.html` | `assets/js/producto-alta-dun14.js`, `product-catalog.js` |
| `producto-editar-dun14.html` | `assets/js/producto-dun14-form.js`, `product-catalog.js` |
| `producto-ficha.html` | `assets/js/producto-ficha.js`, `product-catalog.js` |
| `producto-solicitud-modificacion.html` | `assets/js/producto-solicitud-modificacion.js`, `product-catalog.js` |
| `generador-simbologia.html` | `assets/js/generador-simbologia.js`, `gs1-utils.js`, `product-catalog.js` |
| `qr-digital-link.html` | `assets/js/qr-digital-link.js`, `gs1-utils.js`, `product-catalog.js` |
| `verificacion-simbologia.html` | `assets/js/verificacion-simbologia.js`, `gs1-utils.js` |
| `calculo-digito-verificador.html` | `assets/js/calculo-digito-verificador.js`, `gs1-utils.js` |
| `productos-carga-masiva.html` | `assets/js/productos-carga-masiva.js` |
| `producto-nuevo.html` | HTML objetivo, `producto-form.js`, `producto-wizard.js`, adaptador de análisis de imagen y componentes compartidos usados por la vista |
| `producto-editar.html` | HTML objetivo, `producto-form.js` y componentes compartidos usados por la vista |
| `producto-copiar.html` | HTML objetivo, `producto-copiar-legacy.js` y dependencias directas |
| `micuenta.html` | HTML objetivo, `shortcuts-manager.js`, `help-widget.js`; no asumir que comparte toda la arquitectura de las vistas shell |

## Reglas de implementación

- Hacer el cambio mínimo que resuelva el pedido.
- No realizar refactors generales, limpiezas masivas o cambios de arquitectura no solicitados.
- No tocar navbar o sidebar salvo pedido explícito. En vistas shell, su propietario es `portal-chrome.js`.
- Mantener el look and feel GS1 existente y la interfaz clara/blanca. No introducir tema oscuro ni rediseñar componentes globales.
- Mantener textos, labels y mensajes visibles en español.
- No agregar frameworks ni dependencias nuevas si Bootstrap y JavaScript nativo alcanzan.
- No duplicar lógica que ya vive en un componente compartido.
- Si se modifica un componente compartido, localizar todos sus consumidores y hacer smoke test de las vistas afectadas.
- Mantener el orden de carga de scripts. Bootstrap y utilidades compartidas deben estar disponibles antes del controlador que las usa.
- En `b05/productos.html`, no agregar bloques `<style>` ni atributos `style=""`; usar `assets/styles.css`.
- Para otros HTML, también preferir clases y CSS compartido sobre estilos inline.
- En `assets/styles.css`, modificar la sección existente del componente. No agregar reglas duplicadas al final sin buscar antes.
- Mantener códigos GTIN, UPC, DUN y otros identificadores como texto; no convertirlos a número ni perder ceros a la izquierda.
- No inventar rutas. Confirmar que el destino existe o consultar los manifests de navegación.
- No dejar `href="#"` cuando existe una vista real. Los anchors de Bootstrap internos sí pueden usar hashes cuando corresponda.
- Guardar archivos como UTF-8. No hacer conversiones globales de encoding ni reemplazos masivos de caracteres.
- No reescribir una vista completa para cambiar un botón, texto, modal o comportamiento localizado.
- Si se agregan, eliminan o cambian `<script src>`, `<link href>` o rutas locales en una vista `b05`, actualizar `manifests/agent-view-context.json` en el mismo cambio.

## Reglas de comportamiento por tipo de cambio

### Cambio visual localizado

1. Buscar el selector existente en HTML y `assets/styles.css`.
2. Inspeccionar solo el bloque CSS relacionado.
3. Reutilizar variables, clases y espaciado existentes.
4. Verificar desktop y un ancho móvil razonable.

### Cambio de interacción

1. Identificar el atributo `data-*`, `id` o evento que inicia la acción.
2. Buscar su listener exacto en el controlador y componentes directos.
3. Evitar listeners duplicados y funciones globales nuevas si existe un patrón reutilizable.
4. Verificar clic, teclado básico, cierre y estado posterior.

### Cambio de navegación

1. Confirmar el destino en `b05/`.
2. Consultar de forma filtrada `urls-canonicas.json` o `mapa-navegacion.json`.
3. No usar `b03/` o `b04/` como destino salvo que no exista equivalente vigente y el pedido lo exija.

### Cambio en un componente compartido

1. Buscar todos los HTML que cargan el componente.
2. Mantener compatibilidad con sus puntos de montaje actuales.
3. No insertar copias del componente en las páginas.
4. Probar al menos una vista representativa por cada modo de uso afectado.

## Validación mínima obligatoria

No existe una suite automatizada completa en el repositorio. La validación debe ser proporcional al cambio, pero nunca omitirse silenciosamente.

### Comprobaciones estáticas

```bash
git diff --check

# Ejecutar para cada JS propio modificado, si Node está disponible
node --check assets/js/archivo-modificado.js

# Solo si se modifican scripts Python
python -m compileall scripts
```

### Smoke test en navegador

Servir la raíz del repositorio, por ejemplo:

```bash
python -m http.server 8000
```

Abrir la vista modificada bajo `/b05/` y comprobar:

- que carga sin errores nuevos en consola;
- que no faltan CSS, JS o imágenes;
- que la interacción solicitada funciona;
- que navbar, sidebar y componentes compartidos no se rompieron;
- que las rutas modificadas navegan al destino correcto;
- que el layout sigue siendo usable en desktop y móvil si el cambio es visual.

No afirmar que una validación fue realizada si no se ejecutó realmente.

## Git y alcance de entrega

- Trabajar sobre la rama actual; no crear ni cambiar de rama por iniciativa propia.
- El flujo preferido del proyecto es mantener los cambios en `main` cuando el usuario así lo indique.
- No hacer commit ni push salvo pedido explícito.
- Cuando se pidan commits, agruparlos por funcionalidad y usar mensajes descriptivos.
- Para cada commit y push solicitado, redactar los mensajes y la comunicación en español argentino, con un tono claro, profesional y cordial; explicar bien qué incluye cada commit y mantenerlos agrupados por funcionalidad.
- No mezclar correcciones ajenas al pedido en el mismo cambio.
- Antes de terminar, revisar `git diff` y confirmar que solo aparecen archivos justificados por la tarea.

## Formato del informe final

Informar de forma breve:

1. Qué se cambió.
2. Qué archivos se modificaron.
3. Qué dependencias adicionales se inspeccionaron y por qué.
4. Qué validaciones se ejecutaron y su resultado.
5. Qué no pudo verificarse, si corresponde.

No entregar una descripción genérica: relacionar cada archivo modificado con el comportamiento solicitado.
