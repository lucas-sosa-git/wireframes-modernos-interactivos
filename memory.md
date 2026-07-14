# Memory del proyecto

## Propósito

Este repositorio contiene wireframes HTML interactivos para modernizar el portal sin convertirlo todavía en una aplicación con backend real. Las vistas deben sentirse funcionales: navegación, modales, filtros, paginación, selectores y estados visuales deben responder en el navegador, aunque ciertos procesos queden simulados con datos hardcodeados.

La prioridad es conservar la identidad y la estructura general del portal, mejorar la usabilidad y facilitar futuras integraciones.

## Estado conocido del repositorio

- La vista principal de este alcance es `b05/productos.html`.
- Bootstrap continúa como dependencia vendor en `../assets/b05/css/bootstrap.min.css`.
- Los estilos propios de la vista se concentran en `assets/styles.css`.
- `b05/productos.html` no debe volver a incorporar bloques `<style>` ni atributos `style=""`.
- La vista ya tiene comentarios delimitadores para ubicar sidebar, header, notificaciones, acciones rápidas, tabla, modales, barra fija inferior y ayuda flotante.
- Clases semánticas existentes a preservar o reutilizar cuando corresponda: `layout-shell`, `sidebar-fixed`, `content-shell`, `notification-badge`, `product-table-actions`, `floating-action-bar` y `help-widget`.
- Antes de modificar rutas o dependencias, se debe inspeccionar el árbol real del repositorio. El Repomix entregado para esta tarea solo expone `memory.md` y `README.md`, por lo que no alcanza para confirmar todos los destinos HTML.

## Reglas generales de implementación

1. No rediseñar ni reemplazar el navbar ni el sidebar.
2. Se permiten cambios mínimos dentro del área de cuenta existente para distinguir Usuario de Empresa/Licencia, sin alterar la estructura global de navegación.
3. No hacer refactors generales fuera del alcance de `productos.html`.
4. No agregar frameworks nuevos si Bootstrap y JavaScript nativo alcanzan.
5. No romper jQuery, Bootstrap, `sidebars.js`, `dragula.js`, `example.min.js`, Chart.js ni otros scripts que ya use la vista.
6. Los estilos nuevos deben ir en `assets/styles.css` o en el archivo CSS propio ya definido por el proyecto.
7. La lógica nueva debe ir preferentemente en un archivo JS dedicado, por ejemplo `assets/js/productos.js`, si la estructura real del repositorio lo permite.
8. No dejar enlaces muertos. Cada anchor debe apuntar a una vista existente y coherente. Si no existe un destino, no inventar una ruta silenciosamente: dejarlo documentado en el informe final.
9. Las capturas adjuntas sirven como referencia funcional, no como diseño visual para copiar literalmente.
10. Mantener textos, labels y mensajes en español.

## Criterio de experiencia de usuario

La vista de productos debe estar pensada para usuarios acostumbrados a trabajar con Excel. La interacción principal es una tabla densa, clara y operable, con filtros por columna, ordenamiento, paginación y acciones por registro.

La tabla de productos debe ser el primer bloque funcional visible dentro del contenido principal. Los KPI existentes deben moverse debajo de la tabla.

## Tabla de productos

### Columnas base

Usar como referencia las columnas visibles en la captura:

- Tipo
- Código
- Producto
- Estado
- Marca
- Variedad
- Origen
- Fecha de modificación
- Fecha de alta
- Acciones

No incorporar columnas adicionales sin que ya existan en la vista o sean necesarias para mantener una funcionalidad actual.

### Datos

- Hardcodear al menos 45 registros para poder validar tres páginas.
- Incluir valores variados en tipo, estado, marca, variedad, origen y fechas.
- Usar códigos como texto para evitar pérdida de ceros a la izquierda o conversiones numéricas indeseadas.

### Filtros tipo Excel

Cada columna filtrable debe tener un control desplegable en el encabezado con:

- Orden ascendente.
- Orden descendente.
- Campo de búsqueda dentro de los valores de la columna.
- Selección múltiple de valores únicos mediante checkboxes.
- Opción Seleccionar todo.
- Opción Limpiar filtro.
- Acción Aplicar.

Los filtros deben combinarse entre columnas. Al cambiar cualquier filtro u ordenamiento, volver a la página 1. La columna Acciones no necesita filtro.

### Paginación

- Mostrar 20 registros por página.
- Incluir Anterior, Siguiente y números de página.
- Mostrar un texto de estado, por ejemplo: `Mostrando 1-20 de 45 productos`.
- La paginación debe operar sobre el resultado ya filtrado.
- Deshabilitar correctamente los controles cuando no exista página anterior o siguiente.

### Acciones por registro

Reemplazar la lista horizontal de enlaces por un único dropdown de acciones por fila. Las opciones funcionales de referencia son:

- Copiar
- Modificar
- Detalle
- Logs
- Imagen

Cada opción debe conservar o mapear el destino real correspondiente del repositorio. No usar `href="#"` como solución final cuando exista una vista de destino.

## Acciones generales de productos

### Descarga a Excel

Agregar un botón visible `Descargar productos a Excel` cerca de las herramientas de la tabla. En esta etapa puede funcionar como placeholder, pero debe responder al clic con un mensaje claro como `Funcionalidad preparada para integración` en lugar de no hacer nada.

### Carga masiva

La carga masiva no debe redirigir a otra página.

Flujo esperado:

1. El usuario pulsa `Carga masiva`.
2. Se abre un modal Bootstrap en la misma vista.
3. El modal permite seleccionar archivos `.xlsx` o `.xls`.
4. Se muestra el nombre del archivo seleccionado.
5. Si se confirma sin archivo, se muestra una validación.
6. Si se confirma con archivo, se simula la carga y aparece un mensaje de éxito dentro del modal.
7. No se recarga la página ni se navega a otra pestaña.

No hace falta procesar realmente el Excel en esta etapa.

## Menús superiores del módulo

Las categorías visibles en la referencia son:

- Productos
- Unidades de Despacho
- Herramientas
- Instructivos

Cada categoría debe ser un dropdown. Los elementos internos deben corresponder a vistas reales del repositorio. Antes de editar, Codex debe inventariar los HTML disponibles y reconstruir los `href` correctos. No mantener opciones antiguas que contradigan la referencia funcional.

## Usuario, Empresa y Licencia

La interfaz debe distinguir claramente:

- Usuario: la persona autenticada.
- Empresa/Licencia: el contexto comercial con el que está operando.

Reglas:

- Cambiar labels actuales de `Razón social` a `Licencia` donde corresponda en esta vista.
- Incorporar una acción `Cambiar usuario` en el área de cuenta existente.
- Incorporar una acción `Cambiar empresa` o `Cambiar licencia`, según la terminología ya usada por el proyecto.
- No confundir el cambio de persona con el cambio de contexto empresarial.
- Para el wireframe, estos cambios pueden simularse en el frontend actualizando el texto visible.

### Selector de licencias

Crear un modal o panel moderno, sin copiar el estilo visual de la captura, que muestre por cada opción:

- Nombre de la licencia o empresa.
- CUIT.
- Estado activo cuando corresponda.
- Botón Cambiar.
- Acción Cancelar o Cerrar.

Al cambiar, actualizar la licencia visible en la cabecera de contenido y cerrar el modal.

## Notificaciones

Agregar una funcionalidad de notificaciones moderna, usando la captura solo como referencia de contenido. Incluir datos hardcodeados de ejemplo:

- Notificaciones pendientes de revisión en Productos.
- Factura disponible.
- Próxima capacitación.

La UI puede ser un dropdown, panel lateral o modal coherente con el diseño actual. Debe mostrar título, descripción breve y fecha/hora. No copiar bordes, tipografías ni distribución de la captura de Excel.

## Atajos personalizables

Agregar una acción `Editar atajos` que permita al usuario:

- Ver los atajos disponibles.
- Activar o desactivar cada atajo.
- Guardar los cambios.
- Reflejar inmediatamente los atajos elegidos en el bloque de acciones rápidas.

Para el wireframe, persistir la selección con `localStorage` si no existe backend. Debe existir una opción para restaurar los atajos predeterminados.

## Chatbot flotante

Reemplazar el bloque cuadrado grande por un botón flotante redondo y discreto.

Comportamiento esperado:

- Ícono circular en una esquina del viewport.
- Tooltip al pasar el mouse: `¿En qué podemos ayudarte?`.
- Al hacer clic, abrir un panel de conversación.
- Permitir minimizar o cerrar el panel.
- El botón debe poder arrastrarse dentro del viewport.
- Un arrastre no debe disparar accidentalmente la apertura del chat.
- Evitar que quede fuera de pantalla.
- Puede persistir su posición con `localStorage`.

## Orden visual de `productos.html`

Dentro del contenido principal:

1. Título y contexto mínimo de la vista, si ya existen.
2. Herramientas de productos y tabla.
3. Paginación.
4. KPI existentes, reubicados debajo de la tabla.
5. Bloques secundarios que ya existan y deban conservarse.

La tabla debe dominar la primera pantalla útil.

## Pendientes técnicos a revisar

- Confirmar el uso del `canvas` `chDonut3` y su dependencia con Chart.js antes de mover los KPI.
- Evaluar si el script inline del gráfico debe pasar a un archivo JS externo sin romper su inicialización.
- Revisar la ubicación actual de scripts y cargar la lógica nueva al final del `body` o con `defer`, respetando el orden de dependencias.
- Confirmar los archivos HTML reales para cada dropdown y cada acción por producto.
- Verificar si ya existe un modal, toast o sistema de mensajes reutilizable.

## Definición de terminado para este alcance

El refactor se considera completo cuando:

- Navbar y sidebar mantienen su estructura y comportamiento.
- La tabla es el primer bloque funcional visible.
- Hay al menos 45 productos hardcodeados.
- Se muestran 20 registros por página y se puede cambiar de página.
- Los filtros tipo Excel y el ordenamiento funcionan y se combinan.
- Cada fila tiene un dropdown de acciones.
- Los anchors existentes redirigen correctamente.
- Carga masiva abre un modal y muestra éxito sin redirección.
- Existe el botón de descarga a Excel con respuesta visual.
- Los KPI están debajo de la tabla.
- Usuario y Empresa/Licencia se presentan como conceptos distintos.
- Se puede abrir el selector de licencia y cambiar el contexto visible.
- Hay notificaciones de ejemplo.
- Se pueden editar atajos y conservar la selección.
- El chatbot es circular, desplegable y arrastrable.
- No hay errores nuevos en consola.
- No se agregaron estilos inline ni dependencias innecesarias.
