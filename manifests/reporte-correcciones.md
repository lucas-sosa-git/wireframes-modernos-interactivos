# Reporte de correcciones wireframes-local

Fecha de ejecucion: 2026-05-21

## Resumen
- HTML revisados: 146
- HTML con encoding corregido: 146
- Referencias rotas corregidas: 13 (8 HTML inline `url(img/...)` + 5 CSS `url(../img/...)`)
- Referencias CSS por bloque corregidas en HTML b04/b05: 80
- CSS originales descargados/actualizados desde b03/b04/b05: 35
- Assets externos descargados: 6
- Referencias externas localizadas en HTML: 4 archivos
- Referencias locales faltantes tras validacion: 0
- Patrones mojibake restantes: 0
- Rutas hardcodeadas/remotas internas GS1: 0

## Correcciones principales
- Se aplico reparacion sistematica de mojibake UTF-8 leido como Windows-1252/Latin-1, iterando hasta eliminar los patrones solicitados sin introducir caracteres de reemplazo.
- `assets/css/bootstrap.min.css` fue restaurado desde el remoto b03, corrigiendo el caso donde `pagina-web.html` se veia con estilo oscuro del bloque equivocado.
- Las vistas de `b04/` usan `../assets/b04/css/*.css` cuando el remoto b04 referenciaba `css/*.css` y el asset existe localmente.
- Las vistas de `b05/` usan `../assets/b05/css/*.css` cuando el remoto b05 referenciaba `css/*.css` y el asset existe localmente.
- Se corrigieron los `background-image: url(img/...)` detectados para `caja-2.jpg`, `icono-borrar.svg` y `producto-mermelada.jpg` hacia `../assets/img/...`.
- Los CSS especificos de b04/b05 que apuntaban a `../img/...` fueron ajustados a `../../img/...` para usar los assets compartidos existentes.

## Assets externos descargados
- `assets/externos/backoffice.gs1.org.ar/Archivos/CursoImagenes/2D_retailers.jpg`
- `assets/externos/backoffice.gs1.org.ar/Archivos/CursoImagenes/Curso_ID.jpg`
- `assets/externos/backoffice.gs1.org.ar/Archivos/CursoImagenes/curso_salud_traza.jpg`
- `assets/externos/backoffice.gs1.org.ar/Archivos/CursoImagenes/Curso_traza_alimentos (1).jpg`
- `assets/externos/backoffice.gs1.org.ar/Archivos/CursoImagenes/curso_visibilidad (1).jpg`
- `assets/externos/backoffice.gs1.org.ar/Archivos/CursoImagenes/gerencial_26.jpg`

## Externos conservados como excepcion
- https://api.whatsapp.com/send?phone=5491169654700&text=Hola! - Enlace externo funcional/de navegacion, no asset embebido obligatorio.
- https://static-unificado.laanonima.com.ar/js/jquery.js - JS externo intentado; el servidor respondio 403, se conserva la referencia y se documenta.
- https://www.edigs1latam.com/login.php - Enlace externo funcional/de navegacion, no asset embebido obligatorio.
- https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3284.8366987999248!2d-58.46502822279844!3d-34.582998356406726!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccacdefa869bd%3A0x71b026df6f970f08!2sGS1%20Argentina!5e0!3m2!1ses-419!2suy!4v1767717778446!5m2!1ses-419!2suy - Embed externo de mapa, no asset local del prototipo.
- https://www.mercadolibre.com/jms/mla/lgz/msl/login/ - Enlace externo funcional/de navegacion, no asset embebido obligatorio.
- https://www.oca.com.ar/Busquedas/CodigosPostales - Enlace externo funcional/de navegacion, no asset embebido obligatorio.

## Validacion final
- Rutas `C:\`, `file:/` y `OneDrive`: sin coincidencias.
- Referencias internas remotas `e-tradeconsult.com/privado/gs1` en HTML/CSS: sin coincidencias.
- Caracteres mojibake solicitados en HTML: sin coincidencias.
- Referencias locales `href/src/url(...)`: todas apuntan a archivos existentes.